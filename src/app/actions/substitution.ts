"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin, getCurriculumRegistry } from "./timetable_registry";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSession() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.warn("Session retrieval failed:", err);
  }
  return session;
}

export async function requireSubstitutionPermission() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }

  // 1. If system admin, automatically allowed
  if (session.user.role === "ADMIN" || (session.user as any).position === "แอดมิน") {
    return session;
  }

  // 2. Fetch timetable registry settings
  const registryRes = await getCurriculumRegistry();
  if (!registryRes.success || !registryRes.data) {
    throw new Error("ไม่สามารถเรียกดูการตั้งค่าระบบได้");
  }

  const settings = registryRes.data.settings || {};
  const subAdmins = settings.subAdmins || [];
  const permissionMode = settings.substitutePermissionMode || "admin_only";

  // 3. If timetable sub-admin, automatically allowed
  if (subAdmins.includes(session.user.id)) {
    return session;
  }

  // 4. Check permission modes
  if (permissionMode === "all") {
    return session;
  }

  if (permissionMode === "dept_heads") {
    // Check if the user is one of the department heads
    const deptHeads = settings.deptHeads || {};
    const isHead = Object.values(deptHeads).includes(session.user.id);
    if (isHead) {
      return session;
    }
  }

  throw new Error("ไม่มีสิทธิ์ในการจัดการจัดสอนแทน");
}

// Interface for substitution log payload
export interface SubstitutionRecordInput {
  date: string;
  absentTeacherId: string;
  substituteTeacherId: string;
  periodId: string;
  subjectCode: string;
  subjectName: string;
  classroom: string;
  remark?: string;
}

// 1. Fetch data required for Substitution UI on a specific date
export async function getSubstitutePageData(dateStr: string) {
  try {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { 
        success: false, 
        error: "กรุณาเลือกวันจันทร์ - ศุกร์ สำหรับจัดตารางสอนแทน",
        teachers: [],
        leaveRequests: [],
        schedules: [],
        logs: [],
        loads: {}
      };
    }

    // A. Fetch current academic term
    const term = await prisma.academicTerm.findFirst({
      where: { isCurrent: true }
    });
    if (!term) {
      return { success: false, error: "ไม่พบปีการศึกษาปัจจุบันในระบบ" };
    }

    // B. Fetch all teachers (Users with role TEACHER or admin)
    const teachers = await prisma.user.findMany({
      where: {
        role: { in: ["TEACHER", "ADMIN", "admin", "teacher"] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        subjectGroup: true
      },
      orderBy: { name: "asc" }
    });

    // C. Fetch all periods
    const periods = await prisma.period.findMany({
      orderBy: { order: "asc" }
    });

    // D. Fetch approved leave requests for the specified date
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: new Date(dateStr + "T23:59:59Z") },
        endDate: { gte: new Date(dateStr + "T00:00:00Z") }
      },
      include: {
        user: {
          select: { id: true, name: true, position: true, subjectGroup: true }
        }
      }
    });

    // E. Fetch all normal schedules for the day of the week
    const schedules = await prisma.schedule.findMany({
      where: {
        termId: term.id,
        dayOfWeek: dayOfWeek
      },
      include: {
        user: { select: { id: true, name: true, subjectGroup: true } },
        subject: { select: { code: true, name: true } },
        classroom: { select: { name: true } },
        period: { select: { id: true, order: true } }
      }
    });

    // F. Fetch SubstitutionLogs for that specific date
    const startOfDay = new Date(dateStr + "T00:00:00.000Z");
    const endOfDay = new Date(dateStr + "T23:59:59.999Z");
    const logs = await prisma.substitutionLog.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        absentTeacher: { select: { id: true, name: true, position: true, subjectGroup: true } },
        substituteTeacher: { select: { id: true, name: true, position: true, subjectGroup: true } },
        period: { select: { id: true, order: true, name: true } }
      },
      orderBy: { period: { order: "asc" } }
    });

    // G. Compute cumulative substitution loads (historically) for all teachers
    const logsCount = await prisma.substitutionLog.groupBy({
      by: ["substituteTeacherId"],
      _count: {
        id: true
      }
    });

    const loads: Record<string, number> = {};
    // Initialize loads for all teachers to 0
    teachers.forEach(t => {
      loads[t.id] = 0;
    });
    // Fill in counts
    logsCount.forEach((item: any) => {
      loads[item.substituteTeacherId] = item._count.id;
    });

    // H. Fetch teacher subject assignments for history checks
    const subjectAssignments = await prisma.teacherSubjectAssignment.findMany();

    // Map and enrich teachers with fitnessScores for each schedule slot
    const enrichedTeachers = teachers.map(t => {
      const fitnessScores: Record<string, { fitnessScore: number; reasons: string[] }> = {};

      schedules.forEach(s => {
        let score = 0;
        const reasons: string[] = [];

        // 1. Same subject group or history teaching that subject (+40 points)
        const isSameGroup = t.subjectGroup && s.user.subjectGroup && t.subjectGroup === s.user.subjectGroup;
        const hasHistory = subjectAssignments.some(sa => sa.userId === t.id && sa.subjectId === s.subjectId);
        if (isSameGroup || hasHistory) {
          score += 40;
          if (isSameGroup && hasHistory) {
            reasons.push("กลุ่มสาระเดียวกันและมีประวัติสอนวิชานี้ (+40)");
          } else if (isSameGroup) {
            reasons.push("กลุ่มสาระเดียวกัน (+40)");
          } else {
            reasons.push("มีประวัติสอนวิชานี้ (+40)");
          }
        }

        // 2. Period is free in normal schedule (+40 points)
        const isTeachingNormal = schedules.some(sch => sch.userId === t.id && sch.periodId === s.periodId);
        if (!isTeachingNormal) {
          score += 40;
          reasons.push("คาบเรียนปกติว่าง (+40)");
        }

        // 3. Substitution load (inverse, up to +20 points)
        const loadValues = Object.values(loads);
        const minLoad = loadValues.length > 0 ? Math.min(...loadValues) : 0;
        const maxLoad = loadValues.length > 0 ? Math.max(...loadValues) : 0;
        const tLoad = loads[t.id] || 0;
        let loadScore = 20;
        if (maxLoad !== minLoad) {
          loadScore = 20 * (1 - (tLoad - minLoad) / (maxLoad - minLoad));
        }
        score += loadScore;
        reasons.push(`ภาระงานสอนแทนสะสมย้อนหลังน้อย: ${tLoad} คาบ (+${loadScore.toFixed(1)})`);

        fitnessScores[s.id] = {
          fitnessScore: Math.round(score),
          reasons
        };
      });

      return {
        id: t.id,
        fullName: t.name || "ไม่มีชื่อ",
        email: t.email,
        role: t.role,
        position: t.position || "ครูผู้ช่วย",
        department: t.subjectGroup || "ทั่วไป",
        fitnessScores
      };
    });

    return {
      success: true,
      teachers: enrichedTeachers,
      leaveRequests: leaves.map(l => ({
        id: l.id,
        requesterName: l.user.name || "ไม่มีชื่อ",
        startDate: l.startDate.toISOString().split("T")[0],
        endDate: l.endDate.toISOString().split("T")[0],
        status: l.status,
        type: l.type
      })),
      schedules: schedules.map(s => ({
        id: s.id,
        teacherId: s.user.id,
        teacherName: s.user.name || "",
        periodId: s.periodId,
        periodOrder: s.period.order,
        subjectCode: s.subject.code,
        subjectName: s.subject.name,
        classroom: s.classroom.name
      })),
      logs: logs.map((l: any) => ({
        id: l.id,
        date: l.date.toISOString().split("T")[0],
        absentTeacherId: l.absentTeacherId,
        absentTeacherName: l.absentTeacher.name || "",
        substituteTeacherId: l.substituteTeacherId,
        substituteTeacherName: l.substituteTeacher.name || "",
        period: l.period.order,
        periodId: l.periodId,
        subjectCode: l.subjectCode,
        subjectName: l.subjectName,
        classroom: l.classroom,
        remark: l.remark || "",
        createdAt: l.createdAt.toISOString().replace("T", " ").substring(0, 16)
      })),
      loads,
      periods: periods.map(p => ({
        id: p.id,
        order: p.order,
        name: p.name,
        startTime: p.startTime,
        endTime: p.endTime
      }))
    };
  } catch (error: any) {
    console.error("Error fetching substitution data:", error);
    return { success: false, error: error.message };
  }
}

// 2. Save Daily Substitution Logs
export async function saveSubstitutionLogs(records: SubstitutionRecordInput[]) {
  try {
    await requireSubstitutionPermission();
    if (records.length === 0) {
      return { success: false, error: "ไม่มีข้อมูลบันทึก" };
    }

    const dateStr = records[0].date;
    const targetDate = new Date(dateStr + "T12:00:00Z"); // Center of the day to avoid timezone shifting issues

    // We overwrite/update substitutions for these teachers on this day.
    // Clean up existing logs for this date first (matching absent teachers)
    const absentIds = Array.from(new Set(records.map(r => r.absentTeacherId)));

    const startOfDay = new Date(dateStr + "T00:00:00.000Z");
    const endOfDay = new Date(dateStr + "T23:59:59.999Z");

    await prisma.substitutionLog.deleteMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        absentTeacherId: { in: absentIds }
      }
    });

    // Bulk create
    const createData = records
      .filter(r => r.substituteTeacherId && r.periodId)
      .map(r => ({
        date: targetDate,
        absentTeacherId: r.absentTeacherId,
        substituteTeacherId: r.substituteTeacherId,
        periodId: r.periodId,
        subjectCode: r.subjectCode,
        subjectName: r.subjectName,
        classroom: r.classroom,
        remark: r.remark || ""
      }));

    if (createData.length > 0) {
      await prisma.substitutionLog.createMany({
        data: createData
      });
    }

    revalidatePath("/timetables/schedule");
    return { success: true, message: "บันทึกการจัดครูสอนแทนสำเร็จเรียบร้อยแล้ว!" };
  } catch (error: any) {
    console.error("Error saving substitution logs:", error);
    return { success: false, error: error.message };
  }
}

// 3. Delete a specific substitution log entry
export async function deleteSubstitutionLog(id: string) {
  try {
    await requireSubstitutionPermission();
    await prisma.substitutionLog.delete({
      where: { id }
    });
    revalidatePath("/timetables/schedule");
    return { success: true, message: "ลบประวัติการสอนแทนเรียบร้อยแล้ว" };
  } catch (error: any) {
    console.error("Error deleting substitution log:", error);
    return { success: false, error: error.message };
  }
}

// 4. Get Auto Substitute Config
export async function getAutoSubstituteConfig() {
  try {
    let config = await prisma.autoSubstituteConfig.findUnique({
      where: { id: "default" }
    });
    if (!config) {
      config = await prisma.autoSubstituteConfig.create({
        data: {
          id: "default",
          isEnabled: true,
          priority1Weight: 1.0,
          priority2Weight: 0.8,
          priority3Weight: 0.5,
          allowedPeriods: "[1,2,3,4,6,7,8]"
        }
      });
    }
    return { success: true, data: config };
  } catch (error: any) {
    console.error("Error in getAutoSubstituteConfig:", error);
    return { success: false, error: error.message };
  }
}

// 5. Update Auto Substitute Config
export async function updateAutoSubstituteConfig(data: any) {
  try {
    const config = await prisma.autoSubstituteConfig.upsert({
      where: { id: "default" },
      update: {
        isEnabled: data.isEnabled ?? true,
        priority1Weight: Number(data.priority1Weight ?? 1.0),
        priority2Weight: Number(data.priority2Weight ?? 0.8),
        priority3Weight: Number(data.priority3Weight ?? 0.5),
        allowedPeriods: typeof data.allowedPeriods === "string" ? data.allowedPeriods : JSON.stringify(data.allowedPeriods ?? [1,2,3,4,6,7,8])
      },
      create: {
        id: "default",
        isEnabled: data.isEnabled ?? true,
        priority1Weight: Number(data.priority1Weight ?? 1.0),
        priority2Weight: Number(data.priority2Weight ?? 0.8),
        priority3Weight: Number(data.priority3Weight ?? 0.5),
        allowedPeriods: typeof data.allowedPeriods === "string" ? data.allowedPeriods : JSON.stringify(data.allowedPeriods ?? [1,2,3,4,6,7,8])
      }
    });
    revalidatePath("/timetables/substitution");
    return { success: true, data: config };
  } catch (error: any) {
    console.error("Error in updateAutoSubstituteConfig:", error);
    return { success: false, error: error.message };
  }
}

export async function broadcastSubstitutionToLine(logId: string) {
  try {
    await requireSubstitutionPermission();
    const log = await prisma.substitutionLog.findUnique({
      where: { id: logId },
      include: {
        absentTeacher: { select: { name: true } },
        substituteTeacher: { select: { name: true } },
        period: { select: { order: true, startTime: true, endTime: true } }
      }
    });

    if (!log) {
      return { success: false, error: "ไม่พบข้อมูลรายการจัดสอนแทน" };
    }

    const formattedDate = log.date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const message = `📋 [ใบคำสั่งปฏิบัติหน้าที่สอนแทน]\n` +
      `ประจำวันที่ ${formattedDate}\n` +
      `------------------\n` +
      `ครูผู้ลา: ${log.absentTeacher.name || "ไม่ระบุ"}\n` +
      `ครูผู้แทน: ${log.substituteTeacher.name || "ไม่ระบุ"}\n` +
      `คาบเรียน: คาบที่ ${log.period.order} (${log.period.startTime} - ${log.period.endTime})\n` +
      `วิชาเรียน: ${log.subjectCode} - ${log.subjectName}\n` +
      `ห้องเรียน: ${log.classroom}\n` +
      `------------------\n` +
      `โปรดตรวจสอบข้อมูลความเรียบร้อยและเริ่มปฏิบัติหน้าที่แทน`;

    const { sendLineNotify } = await import("@/lib/line-notify");
    await sendLineNotify(message);
    revalidatePath("/timetables/schedule");
    return { success: true, message: "ส่งข้อความคำสั่งปฏิบัติหน้าที่สอนแทนเข้า LINE กลุ่มเรียบร้อยแล้ว!" };
  } catch (error: any) {
    console.error("Error broadcasting substitution:", error);
    return { success: false, error: error.message };
  }
}

export async function addAbsentTeacherManually(userId: string, dateStr: string) {
  try {
    await requireSubstitutionPermission();

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    // Check if there is already an approved leave request for this teacher on this date
    const existing = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: "APPROVED",
        startDate: { lte: new Date(dateStr + "T23:59:59Z") },
        endDate: { gte: new Date(dateStr + "T00:00:00Z") }
      }
    });

    if (existing) {
      return { success: false, error: "ครูท่านนี้มีสถานะลาในระบบอยู่แล้ว" };
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: "ไม่พบผู้ใช้ในระบบ" };
    }

    // Create a mock approved LeaveRequest
    await prisma.leaveRequest.create({
      data: {
        userId,
        type: "ลาภายนอกระบบ",
        reason: "บันทึกข้อมูลครูผู้ลาเพิ่มเติมภายนอกระบบจัดสอนแทน",
        status: "APPROVED",
        startDate: targetDate,
        endDate: targetDate
      }
    });

    revalidatePath("/timetables/schedule");
    return { success: true, message: `ระบุให้คุณครู ${user.name || user.email} เป็นผู้ลานอกระบบเรียบร้อย` };
  } catch (error: any) {
    return { success: false, error: "เกิดข้อผิดพลาดในการระบุครูผู้ลา: " + error.message };
  }
}

export async function bulkAddAbsentTeachersManually(userIds: string[], dateStr: string) {
  try {
    await requireSubstitutionPermission();

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const startOfDay = new Date(dateStr + "T00:00:00.000Z");
    const endOfDay = new Date(dateStr + "T23:59:59.999Z");

    const addedNames: string[] = [];

    for (const userId of userIds) {
      // Check if there is already an approved leave request
      const existing = await prisma.leaveRequest.findFirst({
        where: {
          userId,
          status: "APPROVED",
          startDate: { lte: endOfDay },
          endDate: { gte: startOfDay }
        }
      });

      if (existing) continue;

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) continue;

      // Create a mock approved LeaveRequest
      await prisma.leaveRequest.create({
        data: {
          userId,
          type: "ลาภายนอกระบบ",
          reason: "บันทึกข้อมูลครูผู้ลาเพิ่มเติมภายนอกระบบจัดสอนแทน",
          status: "APPROVED",
          startDate: targetDate,
          endDate: targetDate
        }
      });

      addedNames.push(user.name || user.email);
    }

    revalidatePath("/timetables/schedule");
    return { 
      success: true, 
      message: addedNames.length > 0 
        ? `ระบุคุณครูผู้ลานอกระบบเรียบร้อยแล้ว ${addedNames.length} ท่าน: ${addedNames.join(", ")}`
        : "ไม่มีคุณครูถูกระบุเพิ่มเติม (เนื่องจากมีสถานะลาอยู่แล้วหรือข้อมูลไม่ถูกต้อง)"
    };
  } catch (error: any) {
    return { success: false, error: "เกิดข้อผิดพลาดในการระบุครูผู้ลา: " + error.message };
  }
}

export async function removeAbsentTeacherManually(userId: string, dateStr: string) {
  try {
    await requireSubstitutionPermission();

    const startOfDay = new Date(dateStr + "T00:00:00.000Z");
    const endOfDay = new Date(dateStr + "T23:59:59.999Z");

    // 1. Delete mock approved LeaveRequest (only manual mock leaves)
    const delLeaves = await prisma.leaveRequest.deleteMany({
      where: {
        userId,
        startDate: { gte: startOfDay, lte: endOfDay },
        type: "ลาภายนอกระบบ"
      }
    });

    if (delLeaves.count === 0) {
      return { success: false, error: "ไม่สามารถยกเลิกได้ เนื่องจากไม่ใช่การระบุผู้ลานอกระบบ หรือไม่มีสถานะลาอยู่" };
    }

    // 2. Clean up substitution logs where this teacher was absent on this date
    await prisma.substitutionLog.deleteMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        absentTeacherId: userId
      }
    });

    revalidatePath("/timetables/schedule");
    return { success: true, message: "ยกเลิกสถานะลาและประวัติการสอนแทนของคุณครูเรียบร้อยแล้ว" };
  } catch (error: any) {
    return { success: false, error: "เกิดข้อผิดพลาดในการยกเลิกผู้ลา: " + error.message };
  }
}

export async function autoAssignSubstitutesForTeacher(absentTeacherId: string, dateStr: string) {
  try {
    await requireSubstitutionPermission();

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { success: false, error: "กรุณาเลือกวันจันทร์ - ศุกร์ สำหรับจัดสอนแทน" };
    }

    const term = await prisma.academicTerm.findFirst({
      where: { isCurrent: true }
    });
    if (!term) {
      return { success: false, error: "ไม่พบปีการศึกษาปัจจุบันในระบบ" };
    }

    // A. Fetch normal schedules for this teacher on this day of the week
    const absentSchedules = await prisma.schedule.findMany({
      where: {
        termId: term.id,
        dayOfWeek,
        userId: absentTeacherId
      },
      include: {
        period: true,
        subject: true,
        classroom: true
      }
    });

    if (absentSchedules.length === 0) {
      return { success: false, error: "คุณครูท่านนี้ไม่มีตารางสอนในวันที่เลือก" };
    }

    // B. Fetch all teachers (potential candidates)
    const teachers = await prisma.user.findMany({
      where: {
        role: { in: ["TEACHER", "ADMIN", "admin", "teacher"] }
      }
    });

    const absentTeacher = teachers.find(t => t.id === absentTeacherId);
    const absentDept = absentTeacher?.subjectGroup;

    // C. Fetch all approved leaves for today (including this teacher and others)
    const startOfDay = new Date(dateStr + "T00:00:00.000Z");
    const endOfDay = new Date(dateStr + "T23:59:59.999Z");
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay }
      }
    });
    const absentUserIds = leaves.map(l => l.userId);

    // D. Fetch all normal schedules for this day of the week
    const schedules = await prisma.schedule.findMany({
      where: {
        termId: term.id,
        dayOfWeek
      }
    });

    // E. Fetch current substitution logs for this date
    const existingLogs = await prisma.substitutionLog.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    // F. Compute current workloads count for fitness scoring
    const logsCount = await prisma.substitutionLog.groupBy({
      by: ["substituteTeacherId"],
      _count: { id: true }
    });
    const loads: Record<string, number> = {};
    teachers.forEach(t => { loads[t.id] = 0; });
    logsCount.forEach((item: any) => { loads[item.substituteTeacherId] = item._count.id; });

    const subjectAssignments = await prisma.teacherSubjectAssignment.findMany();

    // Track assigned candidates during this run
    const assignedThisRun: Record<string, Record<string, boolean>> = {}; // periodId -> teacherId -> boolean

    const newRecords = [];

    // Loop through absent slots and find the best substitute
    for (const s of absentSchedules) {
      // Find candidates for period s.periodId
      const candidates = teachers
        .filter(t => !absentUserIds.includes(t.id) && t.id !== absentTeacherId) // Exclude all absent teachers
        .map(t => {
          // Check if teaching in normal schedule
          const isTeachingNormal = schedules.some(sch => sch.userId === t.id && sch.periodId === s.periodId);
          // Check if already subbing from DB logs
          const isSubbingInDb = existingLogs.some(l => l.substituteTeacherId === t.id && l.periodId === s.periodId);
          // Check if already subbing in this run
          const isSubbingThisRun = assignedThisRun[s.periodId]?.[t.id] || false;

          const isAvailable = !isTeachingNormal && !isSubbingInDb && !isSubbingThisRun;

          let score = 0;
          // Department or history teaching subject
          const isSameGroup = t.subjectGroup && absentDept && t.subjectGroup === absentDept;
          const hasHistory = subjectAssignments.some(sa => sa.userId === t.id && sa.subjectId === s.subjectId);
          if (isSameGroup || hasHistory) score += 40;
          if (!isTeachingNormal) score += 40;

          // Workload balance score
          const loadValues = Object.values(loads);
          const minLoad = loadValues.length > 0 ? Math.min(...loadValues) : 0;
          const maxLoad = loadValues.length > 0 ? Math.max(...loadValues) : 0;
          const tLoad = loads[t.id] || 0;
          let loadScore = 20;
          if (maxLoad !== minLoad) {
            loadScore = 20 * (1 - (tLoad - minLoad) / (maxLoad - minLoad));
          }
          score += loadScore;

          return {
            id: t.id,
            name: t.name || t.email,
            score: isAvailable ? Math.round(score) : -1,
            isAvailable
          };
        })
        .filter(c => c.isAvailable)
        .sort((a, b) => b.score - a.score);

      if (candidates.length > 0) {
        const best = candidates[0];
        newRecords.push({
          date: targetDate,
          absentTeacherId,
          substituteTeacherId: best.id,
          periodId: s.periodId,
          subjectCode: s.subject.code,
          subjectName: s.subject.name,
          classroom: s.classroom.name,
          remark: `จัดสอนแทนอัตโนมัติ (AI Auto) คะแนนความเหมาะสม ${best.score}%`
        });

        // Track assignment
        if (!assignedThisRun[s.periodId]) assignedThisRun[s.periodId] = {};
        assignedThisRun[s.periodId][best.id] = true;
        loads[best.id] = (loads[best.id] || 0) + 1; // Update load in-memory for subsequent periods
      }
    }

    if (newRecords.length === 0) {
      return { success: false, error: "ไม่พบคุณครูผู้สอนแทนที่พร้อมปฏิบัติหน้าที่ในช่องเวลาดังกล่าว" };
    }

    // Clean up any old logs for this teacher on this day
    await prisma.substitutionLog.deleteMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        absentTeacherId
      }
    });

    // Create logs
    await prisma.substitutionLog.createMany({ data: newRecords });

    revalidatePath("/timetables/schedule");
    return { success: true, message: `จัดสอนแทนอัตโนมัติสำเร็จ ${newRecords.length} คาบเรียน!` };
  } catch (error: any) {
    return { success: false, error: "จัดสอนแทนล้มเหลว: " + error.message };
  }
}
