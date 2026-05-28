import { NextResponse } from "next/server";
import { initialStudents } from "@/lib/mock-data";

interface BehaviorLog {
  id: string;
  studentId: string;
  date: string;
  pointsChanged: number; // positive or negative
  actionType: "add" | "deduct";
  reason: string;
  actor: string;
}

let mockBehaviorLogs: BehaviorLog[] = [
  { id: "b-1", studentId: "std-2", date: "2026-05-19", pointsChanged: -5, actionType: "deduct", reason: "แต่งกายผิดระเบียบโรงเรียน", actor: "ครูสมเกียรติ กีฬาดี" },
  { id: "b-2", studentId: "std-1", date: "2026-05-18", pointsChanged: 10, actionType: "add", reason: "ช่วยเหลือผู้ประสบภัยข้างถนนและเก็บกระเป๋าตังคืนเจ้าของ", actor: "ครูอัญชลี รัตนโกสินทร์" },
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const logs = mockBehaviorLogs.filter(l => l.studentId === id);

  return NextResponse.json({
    success: true,
    data: logs,
    message: "ดึงประวัติการปรับคะแนนพฤติกรรมสำเร็จ"
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { pointsChanged, reason, actor } = body;

    if (pointsChanged === undefined || !reason) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "กรุณาระบุจำนวนคะแนนที่ปรับเปลี่ยนและเหตุผล" } },
        { status: 400 }
      );
    }

    const change = Number(pointsChanged);

    const newLog: BehaviorLog = {
      id: `b-${Date.now()}`,
      studentId: id,
      date: new Date().toISOString().substring(0, 10),
      pointsChanged: change,
      actionType: change >= 0 ? "add" : "deduct",
      reason,
      actor: actor || "ครูอัญชลี รัตนโกสินทร์",
    };

    mockBehaviorLogs.unshift(newLog);

    // Event Trigger Simulation: behavior.points_adjusted
    console.log(`[Event Triggered: behavior.points_adjusted] Student ${id} points changed by ${change}. Reason: ${reason}`);

    return NextResponse.json({
      success: true,
      data: newLog,
      message: `ปรับปรุงคะแนนความประพฤตินักเรียนสำเร็จ (${change >= 0 ? `+${change}` : change} คะแนน)`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาด" } },
      { status: 500 }
    );
  }
}
