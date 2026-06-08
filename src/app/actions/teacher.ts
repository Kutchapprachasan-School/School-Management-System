"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const teacherUpdateSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  position: z.string().optional(),
  subjectGroup: z.string().optional(),
  employeeCode: z.string().optional(),
  phone: z.string().optional(),
  dutyDay: z.string().optional(),
  advisoryClass: z.string().optional(),
  role: z.enum(["ADMIN", "TEACHER"])
});

export async function getTeachers() {
  try {
    const teachers = await prisma.user.findMany({
      orderBy: { name: "asc" }
    });
    return { success: true, data: teachers };
  } catch (error) {
    return { success: false, error: "ดึงข้อมูลครูล้มเหลว" };
  }
}

export async function updateTeacher(id: string, data: any) {
  try {
    const parsedData = teacherUpdateSchema.parse(data);

    await prisma.user.update({
      where: { id },
      data: parsedData
    });

    revalidatePath("/timetables/teachers");
    revalidatePath("/timetables/schedule");
    return { success: true, message: "ปรับปรุงข้อมูลสำเร็จ" };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "เกิดข้อผิดพลาด: " + error.message };
  }
}

export async function deleteTeacher(id: string) {
  try {
    // Check if teacher has schedules
    const scheduleCount = await prisma.schedule.count({
      where: { userId: id }
    });
    if (scheduleCount > 0) {
      return { success: false, error: "ไม่สามารถลบครูท่านนี้ได้เนื่องจากมีชั่วโมงสอนอยู่ในตารางสอน" };
    }

    await prisma.user.delete({
      where: { id }
    });

    revalidatePath("/timetables/teachers");
    return { success: true, message: "ลบข้อมูลครูสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "ไม่สามารถลบข้อมูลครูได้: " + error.message };
  }
}
