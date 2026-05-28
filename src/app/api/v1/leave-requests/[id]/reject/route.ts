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

    // Find current pending step and reject it
    const currentStep = req.workflowSteps.find(s => s.decision === "PENDING");
    if (!currentStep) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "ไม่มีขั้นตอนที่รอการพิจารณา" } },
        { status: 400 }
      );
    }

    currentStep.decision = "REJECTED";
    currentStep.decidedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
    currentStep.comments = body.reason || "ไม่ระบุเหตุผล";

    req.status = "REJECTED";
    mockLeaveRequests[reqIndex] = req;

    // Simulate Event: workflow.rejected -> notification.send
    console.log(`[Event: workflow.rejected] Leave ${id} rejected at step ${currentStep.step} -> notify requester via LINE`);

    return NextResponse.json({
      success: true,
      data: req,
      message: `ปฏิเสธใบลาเรียบร้อยแล้ว เหตุผล: ${currentStep.comments}`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาด" } },
      { status: 500 }
    );
  }
}
