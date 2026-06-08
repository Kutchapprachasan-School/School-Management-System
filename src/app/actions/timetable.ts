"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";



// Interface for grid formatting
export interface FormattedScheduleSlot {
  id: string;
  subject: string;
  room: string;
  color: string;
  teacherName: string;
  teacherId: string;
  subjectCode: string;
  classroomId: string;
  classroomName: string;
  headcount?: number;
}

// 1. Fetch current schedules and return in grid-ready format
export async function getTimetableData(filterType?: "classroom" | "teacher" | "room", filterId?: string) {
  try {
    // Ensure we have seeded data if empty
    await seedDefaultSchedulesIfNeeded();

    const term = await prisma.academicTerm.findFirst({
      where: { isCurrent: true }
    });
    if (!term) return { success: false, error: "ไม่พบปีการศึกษาปัจจุบัน" };

    // Fetch related DB entries to map names
    const [schedules, dbRooms, dbTeachers, dbClassrooms, dbSubjects, settings, studentCounts] = await Promise.all([
      prisma.schedule.findMany({
        where: { termId: term.id },
        include: {
          user: { select: { id: true, name: true } },
          subject: { select: { code: true, name: true, color: true } },
          classroom: { select: { id: true, name: true } },
          room: { select: { name: true } },
          period: { select: { order: true } }
        }
      }),
      prisma.room.findMany(),
      prisma.user.findMany(),
      prisma.classroom.findMany(),
      prisma.subject.findMany(),
      prisma.systemSettings.findUnique({ where: { id: "default" } }),
      prisma.student.groupBy({
        by: ['classroom'],
        _count: { id: true }
      })
    ]);

    const studentCountMap = Object.fromEntries(
      studentCounts.map(item => [item.classroom, item._count.id])
    );

    // Parse registries
    let activities: any[] = [];
    let workloads: any[] = [];
    if (settings) {
      if (settings.linePermissions) {
        try { activities = JSON.parse(settings.linePermissions).activities || []; } catch (e) {}
      }
      if (settings.memoDepartments) {
        try { workloads = JSON.parse(settings.memoDepartments).workloads || []; } catch (e) {}
      }
    }

    const gridData: Record<string, FormattedScheduleSlot & { isActivity?: boolean }> = {};

    // First, place locked school activities in grid if they affect the selected filter
    activities.forEach((act) => {
      const day = act.dayOfWeek;
      const periodOrder = act.periodOrder;
      const key = `${day}-${periodOrder}`;

      let matchFilter = false;
      if (!filterType || !filterId) {
        matchFilter = true;
      } else if (filterType === "classroom") {
        matchFilter = act.classrooms.length === 0 || act.classrooms.includes(filterId);
      } else if (filterType === "teacher") {
        matchFilter = act.teachers.length === 0 
          ? !act.excludedTeachers?.includes(filterId)
          : act.teachers.includes(filterId);
      } else if (filterType === "room") {
        matchFilter = act.roomId === filterId;
      }

      if (matchFilter) {
        const actRoomName = dbRooms.find(r => r.id === act.roomId)?.name || "-";
        const actTeachersName = act.teachers.length > 0
          ? act.teachers.map((tid: string) => dbTeachers.find(t => t.id === tid)?.name || tid).join(", ")
          : "ครูทุกคน";

        gridData[key] = {
          id: `activity-${act.id}`,
          subject: act.name,
          room: actRoomName,
          color: "bg-slate-400/20 text-slate-700 dark:text-slate-300 border-slate-400/30",
          teacherName: actTeachersName,
          teacherId: "",
          subjectCode: "ACTIVITY",
          classroomId: "",
          classroomName: "",
          isActivity: true
        };
      }
    });

    let displaySchedules = schedules;
    if (filterType && filterId) {
      if (filterType === "classroom") {
        displaySchedules = schedules.filter(s => s.classroomId === filterId);
      } else if (filterType === "teacher") {
        displaySchedules = schedules.filter(s => s.userId === filterId);
      } else if (filterType === "room") {
        displaySchedules = schedules.filter(s => s.roomId === filterId);
      }
    }

    displaySchedules.forEach((s) => {
      const key = `${s.dayOfWeek}-${s.period.order}`;
      
      // Do not overwrite activities unless it is not occupied
      if (!gridData[key]) {
        gridData[key] = {
          id: s.id,
          subject: s.subject.name,
          room: s.room?.name || s.classroom.name,
          color: s.subject.color || "bg-indigo-500/10 text-indigo-700 border-indigo-500/30",
          teacherName: s.user.name || "ครูผู้สอน",
          teacherId: s.user.id,
          subjectCode: s.subject.code,
          classroomId: s.classroom.id,
          classroomName: s.classroom.name,
          headcount: studentCountMap[s.classroom.name] || 0
        };
      }
    });

    // Check conflicts
    const conflictResult = await checkScheduleConflictsInternal(schedules);

    // Calculate remaining workloads for the active filters
    let targetWorkloads = workloads;
    if (filterType && filterId) {
      if (filterType === "classroom") {
        targetWorkloads = workloads.filter(w => w.classroomId === filterId);
      } else if (filterType === "teacher") {
        targetWorkloads = workloads.filter(w => w.userId === filterId);
      } else if (filterType === "room") {
        targetWorkloads = workloads.filter(w => w.roomId === filterId);
      }
    }

    const formattedWorkloads = targetWorkloads.map(w => {
      const scheduledCount = schedules.filter(s => 
        s.classroomId === w.classroomId &&
        s.subjectId === w.subjectId &&
        s.userId === w.userId
      ).length;

      const sub = dbSubjects.find(s => s.id === w.subjectId || s.code === w.subjectId);
      const user = dbTeachers.find(t => t.id === w.userId);
      const classroom = dbClassrooms.find(c => c.id === w.classroomId);

      return {
        id: w.id,
        classroomId: w.classroomId,
        classroomName: classroom?.name || "",
        subjectId: w.subjectId,
        subjectCode: sub?.code || w.subjectId,
        subjectName: sub?.name || "",
        userId: w.userId,
        teacherName: user?.name || "",
        roomId: w.roomId || "",
        roomName: dbRooms.find(r => r.id === w.roomId)?.name || "",
        hours: w.hours,
        remainingHours: Math.max(0, w.hours - scheduledCount),
        consReq: w.consReq || 1,
        timingPref: w.timingPref || ""
      };
    });

    return { 
      success: true, 
      data: gridData,
      conflictsCount: conflictResult.conflicts.length,
      conflicts: conflictResult.conflicts,
      workloads: formattedWorkloads
    };
  } catch (error: any) {
    console.error("Error in getTimetableData:", error);
    return { success: false, error: error.message };
  }
}

// 2. Check for conflicts in a list of schedules
export async function checkScheduleConflicts() {
  try {
    const term = await prisma.academicTerm.findFirst({
      where: { isCurrent: true }
    });
    if (!term) return { success: false, error: "ไม่พบปีการศึกษาปัจจุบัน", conflicts: [], count: 0 };

    const schedules = await prisma.schedule.findMany({
      where: { termId: term.id },
      include: {
        user: { select: { name: true } },
        subject: { select: { code: true, name: true } },
        classroom: { select: { name: true } },
        period: { select: { name: true, order: true } }
      }
    });

    const result = await checkScheduleConflictsInternal(schedules);
    return { success: true, conflicts: result.conflicts, count: result.conflicts.length };
  } catch (error: any) {
    return { success: false, error: error.message, conflicts: [], count: 0 };
  }
}

// Internal conflict checking function
async function checkScheduleConflictsInternal(schedules: any[]) {
  const conflicts: string[] = [];

  // Group by Day and Period to detect overlaps
  const dayPeriodGroups: Record<string, any[]> = {};
  schedules.forEach((s) => {
    const key = `${s.dayOfWeek}-${s.period.order}`;
    if (!dayPeriodGroups[key]) dayPeriodGroups[key] = [];
    dayPeriodGroups[key].push(s);
  });

  const dayNames = ["", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์"];

  Object.entries(dayPeriodGroups).forEach(([key, list]) => {
    const [dayIdStr, periodOrderStr] = key.split("-");
    const dayName = dayNames[parseInt(dayIdStr)] || "วันเรียน";
    const periodNum = parseInt(periodOrderStr);

    // 1. Check Teacher Conflicts (Same teacher teaching multiple classes in same period)
    const teacherMap: Record<string, any[]> = {};
    list.forEach(s => {
      if (!teacherMap[s.userId]) teacherMap[s.userId] = [];
      teacherMap[s.userId].push(s);
    });

    Object.entries(teacherMap).forEach(([teacherId, sList]) => {
      if (sList.length > 1) {
        const teacherName = sList[0].user.name || "ครู";
        const classrooms = sList.map(s => s.classroom.name).join(" และ ");
        conflicts.push(`⚠️ ครูชน: **${teacherName}** มีสอนซ้อนกันใน${dayName} คาบที่ ${periodNum} ที่ห้องเรียน ${classrooms}`);
      }
    });

    // 2. Check Classroom Conflicts (Same classroom having multiple subjects in same period)
    const classroomMap: Record<string, any[]> = {};
    list.forEach(s => {
      if (!classroomMap[s.classroomId]) classroomMap[s.classroomId] = [];
      classroomMap[s.classroomId].push(s);
    });

    Object.entries(classroomMap).forEach(([classroomId, sList]) => {
      if (sList.length > 1) {
        const classroomName = sList[0].classroom.name;
        const subjects = sList.map(s => `${s.subject.code} (${s.user.name})`).join(" และ ");
        conflicts.push(`⚠️ คาบเรียนชน: ห้องเรียน **${classroomName}** มีตารางเรียนซ้อนกันของวิชา ${subjects} ใน${dayName} คาบที่ ${periodNum}`);
      }
    });
  });

  return { conflicts };
}

// 3. Resolve conflicts automatically in database using AI Optimizer
export async function resolveScheduleConflicts() {
  try {
    const term = await prisma.academicTerm.findFirst({
      where: { isCurrent: true }
    });
    if (!term) return { success: false, error: "ไม่พบปีการศึกษาปัจจุบัน" };

    const schedules = await prisma.schedule.findMany({
      where: { termId: term.id },
      include: {
        user: { select: { id: true, name: true } },
        subject: { select: { id: true, code: true, name: true } },
        classroom: { select: { id: true, name: true } },
        period: { select: { id: true, order: true } }
      }
    });

    const periods = await prisma.period.findMany({
      orderBy: { order: "asc" }
    });

    // Keep track of conflicts
    let conflictResult = await checkScheduleConflictsInternal(schedules);
    if (conflictResult.conflicts.length === 0) {
      return { success: true, message: "🎉 ไม่พบความขัดแย้งของคาบเรียนในระบบ! ตารางสอนถูกต้องอยู่แล้ว" };
    }

    let resolvedCount = 0;
    const dayNames = ["", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์"];
    const logDetails: string[] = [];

    // Find conflicting entries and move them
    // Simple greedy backtracking solver to resolve conflicts:
    for (let i = 0; i < schedules.length; i++) {
      const current = schedules[i];

      // Check if this schedule is currently conflicting
      const conflictsWithSelf = schedules.filter(s => 
        s.id !== current.id && 
        s.dayOfWeek === current.dayOfWeek && 
        s.period.order === current.period.order &&
        (s.userId === current.userId || s.classroomId === current.classroomId)
      );

      if (conflictsWithSelf.length > 0) {
        // Find a new slot for "current" schedule:
        // Day 1-5, Period order 1-8
        let foundNewSlot = false;

        for (let day = 1; day <= 5 && !foundNewSlot; day++) {
          for (let pIdx = 0; pIdx < periods.length && !foundNewSlot; pIdx++) {
            const candidatePeriod = periods[pIdx];

            // Verify if this slot is free for BOTH the teacher AND the classroom
            const isTeacherBusy = schedules.some(s => 
              s.id !== current.id &&
              s.dayOfWeek === day &&
              s.period.order === candidatePeriod.order &&
              s.userId === current.userId
            );

            const isClassroomBusy = schedules.some(s => 
              s.id !== current.id &&
              s.dayOfWeek === day &&
              s.period.order === candidatePeriod.order &&
              s.classroomId === current.classroomId
            );

            if (!isTeacherBusy && !isClassroomBusy) {
              // Move schedule to this new slot in memory
              const oldDay = current.dayOfWeek;
              const oldPeriod = current.period.order;

              current.dayOfWeek = day;
              current.period = candidatePeriod;
              
              // Write changes to database
              await prisma.schedule.update({
                where: { id: current.id },
                data: {
                  dayOfWeek: day,
                  periodId: candidatePeriod.id
                }
              });

              logDetails.push(`• ย้ายวิชา **${current.subject.code}** (${current.classroom.name}) ของ **${current.user.name}** จาก ${dayNames[oldDay]} คาบที่ ${oldPeriod} ไปยัง **${dayNames[day]} คาบที่ ${candidatePeriod.order}**`);
              resolvedCount++;
              foundNewSlot = true;
            }
          }
        }
      }
    }

    revalidatePath("/timetables/schedule");
    return {
      success: true,
      message: `🪄 AI ดำเนินการแก้ปัญหาตารางชนสำเร็จทั้งหมด ${resolvedCount} คาบเรียน!`,
      details: logDetails
    };
  } catch (error: any) {
    console.error("Error resolving conflicts:", error);
    return { success: false, error: error.message };
  }
}

// 4. Seed default schedules if table is empty (Helper)
async function seedDefaultSchedulesIfNeeded() {
  const count = await prisma.schedule.count();
  if (count > 0) return;

  console.log("Seeding default schedules with intentional conflicts for testing...");

  // Find prerequisite tables
  const term = await prisma.academicTerm.findFirst({ where: { isCurrent: true } });
  const subjects = await prisma.subject.findMany();
  const classrooms = await prisma.classroom.findMany();
  const periods = await prisma.period.findMany({ orderBy: { order: "asc" } });
  const users = await prisma.user.findMany({
    where: { role: { in: ["TEACHER", "admin"] } }
  });

  if (!term || subjects.length < 3 || classrooms.length < 3 || periods.length < 5 || users.length === 0) {
    console.log("Unable to seed schedules. Prerequisite tables are empty.");
    return;
  }

  // Link specific entities
  const teacherAnchalee = users[0];
  const teacherWitthaya = users[1] || users[0]; // fallback
  
  const subThai = subjects.find(s => s.code === "ท31101") || subjects[0];
  const subScience = subjects.find(s => s.code === "ว31101") || subjects[1] || subjects[0];
  const subMath = subjects.find(s => s.code === "ค31101") || subjects[2] || subjects[0];

  const classM6 = classrooms.find(c => c.name === "ม.6/1") || classrooms[0];
  const classM1 = classrooms.find(c => c.name === "ม.1/1") || classrooms[1] || classrooms[0];

  const p1 = periods.find(p => p.order === 1)!;
  const p2 = periods.find(p => p.order === 2)!;
  const p3 = periods.find(p => p.order === 3)!;

  // Create schedules with intentional conflicts
  // Conflict 1: ครูอัญชลี (teacherAnchalee) สอนวิชาภาษาไทย ทั้งห้อง ม.6/1 และ ม.1/1 ใน วันจันทร์ (dayOfWeek = 1) คาบที่ 1 (p1)
  await prisma.schedule.createMany({
    data: [
      // Conflict 1 Entries (Teacher Conflict)
      {
        dayOfWeek: 1,
        userId: teacherAnchalee.id,
        subjectId: subThai.id,
        classroomId: classM6.id,
        periodId: p1.id,
        termId: term.id
      },
      {
        dayOfWeek: 1,
        userId: teacherAnchalee.id,
        subjectId: subThai.id,
        classroomId: classM1.id, // conflict! same teacher in p1 on Monday
        periodId: p1.id,
        termId: term.id
      },

      // Conflict 2 Entry (Classroom Conflict: ห้อง ม.6/1 มีเรียนภาษาไทยและวิทย์พร้อมกัน คาบที่ 2 วันอังคาร)
      {
        dayOfWeek: 2,
        userId: teacherAnchalee.id,
        subjectId: subThai.id,
        classroomId: classM6.id,
        periodId: p2.id,
        termId: term.id
      },
      {
        dayOfWeek: 2,
        userId: teacherWitthaya.id,
        subjectId: subScience.id,
        classroomId: classM6.id, // conflict! classroom busy
        periodId: p2.id,
        termId: term.id
      },

      // Regular entries
      {
        dayOfWeek: 3,
        userId: teacherWitthaya.id,
        subjectId: subScience.id,
        classroomId: classM1.id,
        periodId: p3.id,
        termId: term.id
      },
      {
        dayOfWeek: 4,
        userId: teacherAnchalee.id,
        subjectId: subMath.id,
        classroomId: classM6.id,
        periodId: p2.id,
        termId: term.id
      }
    ]
  });

  console.log("Schedules successfully seeded.");
}

export interface SchedulePayload {
  dayOfWeek: number;
  userId: string;
  subjectId: string;
  classroomId: string;
  roomId?: string;
  periodId: string;
  termId?: string;
}

export async function validateScheduleSlot(payload: SchedulePayload & { excludeScheduleId?: string }) {
  try {
    const term = payload.termId 
      ? { id: payload.termId } 
      : await prisma.academicTerm.findFirst({ where: { isCurrent: true } });
    if (!term) return { isValid: false, reason: "ไม่พบปีการศึกษาปัจจุบัน" };

    const termId = term.id;
    const { excludeScheduleId } = payload;

    // 1. Check teacher conflict (Same teacher teaching multiple classes in same period)
    const teacherConflict = await prisma.schedule.findFirst({
      where: {
        termId,
        id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
        dayOfWeek: payload.dayOfWeek,
        periodId: payload.periodId,
        userId: payload.userId,
      },
      include: {
        classroom: { select: { name: true } },
        subject: { select: { code: true } }
      }
    });

    if (teacherConflict) {
      return {
        isValid: false,
        reason: `คุณครูติดสอนห้อง ${teacherConflict.classroom.name} ในวิชา ${teacherConflict.subject.code} แล้ว`
      };
    }

    // 2. Check classroom conflict (Same classroom having multiple subjects in same period)
    const classroomConflict = await prisma.schedule.findFirst({
      where: {
        termId,
        id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
        dayOfWeek: payload.dayOfWeek,
        periodId: payload.periodId,
        classroomId: payload.classroomId,
      },
      include: {
        user: { select: { name: true } },
        subject: { select: { code: true } }
      }
    });

    if (classroomConflict) {
      return {
        isValid: false,
        reason: `ห้องเรียนมีเรียนวิชา ${classroomConflict.subject.code} กับครู ${classroomConflict.user.name || "ผู้สอน"} แล้ว`
      };
    }

    // 3. Check room conflict if specified (Same room used in same period)
    if (payload.roomId) {
      const roomConflict = await prisma.schedule.findFirst({
        where: {
          termId,
          id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
          dayOfWeek: payload.dayOfWeek,
          periodId: payload.periodId,
          roomId: payload.roomId,
        },
        include: {
          classroom: { select: { name: true } },
          subject: { select: { code: true } }
        }
      });

      if (roomConflict) {
        return {
          isValid: false,
          reason: `ห้องปฏิบัติการ/ห้องกายภาพถูกใช้โดยห้อง ${roomConflict.classroom.name} ในวิชา ${roomConflict.subject.code} แล้ว`
        };
      }
    }

    // 4. Check teacher constraints (maxHoursPerWeek & unavailableSlots hard blocks)
    const tc = await prisma.teacherConstraint.findUnique({
      where: { userId: payload.userId }
    });

    if (tc) {
      // 4.1 Max hours check
      const currentHours = await prisma.schedule.count({
        where: {
          termId,
          userId: payload.userId,
          id: excludeScheduleId ? { not: excludeScheduleId } : undefined
        }
      });
      if (currentHours >= tc.maxHoursPerWeek) {
        return {
          isValid: false,
          reason: `คุณครูสอนเกินจำนวนคาบเรียนสูงสุดต่อสัปดาห์ที่กำหนดไว้ (${tc.maxHoursPerWeek} คาบ)`
        };
      }

      // 4.2 Hard block check
      const period = await prisma.period.findUnique({
        where: { id: payload.periodId }
      });
      if (period) {
        try {
          const slots = JSON.parse(tc.unavailableSlots || "[]");
          if (Array.isArray(slots)) {
            const blockKey = `${payload.dayOfWeek}-${period.order}`;
            // If the slots array has the block key (without :soft), it is a hard block
            const isHardBlock = slots.some((s: string) => s === blockKey || s === `${blockKey}:hard`);
            if (isHardBlock) {
              return {
                isValid: false,
                reason: `คุณครูมีข้อจำกัดล็อกห้ามจัดตารางสอน (Hard Block) ในช่วงเวลานี้`
              };
            }
          }
        } catch (e) {
          console.error("Error parsing unavailableSlots:", e);
        }
      }
    }

    // 5. Check curriculum limits (hours allocated to this classroom & subject)
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    });

    let limit = 0;
    if (settings && settings.memoDepartments) {
      try {
        const registry = JSON.parse(settings.memoDepartments);
        const workloads = registry.workloads || [];
        
        // Find subject info
        const sub = await prisma.subject.findUnique({ where: { id: payload.subjectId } });
        const wl = workloads.find((w: any) => 
          w.classroomId === payload.classroomId && 
          (w.subjectId === payload.subjectId || w.subjectId === sub?.code || (sub && w.subjectId === sub.id))
        );
        if (wl) {
          limit = wl.hours;
        }
      } catch (e) {
        console.error("Error parsing workloads:", e);
      }
    }

    if (limit === 0) {
      const subject = await prisma.subject.findUnique({
        where: { id: payload.subjectId }
      });
      if (subject && subject.hours) {
        limit = subject.hours;
      }
    }

    if (limit > 0) {
      const currentSubjectHours = await prisma.schedule.count({
        where: {
          termId,
          classroomId: payload.classroomId,
          subjectId: payload.subjectId,
          id: excludeScheduleId ? { not: excludeScheduleId } : undefined
        }
      });
      if (currentSubjectHours >= limit) {
        return {
          isValid: false,
          reason: `วิชานี้ถูกจัดคาบเรียนเต็มโควต้าตามข้อกำหนดของหลักสูตรแล้ว (${limit} คาบ/สัปดาห์)`
        };
      }
    }

    return { isValid: true };
  } catch (error: any) {
    return { isValid: false, reason: "เกิดข้อผิดพลาดในการตรวจสอบ: " + error.message };
  }
}

export async function assignSubjectToSlot(payload: SchedulePayload) {
  try {
    const term = payload.termId 
      ? { id: payload.termId } 
      : await prisma.academicTerm.findFirst({ where: { isCurrent: true } });
    if (!term) return { success: false, error: "ไม่พบปีการศึกษาปัจจุบัน" };

    const termId = term.id;
    const finalPayload = { ...payload, termId };

    // Validate first
    const validation = await validateScheduleSlot(finalPayload);
    if (!validation.isValid) {
      return { success: false, error: validation.reason };
    }

    // Create schedule slot
    await prisma.schedule.create({
      data: {
        dayOfWeek: finalPayload.dayOfWeek,
        userId: finalPayload.userId,
        subjectId: finalPayload.subjectId,
        classroomId: finalPayload.classroomId,
        roomId: finalPayload.roomId || null,
        periodId: finalPayload.periodId,
        termId: finalPayload.termId,
      }
    });

    revalidatePath("/timetables/schedule");
    return { success: true, message: "จัดคาบเรียนสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "เกิดข้อผิดพลาดในการจัดคาบเรียน: " + error.message };
  }
}

export async function removeSubjectFromSlot(scheduleId: string) {
  try {
    await prisma.schedule.delete({
      where: { id: scheduleId }
    });
    revalidatePath("/timetables/schedule");
    return { success: true, message: "ลบคาบเรียนสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "ไม่สามารถลบคาบเรียนได้: " + error.message };
  }
}

export async function removeSubjectByCoordinates(dayOfWeek: number, periodId: string, classroomId: string) {
  try {
    const term = await prisma.academicTerm.findFirst({ where: { isCurrent: true } });
    if (!term) return { success: false, error: "ไม่พบปีการศึกษาปัจจุบัน" };

    await prisma.schedule.deleteMany({
      where: {
        termId: term.id,
        dayOfWeek,
        periodId,
        classroomId
      }
    });
    revalidatePath("/timetables/schedule");
    return { success: true, message: "ลบคาบเรียนสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "ไม่สามารถลบคาบเรียนได้: " + error.message };
  }
}

export async function moveScheduleSlot(scheduleId: string, dayOfWeek: number, periodId: string) {
  try {
    const term = await prisma.academicTerm.findFirst({ where: { isCurrent: true } });
    if (!term) return { success: false, error: "ไม่พบปีการศึกษาปัจจุบัน" };

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    });

    if (!schedule) {
      return { success: false, error: "ไม่พบคาบเรียนที่ต้องการย้าย" };
    }

    // Validate using consolidated validator
    const validation = await validateScheduleSlot({
      dayOfWeek,
      userId: schedule.userId,
      subjectId: schedule.subjectId,
      classroomId: schedule.classroomId,
      roomId: schedule.roomId || undefined,
      periodId,
      termId: term.id,
      excludeScheduleId: scheduleId
    });

    if (!validation.isValid) {
      return { success: false, error: validation.reason };
    }

    // Update coordinates
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        dayOfWeek,
        periodId
      }
    });

    revalidatePath("/timetables/schedule");
    return { success: true, message: "ย้ายคาบเรียนสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "เกิดข้อผิดพลาดในการย้ายคาบเรียน: " + error.message };
  }
}

export interface ChainMoveStep {
  id: string; // schedule ID
  subjectCode: string;
  classroomName: string;
  teacherName: string;
  fromDay: number;
  fromPeriodId: string;
  fromPeriodOrder: number;
  toDay: number;
  toPeriodId: string;
  toPeriodOrder: number;
}

export async function findChainMovePath(
  scheduleId: string,
  targetDay: number,
  targetPeriodId: string,
  depth: number = 5
) {
  try {
    const term = await prisma.academicTerm.findFirst({ where: { isCurrent: true } });
    if (!term) return { success: false, error: "ไม่พบปีการศึกษาปัจจุบัน" };

    const [allSchedules, allPeriods, dbTeachers, dbClassrooms, dbRooms, settings] = await Promise.all([
      prisma.schedule.findMany({
        where: { termId: term.id },
        include: {
          user: { select: { id: true, name: true } },
          subject: { select: { id: true, code: true, name: true } },
          classroom: { select: { id: true, name: true } },
          room: { select: { id: true, name: true } },
          period: { select: { id: true, order: true } }
        }
      }),
      prisma.period.findMany({ orderBy: { order: "asc" } }),
      prisma.user.findMany({ where: { role: { in: ["TEACHER", "admin", "ADMIN", "teacher"] } } }),
      prisma.classroom.findMany(),
      prisma.room.findMany(),
      prisma.systemSettings.findUnique({ where: { id: "default" } })
    ]);

    const targetPeriod = allPeriods.find(p => p.id === targetPeriodId);
    if (!targetPeriod) return { success: false, error: "ไม่พบข้อมูลคาบเรียนเป้าหมาย" };

    const startSchedule = allSchedules.find(s => s.id === scheduleId);
    if (!startSchedule) return { success: false, error: "ไม่พบคาบเรียนเริ่มต้น" };

    const periodMap = new Map(allPeriods.map(p => [p.id, p]));
    
    // Parse settings activities to identify busy slots (hard blocks due to school events)
    const activityBusyMap = new Set<string>();
    if (settings && settings.linePermissions) {
      try {
        const registry = JSON.parse(settings.linePermissions);
        const lineActList = registry.activities || [];
        for (const act of lineActList) {
          const d = act.dayOfWeek;
          const pOrder = act.periodOrder;
          const targetClasses = act.classrooms && act.classrooms.length > 0 ? act.classrooms : dbClassrooms.map(c => c.id);
          const targetTeachers = act.teachers && act.teachers.length > 0 ? act.teachers : dbTeachers.map(t => t.id);

          for (const cId of targetClasses) activityBusyMap.add(`c-${d}-${pOrder}-${cId}`);
          for (const tId of targetTeachers) activityBusyMap.add(`t-${d}-${pOrder}-${tId}`);
          if (act.roomId) activityBusyMap.add(`r-${d}-${pOrder}-${act.roomId}`);
        }
      } catch (e) {}
    }

    interface SearchState {
      moves: ChainMoveStep[];
      positions: Map<string, { dayOfWeek: number; periodId: string }>;
    }

    const initialPositions = new Map(allSchedules.map(s => [s.id, { dayOfWeek: s.dayOfWeek, periodId: s.periodId }]));
    const queue: SearchState[] = [];
    
    const firstStep: ChainMoveStep = {
      id: startSchedule.id,
      subjectCode: startSchedule.subject.code,
      classroomName: startSchedule.classroom.name,
      teacherName: startSchedule.user.name || "ครูผู้สอน",
      fromDay: startSchedule.dayOfWeek,
      fromPeriodId: startSchedule.periodId,
      fromPeriodOrder: startSchedule.period.order,
      toDay: targetDay,
      toPeriodId: targetPeriodId,
      toPeriodOrder: targetPeriod.order
    };

    const firstPositions = new Map(initialPositions);
    firstPositions.set(startSchedule.id, { dayOfWeek: targetDay, periodId: targetPeriodId });

    queue.push({
      moves: [firstStep],
      positions: firstPositions
    });

    const visitedKeys = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const conflicts = findConflictsInState(current.positions, allSchedules, periodMap, activityBusyMap);
      
      if (conflicts.length === 0) {
        return { success: true, chain: current.moves };
      }

      if (current.moves.length >= depth) {
        continue;
      }

      const conf = conflicts[0];
      const movedIds = new Set(current.moves.map(m => m.id));
      const candidatesToMove = conf.scheduleIds.filter(id => !movedIds.has(id));

      for (const schedId of candidatesToMove) {
        const sched = allSchedules.find(s => s.id === schedId)!;
        const currentPos = current.positions.get(schedId)!;

        for (let d = 1; d <= 5; d++) {
          for (const p of allPeriods) {
            if (p.name.includes("พัก") || p.order === 5) continue; // skip lunch
            if (d === currentPos.dayOfWeek && p.id === currentPos.periodId) continue;

            const nextStep: ChainMoveStep = {
              id: sched.id,
              subjectCode: sched.subject.code,
              classroomName: sched.classroom.name,
              teacherName: sched.user.name || "ครูผู้สอน",
              fromDay: currentPos.dayOfWeek,
              fromPeriodId: currentPos.periodId,
              fromPeriodOrder: periodMap.get(currentPos.periodId)!.order,
              toDay: d,
              toPeriodId: p.id,
              toPeriodOrder: p.order
            };

            const nextPositions = new Map(current.positions);
            nextPositions.set(sched.id, { dayOfWeek: d, periodId: p.id });

            const stateKey = current.moves.map(m => `${m.id}->${m.toDay}-${m.toPeriodId}`).join("|") + `|${sched.id}->${d}-${p.id}`;
            if (!visitedKeys.has(stateKey)) {
              visitedKeys.add(stateKey);
              queue.push({
                moves: [...current.moves, nextStep],
                positions: nextPositions
              });
            }
          }
        }
      }
    }

    return { success: false, error: "ไม่พบเส้นทางการขยับตารางที่ไม่มีความขัดแย้ง" };
  } catch (error: any) {
    console.error("Error in findChainMovePath:", error);
    return { success: false, error: error.message };
  }
}

export async function executeChainMove(chain: Array<{ id: string; dayOfWeek: number; periodId: string }>) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Move temporarily to dayOfWeek = -1 to bypass DB unique constraints
      for (const move of chain) {
        await tx.schedule.update({
          where: { id: move.id },
          data: { dayOfWeek: -1 }
        });
      }
      // Set to final positions
      for (const move of chain) {
        await tx.schedule.update({
          where: { id: move.id },
          data: {
            dayOfWeek: move.dayOfWeek,
            periodId: move.periodId
          }
        });
      }
      return { success: true };
    });

    revalidatePath("/timetables/schedule");
    return result;
  } catch (error: any) {
    console.error("Error in executeChainMove:", error);
    return { success: false, error: error.message };
  }
}

function findConflictsInState(
  positions: Map<string, { dayOfWeek: number; periodId: string }>,
  schedules: any[],
  periodMap: Map<string, any>,
  activityBusyMap: Set<string>
): StateConflict[] {
  const conflicts: StateConflict[] = [];

  const slots = new Map<string, string[]>();
  positions.forEach((pos, id) => {
    const period = periodMap.get(pos.periodId);
    if (period) {
      const key = `${pos.dayOfWeek}-${period.order}`;
      if (!slots.has(key)) slots.set(key, []);
      slots.get(key)!.push(id);
    }
  });

  slots.forEach((schedIds, key) => {
    const [dayStr, periodOrderStr] = key.split("-");
    const day = parseInt(dayStr);
    const periodOrder = parseInt(periodOrderStr);

    const teacherMap = new Map<string, string[]>();
    const classroomMap = new Map<string, string[]>();
    const roomMap = new Map<string, string[]>();

    schedIds.forEach(id => {
      const s = schedules.find(x => x.id === id)!;
      
      if (!teacherMap.has(s.userId)) teacherMap.set(s.userId, []);
      teacherMap.get(s.userId)!.push(id);

      if (!classroomMap.has(s.classroomId)) classroomMap.set(s.classroomId, []);
      classroomMap.get(s.classroomId)!.push(id);

      if (s.roomId) {
        if (!roomMap.has(s.roomId)) roomMap.set(s.roomId, []);
        roomMap.get(s.roomId)!.push(id);
      }
    });

    teacherMap.forEach((ids, teacherId) => {
      if (ids.length > 1) {
        conflicts.push({ type: "teacher", key: `t-${key}-${teacherId}`, scheduleIds: ids });
      }
    });

    classroomMap.forEach((ids, classroomId) => {
      if (ids.length > 1) {
        conflicts.push({ type: "classroom", key: `c-${key}-${classroomId}`, scheduleIds: ids });
      }
    });

    roomMap.forEach((ids, roomId) => {
      if (ids.length > 1) {
        conflicts.push({ type: "room", key: `r-${key}-${roomId}`, scheduleIds: ids });
      }
    });

    schedIds.forEach(id => {
      const s = schedules.find(x => x.id === id)!;
      const tId = s.userId;
      const cId = s.classroomId;
      const rId = s.roomId;

      if (
        activityBusyMap.has(`c-${day}-${periodOrder}-${cId}`) ||
        activityBusyMap.has(`t-${day}-${periodOrder}-${tId}`) ||
        (rId && activityBusyMap.has(`r-${day}-${periodOrder}-${rId}`))
      ) {
        conflicts.push({ type: "activity", key: `act-${key}-${id}`, scheduleIds: [id] });
      }
    });
  });

  return conflicts;
}

interface StateConflict {
  type: "teacher" | "classroom" | "room" | "activity";
  key: string;
  scheduleIds: string[];
}

export interface SwapRecommendation {
  id: string;
  score: number;
  descriptionTh: string;
  actionDetails: {
    sourceSlotId: string;
    targetSlotId: string;
    sourceTeacherId: string;
    targetTeacherId: string;
  }
}

export async function getTeacherConstraints(userId: string) {
  try {
    const constraint = await prisma.teacherConstraint.findUnique({
      where: { userId }
    });
    if (!constraint) {
      return {
        userId,
        maxHoursPerWeek: 20,
        unavailableSlots: "[]",
        lunchPeriodOrder: 5
      };
    }
    return constraint;
  } catch (error: any) {
    console.error("Error in getTeacherConstraints:", error);
    throw new Error("ดึงข้อมูลข้อจำกัดของครูล้มเหลว: " + error.message);
  }
}

export async function updateTeacherConstraints(
  userId: string,
  maxHoursPerWeek: number,
  unavailableSlots: string,
  lunchPeriodOrder: number
) {
  try {
    const constraint = await prisma.teacherConstraint.upsert({
      where: { userId },
      update: {
        maxHoursPerWeek,
        unavailableSlots,
        lunchPeriodOrder
      },
      create: {
        userId,
        maxHoursPerWeek,
        unavailableSlots,
        lunchPeriodOrder
      }
    });
    revalidatePath("/timetables/schedule");
    return { success: true, data: constraint };
  } catch (error: any) {
    console.error("Error in updateTeacherConstraints:", error);
    return { success: false, error: error.message };
  }
}

export async function getTeacherSubjectAssignments(userId: string) {
  try {
    const assignments = await prisma.teacherSubjectAssignment.findMany({
      where: { userId },
      include: {
        subject: true
      }
    });
    return assignments;
  } catch (error: any) {
    console.error("Error in getTeacherSubjectAssignments:", error);
    throw new Error("ดึงข้อมูลวิชาสอนของครูล้มเหลว: " + error.message);
  }
}

export async function updateTeacherSubjectAssignments(userId: string, subjectIds: string[]) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.teacherSubjectAssignment.deleteMany({
        where: { userId }
      });

      const createData = subjectIds.map(subjectId => ({
        userId,
        subjectId
      }));

      if (createData.length > 0) {
        await tx.teacherSubjectAssignment.createMany({
          data: createData
        });
      }

      return { success: true };
    });

    revalidatePath("/timetables/schedule");
    return result;
  } catch (error: any) {
    console.error("Error in updateTeacherSubjectAssignments:", error);
    return { success: false, error: error.message };
  }
}

export async function optimizeTimetableWithAI() {
  try {
    const term = await prisma.academicTerm.findFirst({
      where: { isCurrent: true }
    });
    if (!term) return { success: false, error: "ไม่พบปีการศึกษาปัจจุบัน" };

    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    });

    let workloads: any[] = [];
    if (settings && settings.memoDepartments) {
      try {
        const parsed = JSON.parse(settings.memoDepartments);
        workloads = parsed.workloads || [];
      } catch (e) {
        console.error("Error parsing workloads:", e);
      }
    }

    const [currentSchedules, dbActivities, teacherConstraints, classrooms, dbTeachers, dbPeriods] = await Promise.all([
      prisma.schedule.findMany({
        where: { termId: term.id },
        include: {
          user: { select: { id: true, name: true } },
          subject: { select: { id: true, code: true, name: true } },
          classroom: { select: { id: true, name: true } },
          room: { select: { id: true, name: true } },
          period: { select: { id: true, order: true } }
        }
      }),
      prisma.activity.findMany({
        include: { period: true }
      }),
      prisma.teacherConstraint.findMany(),
      prisma.classroom.findMany(),
      prisma.user.findMany({
        where: { role: { in: ["TEACHER", "ADMIN", "admin", "teacher"] } }
      }),
      prisma.period.findMany({
        orderBy: { order: "asc" }
      })
    ]);

    const constraintMap = new Map<string, { maxHoursPerWeek: number; unavailableSlots: Set<string>; lunchPeriodOrder: number }>();
    for (const tc of teacherConstraints) {
      const slots = new Set<string>();
      try {
        const parsed = JSON.parse(tc.unavailableSlots || "[]");
        if (Array.isArray(parsed)) {
          parsed.forEach((s: string) => slots.add(s));
        }
      } catch (e) {}
      constraintMap.set(tc.userId, {
        maxHoursPerWeek: tc.maxHoursPerWeek,
        unavailableSlots: slots,
        lunchPeriodOrder: tc.lunchPeriodOrder
      });
    }

    function getTeacherConstraint(userId: string) {
      return constraintMap.get(userId) || {
        maxHoursPerWeek: 20,
        unavailableSlots: new Set<string>(),
        lunchPeriodOrder: 5
      };
    }

    const teacherHours = new Map<string, number>();
    const busyMap = new Set<string>();
    const placedSlots: any[] = [];

    for (const s of currentSchedules) {
      const pOrder = s.period.order;
      placedSlots.push({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        periodId: s.periodId,
        periodOrder: pOrder,
        userId: s.userId,
        classroomId: s.classroomId,
        roomId: s.roomId,
        subjectId: s.subjectId
      });

      teacherHours.set(s.userId, (teacherHours.get(s.userId) || 0) + 1);
      busyMap.add(`c-${s.dayOfWeek}-${pOrder}-${s.classroomId}`);
      busyMap.add(`t-${s.dayOfWeek}-${pOrder}-${s.userId}`);
      if (s.roomId) {
        busyMap.add(`r-${s.dayOfWeek}-${pOrder}-${s.roomId}`);
      }
    }

    const activityBusyMap = new Set<string>();
    for (const act of dbActivities) {
      const pOrder = act.period.order;
      const d = act.dayOfWeek;

      if (act.type === "FIXED_ALL") {
        activityBusyMap.add(`all-classrooms-${d}-${pOrder}`);
        activityBusyMap.add(`all-teachers-${d}-${pOrder}`);
      } else if (act.type === "GRADE_SPECIFIC") {
        if (act.gradeFilter) {
          const matchingClassrooms = classrooms.filter(c => c.grade === act.gradeFilter);
          for (const mc of matchingClassrooms) {
            activityBusyMap.add(`c-${d}-${pOrder}-${mc.id}`);
          }
        }
      }
      if (act.roomId) {
        activityBusyMap.add(`r-${d}-${pOrder}-${act.roomId}`);
      }
    }

    if (settings && settings.linePermissions) {
      try {
        const registry = JSON.parse(settings.linePermissions);
        const lineActList = registry.activities || [];
        for (const act of lineActList) {
          const d = act.dayOfWeek;
          const pOrder = act.periodOrder;

          const targetClasses = act.classrooms && act.classrooms.length > 0
            ? act.classrooms
            : classrooms.map((c: any) => c.id);

          const targetTeachers = act.teachers && act.teachers.length > 0
            ? act.teachers
            : dbTeachers.map((t: any) => t.id).filter((id: string) => !act.excludedTeachers?.includes(id));

          for (const cId of targetClasses) {
            activityBusyMap.add(`c-${d}-${pOrder}-${cId}`);
          }
          for (const tId of targetTeachers) {
            activityBusyMap.add(`t-${d}-${pOrder}-${tId}`);
          }
          if (act.roomId) {
            activityBusyMap.add(`r-${d}-${pOrder}-${act.roomId}`);
          }
        }
      } catch (e) {}
    }

    function isSlotValid(
      d: number,
      pOrder: number,
      userId: string,
      classroomId: string,
      roomId?: string | null
    ): { valid: boolean; reason?: string } {
      const constraint = getTeacherConstraint(userId);

      const currentHours = teacherHours.get(userId) || 0;
      if (currentHours + 1 > constraint.maxHoursPerWeek) {
        return { valid: false, reason: `ครูผู้สอนทำงานเกินชั่วโมงสูงสุดต่อสัปดาห์ (${constraint.maxHoursPerWeek} ชม.)` };
      }

      if (pOrder === constraint.lunchPeriodOrder || pOrder === 5) {
        return { valid: false, reason: "ตรงกับคาบพักรับประทานอาหารกลางวัน" };
      }

      if (constraint.unavailableSlots.has(`${d}-${pOrder}`) || constraint.unavailableSlots.has(`${d}-${pOrder}:hard`)) {
        return { valid: false, reason: "ครูไม่สะดวกสอนในคาบนี้ (Unavailable Slot)" };
      }

      if (busyMap.has(`c-${d}-${pOrder}-${classroomId}`)) {
        return { valid: false, reason: "นักเรียนมีเรียนวิชาอื่นในคาบนี้แล้ว" };
      }
      if (busyMap.has(`t-${d}-${pOrder}-${userId}`)) {
        return { valid: false, reason: "คุณครูติดสอนวิชาอื่นในคาบนี้แล้ว" };
      }
      if (roomId && busyMap.has(`r-${d}-${pOrder}-${roomId}`)) {
        return { valid: false, reason: "ห้องเรียน/ห้องปฏิบัติการไม่ว่างในคาบนี้" };
      }

      if (activityBusyMap.has(`all-classrooms-${d}-${pOrder}`) || activityBusyMap.has(`c-${d}-${pOrder}-${classroomId}`)) {
        return { valid: false, reason: "ติดกิจกรรมโรงเรียนในคาบนี้" };
      }
      if (activityBusyMap.has(`all-teachers-${d}-${pOrder}`) || activityBusyMap.has(`t-${d}-${pOrder}-${userId}`)) {
        return { valid: false, reason: "คุณครูติดกิจกรรมโรงเรียนในคาบนี้" };
      }
      if (roomId && activityBusyMap.has(`r-${d}-${pOrder}-${roomId}`)) {
        return { valid: false, reason: "ห้องปฏิบัติการถูกใช้สำหรับกิจกรรมโรงเรียนในคาบนี้" };
      }

      return { valid: true };
    }

    const dbSubjects = await prisma.subject.findMany();

    interface BlockToPlace {
      workloadId: string;
      userId: string;
      subjectId: string;
      classroomId: string;
      roomId?: string | null;
      subjectCode: string;
      subjectName: string;
      classroomName: string;
      teacherName: string;
      len: number;
      timingPref: string;
    }

    const blocksToPlace: BlockToPlace[] = [];
    for (const w of workloads) {
      if (!w.userId || !w.hours) continue;
      const sub = dbSubjects.find(s => s.id === w.subjectId || s.code === w.subjectId);
      if (!sub) continue;
      const teacher = dbTeachers.find(t => t.id === w.userId);
      const classroom = classrooms.find(c => c.id === w.classroomId);

      const scheduledCount = currentSchedules.filter(s =>
        s.userId === w.userId &&
        s.classroomId === w.classroomId &&
        s.subjectId === sub.id
      ).length;

      let remaining = Math.max(0, w.hours - scheduledCount);
      if (remaining <= 0) continue;

      const consLimit = w.consReq || 1;
      while (remaining > 0) {
        const len = Math.min(consLimit, remaining);
        blocksToPlace.push({
          workloadId: w.id,
          userId: w.userId,
          subjectId: sub.id,
          classroomId: w.classroomId,
          roomId: w.roomId || null,
          subjectCode: sub.code,
          subjectName: sub.name,
          classroomName: classroom?.name || "",
          teacherName: teacher?.name || "",
          len,
          timingPref: w.timingPref || ""
        });
        remaining -= len;
      }
    }

    const teacherLoads: Record<string, number> = {};
    for (const w of workloads) {
      if (w.userId) {
        teacherLoads[w.userId] = (teacherLoads[w.userId] || 0) + w.hours;
      }
    }

    // Sort blocks: Constrained teachers first, then longer blocks first
    blocksToPlace.sort((a, b) => {
      const loadA = teacherLoads[a.userId] || 0;
      const loadB = teacherLoads[b.userId] || 0;
      if (loadA !== loadB) return loadB - loadA;
      return b.len - a.len;
    });

    let solverSuccess = false;
    let iterations = 0;
    const maxIterations = 2000;

    function solveBacktracking(idx: number): boolean {
      iterations++;
      if (iterations > maxIterations) return false;
      if (idx >= blocksToPlace.length) return true;

      const block = blocksToPlace[idx];
      const len = block.len;

      // Randomize days
      const days = [1, 2, 3, 4, 5];
      for (let i = days.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [days[i], days[j]] = [days[j], days[i]];
      }

      for (const d of days) {
        // Look for consecutive start periods
        for (let pIdx = 0; pIdx <= dbPeriods.length - len; pIdx++) {
          let crossesLunch = false;
          let hasOrder4 = false;
          let hasOrder5 = false;

          for (let i = 0; i < len; i++) {
            const order = dbPeriods[pIdx + i].order;
            if (order === 4) hasOrder4 = true;
            if (order === 5) hasOrder5 = true;
          }

          if (hasOrder4 && hasOrder5) {
            crossesLunch = true;
          }
          if (crossesLunch) continue;

          // Check if all periods in this block are valid
          let blockValid = true;
          for (let i = 0; i < len; i++) {
            const currentPeriod = dbPeriods[pIdx + i];
            const check = isSlotValid(d, currentPeriod.order, block.userId, block.classroomId, block.roomId);

            let meetsTimingPref = true;
            if (block.timingPref === "M" && currentPeriod.order >= 5) meetsTimingPref = false;
            if (block.timingPref === "A" && currentPeriod.order <= 4) meetsTimingPref = false;

            if (!check.valid || !meetsTimingPref) {
              blockValid = false;
              break;
            }
          }

          if (blockValid) {
            const tempPlaced: any[] = [];
            for (let i = 0; i < len; i++) {
              const currentPeriod = dbPeriods[pIdx + i];
              const pOrder = currentPeriod.order;

              const slot = {
                dayOfWeek: d,
                periodId: currentPeriod.id,
                periodOrder: pOrder,
                userId: block.userId,
                classroomId: block.classroomId,
                roomId: block.roomId,
                subjectId: block.subjectId
              };

              placedSlots.push(slot);
              tempPlaced.push(slot);

              teacherHours.set(block.userId, (teacherHours.get(block.userId) || 0) + 1);
              busyMap.add(`c-${d}-${pOrder}-${block.classroomId}`);
              busyMap.add(`t-${d}-${pOrder}-${block.userId}`);
              if (block.roomId) {
                busyMap.add(`r-${d}-${pOrder}-${block.roomId}`);
              }
            }

            if (solveBacktracking(idx + 1)) return true;

            // Backtrack
            for (const slot of tempPlaced) {
              placedSlots.pop();
              teacherHours.set(block.userId, (teacherHours.get(block.userId) || 1) - 1);
              busyMap.delete(`c-${d}-${slot.periodOrder}-${block.classroomId}`);
              busyMap.delete(`t-${d}-${slot.periodOrder}-${block.userId}`);
              if (block.roomId) {
                busyMap.delete(`r-${d}-${slot.periodOrder}-${block.roomId}`);
              }
            }
          }
        }
      }

      return false;
    }

    solverSuccess = solveBacktracking(0);

    if (solverSuccess) {
      const newSlotsToCreate = placedSlots.filter(slot => !slot.id);
      if (newSlotsToCreate.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const slot of newSlotsToCreate) {
            await tx.schedule.create({
              data: {
                dayOfWeek: slot.dayOfWeek,
                userId: slot.userId,
                subjectId: slot.subjectId,
                classroomId: slot.classroomId,
                roomId: slot.roomId || null,
                periodId: slot.periodId,
                termId: term.id
              }
            });
          }
        });
      }
      revalidatePath("/timetables/schedule");
      return { success: true, message: "จัดตารางสอนสำเร็จ" };
    } else {
      const conflicts: string[] = [];
      const unplacedBlocks = blocksToPlace.slice(placedSlots.length - currentSchedules.length);
      const unplacedGroups = new Map<string, number>();
      const unplacedDetails = new Map<string, BlockToPlace>();

      for (const b of unplacedBlocks) {
        const key = `${b.subjectCode}-${b.classroomName}-${b.teacherName}`;
        unplacedGroups.set(key, (unplacedGroups.get(key) || 0) + b.len);
        unplacedDetails.set(key, b);
      }

      unplacedGroups.forEach((count, key) => {
        const detail = unplacedDetails.get(key)!;
        conflicts.push(`⚠️ ไม่สามารถจัดตารางเรียนวิชา **${detail.subjectCode}** (${detail.subjectName}) สอนโดย **${detail.teacherName}** สำหรับห้อง **${detail.classroomName}** จำนวน ${count} คาบได้ เนื่องจากชนข้อจำกัดเวลาหรือห้องไม่ว่าง`);
      });

      const suggestions: SwapRecommendation[] = [];
      let recommendationCount = 0;

      for (let i = 0; i < currentSchedules.length; i++) {
        for (let j = i + 1; j < currentSchedules.length; j++) {
          const slotA = currentSchedules[i];
          const slotB = currentSchedules[j];

          if (slotA.userId === slotB.userId && slotA.classroomId === slotB.classroomId) continue;

          const simulatedSchedules = currentSchedules.map(s => {
            if (s.id === slotA.id) {
              return { ...s, dayOfWeek: slotB.dayOfWeek, periodId: slotB.periodId, period: slotB.period };
            }
            if (s.id === slotB.id) {
              return { ...s, dayOfWeek: slotA.dayOfWeek, periodId: slotA.periodId, period: slotA.period };
            }
            return s;
          });

          const conflictsSim = await checkScheduleConflictsInternal(simulatedSchedules);
          if (conflictsSim.conflicts.length === 0) {
            const tcA = getTeacherConstraint(slotA.userId);
            const tcB = getTeacherConstraint(slotB.userId);

            const pOrderA = slotA.period.order;
            const pOrderB = slotB.period.order;

            if (pOrderB === tcA.lunchPeriodOrder || pOrderB === 5) continue;
            if (pOrderA === tcB.lunchPeriodOrder || pOrderA === 5) continue;

            if (tcA.unavailableSlots.has(`${slotB.dayOfWeek}-${pOrderB}`)) continue;
            if (tcB.unavailableSlots.has(`${slotA.dayOfWeek}-${pOrderA}`)) continue;

            recommendationCount++;
            const dayNames = ["", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์"];
            const desc = `สลับคาบเรียนระหว่างวิชา ${slotA.subject.code} ของ ${slotA.user.name || "ครู A"} (ห้อง ${slotA.classroom.name}, ${dayNames[slotA.dayOfWeek]} คาบที่ ${slotA.period.order}) กับวิชา ${slotB.subject.code} ของ ${slotB.user.name || "ครู B"} (ห้อง ${slotB.classroom.name}, ${dayNames[slotB.dayOfWeek]} คาบที่ ${slotB.period.order})`;

            suggestions.push({
              id: `rec-${recommendationCount}`,
              score: 85 + (slotA.classroomId === slotB.classroomId ? 10 : 0),
              descriptionTh: desc,
              actionDetails: {
                sourceSlotId: slotA.id,
                targetSlotId: slotB.id,
                sourceTeacherId: slotA.userId,
                targetTeacherId: slotB.userId
              }
            });

            if (suggestions.length >= 3) break;
          }
        }
        if (suggestions.length >= 3) break;
      }

      if (suggestions.length < 3 && currentSchedules.length >= 2) {
        const dayNames = ["", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์"];
        for (let i = 0; i < currentSchedules.length && suggestions.length < 3; i++) {
          const slotA = currentSchedules[i];
          const slotB = currentSchedules[(i + 1) % currentSchedules.length];
          if (slotA.id === slotB.id) continue;

          recommendationCount++;
          suggestions.push({
            id: `rec-fallback-${recommendationCount}`,
            score: 70 - suggestions.length * 5,
            descriptionTh: `[ข้อเสนอแนะสำรอง] ลองสลับวิชา ${slotA.subject.code} (${slotA.user.name}) กับวิชา ${slotB.subject.code} (${slotB.user.name}) เพื่อเปิดช่องตารางเรียน`,
            actionDetails: {
              sourceSlotId: slotA.id,
              targetSlotId: slotB.id,
              sourceTeacherId: slotA.userId,
              targetTeacherId: slotB.userId
            }
          });
        }
      }

      return {
        success: false,
        error: "over_constrained",
        conflicts,
        suggestions: suggestions.slice(0, 3)
      };
    }
  } catch (error: any) {
    console.error("Error in optimizeTimetableWithAI:", error);
    return { success: false, error: error.message };
  }
}

export async function swapScheduleSlots(slotAId: string, slotBId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const slotA = await tx.schedule.findUnique({ where: { id: slotAId } });
      const slotB = await tx.schedule.findUnique({ where: { id: slotBId } });

      if (!slotA || !slotB) {
        throw new Error("ไม่พบคาบเรียนที่ต้องการสลับ");
      }

      // Temporary update to avoid unique constraints during swap
      await tx.schedule.update({
        where: { id: slotAId },
        data: {
          dayOfWeek: -1
        }
      });

      await tx.schedule.update({
        where: { id: slotBId },
        data: {
          dayOfWeek: slotA.dayOfWeek,
          periodId: slotA.periodId
        }
      });

      await tx.schedule.update({
        where: { id: slotAId },
        data: {
          dayOfWeek: slotB.dayOfWeek,
          periodId: slotB.periodId
        }
      });

      return { success: true };
    });

    revalidatePath("/timetables/schedule");
    return result;
  } catch (error: any) {
    console.error("Error in swapScheduleSlots:", error);
    return { success: false, error: error.message };
  }
}

