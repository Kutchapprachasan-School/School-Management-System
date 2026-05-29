"use client";

import React from "react";
import { 
  Calendar, Clock, CheckCircle2, ShieldAlert, Award, FileText, 
  Users, TrendingUp, AlertTriangle, CheckSquare, Sparkles, BookOpen, 
  ChevronRight, HeartPulse, Activity, BellRing, Database, GraduationCap
} from "lucide-react";
import { Student, LeaveRequest, UserRole } from "@/types/school-os";

interface SmartDashboardProps {
  role: UserRole;
  lang?: "th" | "en";
  students: Student[];
  leaveRequests: LeaveRequest[];
  onNavigate: (menu: string, tab?: string) => void;
  onSelectStudent: (student: Student) => void;
  onApproveRequest: (id: string, decision: "APPROVED" | "REJECTED") => void;
  notificationsCount: number;
}

export default function SmartDashboard({
  role,
  lang = "th",
  students,
  leaveRequests,
  onNavigate,
  onSelectStudent,
  onApproveRequest,
  notificationsCount,
}: SmartDashboardProps) {
  
  // Calculate general stats
  const totalStudentsCount = students.length;
  const absentToday = students.filter(s => s.attendanceToday === "absent").length;
  const lateToday = students.filter(s => s.attendanceToday === "late").length;
  const riskStudents = students.filter(s => s.status === "เสี่ยง" || s.status === "ช่วยเหลือเร่งด่วน");
  const pendingLeaves = leaveRequests.filter(r => r.status === "PENDING");

  // Renders for Teacher Role
  const renderTeacherDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] transition-all duration-300 ease-in-out hover:scale-[1.01] hover:border-slate-200 dark:hover:border-slate-700/80 flex flex-col justify-between min-h-[125px] sm:min-h-[145px]">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground font-semibold leading-tight truncate">
              {lang === "th" ? "คาบสอนวันนี้" : "Periods Today"}
            </span>
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0"><BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></span>
          </div>
          <div className="mt-3">
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              {lang === "th" ? "4 คาบ" : "4 Periods"}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-2 truncate">
              {lang === "th" ? "ชั้น ม.6/1" : "Grade 12/1"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] transition-all duration-300 ease-in-out hover:scale-[1.01] hover:border-slate-200 dark:hover:border-slate-700/80 flex flex-col justify-between min-h-[125px] sm:min-h-[145px]">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground font-semibold leading-tight truncate">
              {lang === "th" ? "นักเรียนขาดเรียน" : "Absent Students"}
            </span>
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-450 flex items-center justify-center shrink-0 border border-rose-500/20"><ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></span>
          </div>
          <div className="mt-3">
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-rose-600 leading-none">
              {lang === "th" ? `${absentToday} คน` : `${absentToday} Students`}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-2 truncate">
              {lang === "th" ? `ทั้งหมด ${totalStudentsCount} คน` : `Total ${totalStudentsCount}`}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] transition-all duration-300 ease-in-out hover:scale-[1.01] hover:border-slate-200 dark:hover:border-slate-700/80 flex flex-col justify-between min-h-[125px] sm:min-h-[145px]">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground font-semibold leading-tight truncate">
              {lang === "th" ? "นักเรียนมาสาย" : "Late Arrivals"}
            </span>
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-450 flex items-center justify-center shrink-0 border border-amber-500/20"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></span>
          </div>
          <div className="mt-3">
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-amber-600 leading-none">
              {lang === "th" ? `${lateToday} คน` : `${lateToday} Students`}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-2 truncate">
              {lang === "th" ? "ควรเช็ครายชื่อ" : "Requires Attention"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] transition-all duration-300 ease-in-out hover:scale-[1.01] hover:border-slate-200 dark:hover:border-slate-700/80 flex flex-col justify-between min-h-[125px] sm:min-h-[145px]">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground font-semibold leading-tight truncate">
              {lang === "th" ? "เคสห้องพยาบาล" : "Clinic Visits"}
            </span>
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex items-center justify-center shrink-0 border border-emerald-500/20"><HeartPulse className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></span>
          </div>
          <div className="mt-3">
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-emerald-650 leading-none">
              {lang === "th" ? "2 ราย" : "2 Cases"}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-2 truncate">
              {lang === "th" ? "มีการจ่ายยาทั่วไป" : "General Medicine"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timetable slots */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {lang === "th" ? "ตารางสอนประจำวันนี้" : "Today's Teaching Schedule"}
          </h3>
          <div className="space-y-3">
            {[
              { period: lang === "th" ? "คาบ 1" : "Period 1", time: "08:30 - 09:30", subject: lang === "th" ? "ภาษาไทยพื้นฐาน" : "Basic Thai", status: "done" },
              { period: lang === "th" ? "คาบ 2" : "Period 2", time: "09:30 - 10:30", subject: lang === "th" ? "ภาษาไทยพื้นฐาน" : "Basic Thai", status: "done" },
              { period: lang === "th" ? "คาบ 3" : "Period 3", time: "10:30 - 11:30", subject: lang === "th" ? "เตรียมการสอน" : "Teacher Prep", status: "free" },
              { period: lang === "th" ? "คาบ 4" : "Period 4", time: "11:30 - 12:30", subject: lang === "th" ? "พักกลางวัน" : "Lunch Break", status: "free" },
              { period: lang === "th" ? "คาบ 5" : "Period 5", time: "12:30 - 13:30", subject: lang === "th" ? "ภาษาไทยเพิ่มเติม" : "Advanced Thai", status: "next" },
              { period: lang === "th" ? "คาบ 6" : "Period 6", time: "13:30 - 14:30", subject: lang === "th" ? "กิจกรรมลดเวลาเรียน" : "Co-curricular Time", status: "next" },
            ].map((slot, i) => (
              <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ease-in-out hover:scale-[1.005] ${
                slot.status === "done" 
                  ? "bg-slate-50/40 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900/60 opacity-60" 
                  : slot.status === "next" 
                  ? "bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/40 shadow-sm" 
                  : "bg-white dark:bg-card border-slate-100 dark:border-slate-800/60"
              }`}>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg ${
                    slot.status === "done" 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500" 
                      : slot.status === "next" 
                      ? "bg-indigo-650 text-white shadow-sm" 
                      : "bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-350"
                  }`}>{slot.period}</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{slot.subject}</h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {slot.time}</p>
                  </div>
                </div>
                {slot.status === "done" ? (
                  <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {lang === "th" ? "บันทึกแล้ว" : "Saved"}
                  </span>
                ) : slot.status === "next" ? (
                  <button 
                    onClick={() => onNavigate("Academic", "teaching")}
                    className="text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    {lang === "th" ? "เริ่มคาบเรียน" : "Start Class"}
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold pr-2">{lang === "th" ? "ว่าง" : "Free"}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Checklist */}
        <div className="p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {lang === "th" ? "ภารกิจที่ต้องดำเนินการ" : "Action Checklist"}
            </h3>
            <div className="space-y-4">
              {[
                { title: lang === "th" ? "อนุมัติขอใช้ห้องประชุม ม.6/1" : "Approve Grade 12/1 Room", done: false, desc: lang === "th" ? "คำขอค้างพิจารณา" : "Pending Review" },
                { title: lang === "th" ? "กรอกเกรด ปพ.5 ปลายภาค" : "Submit Grade Reports (SGS)", done: false, desc: lang === "th" ? "ค้างอีก 3 วิชา" : "3 Pending Subjects" },
                { title: lang === "th" ? "เวรเช็คชื่อประจำประตูโรงเรียน" : "Morning Gate Check-in Duty", done: true, desc: lang === "th" ? "เรียบร้อย" : "Completed" },
                { title: lang === "th" ? "ประเมินผลจิตวิทยา SDQ" : "Complete Mental SDQ Evaluation", done: true, desc: lang === "th" ? "เสร็จสิ้น" : "Completed" },
              ].map((task, i) => (
                <div key={i} className="flex gap-3 items-start transition-all duration-300 p-1 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 rounded-lg">
                  <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border mt-0.5 shrink-0 ${
                    task.done ? "bg-emerald-500/10 text-emerald-650 border-emerald-500/25" : "border-slate-200 dark:border-slate-800 text-transparent"
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h4 className={`text-xs font-semibold leading-tight ${task.done ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>{task.title}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">{task.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button 
              onClick={() => onNavigate("Academic", "attendance")}
              className="w-full py-2.5 rounded-lg border border-indigo-200/50 bg-indigo-50/40 hover:bg-indigo-100/50 text-indigo-650 dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-400 dark:hover:bg-indigo-950/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {lang === "th" ? "เช็คชื่อนักเรียน ม.6/1" : "Start Morning Attendance"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Renders for Director Role
  const renderDirectorDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Attendance Chart */}
        <div className="p-5 sm:p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] flex items-center justify-between transition-all duration-300 ease-in-out hover:scale-[1.005]">
          <div>
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">
              {lang === "th" ? "อัตราการเข้าเรียน" : "Daily Attendance Rate"}
            </h3>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mt-2.5">96.8%</p>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-2.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {lang === "th" ? "เพิ่มขึ้น +0.5%" : "+0.5% vs Yesterday"}
            </span>
          </div>
          {/* Animated circular gauge */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" className="stroke-slate-50 dark:stroke-slate-900" strokeWidth="5" fill="transparent" />
              <circle cx="32" cy="32" r="28" className="stroke-indigo-650 dark:stroke-indigo-400" strokeWidth="5" fill="transparent" strokeDasharray="175" strokeDashoffset="5" strokeLinecap="round" />
            </svg>
            <span className="absolute text-[10px] font-bold text-indigo-650 dark:text-indigo-400">96.8%</span>
          </div>
        </div>

        {/* Student at Risk Indicator */}
        <div className="p-5 sm:p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] flex items-center justify-between transition-all duration-300 ease-in-out hover:scale-[1.005]">
          <div>
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">
              {lang === "th" ? "นักเรียนกลุ่มเสี่ยง" : "At-Risk Students"}
            </h3>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-rose-600 mt-2.5">
              {lang === "th" ? `${riskStudents.length} คน` : `${riskStudents.length} Students`}
            </p>
            <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-2.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {lang === "th" ? "ต้องการช่วยเหลือ" : "Requires Support"}
            </span>
          </div>
          <button 
            onClick={() => onNavigate("Analytics", "risk")}
            className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shrink-0"
          >
            <AlertTriangle className="w-5 h-5" />
          </button>
        </div>

        {/* School KPI */}
        <div className="p-5 sm:p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] flex items-center justify-between transition-all duration-300 ease-in-out hover:scale-[1.005]">
          <div>
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">
              {lang === "th" ? "เอกสารค้างพิจารณา" : "Pending Documents"}
            </h3>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-amber-600 mt-2.5">
              {lang === "th" ? `${pendingLeaves.length} เรื่อง` : `${pendingLeaves.length} Cases`}
            </p>
            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-2.5">
              <FileText className="w-3.5 h-3.5" />
              {lang === "th" ? "รอลงนามอนุมัติ" : "Pending Signoff"}
            </span>
          </div>
          <button 
            onClick={() => onNavigate("Operations", "requests")}
            className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shrink-0"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending leave approvals list */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {lang === "th" ? "เอกสารคำขอรอการพิจารณา" : "Pending Request Approval"}
          </h3>
          <div className="space-y-3">
            {pendingLeaves.length > 0 ? (
              pendingLeaves.map((request) => (
                <div key={request.id} className="p-4 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <div>
                    <span className="text-[9px] px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-bold border border-indigo-500/15">{request.leaveType}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">{request.requesterName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{lang === "th" ? `เหตุผล: ${request.reason}` : `Reason: ${request.reason}`}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">{lang === "th" ? `วันที่: ${request.startDate} ถึง ${request.endDate}` : `Dates: ${request.startDate} to ${request.endDate}`}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onApproveRequest(request.id, "APPROVED")}
                      className="bg-indigo-650 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      {lang === "th" ? "อนุมัติ" : "Approve"}
                    </button>
                    <button 
                      onClick={() => onApproveRequest(request.id, "REJECTED")}
                      className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      {lang === "th" ? "ปฏิเสธ" : "Reject"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-xs text-slate-400 dark:text-slate-500 font-medium">
                {lang === "th" ? "ไม่มีเอกสารค้างพิจารณา" : "No pending documents in queue."}
              </div>
            )}
          </div>
        </div>

        {/* Student Risk Quickview */}
        <div className="p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            {lang === "th" ? "นักเรียนกลุ่มเสี่ยงวิกฤต" : "At-Risk Student Alerts"}
          </h3>
          <div className="space-y-3">
            {students.filter(s => s.status !== "ปกติ").slice(0, 3).map((student) => (
              <div 
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-900 hover:border-rose-300 dark:hover:border-rose-900 bg-white dark:bg-card cursor-pointer transition-all duration-300 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{student.fullName}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{lang === "th" ? `ชั้น ${student.classroom} • วินัย: ${student.behaviorPoints}` : `Grade ${student.classroom} • Conduct: ${student.behaviorPoints}`}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                  student.status === "เสี่ยง" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                }`}>
                  {student.status}
                </span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate("Analytics", "risk")}
            className="w-full text-center text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 pt-3 border-t border-slate-100 dark:border-slate-800/80 cursor-pointer"
          >
            <span>{lang === "th" ? "แผนช่วยเหลือทั้งหมด" : "View Assistance Programs"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );

  // Renders for Student / Parent Role
  const renderStudentDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] flex flex-col items-center text-center justify-between min-h-[135px] sm:min-h-[155px] transition-all duration-300 hover:scale-[1.01]">
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20 flex items-center justify-center shrink-0"><Award className="w-4.5 h-4.5 sm:w-5 h-5" /></span>
          <div className="w-full mt-3">
            <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase font-bold leading-tight block truncate">
              {lang === "th" ? "คะแนนความประพฤติ" : "Conduct Points"}
            </span>
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white block mt-1.5">95</span>
            <span className="text-[9px] text-emerald-600 font-bold block mt-1 truncate">
              {lang === "th" ? "พฤติกรรมดีเยี่ยม" : "Excellent Rating"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] flex flex-col items-center text-center justify-between min-h-[135px] sm:min-h-[155px] transition-all duration-300 hover:scale-[1.01]">
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-500/20 flex items-center justify-center shrink-0"><CheckCircle2 className="w-4.5 h-4.5 sm:w-5 h-5" /></span>
          <div className="w-full mt-3">
            <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase font-bold leading-tight block truncate">
              {lang === "th" ? "อัตราการเข้าเรียน" : "Attendance Rate"}
            </span>
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white block mt-1.5">98%</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1 truncate">
              {lang === "th" ? "ขาด 1 • สาย 1 ครั้ง" : "Absent 1 • Late 1"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] flex flex-col items-center text-center justify-between min-h-[135px] sm:min-h-[155px] transition-all duration-300 hover:scale-[1.01]">
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0"><GraduationCap className="w-4.5 h-4.5 sm:w-5 h-5" /></span>
          <div className="w-full mt-3">
            <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase font-bold leading-tight block truncate">
              {lang === "th" ? "เกรดเฉลี่ยปัจจุบัน" : "Current GPA"}
            </span>
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white block mt-1.5">3.85</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1 truncate">
              {lang === "th" ? "ภาคเรียน 1/2569" : "Semester 1/2026"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] flex flex-col items-center text-center justify-between min-h-[135px] sm:min-h-[155px] transition-all duration-300 hover:scale-[1.01]">
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20 flex items-center justify-center shrink-0"><BookOpen className="w-4.5 h-4.5 sm:w-5 h-5" /></span>
          <div className="w-full mt-3">
            <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase font-bold leading-tight block truncate">
              {lang === "th" ? "การบ้านค้างส่ง" : "Pending Homework"}
            </span>
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-rose-600 block mt-1.5">1 งาน</span>
            <span className="text-[9px] text-rose-600 font-bold block mt-1 truncate">
              {lang === "th" ? "ส่งวันพรุ่งนี้" : "Due Tomorrow"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's schedule */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {lang === "th" ? "ตารางเรียนของฉันวันนี้" : "My Timetable Today"}
          </h3>
          <div className="space-y-3">
            {[
              { period: "08:30 - 10:30", subject: lang === "th" ? "ภาษาไทยพื้นฐาน" : "Basic Thai Language", room: lang === "th" ? "ห้องเรียน 312" : "Room 312", teacher: lang === "th" ? "ครูอัญชลี" : "T. Anchalee" },
              { period: "10:30 - 12:30", subject: lang === "th" ? "ฟิสิกส์เพิ่มเติม" : "Advanced Physics", room: lang === "th" ? "ห้องปฏิบัติการฟิสิกส์" : "Physics Laboratory", teacher: lang === "th" ? "ครูวิทยา" : "T. Wittaya" },
              { period: "13:30 - 15:30", subject: lang === "th" ? "พลศึกษา (บาสเกตบอล)" : "Physical Ed", room: lang === "th" ? "โรงยิม" : "Gymnasium", teacher: lang === "th" ? "ครูสมเกียรติ" : "T. Somkiat" },
            ].map((slot, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-card flex justify-between items-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all">
                <div className="flex gap-4 items-center">
                  <span className="text-xs font-semibold bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300">{slot.period}</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{slot.subject}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{slot.teacher} • {slot.room}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Homework list */}
        <div className="p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {lang === "th" ? "การบ้านค้างส่ง" : "My Homework List"}
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-950 bg-rose-50/30 dark:bg-rose-950/10 space-y-1">
              <div className="flex justify-between items-start gap-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {lang === "th" ? "แต่งร้อยกรองภาษาไทย" : "Thai Poetry Writing"}
                </h4>
                <span className="text-[8px] bg-rose-500/15 text-rose-650 dark:bg-rose-950 dark:text-rose-400 px-2 py-0.5 rounded font-bold shrink-0">{lang === "th" ? "ค้างส่ง" : "Overdue"}</span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{lang === "th" ? "กำหนดส่ง: พรุ่งนี้" : "Due: Tomorrow"}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-card space-y-1 opacity-60">
              <div className="flex justify-between items-start gap-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white line-through truncate">
                  {lang === "th" ? "บันทึกแล็บแรงโน้มถ่วง" : "Physics Gravity Lab"}
                </h4>
                <span className="text-[8px] bg-emerald-500/15 text-emerald-650 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded font-bold shrink-0">{lang === "th" ? "ส่งแล้ว" : "Submitted"}</span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{lang === "th" ? "ส่งแล้ว: 18 พ.ค." : "Sent: May 18"}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // Renders for Admin Role
  const renderAdminDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Admin stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] transition-all duration-300 ease-in-out hover:scale-[1.01] hover:border-slate-200 dark:hover:border-slate-700/80 flex flex-col justify-between min-h-[125px] sm:min-h-[145px]">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground font-semibold leading-tight truncate">
              {lang === "th" ? "ผู้ใช้งานทั้งหมด" : "Total Active Users"}
            </span>
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></span>
          </div>
          <div className="mt-3">
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              {lang === "th" ? "1,240 คน" : "1,240 Users"}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-2 truncate">
              {lang === "th" ? "อัตราใช้งาน 99%" : "99% Active Rate"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] transition-all duration-300 ease-in-out hover:scale-[1.01] hover:border-slate-200 dark:hover:border-slate-700/80 flex flex-col justify-between min-h-[125px] sm:min-h-[145px]">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground font-semibold leading-tight truncate">
              {lang === "th" ? "สถานะระบบหลัก" : "Core Server Status"}
            </span>
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-500/20 flex items-center justify-center shrink-0"><Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></span>
          </div>
          <div className="mt-3">
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-emerald-600 leading-none">
              {lang === "th" ? "เสถียร" : "Healthy"}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-2 truncate">
              {lang === "th" ? "เซิร์ฟเวอร์เสร็จสมบูรณ์" : "Supabase Instance Online"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] transition-all duration-300 ease-in-out hover:scale-[1.01] hover:border-slate-200 dark:hover:border-slate-700/80 flex flex-col justify-between min-h-[125px] sm:min-h-[145px]">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground font-semibold leading-tight truncate">
              {lang === "th" ? "ตารางฐานข้อมูล" : "Database Tables"}
            </span>
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0"><FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></span>
          </div>
          <div className="mt-3">
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 leading-none">
              {lang === "th" ? "42 ตาราง" : "42 Tables"}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-2 truncate">
              {lang === "th" ? "ซิงค์โมเดลสำเร็จ" : "Synced via Prisma"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] transition-all duration-300 ease-in-out hover:scale-[1.01] hover:border-slate-200 dark:hover:border-slate-700/80 flex flex-col justify-between min-h-[125px] sm:min-h-[145px]">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground font-semibold leading-tight truncate">
              {lang === "th" ? "กฎการทํางาน" : "Rule Engines"}
            </span>
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20 flex items-center justify-center shrink-0"><BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></span>
          </div>
          <div className="mt-3">
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-amber-600 leading-none">
              {lang === "th" ? "5 กฎ" : "5 Rules"}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-2 truncate">
              {lang === "th" ? "ระบบตอบสนองอัตโนมัติ" : "Event rules active"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System setup status */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {lang === "th" ? "ระบบจัดการคอร์หลัก" : "Core Platform System Engines"}
          </h3>
          <div className="space-y-3">
            {[
              { name: "Workflow Engine", desc: lang === "th" ? "ระบบจัดการขั้นตอนการอนุมัติคำขอเรียนและใบลา" : "Leave approvals and classroom workflows", status: "Active" },
              { name: "Notification Engine", desc: lang === "th" ? "ส่งข้อความอัตโนมัติถึงแอปพลิเคชันและไลน์ผู้ปกครอง" : "Integrated system and LINE push notification services", status: "Active" },
              { name: "Audit Log System", desc: lang === "th" ? "ระบบจัดเก็บข้อมูลความปลอดภัยและการแก้ไขฐานข้อมูล" : "System security audit and transaction records", status: "Active" },
              { name: "Timeline Engine", desc: lang === "th" ? "ดึงสถิติบันทึกความประพฤติและจิตวิทยาของนักเรียน" : "Aggregated student conduct and counseling tracker", status: "Active" },
              { name: "File Storage Manager", desc: lang === "th" ? "จัดเก็บเอกสารและไฟล์รายงานอย่างปลอดภัยบน Supabase" : "Secure report attachments on Supabase bucket", status: "Active" },
            ].map((engine, i) => (
              <div key={i} className="flex justify-between items-center p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-white dark:bg-card">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{engine.name}</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{engine.desc}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/15 shrink-0 ml-2">
                  {engine.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Setup parameters */}
        <div className="p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {lang === "th" ? "ข้อมูลภาคการเรียน" : "Semester Configuration"}
          </h3>
          <div className="space-y-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="p-4 rounded-xl border border-slate-50 dark:border-slate-900 bg-white dark:bg-card space-y-3">
              <div className="flex justify-between">
                <span>{lang === "th" ? "ปีการศึกษา:" : "Academic Year:"}</span>
                <span className="font-bold text-slate-900 dark:text-white">2569</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === "th" ? "ภาคเรียนที่:" : "Semester:"}</span>
                <span className="font-bold text-slate-900 dark:text-white">1</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === "th" ? "วันเปิดเรียน:" : "Opening Date:"}</span>
                <span className="font-bold text-slate-900 dark:text-white">16 พ.ค. 2569</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === "th" ? "วันปิดเรียน:" : "Closing Date:"}</span>
                <span className="font-bold text-slate-900 dark:text-white">10 ต.ค. 2569</span>
              </div>
            </div>
            <button 
              onClick={() => onNavigate("Admin", "setup")}
              className="w-full text-center text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline mt-2 cursor-pointer"
            >
              {lang === "th" ? "ตั้งค่าภาคเรียนระบบหลัก" : "Configure Terms & Classes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Switch role-renders
  switch (role) {
    case "teacher":
      return renderTeacherDashboard();
    case "director":
      return renderDirectorDashboard();
    case "student":
      return renderStudentDashboard();
    case "admin":
      return renderAdminDashboard();
    default:
      return renderTeacherDashboard();
  }
}
