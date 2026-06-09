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

// Save student grades to database
export async function saveStudentGrades(
  subjectId: string,
  termId: string,
  grades: Record<
    string,
    {
      f1: number;
      f2: number;
      mid: number;
      f3: number;
      fin: number;
      reading: number;
      traits: number;
      grade?: string;
    }
  >
) {
  try {
    await requireAuth();

    await prisma.$transaction(async (tx) => {
      for (const [studentId, gradeData] of Object.entries(grades)) {
        const total =
          gradeData.f1 +
          gradeData.f2 +
          gradeData.mid +
          gradeData.f3 +
          gradeData.fin;

        // Calculate grade string
        let calculatedGrade = gradeData.grade;
        if (!calculatedGrade) {
          if (total >= 80) calculatedGrade = "4.0";
          else if (total >= 75) calculatedGrade = "3.5";
          else if (total >= 70) calculatedGrade = "3.0";
          else if (total >= 65) calculatedGrade = "2.5";
          else if (total >= 60) calculatedGrade = "2.0";
          else if (total >= 55) calculatedGrade = "1.5";
          else if (total >= 50) calculatedGrade = "1.0";
          else calculatedGrade = "0";
        }

        // Check if student has low attendance ( มส ) - handled in frontend or backend
        // We'll upsert into SubjectScore table
        await tx.subjectScore.upsert({
          where: {
            studentId_subjectId_termId: {
              studentId,
              subjectId,
              termId
            }
          },
          update: {
            preMidterm: JSON.stringify([gradeData.f1, gradeData.f2]),
            midterm: gradeData.mid,
            postMidterm: JSON.stringify([gradeData.f3]),
            final: gradeData.fin,
            totalScore: total,
            grade: calculatedGrade,
            updatedAt: new Date()
          },
          create: {
            studentId,
            subjectId,
            termId,
            preMidterm: JSON.stringify([gradeData.f1, gradeData.f2]),
            midterm: gradeData.mid,
            postMidterm: JSON.stringify([gradeData.f3]),
            final: gradeData.fin,
            totalScore: total,
            grade: calculatedGrade
          }
        });
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get student grades from database
export async function getStudentScores(subjectId: string, termId: string) {
  try {
    await requireAuth();
    const scores = await prisma.subjectScore.findMany({
      where: {
        subjectId,
        termId
      }
    });
    return { success: true, data: scores };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
