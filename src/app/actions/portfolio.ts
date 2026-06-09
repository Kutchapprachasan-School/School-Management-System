"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function getTeacherPortfolios() {
  const session = await requireAuth();
  return await prisma.teacherPortfolio.findMany({
    where: { teacherId: session.user.id },
    orderBy: { createdAt: "desc" }
  });
}

export async function addPortfolioItem(data: {
  academicYear: number;
  activityName: string;
  qaStandard: string;
  category: string;
  evidenceUrl?: string;
}) {
  const session = await requireAuth();
  const res = await prisma.teacherPortfolio.create({
    data: {
      teacherId: session.user.id,
      academicYear: data.academicYear,
      activityName: data.activityName,
      qaStandard: data.qaStandard,
      category: data.category,
      evidenceUrl: data.evidenceUrl
    }
  });
  revalidatePath("/profile");
  return { success: true, portfolioItem: res };
}

export async function generateSarDraft(academicYear: number) {
  const session = await requireAuth();
  const portfolios = await prisma.teacherPortfolio.findMany({
    where: {
      teacherId: session.user.id,
      academicYear
    },
    orderBy: { qaStandard: "asc" }
  });

  // Mock template generation logic
  const teacherName = session.user.name || "คุณครูผู้สอน";
  const sarOutline = `
รายงานประเมินตนเองรายบุคคล (Self-Assessment Report: SAR)
ประจำปีการศึกษา: ${academicYear}
เสนอโดย: ${teacherName}
--------------------------------------------------

บทที่ 1: ผลงานการปฏิบัติหน้าที่และการสนับสนุนคุณภาพการศึกษา
${portfolios.length > 0
  ? portfolios.map((p, idx) => `  ${idx + 1}. [มาตรฐาน ${p.qaStandard}] ${p.activityName} (${p.category})`).join("\n")
  : "  (ไม่มีข้อมูลผลงานที่บันทึกในปีการศึกษานี้)"
}

บทที่ 2: การพัฒนาตนเองทางวิชาชีพและการสร้างนวัตกรรม
  (รวบรวมชั่วโมง PLC และการจัดกิจกรรมการเรียนรู้แบบ Active Learning)

--------------------------------------------------
สร้างเอกสารร่างสำเร็จเมื่อ: ${new Date().toLocaleDateString("th-TH")}
  `;

  return { success: true, sarDraftText: sarOutline };
}
