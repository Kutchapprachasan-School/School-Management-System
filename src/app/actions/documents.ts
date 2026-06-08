"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSession() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.warn("Session failed or headers not available:", err);
  }
  return session;
}

export async function getDocumentWorkflows() {
  try {
    const docs = await prisma.documentWorkflow.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } }
      }
    });
    return { success: true, data: docs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createDocumentWorkflow(data: {
  title: string;
  type: string; // Memo, Order, Outbound, Announcement
  department?: string;
}) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get current settings to retrieve sequences and prefixes
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    });

    if (!settings) {
      return { success: false, error: "System settings not configured" };
    }

    let prefix = "DOC";
    let seq = 1;
    let updateField = {};

    const yearSuffix = settings.activeYear || "2569";

    if (data.type === "Memo") {
      prefix = settings.docPrefixMemo || "บข";
      seq = settings.docSeqMemo;
      updateField = { docSeqMemo: seq + 1 };
    } else if (data.type === "Order") {
      prefix = settings.docPrefixOrder || "คส";
      seq = settings.docSeqOrder;
      updateField = { docSeqOrder: seq + 1 };
    } else if (data.type === "Outbound") {
      prefix = settings.docPrefixOutbound || "นส";
      seq = settings.docSeqOutbound;
      updateField = { docSeqOutbound: seq + 1 };
    } else if (data.type === "Announcement") {
      prefix = settings.docPrefixAnnouncement || "ปศ";
      seq = settings.docSeqAnnouncement;
      updateField = { docSeqAnnouncement: seq + 1 };
    }

    // Format running number: PREFIX + YEAR + "/" + SEQ
    // e.g. "บข2569/1"
    const docNumber = `${prefix}/${yearSuffix}/${String(seq).padStart(3, "0")}`;

    // Create the document
    const newDoc = await prisma.documentWorkflow.create({
      data: {
        documentNo: docNumber,
        title: data.title,
        type: data.type,
        department: data.department || null,
        status: "PENDING", // PENDING approval by director
        createdBy: session.user.id
      }
    });

    // Update settings sequence
    await prisma.systemSettings.update({
      where: { id: "default" },
      data: updateField
    });

    revalidatePath("/");
    return { success: true, data: newDoc };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveDocumentWorkflow(id: string) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await prisma.documentWorkflow.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: session.user.id
      }
    });

    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
