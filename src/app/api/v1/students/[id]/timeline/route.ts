import { NextResponse } from "next/server";
import { initialTimelineEvents } from "@/lib/mock-data";
import { TimelineEvent } from "@/types/school-os";

// In-memory array for prototype mode
let mockTimelineEvents = [...initialTimelineEvents];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const events = mockTimelineEvents.filter((e) => e.studentId === id);

  return NextResponse.json({
    success: true,
    data: events,
    message: "ดึงข้อมูลประวัติกิจกรรม (Timeline) สำเร็จ"
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.title || !body.description || !body.category) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "กรุณาระบุหัวข้อ รายละเอียด และประเภทของกิจกรรม"
          }
        },
        { status: 400 }
      );
    }

    const newEvent: TimelineEvent = {
      id: `ev-${Date.now()}`,
      studentId: id,
      date: body.date || new Date().toISOString().substring(0, 10),
      category: body.category, // "attendance" | "behavior" | "academic" | "health" | "request" | "home_visit"
      title: body.title,
      description: body.description,
      actor: body.actor || "ครูอัญชลี รัตนโกสินทร์",
      actorRole: body.actorRole || "ครูผู้สอน",
      icon: body.icon || "User"
    };

    mockTimelineEvents.unshift(newEvent);

    return NextResponse.json({
      success: true,
      data: newEvent,
      message: "เพิ่มประวัติกิจกรรมลงในไทม์ไลน์นักเรียนสำเร็จ"
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
