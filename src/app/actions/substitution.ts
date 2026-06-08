"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
    return { success: true, message: "ส่งข้อความคำสั่งปฏิบัติหน้าที่สอนแทนเข้า LINE กลุ่มเรียบร้อยแล้ว!" };
  } catch (error: any) {
    console.error("Error broadcasting substitution:", error);
    return { success: false, error: error.message };
  }
}

