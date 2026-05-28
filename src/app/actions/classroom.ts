"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const classroomSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อชั้นเรียน"),
  grade: z.string().optional(),
  room: z.string().optional(),
});

export async function getClassrooms() {
  try {
    const classrooms = await prisma.classroom.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, data: classrooms };
  } catch (error) {
    return { success: false, error: "ดึงข้อมูลชั้นเรียนล้มเหลว" };
  }
}

export async function createClassroom(formData: FormData) {
  try {
    const data = {
      name: formData.get("name"),
      grade: formData.get("grade") || "",
      room: formData.get("room") || "",
    };

    const parsedData = classroomSchema.parse(data);

    const existing = await prisma.classroom.findUnique({
      where: { name: parsedData.name },
    });

    if (existing) {
      return { success: false, error: "ชั้นเรียนนี้มีอยู่ในระบบแล้ว" };
    }

    await prisma.classroom.create({
      data: parsedData,
    });

    revalidatePath("/timetables/classrooms");
    return { success: true, message: "เพิ่มชั้นเรียนสำเร็จ" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}

export async function deleteClassroom(id: string) {
  try {
    await prisma.classroom.delete({
      where: { id },
    });
    revalidatePath("/timetables/classrooms");
    return { success: true, message: "ลบชั้นเรียนสำเร็จ" };
  } catch (error) {
    return { success: false, error: "ไม่สามารถลบชั้นเรียนได้ อาจมีการใช้งานอยู่ในตารางสอน" };
  }
}
