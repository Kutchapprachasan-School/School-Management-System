import { NextResponse } from "next/server";

interface BulkGradeEntry {
  studentId: string;
  subjectCode: string;
  midtermScore: number;
  finalScore: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classroom, semesterId, entries } = body as {
      classroom: string;
      semesterId: string;
      entries: BulkGradeEntry[];
    };

    if (!classroom || !entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "กรุณาระบุห้องเรียนและรายการคะแนน (entries)" } },
        { status: 400 }
      );
    }

    // Calculate grades for each entry
    const processed = entries.map(entry => {
      const total = entry.midtermScore + entry.finalScore;
      let gradeValue: number;
      let gradeLetter: string;

      if (total >= 80) { gradeValue = 4.0; gradeLetter = "4.0"; }
      else if (total >= 75) { gradeValue = 3.5; gradeLetter = "3.5"; }
      else if (total >= 70) { gradeValue = 3.0; gradeLetter = "3.0"; }
      else if (total >= 65) { gradeValue = 2.5; gradeLetter = "2.5"; }
      else if (total >= 60) { gradeValue = 2.0; gradeLetter = "2.0"; }
      else if (total >= 55) { gradeValue = 1.5; gradeLetter = "1.5"; }
      else if (total >= 50) { gradeValue = 1.0; gradeLetter = "1.0"; }
      else { gradeValue = 0; gradeLetter = "0"; }

      return {
        ...entry,
        totalScore: total,
        gradeValue,
        gradeLetter,
        sgsSyncStatus: "pending" as const,
      };
    });

    console.log(`[Grades] Bulk grade entry for ${classroom}: ${processed.length} records processed`);

    return NextResponse.json({
      success: true,
      data: {
        classroom,
        semesterId: semesterId || "sem-1",
        totalProcessed: processed.length,
        grades: processed,
      },
      message: `บันทึกคะแนนดิบสำเร็จ ${processed.length} รายการ พร้อมคำนวณเกรดอัตโนมัติ`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาด" } },
      { status: 500 }
    );
  }
}
