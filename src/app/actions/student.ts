"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Authentication helpers
async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }
  return session;
}

// 1. Get all students
export async function getStudents() {
  try {
    const students = await prisma.student.findMany({
      include: {
        healthVisits: true,
        homeVisit: true,
        behaviorLogs: true,
        sdqAssessments: true,
        exitPermits: true,
      },
      orderBy: { seatNumber: "asc" }
    });
    return { success: true, data: students };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Create student
export async function createStudent(data: {
  studentCode: string;
  fullName: string;
  nickname?: string;
  classroom: string;
  gender: string;
  status: string;
  parentName?: string;
  parentPhone?: string;
  homeVisited?: boolean;
}) {
  try {
    await requireAuth();

    // Check if code exists
    const existing = await prisma.student.findUnique({
      where: { studentCode: data.studentCode }
    });
    if (existing) {
      return { success: false, error: "รหัสประจำตัวนักเรียนนี้มีอยู่ในระบบแล้ว" };
    }

    // Get seat number
    const count = await prisma.student.count({
      where: { classroom: data.classroom }
    });

    const student = await prisma.student.create({
      data: {
        studentCode: data.studentCode,
        fullName: data.fullName,
        nickname: data.nickname || null,
        classroom: data.classroom,
        seatNumber: count + 1,
        gender: data.gender,
        status: data.status,
        parentName: data.parentName || null,
        parentPhone: data.parentPhone || null,
        ...(data.homeVisited && {
          homeVisit: {
            create: {
              eefStatus: "APPROVED",
              remarks: "นำเข้าประวัติตั้งต้น"
            }
          }
        })
      }
    });

    revalidatePath("/");
    return { success: true, data: student };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Update student
export async function updateStudent(id: string, data: {
  studentCode: string;
  fullName: string;
  nickname?: string;
  classroom: string;
  status: string;
  parentName?: string;
  parentPhone?: string;
  homeVisited?: boolean;
}) {
  try {
    await requireAuth();

    // Check if code exists on other student
    const existing = await prisma.student.findFirst({
      where: {
        studentCode: data.studentCode,
        id: { not: id }
      }
    });
    if (existing) {
      return { success: false, error: "รหัสประจำตัวนักเรียนนี้ถูกใช้งานโดยคนอื่นแล้ว" };
    }

    // Get current student to check home visit
    const current = await prisma.student.findUnique({
      where: { id },
      include: { homeVisit: true }
    });

    if (!current) {
      return { success: false, error: "ไม่พบข้อมูลนักเรียน" };
    }

    // Handle home visit update
    if (data.homeVisited && !current.homeVisit) {
      await prisma.studentHomeVisit.create({
        data: {
          studentId: id,
          eefStatus: "APPROVED",
          remarks: "อัปเดตเยี่ยมบ้าน"
        }
      });
    } else if (!data.homeVisited && current.homeVisit) {
      await prisma.studentHomeVisit.delete({
        where: { studentId: id }
      });
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        studentCode: data.studentCode,
        fullName: data.fullName,
        nickname: data.nickname || null,
        classroom: data.classroom,
        status: data.status,
        parentName: data.parentName || null,
        parentPhone: data.parentPhone || null,
      }
    });

    revalidatePath("/");
    return { success: true, data: student };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Delete student
export async function deleteStudent(id: string) {
  try {
    await requireAuth();

    await prisma.student.delete({
      where: { id }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Create health visit
export async function createHealthVisit(data: {
  studentId: string;
  symptoms: string;
  temperature?: number;
  medicineUsed?: string;
  actionTaken?: string;
}) {
  try {
    await requireAuth();

    const timeString = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

    const visit = await prisma.healthVisit.create({
      data: {
        studentId: data.studentId,
        time: timeString,
        symptoms: data.symptoms,
        firstAid: data.actionTaken || "ให้นอนพักห้องพยาบาล",
        medicine: data.medicineUsed || "ไม่มี",
        medicineQuantity: data.medicineUsed ? 1 : 0
      }
    });

    revalidatePath("/");
    return { success: true, data: visit };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Get health visits
export async function getHealthVisits() {
  try {
    const visits = await prisma.healthVisit.findMany({
      include: { student: true },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: visits };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Create home visit
export async function saveHomeVisit(data: {
  studentId: string;
  allowance: number;
  latitude?: number;
  longitude?: number;
  remarks?: string;
}) {
  try {
    await requireAuth();

    const homeVisit = await prisma.studentHomeVisit.upsert({
      where: { studentId: data.studentId },
      update: {
        travelCost: data.allowance,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        remarks: data.remarks || "บันทึกการเยี่ยมบ้าน",
        eefStatus: "ELIGIBLE"
      },
      create: {
        studentId: data.studentId,
        travelCost: data.allowance,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        remarks: data.remarks || "บันทึกการเยี่ยมบ้าน",
        eefStatus: "ELIGIBLE"
      }
    });

    revalidatePath("/");
    return { success: true, data: homeVisit };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. Adjust Behavior Log (คะแนนความประพฤติ)
export async function createBehaviorLog(data: {
  studentId: string;
  points: number; // positive for merit, negative for deduction
  description: string;
  loggedBy: string;
}) {
  try {
    const session = await requireAuth();

    const behaviorLog = await prisma.behaviorLog.create({
      data: {
        studentId: data.studentId,
        type: data.points > 0 ? "MERIT" : "DEDUCTION",
        points: Math.abs(data.points),
        description: data.description,
        loggedBy: data.loggedBy || session.user.name || "ครูผู้สอน"
      }
    });

    revalidatePath("/");
    return { success: true, data: behaviorLog };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 9. Save SDQ Assessment / BMI
export async function saveSdqAssessment(data: {
  studentId: string;
  emotionalScore: number;
  conductScore: number;
  hyperactivityScore: number;
  peerScore: number;
  prosocialScore: number;
  totalScore: number;
  riskStatus: string;
  weight?: number;
  height?: number;
  answers: string; // JSON string
}) {
  try {
    await requireAuth();

    // 1. Create SDQ log
    const sdq = await prisma.sdqAssessment.create({
      data: {
        studentId: data.studentId,
        assessorType: "TEACHER",
        emotionalScore: data.emotionalScore,
        conductScore: data.conductScore,
        hyperactivityScore: data.hyperactivityScore,
        peerScore: data.peerScore,
        prosocialScore: data.prosocialScore,
        totalScore: data.totalScore,
        riskStatus: data.riskStatus,
        answers: data.answers
      }
    });

    // 2. Update Student weight / height & status
    await prisma.student.update({
      where: { id: data.studentId },
      data: {
        ...(data.weight && { weight: data.weight }),
        ...(data.height && { height: data.height }),
        status: data.riskStatus === "มีปัญหา" ? "ช่วยเหลือเร่งด่วน" : data.riskStatus === "เสี่ยง" ? "เสี่ยง" : "ปกติ"
      }
    });

    revalidatePath("/");
    return { success: true, data: sdq };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 10. Save Exit Permit
export async function saveExitPermit(data: {
  studentId: string;
  reason: string;
  destination: string;
  approvedBy?: string;
}) {
  try {
    const session = await requireAuth();

    const permit = await prisma.studentExitPermit.create({
      data: {
        studentId: data.studentId,
        reason: data.reason,
        destination: data.destination,
        approvedBy: data.approvedBy || session.user.name || "ผู้บริหาร",
        status: "APPROVED",
        lineSentStatus: true
      }
    });

    revalidatePath("/");
    return { success: true, data: permit };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 11. Get student timeline events
export async function getStudentTimeline(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        homeVisit: true,
        healthVisits: true,
        behaviorLogs: true,
        sdqAssessments: true,
        exitPermits: true,
      }
    });

    if (!student) return { success: false, error: "ไม่พบข้อมูลนักเรียน" };

    const events: any[] = [];

    // 1. Behavior logs
    student.behaviorLogs.forEach(log => {
      events.push({
        id: `behavior-${log.id}`,
        date: log.createdAt.toISOString().split("T")[0],
        title: log.type === "MERIT" ? `บำเพ็ญประโยชน์/ทำความดี (+${log.points})` : `หักคะแนนความประพฤติ (-${log.points})`,
        description: log.description,
        category: "behavior",
        icon: "ShieldAlert",
        actor: log.loggedBy,
        createdAt: log.createdAt
      });
    });

    // 2. Health visits
    student.healthVisits.forEach(visit => {
      events.push({
        id: `health-${visit.id}`,
        date: visit.createdAt.toISOString().split("T")[0],
        title: `เข้ารับการรักษาที่ห้องพยาบาล`,
        description: `อาการ: ${visit.symptoms} • การรักษา/จ่ายยา: ${visit.medicine} (${visit.firstAid})`,
        category: "health",
        icon: "HeartPulse",
        actor: "ครูพยาบาล",
        createdAt: visit.createdAt
      });
    });

    // 3. SDQ assessments
    student.sdqAssessments.forEach(sdq => {
      events.push({
        id: `sdq-${sdq.id}`,
        date: sdq.createdAt.toISOString().split("T")[0],
        title: `ประเมินสุขภาพจิต SDQ คัดกรองนักเรียน`,
        description: `ผลลัพธ์: ${sdq.riskStatus === "มีปัญหา" ? "กลุ่มมีปัญหา" : sdq.riskStatus === "เสี่ยง" ? "กลุ่มเสี่ยง" : "ปกติ"} (คะแนนรวม: ${sdq.totalScore})`,
        category: "academic",
        icon: "GraduationCap",
        actor: "ครูประจำชั้น",
        createdAt: sdq.createdAt
      });
    });

    // 4. Home visit
    if (student.homeVisit) {
      events.push({
        id: `homevisit-${student.homeVisit.id}`,
        date: student.homeVisit.visitedAt.toISOString().split("T")[0],
        title: `เยี่ยมบ้านนักเรียน (กสศ. นร.01) สำเร็จ`,
        description: `บันทึกข้อมูลสิ่งแวดล้อมครอบครัว และคำนวณเงินค่าเดินทางรอบทิศทางสำเร็จ (${student.homeVisit.remarks || ""})`,
        category: "home_visit",
        icon: "Home",
        actor: "ครูประจำชั้น",
        createdAt: student.homeVisit.visitedAt
      });
    }

    // 5. Exit permits
    student.exitPermits.forEach(permit => {
      events.push({
        id: `exit-${permit.id}`,
        date: permit.createdAt.toISOString().split("T")[0],
        title: `ขออนุญาตออกนอกบริเวณโรงเรียน (Exit Permit)`,
        description: `เหตุผล: ${permit.reason} • ปลายทาง: ${permit.destination} • อนุมัติโดย: ${permit.approvedBy || "ผู้บริหาร"}`,
        category: "attendance",
        icon: "Calendar",
        actor: permit.approvedBy || "ผู้บริหาร",
        createdAt: permit.createdAt
      });
    });

    // Sort by createdAt descending
    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Fallback if empty to have some default events
    if (events.length === 0) {
      events.push({
        id: "default-1",
        date: student.createdAt.toISOString().split("T")[0],
        title: "เพิ่มนักเรียนเข้าสู่ระบบ",
        description: `เปิดประวัตินักเรียนในฐานข้อมูลของระดับชั้น ${student.classroom}`,
        category: "academic",
        icon: "GraduationCap",
        actor: "ระบบ",
        createdAt: student.createdAt
      });
    }

    return { success: true, data: events };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
