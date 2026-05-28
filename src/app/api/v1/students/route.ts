import { NextResponse } from "next/server";
import { initialStudents } from "@/lib/mock-data";
import { Student } from "@/types/school-os";

// In-memory array for prototype mode
let mockStudents = [...initialStudents];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classroom = searchParams.get("classroom");
  const status = searchParams.get("status");

  let result = [...mockStudents];

  if (classroom) {
    result = result.filter(s => s.classroom === classroom);
  }

  if (status) {
    result = result.filter(s => s.status === status);
  }

  return NextResponse.json({
    success: true,
    data: result,
    message: "ดึงข้อมูลรายชื่อนักเรียนสำเร็จ"
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.fullName || !body.classroom) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "กรุณาระบุชื่อ-นามสกุล และห้องเรียน"
          }
        },
        { status: 400 }
      );
    }

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      studentCode: body.studentCode || `${10000 + mockStudents.length + 1}`,
      fullName: body.fullName,
      nickname: body.nickname,
      classroom: body.classroom,
      seatNumber: body.seatNumber || mockStudents.length + 1,
      gender: body.gender || "ชาย",
      status: body.status || "ปกติ",
      behaviorPoints: body.behaviorPoints || 100,
      sdqScore: body.sdqScore || 10,
      sdqRisk: body.sdqRisk || "ปกติ",
      bmi: body.bmi || 20.0,
      bmiStatus: body.bmiStatus || "สมส่วน",
      parentName: body.parentName || "ผู้ปกครอง",
      parentPhone: body.parentPhone || "080-000-0000",
      homeVisited: body.homeVisited || false
    };

    mockStudents.push(newStudent);

    return NextResponse.json({
      success: true,
      data: newStudent,
      message: "ลงทะเบียนนักเรียนใหม่สำเร็จ"
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
