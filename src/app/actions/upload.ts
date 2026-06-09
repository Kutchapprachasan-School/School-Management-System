"use server";


import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function uploadLogo(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user || (session.user.role !== "ADMIN" && (session.user as any).position !== "แอดมิน")) {
    throw new Error("Unauthorized");
  }

  const file: File | null = formData.get("logo") as unknown as File;
  
  if (!file) {
    throw new Error("No file uploaded");
  }

  // 1. File size check (2MB max)
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX_SIZE) {
    throw new Error("ขนาดไฟล์เกินขีดจำกัด 2MB");
  }

  // 2. MIME type whitelist check
  const whitelistedMimes = ["image/jpeg", "image/png", "image/webp"];
  if (!whitelistedMimes.includes(file.type)) {
    throw new Error("ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ JPEG, PNG, และ WebP เท่านั้น");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Convert to Base64 to support serverless deployment (Vercel)
  // This avoids the ephemeral file system issue without needing an external Blob storage
  const base64Data = buffer.toString('base64');
  const mimeType = file.type || 'image/png';
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  // Return the Base64 Data URL
  return { success: true, url: dataUrl };
}
