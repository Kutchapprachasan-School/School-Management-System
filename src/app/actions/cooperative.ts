"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function getCoopShares() {
  await requireAuth();
  return await prisma.coopShare.findMany({
    include: {
      user: { select: { name: true, email: true } },
      student: { select: { fullName: true, studentCode: true, classroom: true } }
    },
    orderBy: { sharesCount: "desc" }
  });
}

export async function updateCoopShares(data: {
  userId?: string;
  studentId?: string;
  sharesCount: number;
  totalValue: number;
}) {
  await requireAuth();
  
  if (data.userId) {
    return await prisma.coopShare.upsert({
      where: { userId: data.userId },
      update: {
        sharesCount: { increment: data.sharesCount },
        totalValue: { increment: data.totalValue }
      },
      create: {
        userId: data.userId,
        sharesCount: data.sharesCount,
        totalValue: data.totalValue
      }
    });
  } else if (data.studentId) {
    return await prisma.coopShare.upsert({
      where: { studentId: data.studentId },
      update: {
        sharesCount: { increment: data.sharesCount },
        totalValue: { increment: data.totalValue }
      },
      create: {
        studentId: data.studentId,
        sharesCount: data.sharesCount,
        totalValue: data.totalValue
      }
    });
  }
  throw new Error("Invalid request data");
}

export async function processCoopPurchase(data: {
  buyerId: string;
  buyerType: string;
  totalPrice: number;
  paymentBy: string;
  itemsJson: string;
}) {
  await requireAuth();
  const res = await prisma.coopTransaction.create({
    data
  });
  return { success: true, transaction: res };
}
