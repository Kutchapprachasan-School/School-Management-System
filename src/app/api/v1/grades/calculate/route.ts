import { NextResponse } from "next/server";
import { initialStudents } from "@/lib/mock-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classroom, subjectCode, semesterId } = body;

    if (!classroom || !subjectCode) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "กรุณาระบุห้องเรียนและรหัสวิชา" } },
        { status: 400 }
      );
    }

    // Simulate grade calculation for all students
    const students = initialStudents.filter(s => s.classroom === classroom);

    const calculatedGrades = students.map(s => {
      // Simulate random scores for prototype
      const midterm = Math.floor(Math.random() * 20) + 20; // 20-40
      const final_ = Math.floor(Math.random() * 30) + 20;  // 20-50
      const total = midterm + final_;

      let gradeValue: number;
      if (total >= 80) gradeValue = 4.0;
      else if (total >= 75) gradeValue = 3.5;
      else if (total >= 70) gradeValue = 3.0;
      else if (total >= 65) gradeValue = 2.5;
      else if (total >= 60) gradeValue = 2.0;
      else if (total >= 55) gradeValue = 1.5;
      else if (total >= 50) gradeValue = 1.0;
      else gradeValue = 0;

      return {
        studentId: s.id,
        studentName: s.fullName,
        studentCode: s.studentCode,
        midtermScore: midterm,
        finalScore: final_,
        totalScore: total,
        gradeValue,
        gradeLetter: gradeValue.toFixed(1),
      };
    });

    // Calculate class statistics
    const totalStudents = calculatedGrades.length;
    const avgGrade = totalStudents > 0
      ? (calculatedGrades.reduce((sum, g) => sum + g.gradeValue, 0) / totalStudents).toFixed(2)
      : "0.00";
    const passCount = calculatedGrades.filter(g => g.gradeValue >= 1.0).length;
    const failCount = totalStudents - passCount;

    console.log(`[Grades] Calculate grades for ${classroom}/${subjectCode}: avg=${avgGrade}, pass=${passCount}, fail=${failCount}`);

    return NextResponse.json({
      success: true,
      data: {
        classroom,
        subjectCode,
        semesterId: semesterId || "sem-1",
        totalStudents,
        averageGrade: parseFloat(avgGrade),
        passCount,
        failCount,
        passRate: totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0,
        grades: calculatedGrades,
      },
      message: `คำนวณตัดเกรดวิชา ${subjectCode} สำเร็จ (ผ่าน ${passCount}/${totalStudents} คน)`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาด" } },
      { status: 500 }
    );
  }
}
