import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/utils";
import crypto from "crypto";

// Helper function to send reply message via LINE reply token (completely free)
async function sendLineReply(replyToken: string, token: string, messages: any[]) {
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });
    if (!res.ok) {
      console.error("[LINE Webhook] Reply failed:", res.status, await res.text());
    }
  } catch (error) {
    console.error("[LINE Webhook] Reply network error:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Get system settings to retrieve Channel Secret and Channel Access Token
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: { lineChannelAccessToken: true },
    });

    const channelToken = settings?.lineChannelAccessToken;
    if (!channelToken || channelToken.trim() === "") {
      console.warn("[LINE Webhook] lineChannelAccessToken is not configured.");
      return new Response("Webhook is not configured", { status: 501 });
    }

    // 2. Read signature and validate webhook integrity (Fail-Closed)
    const bodyText = await req.text();
    const signature = req.headers.get("x-line-signature");
    const channelSecret = process.env.LINE_CHANNEL_SECRET;

    if (!channelSecret) {
      console.error("[LINE Webhook] LINE_CHANNEL_SECRET environment variable is missing.");
      return new Response("Server configuration error", { status: 500 });
    }
    if (!signature) {
      console.warn("[LINE Webhook] Missing x-line-signature header.");
      return new Response("Missing signature", { status: 401 });
    }

    const hash = crypto
      .createHmac("SHA256", channelSecret)
      .update(bodyText)
      .digest("base64");

    if (hash !== signature) {
      console.warn("[LINE Webhook] Invalid signature detected.");
      return new Response("Unauthorized signature", { status: 401 });
    }

    // 3. Parse and process events
    const payload = JSON.parse(bodyText);
    const events = payload.events || [];

    for (const event of events) {
      if (event.type !== "message" || event.message.type !== "text") {
        continue;
      }

      const replyToken = event.replyToken;
      const senderLineId = event.source?.userId;
      const text = (event.message.text || "").trim();

      if (!replyToken || !senderLineId) continue;

      // --- Registration Command Pattern: "ลงทะเบียน [รหัสประจำตัว] [เบอร์โทร] [เลขท้าย4หลักบัตรปชช.นักเรียน]" ---
      if (text.startsWith("ลงทะเบียน")) {
        const regMatch = text.match(/^ลงทะเบียน\s+(\S+)\s+(\S+)\s+(\d{4})$/i);
        
        if (!regMatch) {
          // If parents typed the old format or made an input syntax error, guide them
          await sendLineReply(replyToken, channelToken, [
            {
              type: "text",
              text: `💡 วิธีการลงทะเบียนผู้ปกครอง:
พิมพ์ "ลงทะเบียน [รหัสประจำตัวนักเรียน] [เบอร์โทรผู้ปกครอง] [เลขท้าย 4 หลักบัตรประชาชนนักเรียน]"
              
เช่น: ลงทะเบียน 12345 0812345678 5678`,
            },
          ]);
          continue;
        }

        const studentCode = regMatch[1];
        const phoneInput = regMatch[2];
        const last4Digits = regMatch[3];

        // Search for student in DB
        const student = await prisma.student.findUnique({
          where: { studentCode },
          include: {
            profile: {
              include: {
                familyMembers: true,
              },
            },
          },
        });

        if (!student) {
          await sendLineReply(replyToken, channelToken, [
            {
              type: "text",
              text: `❌ ไม่พบข้อมูลนักเรียนที่มีรหัสประจำตัว "${studentCode}" กรุณาตรวจสอบรหัสอีกครั้ง`,
            },
          ]);
          continue;
        }

        // Verify if phone number matches parentPhone or any family member phone
        let phoneMatches = false;
        if (student.parentPhone && normalizePhone(student.parentPhone) === normalizePhone(phoneInput)) {
          phoneMatches = true;
        } else if (student.profile?.familyMembers) {
          const matchedFamily = student.profile.familyMembers.find(
            (m) => m.phone && normalizePhone(m.phone) === normalizePhone(phoneInput)
          );
          if (matchedFamily) {
            phoneMatches = true;
          }
        }

        // Verify student national ID last 4 digits
        let idMatches = false;
        const studentNationalId = student.profile?.nationalId || "";
        const studentNationalIdCleaned = studentNationalId.replace(/[-\s]/g, "");
        if (studentNationalIdCleaned && studentNationalIdCleaned.endsWith(last4Digits)) {
          idMatches = true;
        }

        if (phoneMatches && idMatches) {
          // Link parent Line ID to student
          await prisma.student.update({
            where: { id: student.id },
            data: { parentLineUserId: senderLineId },
          });

          await sendLineReply(replyToken, channelToken, [
            {
              type: "text",
              text: `✅ ลงทะเบียนผู้ปกครองสำเร็จ!
------------------
นักเรียน: ${student.fullName} (ชั้น ${student.classroom})
รหัสประจำตัว: ${student.studentCode}

ท่านสามารถพิมพ์รหัสประจำตัวนักเรียนเพื่อตรวจสอบข้อมูลเกรด พฤติกรรม และการเข้าแถวได้ตลอดเวลาฟรี`,
            },
          ]);
        } else if (!phoneMatches) {
          await sendLineReply(replyToken, channelToken, [
            {
              type: "text",
              text: "❌ เบอร์โทรศัพท์ไม่ตรงกับข้อมูลติดต่อของนักเรียนในฐานข้อมูล กรุณาติดต่อคุณครูประจำชั้นเพื่อตรวจสอบข้อมูลติดต่อ",
            },
          ]);
        } else {
          await sendLineReply(replyToken, channelToken, [
            {
              type: "text",
              text: "❌ เลขท้าย 4 หลักบัตรประชาชนของนักเรียนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้งหรือติดต่อคุณครูประจำชั้น",
            },
          ]);
        }
        continue;
      }

      // --- Self-Search Pattern: Type student code to get report card ---
      const studentCodeQuery = text;
      const linkedStudents = await prisma.student.findMany({
        where: {
          studentCode: studentCodeQuery,
          parentLineUserId: senderLineId,
        },
        include: {
          subjectScores: {
            include: {
              subject: true,
            },
          },
          behaviorLogs: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      });

      if (linkedStudents.length === 0) {
        // Not linked or wrong code
        // Reply with instruction
        await sendLineReply(replyToken, channelToken, [
          {
            type: "text",
            text: `💡 พิมพ์ "ลงทะเบียน [รหัสประจำตัวนักเรียน] [เบอร์โทรผู้ปกครอง] [เลขท้าย 4 หลักบัตรประชาชนนักเรียน]" เพื่อลงทะเบียนสิทธิ์เข้าถึงข้อมูลนักเรียน
            
เช่น: ลงทะเบียน 12345 0812345678 5678`,
          },
        ]);
        continue;
      }

      // Format child summary report (Free response)
      const child = linkedStudents[0];
      const gradesText = child.subjectScores.length > 0
        ? child.subjectScores.map(score => {
            const gradeStr = score.grade || "-";
            return `• ${score.subject?.code} ${score.subject?.name}: เกรด ${gradeStr}`;
          }).join("\n")
        : "ยังไม่มีผลสัมฤทธิ์ทางการเรียนบันทึกในเทอมนี้";

      const totalBehaviorPoints = 100 + child.behaviorLogs.reduce((sum, log) => {
        return sum + (log.type === "MERIT" ? log.points : -log.points);
      }, 0);

      const behaviorText = child.behaviorLogs.length > 0
        ? child.behaviorLogs.map(log => {
            const prefix = log.type === "MERIT" ? "+" : "-";
            return `• ${log.description} (${prefix}${log.points})`;
          }).join("\n")
        : "ไม่มีการบันทึกพฤติกรรมล่าสุด";

      await sendLineReply(replyToken, channelToken, [
        {
          type: "text",
          text: `📊 รายงานประวัติผู้เรียน: ${child.fullName}
------------------
รหัสประจำตัว: ${child.studentCode}
ชั้นเรียน: ห้อง ${child.classroom}
ความประพฤติทั่วไป: สถานะ ${child.status}

📝 ผลการเรียนล่าสุด:
${gradesText}

🛡️ คะแนนพฤติกรรม (รวมสะสม: ${totalBehaviorPoints} คะแนน):
${behaviorText}
------------------`,
        },
      ]);
    }

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("[LINE Webhook] Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
