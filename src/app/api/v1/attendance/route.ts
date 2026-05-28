import { NextResponse } from "next/server";

// In-memory attendance store for prototype mode
interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  date: string;
  status: "present" | "absent" | "late" | "leave" | "sick";
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

let mockAttendance: AttendanceRecord[] = [
  { id: "att-1", studentId: "std-1", studentName: "นายธนพล รักเรียน", classroom: "ม.6/1", date: "2026-05-21", status: "present", createdBy: "ครูอัญชลี", createdAt: "2026-05-21 08:00" },
  { id: "att-2", studentId: "std-2", studentName: "น.ส.สมหญิง ดีใจ", classroom: "ม.6/1", date: "2026-05-21", status: "absent", remarks: "ไม่มีใบลา", createdBy: "ครูอัญชลี", createdAt: "2026-05-21 08:00" },
  { id: "att-3", studentId: "std-3", studentName: "นายวิชัย เก่งมาก", classroom: "ม.6/1", date: "2026-05-21", status: "late", remarks: "สาย 15 นาที", createdBy: "ครูอัญชลี", createdAt: "2026-05-21 08:15" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classroom = searchParams.get("classroom");
  const date = searchParams.get("date");
  const studentId = searchParams.get("studentId");

  let result = [...mockAttendance];

  if (classroom) result = result.filter(r => r.classroom === classroom);
  if (date) result = result.filter(r => r.date === date);
  if (studentId) result = result.filter(r => r.studentId === studentId);

  return NextResponse.json({
    success: true,
    data: result,
    message: "ดึงข้อมูลการเช็คชื่อสำเร็จ"
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.studentId || !body.date || !body.status) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "กรุณาระบุรหัสนักเรียน วันที่ และสถานะการเข้าเรียน"
          }
        },
        { status: 400 }
      );
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      studentId: body.studentId,
      studentName: body.studentName || "ไม่ระบุชื่อ",
      classroom: body.classroom || "ม.6/1",
      date: body.date,
      status: body.status,
      remarks: body.remarks,
      createdBy: body.createdBy || "ครูอัญชลี รัตนโกสินทร์",
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    mockAttendance.push(newRecord);

    return NextResponse.json({
      success: true,
      data: newRecord,
      message: "บันทึกการเช็คชื่อสำเร็จ"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" } },
      { status: 500 }
    );
  }
}
