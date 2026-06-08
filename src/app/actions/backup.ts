"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getBackups() {
  try {
    const backups = await prisma.systemBackup.findMany({
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: backups };
  } catch (error: any) {
    return { success: false, error: "ดึงข้อมูลสำรองล้มเหลว: " + error.message };
  }
}

export async function createBackup(label: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    const createdBy = session?.user?.name || session?.user?.email || "System Admin";

    // Query core timetable tables
    const [schedules, subjects, classrooms, rooms] = await Promise.all([
      prisma.schedule.findMany(),
      prisma.subject.findMany(),
      prisma.classroom.findMany(),
      prisma.room.findMany()
    ]);

    const backupData = {
      schedules,
      subjects,
      classrooms,
      rooms
    };

    const dataString = JSON.stringify(backupData);

    await prisma.systemBackup.create({
      data: {
        label,
        data: dataString,
        createdBy
      }
    });

    revalidatePath("/timetables/backups");
    return { success: true, message: "สร้างจุดบันทึกตารางเรียนสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "สำรองข้อมูลล้มเหลว: " + error.message };
  }
}

export async function restoreBackup(id: string) {
  try {
    const backup = await prisma.systemBackup.findUnique({
      where: { id }
    });

    if (!backup) {
      return { success: false, error: "ไม่พบข้อมูลสำรองที่ต้องการกู้คืน" };
    }

    const { schedules, subjects, classrooms, rooms } = JSON.parse(backup.data);

    // Run in transaction to replace tables cleanly
    await prisma.$transaction(async (tx) => {
      // 1. Clear existing schedules to avoid conflict with classrooms/rooms deletions
      await tx.schedule.deleteMany();

      // 2. Clear other entities
      await tx.room.deleteMany();
      await tx.classroom.deleteMany();
      await tx.subject.deleteMany();

      // 3. Re-insert subjects
      if (subjects && subjects.length > 0) {
        await tx.subject.createMany({
          data: subjects.map((s: any) => ({
            id: s.id,
            code: s.code,
            name: s.name,
            credit: s.credit,
            hours: s.hours,
            color: s.color
          }))
        });
      }

      // 4. Re-insert classrooms
      if (classrooms && classrooms.length > 0) {
        await tx.classroom.createMany({
          data: classrooms.map((c: any) => ({
            id: c.id,
            name: c.name,
            grade: c.grade,
            room: c.room,
            lineGroupId: c.lineGroupId
          }))
        });
      }

      // 5. Re-insert rooms
      if (rooms && rooms.length > 0) {
        await tx.room.createMany({
          data: rooms.map((r: any) => ({
            id: r.id,
            name: r.name,
            building: r.building
          }))
        });
      }

      // 6. Re-insert schedules
      if (schedules && schedules.length > 0) {
        await tx.schedule.createMany({
          data: schedules.map((s: any) => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            userId: s.userId,
            subjectId: s.subjectId,
            classroomId: s.classroomId,
            roomId: s.roomId,
            periodId: s.periodId,
            termId: s.termId
          }))
        });
      }
    });

    revalidatePath("/timetables/schedule");
    revalidatePath("/timetables/dashboard");
    return { success: true, message: "กู้คืนระบบตารางสอนตาม Snapshot สำเร็จเรียบร้อยแล้ว!" };
  } catch (error: any) {
    console.error("Restore error:", error);
    return { success: false, error: "กู้คืนข้อมูลล้มเหลว: " + error.message };
  }
}

export async function deleteBackup(id: string) {
  try {
    await prisma.systemBackup.delete({
      where: { id }
    });
    revalidatePath("/timetables/backups");
    return { success: true, message: "ลบจุดบันทึกสำเร็จ" };
  } catch (error: any) {
    return { success: false, error: "ลบล้มเหลว: " + error.message };
  }
}
