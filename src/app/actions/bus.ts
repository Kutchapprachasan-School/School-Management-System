"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function getBusRoutes() {
  await requireAuth();
  return await prisma.busRoute.findMany({
    include: {
      roster: {
        include: {
          student: {
            select: { fullName: true, studentCode: true, classroom: true, parentPhone: true }
          }
        }
      },
      attendance: {
        orderBy: { timestamp: "desc" },
        take: 10
      }
    }
  });
}

export async function createBusRoute(data: {
  busNumber: string;
  driverName: string;
  driverPhone: string;
}) {
  await requireAuth();
  const res = await prisma.busRoute.create({
    data
  });
  return { success: true, route: res };
}

export async function submitBusAttendance(data: {
  routeId: string;
  studentId: string;
  direction: string;
  coordinates?: string;
}) {
  await requireAuth();
  const res = await prisma.busAttendance.create({
    data
  });

  // Fetch student and check for parent phone / LINE Notify token to notify parent
  const student = await prisma.student.findUnique({
    where: { id: data.studentId },
    include: {
      profile: true
    }
  });

  if (student) {
    const directionStr = data.direction === "INBOUND" ? "ขึ้นรถโรงเรียน (เดินทางไปโรงเรียน)" : "ลงจากรถโรงเรียน (เดินทางกลับบ้าน)";
    const message = `🚌 [ความปลอดภัยรถรับส่ง] น้อง ${student.fullName} ได้สแกน${directionStr} เรียบร้อยแล้ว ณ เวลา ${new Date(res.timestamp).toLocaleTimeString("th-TH")}`;

    // Here we can trigger the LINE Notify call
    // In production, we retrieve the parent's LINE Notify token from student profile preferences
    // For now we log it to console
    console.log(`[LINE Notify to Parent] ${message} | GPS: ${data.coordinates || "N/A"}`);
  }

  revalidatePath("/profile");
  return { success: true, attendanceRecord: res };
}
