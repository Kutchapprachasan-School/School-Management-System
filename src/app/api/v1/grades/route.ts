import { NextResponse } from "next/server";
import { initialStudents } from "@/lib/mock-data";

interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  subjectCode: string;
  subjectName: string;
  midtermScore: number;
  finalScore: number;
  totalScore: number;
  gradeValue: number | null;
  gradeLetter: string;
  semesterId: string;
  sgsSyncStatus: "pending" | "synced" | "error";
}

// Generate mock grades from student list
const mockGrades: GradeRecord[] = initialStudents.flatMap(s => [
  {
    id: `gr-${s.id}-1`, studentId: s.id, studentName: s.fullName, classroom: s.classroom,
    subjectCode: "ท33101", subjectName: "ภาษาไทยพื้นฐาน",
    midtermScore: 32, finalScore: 38, totalScore: 70, gradeValue: 3.0, gradeLetter: "3.0",
    semesterId: "sem-1", sgsSyncStatus: "pending" as const,
  },
  {
    id: `gr-${s.id}-2`, studentId: s.id, studentName: s.fullName, classroom: s.classroom,
    subjectCode: "ค33101", subjectName: "คณิตศาสตร์พื้นฐาน",
    midtermScore: 28, finalScore: 35, totalScore: 63, gradeValue: 2.5, gradeLetter: "2.5",
    semesterId: "sem-1", sgsSyncStatus: "pending" as const,
  },
  {
    id: `gr-${s.id}-3`, studentId: s.id, studentName: s.fullName, classroom: s.classroom,
    subjectCode: "อ33101", subjectName: "ภาษาอังกฤษพื้นฐาน",
    midtermScore: 35, finalScore: 42, totalScore: 77, gradeValue: 3.5, gradeLetter: "3.5",
    semesterId: "sem-1", sgsSyncStatus: "pending" as const,
  },
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const subjectCode = searchParams.get("subjectCode");
  const classroom = searchParams.get("classroom");

  let result = [...mockGrades];
  if (studentId) result = result.filter(g => g.studentId === studentId);
  if (subjectCode) result = result.filter(g => g.subjectCode === subjectCode);
  if (classroom) result = result.filter(g => g.classroom === classroom);

  return NextResponse.json({
    success: true,
    data: result,
    message: "ดึงข้อมูลผลการเรียนสำเร็จ"
  });
}
