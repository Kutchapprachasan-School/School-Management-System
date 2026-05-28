import { NextResponse } from "next/server";
import { initialLeaveRequests } from "@/lib/mock-data";
import { LeaveRequest } from "@/types/school-os";

let mockLeaveRequests = [...initialLeaveRequests];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const leaveReq = mockLeaveRequests.find(r => r.id === id);

  if (!leaveReq) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "ไม่พบเอกสารใบลารหัสนี้ในระบบ" } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: leaveReq,
    message: "ดึงข้อมูลเอกสารใบลาสำเร็จ"
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const reqIndex = mockLeaveRequests.findIndex(r => r.id === id);

    if (reqIndex === -1) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "ไม่พบเอกสารใบลารหัสนี้ในระบบ" } },
        { status: 404 }
      );
    }

    mockLeaveRequests[reqIndex] = { ...mockLeaveRequests[reqIndex], ...body };

    return NextResponse.json({
      success: true,
      data: mockLeaveRequests[reqIndex],
      message: "แก้ไขเอกสารใบลาสำเร็จ"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาด" } },
      { status: 500 }
    );
  }
}
