import { NextResponse } from "next/server";
import { initialStudents } from "@/lib/mock-data";

export async function GET() {
  const students = initialStudents;

  const scannedResults = students.map(s => {
    let riskScore = 0; // 0 to 100 risk scale
    const riskReasons: string[] = [];

    // Heuristic 1: Behavior Points deficit
    if (s.behaviorPoints < 70) {
      riskScore += 45;
      riskReasons.push(`คะแนนความประพฤติต่ำขั้นวิกฤต (${s.behaviorPoints} คะแนน)`);
    } else if (s.behaviorPoints < 85) {
      riskScore += 25;
      riskReasons.push(`คะแนนความประพฤติเริ่มต่ำกว่าเกณฑ์ปกติ (${s.behaviorPoints} คะแนน)`);
    }

    // Heuristic 2: Daily attendance issues
    if (s.attendanceToday === "absent") {
      riskScore += 20;
      riskReasons.push("ไม่พบชื่อเช็คชื่อเข้าเรียนวันนี้ (ขาดเรียน)");
    } else if (s.attendanceToday === "late") {
      riskScore += 5;
      riskReasons.push("มาเรียนสายเช้านี้");
    }

    // Heuristic 3: Wellness profile (SDQ Risk)
    if (s.sdqRisk === "เสี่ยง" || s.sdqRisk === "มีปัญหา") {
      riskScore += 30;
      riskReasons.push("ผลการวิเคราะห์คัดกรองพฤติกรรม SDQ อยู่ในเกณฑ์กลุ่มเสี่ยง/มีปัญหา");
    }

    // Classify zone
    let zone: "red" | "yellow" | "green" = "green";
    if (riskScore >= 50) {
      zone = "red";
    } else if (riskScore >= 20) {
      zone = "yellow";
    }

    return {
      studentId: s.id,
      studentCode: s.studentCode,
      fullName: s.fullName,
      classroom: s.classroom,
      riskScore,
      riskZone: zone,
      reasons: riskReasons,
      recommendedAction: zone === "red"
        ? "เสนอส่งต่อฝ่ายแนะแนว/ติดต่อพบผู้ปกครองทันที"
        : zone === "yellow"
        ? "ครูประจำชั้นคัดกรองติดตามพฤติกรรมในห้องเรียนอย่างใกล้ชิด"
        : "สนับสนุนเชิงบวกตามมาตรฐานโรงเรียน",
    };
  });

  // Calculate distributions
  const redGroup = scannedResults.filter(r => r.riskZone === "red");
  const yellowGroup = scannedResults.filter(r => r.riskZone === "yellow");
  const greenGroup = scannedResults.filter(r => r.riskZone === "green");

  return NextResponse.json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      summary: {
        totalScanned: scannedResults.length,
        redCount: redGroup.length,
        yellowCount: yellowGroup.length,
        greenCount: greenGroup.length,
        overallAtRiskPercentage: Math.round(((redGroup.length + yellowGroup.length) / scannedResults.length) * 100),
      },
      groups: {
        red: redGroup.sort((a, b) => b.riskScore - a.riskScore),
        yellow: yellowGroup.sort((a, b) => b.riskScore - a.riskScore),
        green: greenGroup,
      }
    },
    message: "อัลกอริทึมสแกนประเมินนักเรียนกลุ่มเสี่ยงประมวลผลสำเร็จ"
  });
}
