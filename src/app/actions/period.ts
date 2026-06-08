"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const periodSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อคาบเรียน เช่น คาบ 1"),
  order: z.coerce.number().min(1, "ลำดับคาบต้องมากกว่า 0"),
  startTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "รูปแบบเวลาเริ่มต้นไม่ถูกต้อง (HH:MM)"),
  endTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "รูปแบบเวลาสิ้นสุดไม่ถูกต้อง (HH:MM)")
});

export async function getPeriods() {
  try {
    const periods = await prisma.period.findMany({
      orderBy: { order: "asc" }
    });
    return { success: true, data: periods };
  } catch (error: any) {
    return { success: false, error: "ดึงข้อมูลคาบเรียนล้มเหลว: " + error.message };
  }
}

export async function createPeriod(formData: FormData) {
  try {
    const data = {
      name: formData.get("name"),
      order: formData.get("order"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime")
    };

    const parsedData = periodSchema.parse(data);

    // Check if order exists
    const existingOrder = await prisma.period.findFirst({
      where: { order: parsedData.order }
    });
    if (existingOrder) {
      return { success: false, error: `ลำดับคาบเรียนที่ ${parsedData.order} มีในระบบแล้ว` };
    }

    await prisma.period.create({
      data: parsedData
    });

    revalidatePath("/timetables/periods");
    revalidatePath("/timetables/schedule");
    return { success: true, message: "เพิ่มคาบเรียนสำเร็จ" };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "เกิดข้อผิดพลาด: " + error.message };
  }
}

export async function updatePeriodTime(id: string, startTime: string, endTime: string) {
  try {
    // Basic regex check
    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return { success: false, error: "รูปแบบเวลาไม่ถูกต้อง (HH:MM)" };
    }

    await prisma.period.update({
      where: { id },
      data: { startTime, endTime }
    });

    revalidatePath("/timetables/periods");
    revalidatePath("/timetables/schedule");
    return { success: true, message: "ปรับปรุงเวลาคาบเรียนสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "ปรับปรุงเวลาล้มเหลว: " + error.message };
  }
}

export async function deletePeriod(id: string) {
  try {
    // Check if schedules exist using this period
    const scheduleCount = await prisma.schedule.count({
      where: { periodId: id }
    });

    if (scheduleCount > 0) {
      return { success: false, error: "ไม่สามารถลบคาบเรียนนี้ได้เนื่องจากมีคาบเรียนจัดตารางสอนอยู่ในระบบ" };
    }

    await prisma.period.delete({
      where: { id }
    });

    revalidatePath("/timetables/periods");
    revalidatePath("/timetables/schedule");
    return { success: true, message: "ลบคาบเรียนสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "ไม่สามารถลบคาบเรียนได้: " + error.message };
  }
}

export async function bulkUpdatePeriodTimes(times: Array<{ id: string; startTime: string; endTime: string }>) {
  try {
    await prisma.$transaction(
      times.map(t => prisma.period.update({
        where: { id: t.id },
        data: { startTime: t.startTime, endTime: t.endTime }
      }))
    );
    revalidatePath("/timetables/periods");
    revalidatePath("/timetables/schedule");
    return { success: true, message: "ปรับปรุงเวลาเรียนทั้งหมดสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "เกิดข้อผิดพลาดในการบันทึกเวลาเรียนทั้งหมด: " + error.message };
  }
}
