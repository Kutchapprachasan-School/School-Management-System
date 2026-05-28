import { NextResponse } from "next/server";
import { initialStudents } from "@/lib/mock-data";
import { Student } from "@/types/school-os";

// In-memory array for prototype mode
let mockStudents = [...initialStudents];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const student = mockStudents.find((s) => s.id === id);

  if (!student) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "ไม่พบข้อมูลนักเรียนรหัสนี้ในระบบ"
        }
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: student,
    message: "ดึงข้อมูลนักเรียนสำเร็จ"
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const studentIndex = mockStudents.findIndex((s) => s.id === id);

    if (studentIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "ไม่พบข้อมูลนักเรียนรหัสนี้ในระบบ"
          }
        },
        { status: 404 }
      );
    }

    // Update student properties
    const updatedStudent = {
      ...mockStudents[studentIndex],
      ...body
    };

    mockStudents[studentIndex] = updatedStudent;

    return NextResponse.json({
      success: true,
      data: updatedStudent,
      message: "แก้ไขข้อมูลประวัตินักเรียนสำเร็จ"
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
        }
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const studentIndex = mockStudents.findIndex((s) => s.id === id);

  if (studentIndex === -1) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "ไม่พบข้อมูลนักเรียนรหัสนี้ในระบบ"
        }
      },
      { status: 404 }
    );
  }

  mockStudents.splice(studentIndex, 1);

  return NextResponse.json({
    success: true,
    data: null,
    message: "จำหน่ายนักเรียนออกจากระบบสำเร็จ"
  });
}
