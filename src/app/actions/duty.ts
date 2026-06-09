"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function getDutySchedules() {
  await requireAuth();
  return await prisma.dutySchedule.findMany({
    include: {
      teacher: {
        select: { name: true, position: true }
      },
      logs: {
        orderBy: { date: "desc" },
        take: 5
      }
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { spotName: "asc" }
    ]
  });
}

export async function createDutySchedule(data: {
  teacherId: string;
  dayOfWeek: string;
  spotName: string;
  timeSlot: string;
}) {
  await requireAuth();
  const res = await prisma.dutySchedule.create({
    data
  });
  revalidatePath("/profile");
  return { success: true, dutySchedule: res };
}

export async function submitDutyLog(data: {
  dutyScheduleId: string;
  date: Date;
  status: string;
  reportedBy: string;
  photoUrl?: string;
  incidents?: string;
}) {
  await requireAuth();
  const res = await prisma.dutyLog.create({
    data
  });
  revalidatePath("/profile");
  return { success: true, log: res };
}
