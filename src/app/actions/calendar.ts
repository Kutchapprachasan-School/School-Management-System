"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAcademicEvents() {
  try {
    const events = await prisma.academicEvent.findMany({
      orderBy: {
        startDate: "asc",
      },
    });
    return { success: true, data: events };
  } catch (error: any) {
    console.error("Failed to fetch academic events:", error);
    return { success: false, error: error.message };
  }
}

export async function createAcademicEvent(data: {
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate?: string;  // ISO string
  color?: string;
}) {
  try {
    const event = await prisma.academicEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        color: data.color || "#4f46e5",
      },
    });
    revalidatePath("/");
    return { success: true, data: event };
  } catch (error: any) {
    console.error("Failed to create academic event:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAcademicEvent(id: string) {
  try {
    await prisma.academicEvent.delete({
      where: { id },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete academic event:", error);
    return { success: false, error: error.message };
  }
}
