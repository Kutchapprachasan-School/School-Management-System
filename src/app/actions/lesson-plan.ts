"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function getLessonPlans() {
  const session = await requireAuth();
  return await prisma.lessonPlan.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" }
  });
}

export async function createLessonPlan(data: {
  subjectId: string;
  title: string;
  objective: string;
  content: string;
  activities: string;
  media?: string;
  evaluation?: string;
}) {
  const session = await requireAuth();
  const res = await prisma.lessonPlan.create({
    data: {
      userId: session.user.id,
      subjectId: data.subjectId,
      title: data.title,
      objective: data.objective,
      content: data.content,
      activities: data.activities,
      media: data.media || null,
      evaluation: data.evaluation || ""
    }
  });
  revalidatePath("/profile");
  return { success: true, lessonPlan: res };
}

export async function generateAiRubric(data: {
  topic: string;
  gradeLevel: string;
  criteria: string[];
}) {
  await requireAuth();

  // Simulated AI response for grading rubrics based on school parameters
  const rubricLevels = data.criteria.map((criterion) => {
    return {
      criterion,
      level4: `ดีเยี่ยม (4): นักเรียนแสดงออกถึงความเข้าใจอย่างลึกซึ้งในเรื่อง ${criterion} และสามารถประยุกต์ใช้ได้สมบูรณ์แบบ`,
      level3: `ดี (3): นักเรียนสามารถปฏิบัติงานได้ตามเกณฑ์ ${criterion} ครบถ้วนโดยมีข้อผิดพลาดเล็กน้อย`,
      level2: `พอใช้ (2): นักเรียนสามารถปฏิบัติงานเรื่อง ${criterion} ได้เป็นบางส่วน ยังต้องมีครูชี้แนะ`,
      level1: `ปรับปรุง (1): นักเรียนยังไม่เข้าใจหลักการพื้นฐานของ ${criterion}`
    };
  });

  return {
    success: true,
    topic: data.topic,
    gradeLevel: data.gradeLevel,
    rubric: rubricLevels
  };
}
