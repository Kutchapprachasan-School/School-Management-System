import { NextResponse } from "next/server";
import { initialStudents } from "@/lib/mock-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const student = initialStudents.find(s => s.id === id);

  if (!student) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "ไม่พบข้อมูลนักเรียนรหัสนี้ในระบบ" } },
      { status: 404 }
    );
  }

  // Simulate cumulative attendance data for prototype
  return NextResponse.json({
    success: true,
    data: {
      studentId: id,
      studentName: student.fullName,
      classroom: student.classroom,
      semester: "ภาคเรียนที่ 1/2569",
      totalSchoolDays: 45,
      present: 38,
      absent: 3,
      late: 2,
      leave: 1,
      sick: 1,
      attendanceRate: 88.9,
      consecutiveAbsent: student.attendanceToday === "absent" ? 2 : 0,
      riskFlag: student.status === "เสี่ยง" || student.status === "ช่วยเหลือเร่งด่วน"
    },
    message: `ดึงข้อมูลสถิติมาเรียนสะสมของ ${student.fullName} สำเร็จ`
  });
}
