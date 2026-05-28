import { NextResponse } from "next/server";
import { initialStudents, initialLeaveRequests, initialHealthVisits } from "@/lib/mock-data";

export async function GET() {
  const students = initialStudents;
  const leaves = initialLeaveRequests;
  const medical = initialHealthVisits;

  // 1. Enrollment stats
  const totalStudents = students.length;
  const maleStudents = students.filter(s => s.gender === "ชาย").length;
  const femaleStudents = students.filter(s => s.gender === "หญิง").length;

  // 2. Attendance rates
  const present = students.filter(s => s.attendanceToday === "present").length;
  const late = students.filter(s => s.attendanceToday === "late").length;
  const absent = students.filter(s => s.attendanceToday === "absent").length;
  const overallAttendanceRate = totalStudents > 0
    ? Math.round(((present + late) / totalStudents) * 100)
    : 0;

  // 3. Behavior analysis
  const totalBehaviorPoints = students.reduce((sum, s) => sum + s.behaviorPoints, 0);
  const averageBehaviorPoints = totalStudents > 0
    ? parseFloat((totalBehaviorPoints / totalStudents).toFixed(1))
    : 100;
  
  const behavioralAlerts = students.filter(s => s.behaviorPoints < 80).length;

  // 4. Academic SDQ and risk detection
  const highRiskSdq = students.filter(s => s.sdqRisk === "เสี่ยง" || s.sdqRisk === "มีปัญหา" || s.status === "ช่วยเหลือเร่งด่วน").length;

  // 5. Workflow operations
  const pendingLeaves = leaves.filter(l => l.status === "PENDING").length;
  const approvedLeaves = leaves.filter(l => l.status === "APPROVED").length;

  // 6. Medical frequency
  const dailyMedicalVisits = medical.length;

  const dashboardData = {
    schoolName: "โรงเรียนวิทยาการเทคโนโลยีประยุกต์",
    academicYear: "2569",
    semester: "1",
    timestamp: new Date().toISOString(),
    metrics: {
      enrollment: {
        total: totalStudents,
        male: maleStudents,
        female: femaleStudents,
      },
      attendance: {
        todayRate: overallAttendanceRate,
        presentCount: present,
        lateCount: late,
        absentCount: absent,
      },
      behavior: {
        avgPoints: averageBehaviorPoints,
        alertsCount: behavioralAlerts,
      },
      wellbeing: {
        sdqHighRisk: highRiskSdq,
        clinicVisitsToday: dailyMedicalVisits,
      },
      operations: {
        pendingApprovals: pendingLeaves,
        approvedTotal: approvedLeaves,
      }
    }
  };

  return NextResponse.json({
    success: true,
    data: dashboardData,
    message: "ดึงข้อมูลสถิติรายงานผู้บริหารระบบสำเร็จ"
  });
}
