"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";

export async function sendLineTargetedBroadcast(data: {
  classrooms?: string[];
  studentIds?: string[];
  message: string;
}) {
  try {
    const session = await requireAuth();
    const user = session.user as any;

    // Verify role (only teachers, admins, or executives can send broadcasts)
    const isAuthorized = user.role === "ADMIN" || ["ครู", "หัวหน้างานบุคคล", "ผู้บริหาร", "แอดมิน"].includes(user.position);
    if (!isAuthorized) {
      throw new Error("ไม่มีสิทธิ์ในการส่งข้อความแจ้งเตือนผู้ปกครอง");
    }

    if (!data.message || data.message.trim() === "") {
      throw new Error("กรุณากรอกข้อความที่ต้องการส่ง");
    }

    // 1. Fetch system settings
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: { lineChannelAccessToken: true },
    });

    const token = settings?.lineChannelAccessToken;
    if (!token || token.trim() === "") {
      throw new Error("ไม่ได้ตั้งค่า LINE Channel Access Token ในระบบ");
    }

    // 2. Build where clause
    const whereClause: any = {};
    if (data.studentIds && data.studentIds.length > 0) {
      whereClause.id = { in: data.studentIds };
    } else if (data.classrooms && data.classrooms.length > 0) {
      whereClause.classroom = { in: data.classrooms };
    } else {
      throw new Error("กรุณาเลือกกลุ่มเป้าหมาย (ระดับชั้น หรือ รายชื่อนักเรียน)");
    }

    // Only target students with linked parent LINE User IDs
    whereClause.parentLineUserId = { not: null };

    const students = await prisma.student.findMany({
      where: whereClause,
      select: { parentLineUserId: true },
    });

    const parentLineIds = Array.from(
      new Set(
        students
          .map((s) => s.parentLineUserId)
          .filter((id): id is string => !!id && id.trim() !== "")
      )
    );

    if (parentLineIds.length === 0) {
      return {
        success: false,
        error: "ไม่พบผู้ปกครองที่เชื่อมต่อกับระบบ LINE ในกลุ่มเป้าหมายที่เลือก",
      };
    }

    // 3. Chunk recipients into groups of 500 (LINE Multicast API constraint)
    const chunkSize = 500;
    const chunks: string[][] = [];
    for (let i = 0; i < parentLineIds.length; i += chunkSize) {
      chunks.push(parentLineIds.slice(i, i + chunkSize));
    }

    // Format final message context
    const broadcastText = `📢 ประกาศจากโรงเรียน (ส่งตรงถึงผู้ปกครอง)\n------------------\n${data.message}\n------------------\nโดย: ${user.name} (${user.position || "ครูผู้สอน"})`;

    // 4. Send multicast requests (Functional/Pure aggregation)
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const res = await fetch("https://api.line.me/v2/bot/message/multicast", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              to: chunk,
              messages: [
                {
                  type: "text",
                  text: broadcastText,
                },
              ],
            }),
          });

          if (res.ok) {
            return { success: chunk.length, failed: 0 };
          } else {
            console.error("[LINE Multicast] API Error:", res.status, await res.text());
            return { success: 0, failed: chunk.length };
          }
        } catch (err) {
          console.error("[LINE Multicast] Network error for chunk:", err);
          return { success: 0, failed: chunk.length };
        }
      })
    );

    const successCount = results.reduce((sum, r) => sum + r.success, 0);
    const failCount = results.reduce((sum, r) => sum + r.failed, 0);

    return {
      success: true,
      sentCount: successCount,
      failedCount: failCount,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
