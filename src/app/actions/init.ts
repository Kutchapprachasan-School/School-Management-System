"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getSystemInitialData() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    // 1. Check if Subjects table is empty
    const subjectsCount = await prisma.subject.count();
    if (subjectsCount === 0) {
      console.log("Seeding default subjects...");
      await prisma.subject.createMany({
        data: [
          { code: "ว31101", name: "วิทยาศาสตร์พื้นฐาน", credit: 1.5, hours: 3, color: "#3b82f6" },
          { code: "ท31101", name: "ภาษาไทยพื้นฐาน", credit: 1.0, hours: 2, color: "#ef4444" },
          { code: "ค31101", name: "คณิตศาสตร์พื้นฐาน", credit: 1.5, hours: 3, color: "#10b981" },
          { code: "อ31101", name: "ภาษาอังกฤษพื้นฐาน", credit: 1.0, hours: 2, color: "#f59e0b" },
          { code: "ส31101", name: "สังคมศึกษา", credit: 1.0, hours: 2, color: "#8b5cf6" },
        ]
      });
    }

    // 2. Check if Classrooms table is empty
    const classroomsCount = await prisma.classroom.count();
    if (classroomsCount === 0) {
      console.log("Seeding default classrooms...");
      await prisma.classroom.createMany({
        data: [
          { name: "ม.1/1", grade: "ม.1", room: "1" },
          { name: "ม.1/2", grade: "ม.1", room: "2" },
          { name: "ม.4/1", grade: "ม.4", room: "1" },
          { name: "ม.6/1", grade: "ม.6", room: "1" },
        ]
      });
    }

    // 3. Check if AcademicTerm exists
    const termCount = await prisma.academicTerm.count();
    if (termCount === 0) {
      await prisma.academicTerm.create({
        data: { year: "2569", term: "1", isCurrent: true }
      });
    }

    // 4. Check if Period exists
    const periodCount = await prisma.period.count();
    if (periodCount === 0) {
      await prisma.period.createMany({
        data: [
          { name: "คาบ 1", order: 1, startTime: "08:30", endTime: "09:20" },
          { name: "คาบ 2", order: 2, startTime: "09:20", endTime: "10:10" },
          { name: "คาบ 3", order: 3, startTime: "10:10", endTime: "11:00" },
          { name: "คาบ 4", order: 4, startTime: "11:00", endTime: "11:50" },
          { name: "คาบ 5", order: 5, startTime: "12:50", endTime: "13:40" },
          { name: "คาบ 6", order: 6, startTime: "13:40", endTime: "14:30" },
          { name: "คาบ 7", order: 7, startTime: "14:30", endTime: "15:20" },
          { name: "คาบ 8", order: 8, startTime: "15:20", endTime: "16:10" },
        ]
      });
    }

    // 5. Fetch Dynamic Data from Supabase PostgreSQL
    const teachers = await prisma.user.findMany({
      orderBy: { name: "asc" }
    });

    const leaveRequests = await prisma.leaveRequest.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" }
    });

    const subjects = await prisma.subject.findMany({
      orderBy: { code: "asc" }
    });

    const classrooms = await prisma.classroom.findMany({
      orderBy: { name: "asc" }
    });

    const periods = await prisma.period.findMany({
      orderBy: { order: "asc" }
    });

    let settings = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    });
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: "default",
          schoolName: "โรงเรียนกุฎประสิทธิ์",
          subheader: "ระบบจัดการการลา & จัดตารางสอนอัจฉริยะ (School OS)",
          logoUrl: null,
          footerText: "© 2026 โรงเรียนกุฎประสิทธิ์. All Rights Reserved."
        }
      });
    }

    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return {
      success: true,
      data: {
        session,
        teachers: teachers.map(t => ({
          id: t.id,
          fullName: t.name || t.email,
          email: t.email,
          position: t.position || "ครู",
          subjectGroup: t.subjectGroup || "ทั่วไป",
          role: t.role === "ADMIN" ? "admin" : "teacher",
          isApproved: t.isApproved
        })),
        leaveRequests: leaveRequests.map(lr => ({
          id: lr.id,
          userId: lr.userId,
          teacherName: lr.user?.name || lr.user?.email || "ไม่ทราบชื่อ",
          type: lr.type === "SICK" ? "ลาป่วย" : lr.type === "PERSONAL" ? "ลากิจส่วนตัว" : "ลาพักผ่อน",
          startDate: lr.startDate.toISOString().split('T')[0],
          endDate: lr.endDate.toISOString().split('T')[0],
          reason: lr.reason,
          status: lr.status === "APPROVED" ? "อนุมัติแล้ว" : lr.status === "REJECTED" ? "ไม่นุมัติ" : "รออนุมัติ",
          documentUrl: lr.documentUrl
        })),
        subjects: subjects.map(s => ({
          id: s.id,
          code: s.code,
          name: s.name,
          credits: s.credit || 1.5,
          hours: s.hours || 3,
          color: s.color || "#3b82f6"
        })),
        classrooms: classrooms.map(c => ({
          id: c.id,
          name: c.name,
          grade: c.grade || "",
          room: c.room || ""
        })),
        periods: periods.map(p => ({
          id: p.id,
          name: p.name,
          order: p.order,
          startTime: p.startTime,
          endTime: p.endTime
        })),
        settings,
        logs: logs.map(l => ({
          id: l.id,
          actionType: l.actionType,
          description: l.description,
          timestamp: l.createdAt.toLocaleString("th-TH")
        }))
      }
    };
  } catch (err: any) {
    console.error("Error in getSystemInitialData:", err);
    return { success: false, error: err.message };
  }
}
