import { NextResponse } from "next/server";
import { initialLeaveRequests } from "@/lib/mock-data";

let mockLeaveRequests = [...initialLeaveRequests];

export async function POST(
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

    const req = mockLeaveRequests[reqIndex];

    // Find next pending step and approve it
    const nextStep = req.workflowSteps.find(s => s.decision === "PENDING");
    if (!nextStep) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "ไม่มีขั้นตอนที่รอการอนุมัติ" } },
        { status: 400 }
      );
    }

    nextStep.decision = "APPROVED";
    nextStep.decidedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
    nextStep.comments = body.comments || "";

    // Check if all steps approved
    const allApproved = req.workflowSteps.every(s => s.decision === "APPROVED");
    if (allApproved) {
      req.status = "APPROVED";
    }

    mockLeaveRequests[reqIndex] = req;

    // Simulate Event: workflow.step_approved -> notification.send
    console.log(`[Event: workflow.step_approved] Leave ${id} step ${nextStep.step} approved by ${nextStep.role || nextStep.approver}`);
    if (allApproved) {
      console.log(`[Event: workflow.completed] Leave ${id} fully approved -> notify requester via LINE`);
    }

    return NextResponse.json({
      success: true,
      data: req,
      message: allApproved
        ? "ใบลาได้รับการอนุมัติครบทุกขั้นตอนเรียบร้อยแล้ว"
        : `ลงนามอนุมัติขั้นตอนที่ ${nextStep.step} สำเร็จ`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาด" } },
      { status: 500 }
    );
  }
}
