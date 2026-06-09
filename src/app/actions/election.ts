"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import crypto from "crypto";

export async function getActiveElection() {
  return await prisma.election.findFirst({
    where: { status: "ACTIVE" },
    include: {
      candidates: {
        orderBy: { partyNumber: "asc" }
      }
    }
  });
}

export async function createElection(data: {
  title: string;
  startDate: Date;
  endDate: Date;
}) {
  await requireAuth();
  return await prisma.election.create({
    data: {
      title: data.title,
      status: "DRAFT",
      startDate: data.startDate,
      endDate: data.endDate
    }
  });
}

export async function addCandidate(data: {
  electionId: string;
  partyNumber: number;
  partyName: string;
  leaderName: string;
  slogan?: string;
  logoUrl?: string;
}) {
  await requireAuth();
  return await prisma.candidate.create({
    data
  });
}

export async function castVote(electionId: string, candidateId: string, studentCode: string) {
  // Validate student identity
  const student = await prisma.student.findUnique({
    where: { studentCode }
  });

  if (!student) {
    return { success: false, error: "ไม่พบรหัสนักเรียนในฐานข้อมูล" };
  }

  const election = await prisma.election.findUnique({
    where: { id: electionId }
  });

  if (!election || election.status !== "ACTIVE") {
    return { success: false, error: "ไม่มีการเปิดลงคะแนนเสียงที่เปิดใช้งานในขณะนี้" };
  }

  // Hash student code to keep vote anonymous but prevent double voting
  const voterHash = crypto.createHash("sha256").update(studentCode + electionId).digest("hex");
  const voterLogList: string[] = JSON.parse(election.voterLogJson || "[]");

  if (voterLogList.includes(voterHash)) {
    return { success: false, error: "ท่านได้ใช้สิทธิ์ลงคะแนนเสียงในการเลือกตั้งครั้งนี้ไปแล้ว" };
  }

  voterLogList.push(voterHash);

  // Increment vote count and save voter log transactionally
  await prisma.$transaction([
    prisma.candidate.update({
      where: { id: candidateId },
      data: { votesCount: { increment: 1 } }
    }),
    prisma.election.update({
      where: { id: electionId },
      data: { voterLogJson: JSON.stringify(voterLogList) }
    })
  ]);

  return { success: true };
}
