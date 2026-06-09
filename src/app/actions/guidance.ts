"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function getScholarships() {
  return await prisma.scholarship.findMany({
    include: {
      applications: {
        include: {
          student: {
            select: { fullName: true, studentCode: true, classroom: true }
          }
        }
      }
    },
    orderBy: { name: "asc" }
  });
}

export async function submitScholarshipApplication(data: {
  scholarshipId: string;
  studentId: string;
  remarks?: string;
}) {
  await requireAuth();
  const res = await prisma.scholarshipApplication.create({
    data: {
      scholarshipId: data.scholarshipId,
      studentId: data.studentId,
      status: "PENDING",
      remarks: data.remarks
    }
  });
  return { success: true, application: res };
}

export async function getAlumniRecords() {
  await requireAuth();
  return await prisma.alumniRecord.findMany({
    orderBy: { graduationYear: "desc" }
  });
}

export async function saveAlumniRecord(data: {
  studentCode: string;
  fullName: string;
  graduationYear: number;
  tcasStatus?: string;
  workplace?: string;
  phone?: string;
  email?: string;
}) {
  await requireAuth();
  const res = await prisma.alumniRecord.upsert({
    where: { studentCode: data.studentCode },
    update: {
      fullName: data.fullName,
      graduationYear: data.graduationYear,
      tcasStatus: data.tcasStatus,
      workplace: data.workplace,
      phone: data.phone,
      email: data.email
    },
    create: data
  });
  revalidatePath("/profile");
  return { success: true, alumni: res };
}
