"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function submitMentalHealthAssessment(data: {
  studentId: string;
  type: string;
  score: number;
  result: string;
}) {
  await requireAuth();
  const res = await prisma.mentalHealthAssessment.create({
    data
  });
  return { success: true, assessment: res };
}

export async function getCounselingSessions() {
  const session = await requireAuth();
  const user = session.user as any;

  // Security: only counselor, guidance teacher, director, or admin can access counseling logs
  const isAuthorized = user.role === "ADMIN" || ["ครูแนะแนว", "ครู", "ผู้บริหาร", "แอดมิน"].includes(user.position);
  if (!isAuthorized) {
    throw new Error("ไม่มีสิทธิ์เข้าถึงประวัติบันทึกการปรึกษาจิตวิทยา");
  }

  return await prisma.counselingSession.findMany({
    include: {
      student: {
        select: { fullName: true, studentCode: true, classroom: true }
      }
    },
    orderBy: { date: "desc" }
  });
}

export async function saveCounselingSession(data: {
  studentId: string;
  counselorId: string;
  date: Date;
  topics: string;
  notesSecured: string;
  referralNeeded: boolean;
}) {
  const session = await requireAuth();
  const user = session.user as any;

  const isAuthorized = user.role === "ADMIN" || ["ครูแนะแนว", "ครู", "ผู้บริหาร", "แอดมิน"].includes(user.position);
  if (!isAuthorized) {
    throw new Error("ไม่มีสิทธิ์เข้าใช้งานระบบบันทึกคำปรึกษาจิตวิทยา");
  }

  const res = await prisma.counselingSession.create({
    data
  });
  revalidatePath("/profile");
  return { success: true, counselingSession: res };
}
