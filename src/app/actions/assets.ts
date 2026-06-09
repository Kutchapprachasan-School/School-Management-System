"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function getAssets() {
  await requireAuth();
  return await prisma.schoolAsset.findMany({
    include: {
      auditLogs: {
        orderBy: { auditDate: "desc" },
        take: 1
      }
    },
    orderBy: { assetCode: "asc" }
  });
}

export async function createAsset(data: {
  assetCode: string;
  name: string;
  category: string;
  purchaseDate: Date;
  cost: number;
  location: string;
  status: string;
}) {
  await requireAuth();
  const res = await prisma.schoolAsset.create({
    data
  });
  revalidatePath("/profile");
  return { success: true, asset: res };
}

export async function submitAssetAudit(data: {
  assetId: string;
  auditDate: Date;
  auditorName: string;
  condition: string;
  notes?: string;
  photoUrl?: string;
}) {
  await requireAuth();
  const res = await prisma.assetAuditLog.create({
    data
  });

  // Also update parent asset status based on audit findings
  let assetStatus = "NORMAL";
  if (data.condition === "SCRAPPED" || data.condition === "REPAIR_NEEDED") {
    assetStatus = data.condition === "SCRAPPED" ? "LOST" : "DAMAGED";
  }

  await prisma.schoolAsset.update({
    where: { id: data.assetId },
    data: { status: assetStatus }
  });

  revalidatePath("/profile");
  return { success: true, log: res };
}
