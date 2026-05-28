import { NextResponse } from "next/server";
import { initialLeaveRequests } from "@/lib/mock-data";
import { LeaveRequest } from "@/types/school-os";

// In-memory leave requests for prototype mode
let mockLeaveRequests = [...initialLeaveRequests];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const role = searchParams.get("role");

  let result = [...mockLeaveRequests];

  if (status) {
    result = result.filter(r => r.status === status);
  }

  if (role) {
    result = result.filter(r => r.requesterRole === role);
  }

  return NextResponse.json({
    success: true,
    data: result,
    message: "ดึงข้อมูลรายการใบลาสำเร็จ"
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.leaveType || !body.reason || !body.startDate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "กรุณาระบุประเภทการลา เหตุผล และวันที่เริ่มต้น"
          }
        },
        { status: 400 }
      );
    }

    const newRequest: LeaveRequest = {
      id: `req-${Date.now()}`,
      requesterName: body.requesterName || "ครูอัญชลี รัตนโกสินทร์",
      requesterRole: body.requesterRole || "ครูผู้สอน",
      leaveType: body.leaveType,
      reason: body.reason,
      startDate: body.startDate,
      endDate: body.endDate || body.startDate,
      status: "PENDING",
      workflowSteps: [
        { step: 1, approver: "หัวหน้าฝ่าย / หัวหน้ากลุ่มสาระ", role: "Supervisor", decision: "PENDING" },
        { step: 2, approver: "รองผู้อำนวยการโรงเรียน", role: "Deputy Director", decision: "PENDING" },
        { step: 3, approver: "ผู้อำนวยการโรงเรียน", role: "Director", decision: "PENDING" }
      ]
    };

    mockLeaveRequests.unshift(newRequest);

    return NextResponse.json({
      success: true,
      data: newRequest,
      message: "ยื่นคำขอใบลาเข้าระบบ Workflow Engine สำเร็จ"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" } },
      { status: 500 }
    );
  }
}
