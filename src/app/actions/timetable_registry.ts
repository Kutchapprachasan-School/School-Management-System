"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Types
export interface CurriculumPlan {
  id: string;
  name: string;
  grade: string;
  term: string;
  assignedClassrooms?: string[]; // classroom IDs
  subjects: Array<{
    code: string;
    name: string;
    hours: number;
    consReq: number;
    timingPref: string; // "M" | "A" | ""
  }>;
}

export interface Workload {
  id: string;
  classroomId: string;
  subjectId: string;
  userId: string; // Teacher
  roomId?: string; // Physical Room
  hours: number;
  consReq: number;
  timingPref: string;
}

export interface SchoolActivity {
  id: string;
  name: string;
  dayOfWeek: number; // 1-5
  periodOrder: number; // 1-8
  classrooms: string[]; // Classroom IDs (empty = all)
  teachers: string[]; // Teacher IDs (empty = all)
  excludedTeachers?: string[]; // Excluded teacher IDs
  roomId?: string; // Physical Room ID
}

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

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || (session.user.role !== "ADMIN" && (session.user as any).position !== "แอดมิน")) {
    throw new Error("สิทธิ์แอดมินเท่านั้น");
  }
  return session;
}

// 1. Curriculum & Workload Registry Store
export async function getCurriculumRegistry() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    });

    if (!settings || !settings.memoDepartments) {
      return {
        success: true,
        data: {
          curriculums: [],
          classPlanMap: {},
          workloads: [],
          settings: {
            deptHeads: {},
            allowTeacherSelfAssign: true,
            pageAccess: {}
          },
          lunchConfig: {
            classroomLunch: {},
            teacherLunch: {},
            globalLunch: 5
          }
        }
      };
    }

    const registry = JSON.parse(settings.memoDepartments);
    return {
      success: true,
      data: {
        curriculums: (registry.curriculums as CurriculumPlan[]) || [],
        classPlanMap: (registry.classPlanMap as Record<string, string>) || {},
        workloads: (registry.workloads as Workload[]) || [],
        settings: registry.settings || {
          deptHeads: {},
          allowTeacherSelfAssign: true,
          pageAccess: {}
        },
        lunchConfig: registry.lunchConfig || {
          classroomLunch: {},
          teacherLunch: {},
          globalLunch: 5
        }
      }
    };
  } catch (error: any) {
    return { success: false, error: "ดึงข้อมูลโครงสร้างแผนล้มเหลว: " + error.message };
  }
}

export async function saveCurriculumRegistryInternal(data: { curriculums: CurriculumPlan[]; classPlanMap: Record<string, string>; workloads: Workload[]; settings?: any; lunchConfig?: any }) {
  const serialized = JSON.stringify(data);
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { memoDepartments: serialized },
    create: {
      id: "default",
      memoDepartments: serialized,
      schoolName: "โรงเรียนกุฎประสิทธิ์",
      subheader: "ระบบจัดการตารางสอนอัจฉริยะ (School OS)",
      footerText: "© 2026 โรงเรียนกุฎประสิทธิ์. All Rights Reserved."
    }
  });

  revalidatePath("/timetables/subjects");
  revalidatePath("/timetables/schedule");
  revalidatePath("/timetables/curriculums");
  revalidatePath("/timetables/workloads");
  revalidatePath("/timetables/periods");
}

export async function saveCurriculumRegistry(data: { curriculums: CurriculumPlan[]; classPlanMap: Record<string, string>; workloads: Workload[]; settings?: any; lunchConfig?: any }) {
  try {
    await requireAdmin();
    await saveCurriculumRegistryInternal(data);
    return { success: true, message: "บันทึกข้อมูลหลักสูตรและภาระงานสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "บันทึกข้อมูลล้มเหลว: " + error.message };
  }
}

export async function getLunchConfig() {
  try {
    const regRes = await getCurriculumRegistry();
    if (regRes.success && regRes.data) {
      return {
        success: true,
        data: (regRes.data as any).lunchConfig || {
          classroomLunch: {},
          teacherLunch: {},
          globalLunch: 5
        }
      };
    }
    return { success: false, error: regRes.error || "ดึงข้อมูลพักกลางวันล้มเหลว" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveLunchConfig(lunchConfig: any) {
  try {
    await requireAdmin();

    const regRes = await getCurriculumRegistry();
    if (!regRes.success || !regRes.data) return { success: false, error: regRes.error };

    const { curriculums, classPlanMap, workloads, settings } = regRes.data as any;

    await saveCurriculumRegistryInternal({
      curriculums,
      classPlanMap,
      workloads,
      settings,
      lunchConfig
    });

    return { success: true, message: "บันทึกการตั้งค่าพักกลางวันสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "บันทึกการตั้งค่าล้มเหลว: " + error.message };
  }
}

// 2. School Activities Registry Store
export async function getActivitiesRegistry() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    });

    if (!settings || !settings.linePermissions) {
      return { success: true, data: { activities: [] } };
    }

    const registry = JSON.parse(settings.linePermissions);
    return { success: true, data: { activities: registry.activities || [] } };
  } catch (error: any) {
    return { success: false, error: "ดึงข้อมูลกิจกรรมโรงเรียนล้มเหลว: " + error.message };
  }
}

export async function saveActivitiesRegistry(data: { activities: SchoolActivity[] }) {
  try {
    await requireAdmin();

    const serialized = JSON.stringify(data);
    await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: { linePermissions: serialized },
      create: {
        id: "default",
        linePermissions: serialized,
        schoolName: "โรงเรียนกุฎประสิทธิ์",
        subheader: "ระบบจัดการตารางสอนอัจฉริยะ (School OS)",
        footerText: "© 2026 โรงเรียนกุฎประสิทธิ์. All Rights Reserved."
      }
    });

    revalidatePath("/timetables/schedule");
    return { success: true, message: "บันทึกกิจกรรมสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "บันทึกข้อมูลกิจกรรมล้มเหลว: " + error.message };
  }
}

// 3. Auto Import Workloads for a Classroom from its Curriculum Plan
export async function autoImportWorkloads(classroomId: string, planId: string) {
  try {
    await requireAdmin();

    const registryRes = await getCurriculumRegistry();
    if (!registryRes.success || !registryRes.data) {
      return { success: false, error: registryRes.error };
    }

    const { curriculums, classPlanMap, workloads } = registryRes.data as {
      curriculums: CurriculumPlan[];
      classPlanMap: Record<string, string>;
      workloads: Workload[];
    };

    const plan = curriculums.find((c: CurriculumPlan) => c.id === planId);
    if (!plan) {
      return { success: false, error: "ไม่พบแผนการเรียนที่เลือก" };
    }

    // Assign class to plan
    classPlanMap[classroomId] = planId;

    // Remove old workloads for this classroom
    const filteredWorkloads = workloads.filter((w: Workload) => w.classroomId !== classroomId);

    // Load actual subjects from DB to ensure codes match
    const dbSubjects = await prisma.subject.findMany();

    // Map curriculum subjects to new workloads
    const newWorkloads = plan.subjects.map((sub: any, idx: number) => {
      const dbSub = dbSubjects.find(s => s.code === sub.code);
      return {
        id: `wl-${classroomId}-${sub.code}-${Date.now()}-${idx}`,
        classroomId,
        subjectId: dbSub?.id || sub.code, // use DB subject ID if exists, otherwise code
        userId: "", // unassigned teacher initially
        roomId: "", // unassigned room initially
        hours: sub.hours,
        consReq: sub.consReq || 1,
        timingPref: sub.timingPref || ""
      };
    });

    const updatedWorkloads = [...filteredWorkloads, ...newWorkloads];

    await saveCurriculumRegistry({
      curriculums,
      classPlanMap,
      workloads: updatedWorkloads
    });

    return { success: true, message: `ดึงข้อมูลรายวิชาจากหลักสูตรเข้าชั้นเรียนสำเร็จ (${plan.subjects.length} วิชา)` };
  } catch (error: any) {
    return { success: false, error: "ดึงข้อมูลล้มเหลว: " + error.message };
  }
}

export async function syncCurriculumToClassrooms(planId: string, classroomIds: string[]) {
  try {
    await requireAdmin();

    const registryRes = await getCurriculumRegistry();
    if (!registryRes.success || !registryRes.data) {
      return { success: false, error: registryRes.error };
    }

    const { curriculums, classPlanMap, workloads } = registryRes.data as {
      curriculums: CurriculumPlan[];
      classPlanMap: Record<string, string>;
      workloads: Workload[];
    };

    const plan = curriculums.find((c: CurriculumPlan) => c.id === planId);
    if (!plan) {
      return { success: false, error: "ไม่พบแผนการเรียนที่เลือก" };
    }

    // Update plan's assignedClassrooms
    plan.assignedClassrooms = classroomIds;

    // Filter out workloads for all classroomIds being synced
    let updatedWorkloads = workloads.filter((w: Workload) => !classroomIds.includes(w.classroomId));

    // Load subjects from DB
    const dbSubjects = await prisma.subject.findMany();

    // Map curriculum subjects to workloads for each classroom
    const newWorkloads: Workload[] = [];
    classroomIds.forEach((classId) => {
      // Map class to plan
      classPlanMap[classId] = planId;

      plan.subjects.forEach((sub: any, idx: number) => {
        const dbSub = dbSubjects.find(s => s.code === sub.code);
        newWorkloads.push({
          id: `wl-${classId}-${sub.code}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          classroomId: classId,
          subjectId: dbSub?.id || sub.code,
          userId: "", // unassigned
          roomId: "", // unassigned
          hours: sub.hours,
          consReq: sub.consReq || 1,
          timingPref: sub.timingPref || ""
        });
      });
    });

    updatedWorkloads = [...updatedWorkloads, ...newWorkloads];

    await saveCurriculumRegistry({
      curriculums,
      classPlanMap,
      workloads: updatedWorkloads
    });

    return { success: true, message: `ซิงค์วิชาเรียนจากหลักสูตรเข้าสู่ชั้นเรียนที่เลือกสำเร็จ (${classroomIds.length} ชั้นเรียน)` };
  } catch (error: any) {
    return { success: false, error: "ซิงค์หลักสูตรล้มเหลว: " + error.message };
  }
}

// 4. Admin Resets
export async function clearTimetableData(classroomId?: string) {
  try {
    await requireAdmin();

    const term = await prisma.academicTerm.findFirst({
      where: { isCurrent: true }
    });
    if (!term) return { success: false, error: "ไม่พบเทอมปัจจุบัน" };

    if (classroomId) {
      await prisma.schedule.deleteMany({
        where: {
          termId: term.id,
          classroomId: classroomId
        }
      });
    } else {
      await prisma.schedule.deleteMany({
        where: {
          termId: term.id
        }
      });
    }

    revalidatePath("/timetables/schedule");
    return { success: true, message: classroomId ? "ล้างตารางสอนของชั้นเรียนนี้เรียบร้อย" : "ล้างตารางสอนทั้งหมดของเทอมนี้เรียบร้อย" };
  } catch (error: any) {
    return { success: false, error: "เกิดข้อผิดพลาดในการล้างข้อมูล: " + error.message };
  }
}

export async function clearWorkloads() {
  try {
    await requireAdmin();

    const registryRes = await getCurriculumRegistry();
    if (!registryRes.success || !registryRes.data) {
      return { success: false, error: registryRes.error };
    }

    const { curriculums, classPlanMap } = registryRes.data;

    await saveCurriculumRegistry({
      curriculums,
      classPlanMap,
      workloads: []
    });

    return { success: true, message: "ล้างรายการภาระงานทั้งหมดสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "ล้างรายการภาระงานล้มเหลว: " + error.message };
  }
}

// 5. Update Teacher Registry Config (Max workload / Unavailable slots) stored in User.preferences
export async function getTeachersRegistry() {
  try {
    const teachers = await prisma.user.findMany({
      orderBy: { name: "asc" }
    });

    return {
      success: true,
      data: teachers.map(t => {
        let prefs = { maxPeriods: 22, unavailable: [] };
        if (t.preferences) {
          try {
            prefs = JSON.parse(t.preferences);
          } catch (e) {}
        }
        return {
          id: t.id,
          name: t.name || t.email,
          email: t.email,
          maxPeriods: prefs.maxPeriods ?? 22,
          unavailable: prefs.unavailable || []
        };
      })
    };
  } catch (error: any) {
    return { success: false, error: "ดึงข้อมูลทะเบียนครูล้มเหลว: " + error.message };
  }
}

export async function updateTeacherRegistry(userId: string, maxPeriods: number, unavailable: string[]) {
  try {
    await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return { success: false, error: "ไม่พบคุณครูในระบบ" };

    let prefs: any = {};
    if (user.preferences) {
      try {
        prefs = JSON.parse(user.preferences);
      } catch (e) {}
    }

    prefs.maxPeriods = maxPeriods;
    prefs.unavailable = unavailable;

    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: JSON.stringify(prefs)
      }
    });

    return { success: true, message: "อัปเดตข้อมูลภาระงานและคาบไม่ว่างครูสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "อัปเดตข้อมูลล้มเหลว: " + error.message };
  }
}

// 6. AI Scheduling Solver
export async function runAIScheduler(isOptimize: boolean) {
  try {
    await requireAdmin();

    const term = await prisma.academicTerm.findFirst({
      where: { isCurrent: true }
    });
    if (!term) return { success: false, error: "ไม่พบปีการศึกษาปัจจุบัน" };

    // Fetch database infrastructure
    const dbPeriods = await prisma.period.findMany({ orderBy: { order: "asc" } });
    const dbSubjects = await prisma.subject.findMany();
    const dbClassrooms = await prisma.classroom.findMany();
    const dbRooms = await prisma.room.findMany();
    const dbTeachers = await prisma.user.findMany();

    if (dbPeriods.length === 0) return { success: false, error: "กรุณากำหนดคาบเวลาเรียนก่อนจัดตาราง" };

    // Load registries
    const currRes = await getCurriculumRegistry();
    const actRes = await getActivitiesRegistry();

    const workloads: Workload[] = currRes.data?.workloads || [];
    const activities: SchoolActivity[] = actRes.data?.activities || [];

    // Filter out workloads without assigned teachers
    const validWorkloads = workloads.filter(w => w.userId && w.hours > 0);
    if (validWorkloads.length === 0 && activities.length === 0) {
      return { success: false, error: "ไม่พบภาระงานที่มีครูผู้สอน หรือกิจกรรมโรงเรียนที่จะนำมาจัดตาราง" };
    }

    // Set up teacher structures
    const teacherMaxPeriods: Record<string, number> = {};
    const teacherUnavailable: Record<string, Record<string, boolean>> = {};

    dbTeachers.forEach(t => {
      let prefs = { maxPeriods: 22, unavailable: [] };
      if (t.preferences) {
        try {
          prefs = JSON.parse(t.preferences);
        } catch (e) {}
      }
      teacherMaxPeriods[t.id] = prefs.maxPeriods ?? 22;
      
      teacherUnavailable[t.id] = {};
      if (prefs.unavailable) {
        prefs.unavailable.forEach((pt: string) => {
          teacherUnavailable[t.id][pt] = true;
        });
      }
    });

    // Create time grid [day][periodOrder]
    const daysCount = 5;
    const periodsCount = dbPeriods.length;

    // Grid tracking state in-memory
    interface SlotState {
      teachers: Record<string, boolean>;
      classrooms: Record<string, boolean>;
      rooms: Record<string, boolean>;
      entries: any[];
    }

    const grid: Record<number, Record<number, SlotState>> = {};
    for (let d = 1; d <= daysCount; d++) {
      grid[d] = {};
      for (let p = 1; p <= periodsCount; p++) {
        grid[d][p] = { teachers: {}, classrooms: {}, rooms: {}, entries: [] };
      }
    }

    const teacherPlacedCount: Record<string, number> = {};

    // Helper check function
    function isSlotFree(d: number, p: number, tId: string, cId: string, rId?: string) {
      const slot = grid[d][p];
      if (tId && slot.teachers[tId]) return false;
      if (tId && teacherUnavailable[tId] && teacherUnavailable[tId][`${d}-${p}`]) return false;
      if (cId && slot.classrooms[cId]) return false;
      if (rId && slot.rooms[rId]) return false;
      return true;
    }

    const lunchConfig = currRes.data?.lunchConfig;

    function isBlockFree(d: number, startP: number, len: number, tId: string, cId: string, rId?: string, timingPref?: string) {
      const classLunchPeriod = lunchConfig?.classroomLunch?.[cId] || lunchConfig?.globalLunch || 5;
      const teacherLunchPeriod = lunchConfig?.teacherLunch?.[tId] || lunchConfig?.globalLunch || 5;

      for (let i = 0; i < len; i++) {
        const p = startP + i;
        if (p > periodsCount) return false;
        
        // check if this is classroom lunch or teacher lunch, or named "พัก"
        if (p === classLunchPeriod || p === teacherLunchPeriod || dbPeriods[p - 1]?.name.includes("พัก")) {
          return false;
        }

        if (!isSlotFree(d, p, tId, cId, rId)) return false;

        // Morning/Afternoon preference
        if (timingPref === "M" && p >= classLunchPeriod) return false; // Morning before lunch
        if (timingPref === "A" && p <= classLunchPeriod) return false; // Afternoon after lunch
      }

      if (tId) {
        const maxLimit = teacherMaxPeriods[tId] || 999;
        if ((teacherPlacedCount[tId] || 0) + len > maxLimit) return false;
      }

      return true;
    }

    function commitBlock(d: number, startP: number, len: number, workload: Workload, isActivity: boolean) {
      for (let i = 0; i < len; i++) {
        const p = startP + i;
        const slot = grid[d][p];
        
        if (workload.userId) {
          slot.teachers[workload.userId] = true;
          teacherPlacedCount[workload.userId] = (teacherPlacedCount[workload.userId] || 0) + 1;
        }
        if (workload.classroomId) {
          slot.classrooms[workload.classroomId] = true;
        }
        if (workload.roomId) {
          slot.rooms[workload.roomId] = true;
        }

        slot.entries.push({
          dayOfWeek: d,
          periodOrder: p,
          workloadId: workload.id,
          classroomId: workload.classroomId,
          subjectId: workload.subjectId,
          userId: workload.userId,
          roomId: workload.roomId || null,
          isActivity
        });
      }
    }

    // Step A. Lock Activities in Grid
    activities.forEach(act => {
      const d = act.dayOfWeek;
      const p = act.periodOrder;
      if (d < 1 || d > 5 || p < 1 || p > periodsCount) return;

      const targetClasses = act.classrooms.length > 0 
        ? act.classrooms 
        : dbClassrooms.map(c => c.id);

      const targetTeachers = act.teachers.length > 0 
        ? act.teachers 
        : dbTeachers.map(t => t.id).filter(id => !act.excludedTeachers?.includes(id));

      // Lock classes & teachers in grid
      targetClasses.forEach(cId => {
        grid[d][p].classrooms[cId] = true;
      });
      targetTeachers.forEach(tId => {
        grid[d][p].teachers[tId] = true;
      });
      if (act.roomId) {
        grid[d][p].rooms[act.roomId] = true;
      }

      grid[d][p].entries.push({
        dayOfWeek: d,
        periodOrder: p,
        activityName: act.name,
        isActivity: true
      });
    });

    // Step B. Pre-load already scheduled items (if optimize mode)
    const existingSchedules = await prisma.schedule.findMany({
      where: { termId: term.id }
    });

    const prePlacedWorkloads: Record<string, number> = {};

    if (isOptimize) {
      existingSchedules.forEach(s => {
        // Find matching workload
        const wl = validWorkloads.find(w => 
          w.classroomId === s.classroomId && 
          w.subjectId === s.subjectId && 
          w.userId === s.userId
        );

        if (wl) {
          const matchedPeriod = dbPeriods.find(p => p.id === s.periodId);
          if (matchedPeriod) {
            const pOrder = matchedPeriod.order;
            const d = s.dayOfWeek;

            if (isSlotFree(d, pOrder, s.userId, s.classroomId, s.roomId || undefined)) {
              commitBlock(d, pOrder, 1, wl, false);
              const key = `${wl.id}`;
              prePlacedWorkloads[key] = (prePlacedWorkloads[key] || 0) + 1;
            }
          }
        }
      });
    }

    // Step C. Break workloads into study blocks to place
    interface BlockToPlace {
      workload: Workload;
      len: number;
    }

    const blocks: BlockToPlace[] = [];
    validWorkloads.forEach(w => {
      let remainingHours = w.hours - (prePlacedWorkloads[w.id] || 0);
      if (remainingHours <= 0) return;

      const consLimit = Math.min(w.consReq || 1, remainingHours);
      while (remainingHours > 0) {
        const len = Math.min(consLimit, remainingHours);
        blocks.push({ workload: w, len });
        remainingHours -= len;
      }
    });

    // Sort blocks by difficulty (teachers with higher workload first)
    const teacherLoads: Record<string, number> = {};
    validWorkloads.forEach(w => {
      teacherLoads[w.userId] = (teacherLoads[w.userId] || 0) + w.hours;
    });

    blocks.sort((a, b) => {
      const loadA = teacherLoads[a.workload.userId] || 0;
      const loadB = teacherLoads[b.workload.userId] || 0;
      if (loadA !== loadB) return loadB - loadA; // higher load first
      return b.len - a.len; // longer blocks first
    });

    // Backtracking / Random greedy solver
    let success = false;
    let iterations = 0;
    const maxIterations = 3000;

    function solve(blockIdx: number): boolean {
      iterations++;
      if (iterations > maxIterations) return false; // stop if running too long
      if (blockIdx >= blocks.length) return true; // placed everything!

      const { workload, len } = blocks[blockIdx];

      // Try placing block in random order of days and slots
      const days = [1, 2, 3, 4, 5];
      // Shuffle days to randomize
      for (let i = days.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [days[i], days[j]] = [days[j], days[i]];
      }

      for (const d of days) {
        for (let p = 1; p <= periodsCount - len + 1; p++) {
          if (isBlockFree(d, p, len, workload.userId, workload.classroomId, workload.roomId || undefined, workload.timingPref)) {
            // Apply placement
            const addedSlots: Array<{ d: number; p: number }> = [];
            for (let i = 0; i < len; i++) {
              const currentP = p + i;
              const slot = grid[d][currentP];
              slot.teachers[workload.userId] = true;
              slot.classrooms[workload.classroomId] = true;
              if (workload.roomId) slot.rooms[workload.roomId] = true;
              
              teacherPlacedCount[workload.userId] = (teacherPlacedCount[workload.userId] || 0) + 1;

              slot.entries.push({
                dayOfWeek: d,
                periodOrder: currentP,
                workloadId: workload.id,
                classroomId: workload.classroomId,
                subjectId: workload.subjectId,
                userId: workload.userId,
                roomId: workload.roomId || null,
                isActivity: false
              });

              addedSlots.push({ d, p: currentP });
            }

            // Recurse
            if (solve(blockIdx + 1)) return true;

            // Backtrack
            addedSlots.forEach(as => {
              const slot = grid[as.d][as.p];
              delete slot.teachers[workload.userId];
              delete slot.classrooms[workload.classroomId];
              if (workload.roomId) delete slot.rooms[workload.roomId];
              teacherPlacedCount[workload.userId] = Math.max(0, (teacherPlacedCount[workload.userId] || 0) - 1);
              slot.entries = slot.entries.filter(e => e.workloadId !== workload.id);
            });
          }
        }
      }

      return false;
    }

    success = solve(0);

    // Save final grid state to database in a single transaction
    const finalEntriesToSave: any[] = [];
    const logDetails: string[] = [];

    for (let d = 1; d <= daysCount; d++) {
      for (let p = 1; p <= periodsCount; p++) {
        const slot = grid[d][p];
        slot.entries.forEach(e => {
          if (e.isActivity) return; // activities are rendered locked dynamically, not saved in schedule table if it is general

          const period = dbPeriods.find(dbP => dbP.order === p);
          if (period) {
            finalEntriesToSave.push({
              dayOfWeek: d,
              userId: e.userId,
              subjectId: e.subjectId,
              classroomId: e.classroomId,
              roomId: e.roomId || null,
              periodId: period.id,
              termId: term.id
            });
          }
        });
      }
    }

    // Apply database writes in transaction
    if (finalEntriesToSave.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Clear old timetables depending on mode
        if (!isOptimize) {
          await tx.schedule.deleteMany({
            where: { termId: term.id }
          });
        }

        // Insert new schedules
        for (const entry of finalEntriesToSave) {
          // Check if slot already exists (for optimize mode to not double-write or crash on unique constraint)
          const exist = await tx.schedule.findFirst({
            where: {
              termId: term.id,
              dayOfWeek: entry.dayOfWeek,
              periodId: entry.periodId,
              userId: entry.userId
            }
          });

          if (!exist) {
            await tx.schedule.create({ data: entry });
          }
        }
      });
    }

    revalidatePath("/timetables/schedule");
    
    if (success) {
      return {
        success: true,
        message: `🎉 จัดตารางสอนสำเร็จทั้งหมด ${finalEntriesToSave.length} คาบเรียน! (${iterations} Iterations)`
      };
    } else {
      const placedCount = finalEntriesToSave.length;
      const totalCount = blocks.reduce((acc, b) => acc + b.len, 0) + existingSchedules.length;
      return {
        success: true,
        message: `⚠️ AI จัดตารางได้บางส่วน (${placedCount}/${totalCount} คาบ) เนื่องจากความหนาแน่นและข้อจำกัดของเงื่อนไขการชนสูงกรุณาขยับคาบด้วยตนเองหรือล้างตารางแล้วลองอีกครั้ง`
      };
    }

  } catch (error: any) {
    console.error("runAIScheduler error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดของ AI Solver: " + error.message };
  }
}

function getSubjectGroupFromCode(code: string): string {
  if (!code) return "ทั่วไป";
  const prefix = code.charAt(0);
  switch (prefix) {
    case "ค": return "คณิตศาสตร์";
    case "ว": return "วิทยาศาสตร์และเทคโนโลยี";
    case "ท": return "ภาษาไทย";
    case "อ": return "ภาษาต่างประเทศ";
    case "ส": return "สังคมศึกษา ศาสนา และวัฒนธรรม";
    case "พ": return "สุขศึกษาและพลศึกษา";
    case "ศ": return "ศิลปะ";
    case "ง": return "การงานอาชีพ";
    default: return "ทั่วไป";
  }
}

export async function assignTeacherToWorkload(workloadId: string, userId: string, roomId?: string) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "กรุณาเข้าสู่ระบบ" };
    }

    const regRes = await getCurriculumRegistry();
    if (!regRes.success || !regRes.data) {
      return { success: false, error: regRes.error };
    }

    const { curriculums, classPlanMap, workloads, settings } = regRes.data as any;

    const wlIndex = workloads.findIndex((w: Workload) => w.id === workloadId);
    if (wlIndex === -1) {
      return { success: false, error: "ไม่พบรายการภาระงาน" };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    if (!currentUser) return { success: false, error: "ไม่พบผู้ใช้ในระบบ" };

    const isAdmin = currentUser.role === "ADMIN" || currentUser.position === "แอดมิน";
    const deptHeads = settings?.deptHeads || {};
    const isDeptHead = Object.values(deptHeads).includes(currentUser.id);
    const allowSelfAssign = settings?.allowTeacherSelfAssign ?? true;

    const wl = workloads[wlIndex];
    
    // Find subject code in DB
    const dbSub = await prisma.subject.findFirst({
      where: {
        OR: [
          { id: wl.subjectId },
          { code: wl.subjectId }
        ]
      }
    });

    const subjectGroupOfWl = dbSub ? getSubjectGroupFromCode(dbSub.code) : "ทั่วไป";

    if (!isAdmin) {
      if (isDeptHead) {
        // Head of department can assign teachers to subjects in their department
        const headGroup = Object.keys(deptHeads).find(k => deptHeads[k] === currentUser.id);
        if (headGroup !== subjectGroupOfWl) {
          return { success: false, error: `คุณเป็นหัวหน้าหมวด ${headGroup} ไม่สามารถมอบหมายงานหมวด ${subjectGroupOfWl} ได้` };
        }
      } else {
        // Regular teacher
        if (!allowSelfAssign) {
          return { success: false, error: "ระบบปิดไม่ให้ครูทั่วไปลงภาระงานสอนด้วยตนเองชั่วคราว" };
        }
        if (currentUser.id !== userId) {
          return { success: false, error: "คุณครูทั่วไปสามารถลงทะเบียนภาระงานให้ตนเองได้เท่านั้น" };
        }
        // Check if the subject group matches
        if (currentUser.subjectGroup && currentUser.subjectGroup !== subjectGroupOfWl) {
          return { success: false, error: `วิชานี้อยู่ในหมวด ${subjectGroupOfWl} แต่คุณสังเกตหมวด ${currentUser.subjectGroup}` };
        }
      }
    }

    // Update workload
    workloads[wlIndex].userId = userId;
    workloads[wlIndex].roomId = roomId || "";

    await saveCurriculumRegistryInternal({
      curriculums,
      classPlanMap,
      workloads,
      settings
    });

    return { success: true, message: "มอบหมายครูผู้สอนสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "มอบหมายครูผู้สอนล้มเหลว: " + error.message };
  }
}

export async function unassignTeacherFromWorkload(workloadId: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: "กรุณาเข้าสู่ระบบ" };

    const regRes = await getCurriculumRegistry();
    if (!regRes.success || !regRes.data) return { success: false, error: regRes.error };

    const { curriculums, classPlanMap, workloads, settings } = regRes.data as any;
    const wlIndex = workloads.findIndex((w: Workload) => w.id === workloadId);
    if (wlIndex === -1) return { success: false, error: "ไม่พบรายการภาระงาน" };

    const wl = workloads[wlIndex];
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    if (!currentUser) return { success: false, error: "ไม่พบผู้ใช้ในระบบ" };

    const isAdmin = currentUser.role === "ADMIN" || currentUser.position === "แอดมิน";
    const deptHeads = settings?.deptHeads || {};
    const isDeptHead = Object.values(deptHeads).includes(currentUser.id);

    if (!isAdmin) {
      if (isDeptHead) {
        // Check department group match
        const dbSub = await prisma.subject.findFirst({
          where: { OR: [{ id: wl.subjectId }, { code: wl.subjectId }] }
        });
        const subjectGroupOfWl = dbSub ? getSubjectGroupFromCode(dbSub.code) : "ทั่วไป";
        const headGroup = Object.keys(deptHeads).find(k => deptHeads[k] === currentUser.id);
        if (headGroup !== subjectGroupOfWl) {
          return { success: false, error: `คุณไม่สามารถยกเลิกงานในหมวดอื่นได้` };
        }
      } else {
        // Teacher can only unassign themselves
        if (wl.userId !== currentUser.id) {
          return { success: false, error: "คุณครูทั่วไปสามารถยกเลิกภาระงานของตนเองได้เท่านั้น" };
        }
      }
    }

    // Unassign
    workloads[wlIndex].userId = "";
    workloads[wlIndex].roomId = "";

    await saveCurriculumRegistryInternal({
      curriculums,
      classPlanMap,
      workloads,
      settings
    });

    return { success: true, message: "ยกเลิกมอบหมายครูผู้สอนสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "ยกเลิกมอบหมายล้มเหลว: " + error.message };
  }
}

