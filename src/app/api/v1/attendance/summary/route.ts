import { NextResponse } from "next/server";
import { initialStudents } from "@/lib/mock-data";

export async function GET() {
  const students = initialStudents;
  const total = students.length;

  // Compute attendance statistics from current mock state
  const present = students.filter(s => s.attendanceToday === "present").length;
  const absent = students.filter(s => s.attendanceToday === "absent").length;
  const late = students.filter(s => s.attendanceToday === "late").length;
  const leave = students.filter(s => s.attendanceToday === "leave").length;
  const sick = students.filter(s => s.attendanceToday === "sick").length;
  const unchecked = students.filter(s => !s.attendanceToday).length;

  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return NextResponse.json({
    success: true,
    data: {
      date: new Date().toISOString().substring(0, 10),
      classroom: "ม.6/1",
      total,
      present,
      absent,
      late,
      leave,
      sick,
      unchecked,
      attendanceRate,
      riskStudents: students.filter(s => s.status === "เสี่ยง" || s.status === "ช่วยเหลือเร่งด่วน").length
    },
    message: "ดึงข้อมูลสถิติภาพรวมการมาเรียนสำเร็จ"
  });
}
