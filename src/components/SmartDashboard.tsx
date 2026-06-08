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
  userName?: string | null;
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
  userName,
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
      {/* Overview stats - Combined Split Hero Banner Card matching mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Combined Split Hero Card (span 2 cols) - Predictive UX */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-[0_2px_16px_rgba(0,0,0,0.015)] flex flex-col sm:flex-row justify-between items-stretch gap-6 transition-all duration-300 hover:border-slate-200/80 dark:hover:border-slate-800 relative overflow-hidden">
          {/* Subtle background glow for predictive importance */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Left section: Current Period */}
          <div className="flex-1 flex flex-col justify-between min-h-[110px] relative z-10">
            <span className="text-[11px] sm:text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {lang === "th" ? "คาบสอนปัจจุบัน" : "Current Period"}
            </span>
            <div className="mt-auto pt-4">
              <p className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">คาบที่ 1</p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1 mt-3">
                <Clock className="w-3.5 h-3.5" />
                {lang === "th" ? "08:30 - 09:30 น." : "08:30 - 09:30 AM"}
              </span>
            </div>
          </div>

          {/* Vertical Divider Hairline */}
          <div className="hidden sm:block w-px bg-slate-100 dark:bg-slate-900 relative z-10" />

          {/* Right section: Detail metrics & Action */}
          <div className="flex-1 flex flex-col justify-between min-h-[110px] relative z-10">
            <span className="text-[11px] sm:text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block mb-2">
              {lang === "th" ? "วิชา และ ห้องเรียน" : "Subject & Classroom"}
            </span>
            <div className="mt-auto space-y-3">
              <div>
                <p className="text-sm font-extrabold text-[#2d2d2d] dark:text-amber-400 leading-tight">
                  {lang === "th" ? "ภาษาไทยพื้นฐาน ม.6/1" : "Basic Thai Grade 12/1"}
                </p>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold block mt-1 leading-relaxed">
                  {lang === "th" ? "อาคาร 3 ห้อง 301" : "Building 3 Room 301"}
                </span>
              </div>
              <button 
                onClick={() => onNavigate("Academic", "attendance")}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-premium hover:shadow-[0_8px_30px_rgba(245,197,66,0.3)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {lang === "th" ? "ไปหน้าเช็คชื่อนักเรียน" : "Go to Attendance"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Stats Card 1: Absent Students */}
        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-[0_2px_16px_rgba(0,0,0,0.015)] flex flex-col justify-between min-h-[145px] transition-all duration-300 hover:border-slate-200/80 dark:hover:border-slate-800">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground font-bold uppercase tracking-wider">
              {lang === "th" ? "นักเรียนขาดเรียน" : "Absent Students"}
            </span>
            <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/25"><ShieldAlert className="w-3.5 h-3.5" /></span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-rose-600 leading-none">
              {lang === "th" ? `${absentToday} คน` : `${absentToday} Students`}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-2.5 truncate">
              {lang === "th" ? `มาเรียนสาย ${lateToday} คน / ทั้งหมด ${totalStudentsCount} คน` : `Late ${lateToday} / Total ${totalStudentsCount} Students`}
            </span>
          </div>
        </div>

        {/* Right Stats Card 2: Golden action pill shortcut */}
        <div 
          onClick={() => onNavigate("Academic", "attendance")}
          className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 text-amber-900 dark:text-amber-450 flex flex-col justify-between min-h-[145px] transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-sm"
        >
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-400 font-extrabold uppercase tracking-wider">
              {lang === "th" ? "ห้องเรียนอัจฉริยะ >" : "Smart Classroom >"}
            </span>
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0"><Sparkles className="w-3.5 h-3.5" /></span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold leading-relaxed text-amber-800 dark:text-amber-400">
              {lang === "th" ? "18 รายการส่งงานค้างส่งและรอเช็คชื่อนักเรียนประจำวัน" : "18 Homework tasks pending review and roll-call"}
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timetable slots */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
                  ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/40 shadow-sm" 
                  : "bg-white dark:bg-card border-slate-100 dark:border-slate-800/60"
              }`}>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg ${
                    slot.status === "done" 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500" 
                      : slot.status === "next" 
                      ? "bg-[#2d2d2d] text-white shadow-sm" 
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
                    className="text-[11px] font-bold bg-[#2d2d2d] hover:bg-[#3a3a3a] text-white px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
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
              <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
                  {task.done ? (
                    <span className="w-4.5 h-4.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center mt-0.5 shrink-0 cursor-pointer shadow-sm transition-all border border-slate-900 dark:border-white">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                    </span>
                  ) : (
                    <span className="w-4.5 h-4.5 rounded-full border border-slate-350 dark:border-slate-700 bg-transparent flex items-center justify-center mt-0.5 shrink-0 cursor-pointer hover:border-slate-500 transition-all" />
                  )}
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
              className="w-full py-2.5 rounded-lg border border-amber-200/50 bg-amber-50/40 hover:bg-amber-100/50 text-[#2d2d2d] dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
      {/* Top Banner stats - Combined Split Hero Banner Card matching mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Combined Split Hero Card (span 2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-[0_2px_16px_rgba(0,0,0,0.015)] flex flex-col sm:flex-row justify-between items-stretch gap-6 transition-all duration-300 hover:border-slate-200/80 dark:hover:border-slate-800">
          {/* Left section: Huge statistic */}
          <div className="flex-1 flex flex-col justify-between min-h-[110px]">
            <span className="text-[11px] sm:text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
              {lang === "th" ? "อัตราเข้าเรียนวันนี้" : "Attendance Rate Today"}
            </span>
            <div className="mt-auto flex items-baseline gap-2">
              <p className="text-5xl font-black tracking-tight text-[#2d2d2d] dark:text-amber-400 leading-none">96.8%</p>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +0.5%
              </span>
            </div>
          </div>

          {/* Vertical Divider Hairline */}
          <div className="hidden sm:block w-px bg-slate-100 dark:bg-slate-900" />

          {/* Right section: Detail metrics */}
          <div className="flex-1 flex flex-col justify-between min-h-[110px]">
            <span className="text-[11px] sm:text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
              {lang === "th" ? "การประเมินและบริหาร" : "Executive Evaluation"}
            </span>
            <div className="mt-auto">
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                {lang === "th" ? "ระบบตรวจสุขภาพจิตนักเรียน" : "Student Mental SDQ Panel"}
              </p>
              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold block mt-2">
                {lang === "th" ? "การคัดกรองช่วยเหลือเสร็จ 92%" : "92% screening forms completed"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Stats Card 1: Risk Students */}
        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-[0_2px_16px_rgba(0,0,0,0.015)] flex flex-col justify-between min-h-[145px] transition-all duration-300 hover:border-slate-200/80 dark:hover:border-slate-800">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground font-bold uppercase tracking-wider">
              {lang === "th" ? "นักเรียนกลุ่มเสี่ยง" : "At-Risk Students"}
            </span>
            <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/25"><AlertTriangle className="w-3.5 h-3.5" /></span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-rose-600 leading-none">
              {lang === "th" ? `${riskStudents.length} คน` : `${riskStudents.length} Students`}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-2.5 truncate">
              {lang === "th" ? "ระดับวิกฤต ต้องการช่วยเหลือด่วน" : "Requires urgent counseling support"}
            </span>
          </div>
        </div>

        {/* Right Stats Card 2: Golden action pill shortcut */}
        <div 
          onClick={() => onNavigate("Operations", "requests")}
          className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 text-amber-900 dark:text-amber-450 flex flex-col justify-between min-h-[145px] transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-sm"
        >
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-400 font-extrabold uppercase tracking-wider">
              {lang === "th" ? "ห้องทำงานผู้บริหาร >" : "Executive Desk >"}
            </span>
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0"><FileText className="w-3.5 h-3.5" /></span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold leading-relaxed text-amber-800 dark:text-amber-400">
              {lang === "th" ? `${pendingLeaves.length} เรื่องเอกสารคำขอลาและใบเสนออนุมัติค้างลงนามดิจิทัล` : `${pendingLeaves.length} leave requests and budget approvals waiting signatures`}
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending leave approvals list */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            {lang === "th" ? "เอกสารคำขอรอการพิจารณา" : "Pending Request Approval"}
          </h3>
          <div className="space-y-3">
            {pendingLeaves.length > 0 ? (
              pendingLeaves.map((request) => (
                <div key={request.id} className="p-4 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <div>
                    <span className="text-[9px] px-2.5 py-0.5 rounded-md bg-amber-500/10 text-[#2d2d2d] dark:text-amber-400 font-bold border border-amber-500/15">{request.leaveType}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">{request.requesterName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{lang === "th" ? `เหตุผล: ${request.reason}` : `Reason: ${request.reason}`}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">{lang === "th" ? `วันที่: ${request.startDate} ถึง ${request.endDate}` : `Dates: ${request.startDate} to ${request.endDate}`}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onApproveRequest(request.id, "APPROVED")}
                      className="bg-[#2d2d2d] hover:bg-[#3a3a3a] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
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
            className="w-full text-center text-xs font-bold text-[#2d2d2d] dark:text-amber-400 hover:underline flex items-center justify-center gap-1 pt-3 border-t border-slate-100 dark:border-slate-800/80 cursor-pointer"
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
      {/* Stats Cards - Combined Split Hero Banner Card matching mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Combined Split Hero Card (span 2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-[0_2px_16px_rgba(0,0,0,0.015)] flex flex-col sm:flex-row justify-between items-stretch gap-6 transition-all duration-300 hover:border-slate-200/80 dark:hover:border-slate-800">
          {/* Left section: Huge statistic */}
          <div className="flex-1 flex flex-col justify-between min-h-[110px]">
            <span className="text-[11px] sm:text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
              {lang === "th" ? "คะแนนความประพฤติ" : "Conduct Points"}
            </span>
            <div className="mt-auto">
              <p className="text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">95</p>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-3">
                {lang === "th" ? "ระดับดีเยี่ยม" : "Excellent Rating"}
              </span>
            </div>
          </div>

          {/* Vertical Divider Hairline */}
          <div className="hidden sm:block w-px bg-slate-100 dark:bg-slate-900" />

          {/* Right section: Detail metrics */}
          <div className="flex-1 flex flex-col justify-between min-h-[110px]">
            <span className="text-[11px] sm:text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
              {lang === "th" ? "ชั้นเรียนของข้าพเจ้า" : "Active School Room"}
            </span>
            <div className="mt-auto">
              <p className="text-sm font-extrabold text-[#2d2d2d] dark:text-amber-400 leading-tight">
                {lang === "th" ? "ระดับชั้น มัธยมศึกษาปีที่ 6/1" : "Grade 12 / Room 1"}
              </p>
              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold block mt-2">
                {lang === "th" ? "อาจารย์ประจำชั้น: ครูวรรณภา" : "Homeroom Teacher: Mrs. Wannapha"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Stats Card 1: Pending Homework */}
        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-[0_2px_16px_rgba(0,0,0,0.015)] flex flex-col justify-between min-h-[145px] transition-all duration-300 hover:border-slate-200/80 dark:hover:border-slate-800">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground font-bold uppercase tracking-wider">
              {lang === "th" ? "การบ้านค้างส่ง" : "Pending Homework"}
            </span>
            <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-450 flex items-center justify-center shrink-0 border border-rose-500/25"><BookOpen className="w-3.5 h-3.5" /></span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-rose-600 leading-none">
              {lang === "th" ? "1 งาน" : "1 Task"}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-2.5 truncate">
              {lang === "th" ? "ภาษาไทยพื้นฐาน ส่งในวันพรุ่งนี้" : "Basic Thai Literature due tomorrow"}
            </span>
          </div>
        </div>

        {/* Right Stats Card 2: Golden action pill shortcut */}
        <div 
          onClick={() => onNavigate("Home", "dashboard")}
          className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 text-amber-900 dark:text-amber-450 flex flex-col justify-between min-h-[145px] transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-sm"
        >
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-400 font-extrabold uppercase tracking-wider">
              {lang === "th" ? "ห้องเรียนของฉัน >" : "My Classroom >"}
            </span>
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0"><Award className="w-3.5 h-3.5" /></span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold leading-relaxed text-amber-800 dark:text-amber-400">
              {lang === "th" ? "เกรดเฉลี่ยสะสมเรียนดีเด่น 3.85 และรายละเอียดวิชาการตารางเรียนทั้งหมด" : "Honor roll average GPA 3.85 and full subject timetable overview"}
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's schedule */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
            <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
      {/* Admin stats - Combined Split Hero Banner Card matching mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Combined Split Hero Card (span 2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-[0_2px_16px_rgba(0,0,0,0.015)] flex flex-col sm:flex-row justify-between items-stretch gap-6 transition-all duration-300 hover:border-slate-200/80 dark:hover:border-slate-800">
          {/* Left section: Huge statistic */}
          <div className="flex-1 flex flex-col justify-between min-h-[110px]">
            <span className="text-[11px] sm:text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
              {`${lang === "th" ? "ผู้ใช้งานทั้งหมดในระบบ" : "Total Registered Users"}`}
            </span>
            <div className="mt-auto">
              <p className="text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">1,240 คน</p>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-3">
                {`${lang === "th" ? "ใช้งานจริง (Active) 99%" : "99% Active Engagement"}`}
              </span>
            </div>
          </div>

          {/* Vertical Divider Hairline */}
          <div className="hidden sm:block w-px bg-slate-100 dark:bg-slate-900" />

          {/* Right section: Detail metrics */}
          <div className="flex-1 flex flex-col justify-between min-h-[110px]">
            <span className="text-[11px] sm:text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
              {`${lang === "th" ? "โครงสร้างตารางฐานข้อมูล" : "Database Models Overview"}`}
            </span>
            <div className="mt-auto">
              <p className="text-sm font-extrabold text-[#2d2d2d] dark:text-amber-400 leading-tight">
                {`${lang === "th" ? "ระบบเชื่อมโยงหลัก: 42 ตาราง" : "Core Engines: 42 Models Connected"}`}
              </p>
              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold block mt-2">
                {`${lang === "th" ? "ซิงค์โมเดลผ่าน Prisma CLI สำเร็จ" : "Schema synced via Prisma Client CLI"}`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Stats Card 1: Core Server Status */}
        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-[0_2px_16px_rgba(0,0,0,0.015)] flex flex-col justify-between min-h-[145px] transition-all duration-300 hover:border-slate-200/80 dark:hover:border-slate-800">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground font-bold uppercase tracking-wider">
              {`${lang === "th" ? "สถานะเซิร์ฟเวอร์หลัก" : "Core Server Status"}`}
            </span>
            <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 flex items-center justify-center shrink-0 border border-emerald-500/25"><Database className="w-3.5 h-3.5" /></span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-emerald-650 leading-none">
              {`${lang === "th" ? "เสถียร" : "Healthy"}`}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-2.5 truncate">
              {`${lang === "th" ? "เซิร์ฟเวอร์สำเร็จ Supabase Cloud" : "Uptime 99.98% Cloud Instance"}`}
            </span>
          </div>
        </div>

        {/* Right Stats Card 2: Golden action pill shortcut */}
        <div 
          onClick={() => onNavigate("Admin", "rules")}
          className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 text-amber-900 dark:text-amber-450 flex flex-col justify-between min-h-[145px] transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-sm"
        >
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-400 font-extrabold uppercase tracking-wider">
              {`${lang === "th" ? "ควบคุมแผงระบบ >" : "System Control >"}`}
            </span>
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0"><Sparkles className="w-3.5 h-3.5" /></span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold leading-relaxed text-amber-800 dark:text-amber-400">
              {`${lang === "th" ? "5 กฎการตอบสนองระบบอัตโนมัติ และสถิติความปลอดภัยระบบหลัก" : "5 automated trigger rules and full core system logs"}`}
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System setup status */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
              className="w-full text-center text-xs font-bold text-[#2d2d2d] dark:text-amber-400 hover:underline mt-2 cursor-pointer"
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
