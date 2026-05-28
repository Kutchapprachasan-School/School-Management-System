import { NextResponse } from "next/server";

interface TimetableSlot {
  id: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  room: string;
}

const mockTimetable: TimetableSlot[] = [
  // Monday
  { id: "tt-1", day: "จันทร์", period: 1, startTime: "08:30", endTime: "09:20", subjectCode: "ท33101", subjectName: "ภาษาไทยพื้นฐาน", teacherName: "ครูอัญชลี", room: "601" },
  { id: "tt-2", day: "จันทร์", period: 2, startTime: "09:20", endTime: "10:10", subjectCode: "ค33101", subjectName: "คณิตศาสตร์พื้นฐาน", teacherName: "ครูสมชาย", room: "601" },
  { id: "tt-3", day: "จันทร์", period: 3, startTime: "10:30", endTime: "11:20", subjectCode: "อ33101", subjectName: "ภาษาอังกฤษพื้นฐาน", teacherName: "ครูแมรี่", room: "601" },
  { id: "tt-4", day: "จันทร์", period: 4, startTime: "11:20", endTime: "12:10", subjectCode: "ว33101", subjectName: "วิทยาศาสตร์พื้นฐาน", teacherName: "ครูวิทย์", room: "Lab 1" },
  { id: "tt-5", day: "จันทร์", period: 5, startTime: "13:00", endTime: "13:50", subjectCode: "ส33101", subjectName: "สังคมศึกษา", teacherName: "ครูประวัติ", room: "601" },
  { id: "tt-6", day: "จันทร์", period: 6, startTime: "13:50", endTime: "14:40", subjectCode: "พ33101", subjectName: "สุขศึกษาและพลศึกษา", teacherName: "ครูสมเกียรติ", room: "สนามกีฬา" },
  // Tuesday
  { id: "tt-7", day: "อังคาร", period: 1, startTime: "08:30", endTime: "09:20", subjectCode: "ค33101", subjectName: "คณิตศาสตร์พื้นฐาน", teacherName: "ครูสมชาย", room: "601" },
  { id: "tt-8", day: "อังคาร", period: 2, startTime: "09:20", endTime: "10:10", subjectCode: "ว33101", subjectName: "วิทยาศาสตร์พื้นฐาน", teacherName: "ครูวิทย์", room: "Lab 1" },
  { id: "tt-9", day: "อังคาร", period: 3, startTime: "10:30", endTime: "11:20", subjectCode: "ท33101", subjectName: "ภาษาไทยพื้นฐาน", teacherName: "ครูอัญชลี", room: "601" },
  { id: "tt-10", day: "อังคาร", period: 4, startTime: "11:20", endTime: "12:10", subjectCode: "ศ33101", subjectName: "ศิลปะ", teacherName: "ครูศิลป์", room: "ห้องศิลปะ" },
  { id: "tt-11", day: "อังคาร", period: 5, startTime: "13:00", endTime: "13:50", subjectCode: "อ33101", subjectName: "ภาษาอังกฤษพื้นฐาน", teacherName: "ครูแมรี่", room: "601" },
  { id: "tt-12", day: "อังคาร", period: 6, startTime: "13:50", endTime: "14:40", subjectCode: "ง33101", subjectName: "การงานอาชีพฯ", teacherName: "ครูเทค", room: "ห้อง Com" },
  // Wednesday
  { id: "tt-13", day: "พุธ", period: 1, startTime: "08:30", endTime: "09:20", subjectCode: "อ33101", subjectName: "ภาษาอังกฤษพื้นฐาน", teacherName: "ครูแมรี่", room: "601" },
  { id: "tt-14", day: "พุธ", period: 2, startTime: "09:20", endTime: "10:10", subjectCode: "ท33101", subjectName: "ภาษาไทยพื้นฐาน", teacherName: "ครูอัญชลี", room: "601" },
  { id: "tt-15", day: "พุธ", period: 3, startTime: "10:30", endTime: "11:20", subjectCode: "ค33101", subjectName: "คณิตศาสตร์พื้นฐาน", teacherName: "ครูสมชาย", room: "601" },
  { id: "tt-16", day: "พุธ", period: 4, startTime: "11:20", endTime: "12:10", subjectCode: "ส33101", subjectName: "สังคมศึกษา", teacherName: "ครูประวัติ", room: "601" },
  // Thursday
  { id: "tt-17", day: "พฤหัสบดี", period: 1, startTime: "08:30", endTime: "09:20", subjectCode: "ว33101", subjectName: "วิทยาศาสตร์พื้นฐาน", teacherName: "ครูวิทย์", room: "Lab 1" },
  { id: "tt-18", day: "พฤหัสบดี", period: 2, startTime: "09:20", endTime: "10:10", subjectCode: "อ33101", subjectName: "ภาษาอังกฤษพื้นฐาน", teacherName: "ครูแมรี่", room: "601" },
  { id: "tt-19", day: "พฤหัสบดี", period: 3, startTime: "10:30", endTime: "11:20", subjectCode: "ท33101", subjectName: "ภาษาไทยพื้นฐาน", teacherName: "ครูอัญชลี", room: "601" },
  { id: "tt-20", day: "พฤหัสบดี", period: 4, startTime: "11:20", endTime: "12:10", subjectCode: "พ33101", subjectName: "สุขศึกษาฯ", teacherName: "ครูสมเกียรติ", room: "สนามกีฬา" },
  { id: "tt-21", day: "พฤหัสบดี", period: 5, startTime: "13:00", endTime: "13:50", subjectCode: "ค33101", subjectName: "คณิตศาสตร์พื้นฐาน", teacherName: "ครูสมชาย", room: "601" },
  // Friday
  { id: "tt-22", day: "ศุกร์", period: 1, startTime: "08:30", endTime: "09:20", subjectCode: "ส33101", subjectName: "สังคมศึกษา", teacherName: "ครูประวัติ", room: "601" },
  { id: "tt-23", day: "ศุกร์", period: 2, startTime: "09:20", endTime: "10:10", subjectCode: "ง33101", subjectName: "การงานอาชีพฯ", teacherName: "ครูเทค", room: "ห้อง Com" },
  { id: "tt-24", day: "ศุกร์", period: 3, startTime: "10:30", endTime: "11:20", subjectCode: "ศ33101", subjectName: "ศิลปะ", teacherName: "ครูศิลป์", room: "ห้องศิลปะ" },
  { id: "tt-25", day: "ศุกร์", period: 4, startTime: "11:20", endTime: "12:10", subjectCode: "ว33101", subjectName: "วิทยาศาสตร์พื้นฐาน", teacherName: "ครูวิทย์", room: "Lab 1" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get("day");
  const classroom = searchParams.get("classroom");
  const teacherName = searchParams.get("teacher");

  let result = [...mockTimetable];
  if (day) result = result.filter(t => t.day === day);
  if (teacherName) result = result.filter(t => t.teacherName.includes(teacherName));

  // Group by day for structured output
  const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"];
  const grouped = days.map(d => ({
    day: d,
    slots: result.filter(t => t.day === d).sort((a, b) => a.period - b.period),
  }));

  return NextResponse.json({
    success: true,
    data: {
      classroom: classroom || "ม.6/1",
      semester: "ภาคเรียนที่ 1/2569",
      schedule: grouped,
      totalSlots: result.length,
    },
    message: "ดึงข้อมูลตารางเรียนสำเร็จ"
  });
}
