import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classroom, date, records } = body; // records: Array of { studentId, status, remarks }

    if (!classroom || !date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "กรุณาระบุข้อมูลชั้นเรียน วันที่ และรายการประวัติการมาเรียน (records) ให้ครบถ้วน"
          }
        },
        { status: 400 }
      );
    }

    // Prototype Log
    console.log(`Bulk Attendance Checked for ${classroom} on ${date}:`, records);

    // Event Trigger Simulation (Asynchronous Pub/Sub Event Loop)
    // 1. attendance.created -> Trigger parents notifications if absent
    const absents = records.filter(r => r.status === "absent");
    if (absents.length > 0) {
      console.log(`[Event Triggered: attendance.created] Dispatching LINE message API to parents of ${absents.length} absent students.`);
    }

    return NextResponse.json({
      success: true,
      data: {
        classroom,
        date,
        totalChecked: records.length,
        absentCount: absents.length
      },
      message: "บันทึกเวลาเรียนแบบกลุ่ม (Bulk Attendance Check) สำเร็จเรียบร้อย"
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
