import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classroom, targetDay, targetPeriod, proposedTeacher, proposedSubject } = body;

    if (!classroom || !proposedTeacher || !proposedSubject) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "กรุณาระบุห้องเรียน ครูผู้สอน และวิชาเรียนที่จะจัดสรร" } },
        { status: 400 }
      );
    }

    // Heuristics Simulation Engine
    const conflictsDetected: string[] = [];
    let scheduleFitnessScore = 100;

    // Constraint 1: Double-Booking check (Simulated)
    if (proposedTeacher === "ครูสมชาย ฉลาดดี" && targetDay === "จันทร์" && targetPeriod === 2) {
      conflictsDetected.push("ครูสมชาย ติดภาระสอนวิชาคณิตศาสตร์ที่ห้อง ม.6/2 ในคาบที่ 2");
      scheduleFitnessScore -= 40;
    }

    // Constraint 2: Subject fatigue distribution check (e.g. math should not be in consecutive hours or late afternoon)
    if (proposedSubject.toLowerCase().includes("คณิต") && targetPeriod && targetPeriod > 4) {
      conflictsDetected.push("ไม่ควรจัดวิชาคณิศาสตร์ในคาบเรียนตอนบ่าย เนื่องจากดัชนีความเหนื่อยล้าของเด็กนักเรียนอยู่ในเกณฑ์สูง");
      scheduleFitnessScore -= 20;
    }

    // Constraint 3: Room reservation double-booking
    if (proposedSubject.toLowerCase().includes("คอมพิวเตอร์") && targetDay === "อังคาร" && targetPeriod === 6) {
      conflictsDetected.push("ห้องปฏิบัติการคอมพิวเตอร์ 1 ถูกจองโดยห้อง ม.5/1 เรียบร้อยแล้ว");
      scheduleFitnessScore -= 30;
    }

    const optimizationResult = {
      classroom,
      subject: proposedSubject,
      teacher: proposedTeacher,
      targetDay: targetDay || "จันทร์",
      targetPeriod: targetPeriod || 1,
      isFeasible: conflictsDetected.length === 0,
      fitnessScore: Math.max(0, scheduleFitnessScore),
      conflicts: conflictsDetected,
      aiRecommendations: conflictsDetected.length > 0 
        ? [
            `แนะนำให้ย้ายการสอนวิชา ${proposedSubject} ไปจัดสอนในวันพุธ คาบที่ 3 แทน ซึ่งครูและห้องปฏิบัติการว่าง 100%`,
            `ปรับเปลี่ยนครูผู้สอนสำรองสำหรับคาบเวลานี้เป็น ครูวิทย์ สาระดี`
          ]
        : ["ตารางเรียนมีความลงตัวและมีประสิทธิภาพการเรียนรู้สูงที่สุด ผ่านเกณฑ์มาตรฐาน"]
    };

    return NextResponse.json({
      success: true,
      data: optimizationResult,
      message: conflictsDetected.length > 0
        ? `ตรวจพบข้อขัดแย้งเชิงตารางสอน ${conflictsDetected.length} จุดหลัก`
        : "จัดสรรตารางเรียนได้อย่างสมบูรณ์แบบ AI ไม่พบข้อขัดแย้งของทรัพยากรครูและห้องเรียน"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาด" } },
      { status: 500 }
    );
  }
}
