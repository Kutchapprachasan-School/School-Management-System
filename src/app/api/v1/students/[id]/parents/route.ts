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

  // Simulate parent data for prototype
  const parents = [
    {
      id: `par-${id}-1`,
      fullName: student.parentName,
      phoneNumber: student.parentPhone,
      relationship: "มารดา",
      lineUserId: null,
    }
  ];

  return NextResponse.json({
    success: true,
    data: parents,
    message: `ดึงข้อมูลผู้ปกครองของ ${student.fullName} สำเร็จ`
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.fullName || !body.relationship) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "กรุณาระบุชื่อ-นามสกุลและความสัมพันธ์ของผู้ปกครอง" } },
        { status: 400 }
      );
    }

    const newParent = {
      id: `par-${Date.now()}`,
      studentId: id,
      fullName: body.fullName,
      phoneNumber: body.phoneNumber || "",
      relationship: body.relationship,
      lineUserId: body.lineUserId || null,
    };

    return NextResponse.json({
      success: true,
      data: newParent,
      message: "เพิ่มข้อมูลผู้ปกครองสำเร็จ"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" } },
      { status: 500 }
    );
  }
}
