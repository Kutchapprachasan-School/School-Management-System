"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// 1. Save or Update Subject-specific Attendance
export async function saveSubjectAttendance(
  classroomId: string,
  subjectId: string,
  periodId: string,
  dateStr: string, // ISO string or YYYY-MM-DD
  records: Record<string, string> // studentId -> status (present, late, absent, sick, leave)
) {
  try {
    const dateVal = new Date(dateStr);
    
    // We search if it already exists using unique compound key
    const attendance = await prisma.subjectAttendance.upsert({
      where: {
        classroomId_subjectId_periodId_date: {
          classroomId,
          subjectId,
          periodId,
          date: dateVal
        }
      },
      create: {
        classroomId,
        subjectId,
        periodId,
        date: dateVal,
        records: JSON.stringify(records)
      },
      update: {
        records: JSON.stringify(records)
      }
    });

    revalidatePath("/");
    return { success: true, data: attendance };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Get Subject-specific Attendance
export async function getSubjectAttendance(
  classroomId: string,
  subjectId: string,
  periodId: string,
  dateStr: string
) {
  try {
    const dateVal = new Date(dateStr);
    const attendance = await prisma.subjectAttendance.findUnique({
      where: {
        classroomId_subjectId_periodId_date: {
          classroomId,
          subjectId,
          periodId,
          date: dateVal
        }
      }
    });

    if (!attendance) {
      return { success: true, data: null };
    }

    return { 
      success: true, 
      data: {
        ...attendance,
        records: JSON.parse(attendance.records)
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Get Classroom Schedules for a specific day of the week
export async function getClassroomSchedulesForDay(
  classroomName: string,
  dayOfWeek: number // 1=Monday, 2=Tuesday, etc.
) {
  try {
    // Find classroom id from name first
    const classroom = await prisma.classroom.findUnique({
      where: { name: classroomName }
    });

    if (!classroom) {
      return { success: false, error: "ไม่พบข้อมูลห้องเรียน" };
    }

    // Find schedules
    const schedules = await prisma.schedule.findMany({
      where: {
        classroomId: classroom.id,
        dayOfWeek
      },
      include: {
        subject: true,
        period: true,
        user: true // teacher details
      },
      orderBy: {
        period: {
          order: "asc"
        }
      }
    });

    return { success: true, data: schedules };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
