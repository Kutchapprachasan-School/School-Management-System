import { NextResponse } from "next/server";
import { initialHealthVisits } from "@/lib/mock-data";
import { HealthVisit } from "@/types/school-os";

// In-memory health visits for prototype mode
let mockHealthVisits = [...initialHealthVisits];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classroom = searchParams.get("classroom");
  const studentName = searchParams.get("studentName");

  let result = [...mockHealthVisits];

  if (classroom) result = result.filter(v => v.classroom === classroom);
  if (studentName) result = result.filter(v => v.studentName.includes(studentName));

  return NextResponse.json({
    success: true,
    data: result,
    message: "ดึงข้อมูลประวัติการรักษาห้องพยาบาลสำเร็จ"
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.studentName || !body.symptoms) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "กรุณาระบุชื่อนักเรียนและอาการที่เข้ารับบริการ"
          }
        },
        { status: 400 }
      );
    }

    const newVisit: HealthVisit = {
      id: `hv-${Date.now()}`,
      studentName: body.studentName,
      classroom: body.classroom || "ม.6/1",
      symptoms: body.symptoms,
      medicineUsed: body.medicineUsed || "ไม่ได้ใช้ยา",
      actionTaken: body.actionTaken || "ให้นอนพัก",
      visitTime: body.visitTime || new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    mockHealthVisits.unshift(newVisit);

    // Simulate Event: health.visit_created -> timeline.add + parent.notify
    console.log(`[Event: health.visit_created] ${newVisit.studentName} เข้าห้องพยาบาล -> บันทึก Timeline + แจ้งผู้ปกครอง`);

    return NextResponse.json({
      success: true,
      data: newVisit,
      message: "บันทึกข้อมูลการรักษาห้องพยาบาลสำเร็จ"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" } },
      { status: 500 }
    );
  }
}
