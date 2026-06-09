"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function depositRecycling(data: {
  studentId: string;
  wasteType: string;
  weightKg: number;
  pointsValue: number;
}) {
  await requireAuth();
  const res = await prisma.wasteDeposit.create({
    data
  });

  // Credit student behavior points (merits) based on environmental deposits
  if (data.pointsValue > 0) {
    await prisma.behaviorLog.create({
      data: {
        studentId: data.studentId,
        type: "MERIT",
        points: Math.min(10, Math.ceil(data.pointsValue / 10)),
        description: `กิจกรรมธนาคารขยะ: ฝากขยะประเภท ${data.wasteType} น้ำหนัก ${data.weightKg} กก.`,
        loggedBy: "ระบบธนาคารขยะ"
      }
    });
  }

  revalidatePath("/profile");
  return { success: true, deposit: res };
}

export async function getRecyclingLeaderboard() {
  await requireAuth();
  const rawLeaderboard = await prisma.wasteDeposit.groupBy({
    by: ["studentId"],
    _sum: {
      weightKg: true,
      pointsValue: true
    },
    orderBy: {
      _sum: {
        weightKg: "desc"
      }
    },
    take: 10
  });

  // Fetch student names for display
  const leaderboard = await Promise.all(
    rawLeaderboard.map(async (item) => {
      const student = await prisma.student.findUnique({
        where: { id: item.studentId },
        select: { fullName: true, studentCode: true, classroom: true }
      });
      return {
        studentId: item.studentId,
        fullName: student?.fullName || "ไม่ระบุชื่อ",
        studentCode: student?.studentCode || "-",
        classroom: student?.classroom || "-",
        totalWeight: item._sum.weightKg || 0,
        totalPoints: item._sum.pointsValue || 0
      };
    })
  );

  return leaderboard;
}
