"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const subjectSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสวิชา"),
  name: z.string().min(1, "กรุณากรอกชื่อวิชา"),
  credit: z.coerce.number().min(0).optional(),
  hours: z.coerce.number().min(1, "ต้องมีอย่างน้อย 1 คาบ"),
  color: z.string().optional(),
});

export async function getSubjects() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { code: "asc" },
    });
    return { success: true, data: subjects };
  } catch (error) {
    return { success: false, error: "ดึงข้อมูลวิชาล้มเหลว" };
  }
}

export async function createSubject(formData: FormData) {
  try {
    const data = {
      code: formData.get("code"),
      name: formData.get("name"),
      credit: formData.get("credit") || "0",
      hours: formData.get("hours") || "1",
      color: formData.get("color") || "#3b82f6",
    };

    const parsedData = subjectSchema.parse(data);

    const existing = await prisma.subject.findUnique({
      where: { code: parsedData.code },
    });

    if (existing) {
      return { success: false, error: "รหัสวิชานี้มีอยู่ในระบบแล้ว" };
    }

    await prisma.subject.create({
      data: parsedData,
    });

    revalidatePath("/timetables/subjects");
    return { success: true, message: "เพิ่มรายวิชาสำเร็จ" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}

export async function deleteSubject(id: string) {
  try {
    await prisma.subject.delete({
      where: { id },
    });
    revalidatePath("/timetables/subjects");
    return { success: true, message: "ลบรายวิชาสำเร็จ" };
  } catch (error) {
    return { success: false, error: "ไม่สามารถลบรายวิชาได้ อาจมีการใช้งานอยู่ในตารางสอน" };
  }
}
