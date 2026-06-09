"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-server";
import crypto from "crypto";

// Helper to parse user preferences JSON safely
function parsePreferences(preferencesJson: string | null | undefined): Record<string, any> {
  if (!preferencesJson) return {};
  try {
    return JSON.parse(preferencesJson);
  } catch {
    return {};
  }
}

// For updating profile details like name, subjectGroup, image, signatureUrl
export async function updateProfile(data: { name: string; subjectGroup: string; lineUserId?: string; image?: string; signatureUrl?: string }) {
  const session = await requireAuth();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      subjectGroup: data.subjectGroup,
      lineUserId: data.lineUserId,
      image: data.image !== undefined ? data.image : undefined,
      signatureUrl: data.signatureUrl !== undefined ? data.signatureUrl : undefined,
    }
  });

  revalidatePath("/profile");
  return { success: true };
}

// Setup or update Signature PIN
export async function setupSignaturePin(pin: string) {
  const session = await requireAuth();

  if (!/^\d{6}$/.test(pin)) {
    throw new Error("PIN ต้องเป็นตัวเลข 6 หลักเท่านั้น");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  const preferencesObj = parsePreferences(user?.preferences);

  // Store the PIN securely in preferences JSON (Hashed using Salted SHA-256)
  const salt = crypto.randomBytes(16).toString("hex");
  const hashedPin = crypto.createHash("sha256").update(pin + salt).digest("hex");
  preferencesObj.signaturePin = `${salt}:${hashedPin}`;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      preferences: JSON.stringify(preferencesObj)
    }
  });

  return { success: true };
}

// Verify Signature PIN
export async function verifySignaturePin(pin: string) {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user?.preferences) {
    return { success: false, error: "กรุณาตั้งค่ารหัส PIN ลายเซ็นก่อนใช้งาน" };
  }

  try {
    const preferencesObj = JSON.parse(user.preferences);
    const storedPin = preferencesObj.signaturePin;
    if (!storedPin) {
      return { success: false, error: "กรุณาตั้งค่ารหัส PIN ลายเซ็นก่อนใช้งาน" };
    }

    if (storedPin.includes(":")) {
      const [salt, hashedPin] = storedPin.split(":");
      const testHash = crypto.createHash("sha256").update(pin + salt).digest("hex");
      if (testHash === hashedPin) {
        return { success: true };
      }
    } else {
      // Fallback for legacy unsalted SHA-256 PINs
      const legacyHash = crypto.createHash("sha256").update(pin).digest("hex");
      if (storedPin === legacyHash) {
        return { success: true };
      }
    }
  } catch (err) {
    return { success: false, error: "เกิดข้อผิดพลาดในการตรวจสอบรหัส PIN" };
  }

  return { success: false, error: "รหัส PIN ไม่ถูกต้อง" };
}

// Verify WebAuthn Biometrics (ECDSA P-256 Cryptographic Signature validation)
export async function verifySignatureBiometrics(payload: { credentialId?: string; signature?: string; challenge?: string }) {
  await requireAuth();

  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user?.preferences) {
    return { success: false, error: "กรุณาลงทะเบียนลายนิ้วมือ/ใบหน้าก่อนใช้งาน" };
  }

  try {
    const preferencesObj = parsePreferences(user.preferences);
    if (!preferencesObj.webauthnEnabled) {
      return { success: false, error: "กรุณาลงทะเบียนลายนิ้วมือ/ใบหน้าก่อนใช้งาน" };
    }

    const { credentialId, signature, challenge } = payload;
    if (!credentialId || !signature || !challenge) {
      return { success: false, error: "ข้อมูลลายเซ็นชีวมาตรไม่ครบถ้วน" };
    }

    if (preferencesObj.webauthnCredentialId !== credentialId) {
      return { success: false, error: "ข้อมูลอุปกรณ์ลงทะเบียนไม่ถูกต้อง" };
    }

    // Verify the cryptographic signature using Node's crypto
    const verifier = crypto.createVerify("SHA256");
    verifier.update(challenge);

    // Form PEM public key from base64 SPKI
    const pubKeyBase64 = preferencesObj.webauthnPublicKey;
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${pubKeyBase64.match(/.{1,64}/g)?.join("\n")}\n-----END PUBLIC KEY-----`;

    const isVerified = verifier.verify(publicKeyPem, Buffer.from(signature, "hex"));

    if (isVerified) {
      return { success: true };
    }
  } catch (err) {
    console.error("[Biometrics Verification] Error:", err);
    return { success: false, error: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูลชีวมาตร" };
  }

  return { success: false, error: "การตรวจสอบลายนิ้วมือ/ใบหน้า ล้มเหลว (ลายเซ็นดิจิทัลไม่ถูกต้อง)" };
}

// Register WebAuthn Biometrics (Saves client-generated public key & credential ID)
export async function registerBiometrics(publicKeyPem: string, credentialId: string) {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  const preferencesObj = parsePreferences(user?.preferences);

  preferencesObj.webauthnEnabled = true;
  preferencesObj.webauthnPublicKey = publicKeyPem;
  preferencesObj.webauthnCredentialId = credentialId;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      preferences: JSON.stringify(preferencesObj)
    }
  });

  return { success: true };
}
