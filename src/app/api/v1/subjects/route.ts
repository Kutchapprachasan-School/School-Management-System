import { NextResponse } from "next/server";

interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  teacherName: string;
  classroom: string;
  semesterId: string;
}

let mockSubjects: Subject[] = [
  { id: "sub-1", subjectCode: "ท33101", subjectName: "ภาษาไทยพื้นฐาน", credits: 1.5, teacherName: "ครูอัญชลี รัตนโกสินทร์", classroom: "ม.6/1", semesterId: "sem-1" },
  { id: "sub-2", subjectCode: "ค33101", subjectName: "คณิตศาสตร์พื้นฐาน", credits: 1.5, teacherName: "ครูสมชาย ฉลาดดี", classroom: "ม.6/1", semesterId: "sem-1" },
  { id: "sub-3", subjectCode: "อ33101", subjectName: "ภาษาอังกฤษพื้นฐาน", credits: 1.5, teacherName: "ครูแมรี่ สมิธ", classroom: "ม.6/1", semesterId: "sem-1" },
  { id: "sub-4", subjectCode: "ว33101", subjectName: "วิทยาศาสตร์พื้นฐาน", credits: 1.5, teacherName: "ครูวิทย์ สาระดี", classroom: "ม.6/1", semesterId: "sem-1" },
  { id: "sub-5", subjectCode: "ส33101", subjectName: "สังคมศึกษา", credits: 1.5, teacherName: "ครูประวัติ ศาสตร์ดี", classroom: "ม.6/1", semesterId: "sem-1" },
  { id: "sub-6", subjectCode: "พ33101", subjectName: "สุขศึกษาและพลศึกษา", credits: 1.0, teacherName: "ครูสมเกียรติ กีฬาดี", classroom: "ม.6/1", semesterId: "sem-1" },
  { id: "sub-7", subjectCode: "ศ33101", subjectName: "ศิลปะ", credits: 1.0, teacherName: "ครูศิลป์ สวยงาม", classroom: "ม.6/1", semesterId: "sem-1" },
  { id: "sub-8", subjectCode: "ง33101", subjectName: "การงานอาชีพและเทคโนโลยี", credits: 1.0, teacherName: "ครูเทค โนโลยี", classroom: "ม.6/1", semesterId: "sem-1" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classroom = searchParams.get("classroom");

  let result = [...mockSubjects];
  if (classroom) result = result.filter(s => s.classroom === classroom);

  return NextResponse.json({
    success: true,
    data: result,
    message: "ดึงข้อมูลรายวิชาสำเร็จ"
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.subjectCode || !body.subjectName || !body.credits) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "กรุณาระบุรหัสวิชา ชื่อวิชา และหน่วยกิต" } },
        { status: 400 }
      );
    }

    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      subjectCode: body.subjectCode,
      subjectName: body.subjectName,
      credits: body.credits,
      teacherName: body.teacherName || "",
      classroom: body.classroom || "ม.6/1",
      semesterId: body.semesterId || "sem-1",
    };

    mockSubjects.push(newSubject);

    return NextResponse.json({
      success: true,
      data: newSubject,
      message: "เพิ่มรายวิชาเข้าระบบหลักสูตรสำเร็จ"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาด" } },
      { status: 500 }
    );
  }
}
