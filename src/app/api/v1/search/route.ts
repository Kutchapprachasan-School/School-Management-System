import { NextResponse } from "next/server";
import { initialStudents } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase();

  if (!q || q.length < 1) {
    return NextResponse.json({
      success: true,
      data: { students: [], total: 0 },
      message: "กรุณาระบุคำค้นหา"
    });
  }

  // Search students by name, code, classroom, or nickname
  const matchedStudents = initialStudents.filter(s =>
    s.fullName.toLowerCase().includes(q) ||
    s.studentCode.toLowerCase().includes(q) ||
    s.classroom.toLowerCase().includes(q) ||
    (s.nickname && s.nickname.toLowerCase().includes(q)) ||
    s.parentName.toLowerCase().includes(q)
  ).map(s => ({
    id: s.id,
    type: "student" as const,
    title: s.fullName,
    subtitle: `${s.classroom} • ${s.studentCode}`,
    status: s.status,
  }));

  return NextResponse.json({
    success: true,
    data: {
      students: matchedStudents,
      total: matchedStudents.length,
    },
    message: `พบผลลัพธ์ ${matchedStudents.length} รายการ`
  });
}
