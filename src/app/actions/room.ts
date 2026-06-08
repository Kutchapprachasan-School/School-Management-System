"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const roomSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อห้องเรียน"),
  building: z.string().optional(),
});

export async function getRooms() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, data: rooms };
  } catch (error) {
    return { success: false, error: "ดึงข้อมูลห้องเรียนล้มเหลว" };
  }
}

export async function createRoom(formData: FormData) {
  try {
    const data = {
      name: formData.get("name"),
      building: formData.get("building") || "",
    };

    const parsedData = roomSchema.parse(data);

    const existing = await prisma.room.findUnique({
      where: { name: parsedData.name },
    });

    if (existing) {
      return { success: false, error: "ห้องเรียนนี้มีอยู่ในระบบแล้ว" };
    }

    await prisma.room.create({
      data: parsedData,
    });

    revalidatePath("/timetables/rooms");
    return { success: true, message: "เพิ่มห้องเรียนสำเร็จ" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}

export async function updateRoom(id: string, formData: FormData) {
  try {
    const data = {
      name: formData.get("name"),
      building: formData.get("building") || "",
    };

    const parsedData = roomSchema.parse(data);

    const existing = await prisma.room.findFirst({
      where: {
        name: parsedData.name,
        NOT: { id },
      },
    });

    if (existing) {
      return { success: false, error: "ห้องเรียนชื่อนี้มีอยู่ในระบบแล้ว" };
    }

    await prisma.room.update({
      where: { id },
      data: parsedData,
    });

    revalidatePath("/timetables/rooms");
    return { success: true, message: "แก้ไขห้องเรียนสำเร็จ" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}

export async function deleteRoom(id: string) {
  try {
    await prisma.room.delete({
      where: { id },
    });
    revalidatePath("/timetables/rooms");
    return { success: true, message: "ลบห้องเรียนสำเร็จ" };
  } catch (error) {
    return { success: false, error: "ไม่สามารถลบห้องเรียนได้ อาจมีการใช้งานอยู่ในตารางสอน" };
  }
}
