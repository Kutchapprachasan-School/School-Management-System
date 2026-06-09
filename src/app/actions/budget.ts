"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }
  return session;
}

async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN" && (session.user as any).position !== "แอดมิน") {
    throw new Error("ไม่มีสิทธิ์ในการจัดการข้อมูลพัสดุและงบประมาณ");
  }
  return session;
}

// 1. Get all budget projects
export async function getBudgetProjects() {
  try {
    await requireAuth();
    const projects = await prisma.budgetProject.findMany({
      orderBy: { code: "asc" }
    });
    return { success: true, data: projects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Create or Update a budget project
export async function upsertBudgetProject(data: { id?: string; code: string; name: string; budget: number; spent?: number }) {
  try {
    await requireAdmin();
    const budgetVal = Number(data.budget);
    const spentVal = Number(data.spent || 0);
    const remainingVal = budgetVal - spentVal;

    const project = await prisma.budgetProject.upsert({
      where: { code: data.code },
      update: {
        name: data.name,
        budget: budgetVal,
        spent: spentVal,
        remaining: remainingVal
      },
      create: {
        code: data.code,
        name: data.name,
        budget: budgetVal,
        spent: spentVal,
        remaining: remainingVal
      }
    });

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true, data: project };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Deduct budget from a project safely
export async function deductProjectBudget(projectCode: string, amount: number) {
  try {
    await requireAuth();
    const amountVal = Number(amount);
    if (amountVal <= 0) {
      throw new Error("ยอดเงินที่หักต้องมากกว่า 0 บาท");
    }

    const res = await prisma.$transaction(async (tx) => {
      const project = await tx.budgetProject.findUnique({
        where: { code: projectCode }
      });

      if (!project) {
        throw new Error(`ไม่พบโครงการรหัส ${projectCode}`);
      }

      if (project.remaining < amountVal) {
        throw new Error(`งบประมาณคงเหลือไม่เพียงพอ (คงเหลือ: ${project.remaining} บาท, ต้องการใช้: ${amountVal} บาท)`);
      }

      const newSpent = project.spent + amountVal;
      const newRemaining = project.budget - newSpent;

      const updated = await tx.budgetProject.update({
        where: { code: projectCode },
        data: {
          spent: newSpent,
          remaining: newRemaining
        }
      });

      return updated;
    });

    revalidatePath("/");
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
