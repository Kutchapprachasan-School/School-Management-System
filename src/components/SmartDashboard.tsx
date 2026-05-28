"use client";

import React from "react";
import { 
  Calendar, Clock, CheckCircle2, ShieldAlert, Award, FileText, 
  Users, TrendingUp, AlertTriangle, CheckSquare, Sparkles, BookOpen, 
  ChevronRight, HeartPulse, Bell, Activity, BellRing, Database, GraduationCap
} from "lucide-react";
import { Student, LeaveRequest, UserRole } from "@/types/school-os";

interface SmartDashboardProps {
  role: UserRole;
  students: Student[];
  leaveRequests: LeaveRequest[];
  onNavigate: (menu: string, tab?: string) => void;
  onSelectStudent: (student: Student) => void;
  onApproveRequest: (id: string, decision: "APPROVED" | "REJECTED") => void;
  notificationsCount: number;
}

export default function SmartDashboard({
  role,
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl glass-card transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 dark:text-muted-foreground font-semibold">คาบสอนวันนี้</span>
            <span className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><BookOpen className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-light tracking-tight text-slate-900 dark:text-white mt-3">4 คาบ</p>
          <span className="text-[10px] text-slate-400 dark:text-muted-foreground block mt-1">ชั้น ม.6/1 (วิชาภาษาไทย)</span>
        </div>

        <div className="p-5 rounded-xl glass-card transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 dark:text-muted-foreground font-semibold">นักเรียนขาดเรียน</span>
            <span className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center"><ShieldAlert className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-light tracking-tight text-rose-600 mt-3">{absentToday} คน</p>
          <span className="text-[10px] text-slate-400 dark:text-muted-foreground block mt-1">จากทั้งหมด {totalStudentsCount} คน</span>
        </div>

        <div className="p-5 rounded-xl glass-card transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 dark:text-muted-foreground font-semibold">นักเรียนมาสาย</span>
            <span className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center"><Clock className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-light tracking-tight text-amber-600 mt-3">{lateToday} คน</p>
          <span className="text-[10px] text-slate-400 dark:text-muted-foreground block mt-1">ควรติดตามระเบียบแถว</span>
        </div>

        <div className="p-5 rounded-xl glass-card transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 dark:text-muted-foreground font-semibold">เคสห้องพยาบาล</span>
            <span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><HeartPulse className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-light tracking-tight text-emerald-600 mt-3">2 เคส</p>
          <span className="text-[10px] text-slate-400 dark:text-muted-foreground block mt-1">มีการจ่ายยาพาราเซตามอล</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timetable slots */}
        <div className="lg:col-span-2 p-6 rounded-xl glass-card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ตารางสอนประจำวันนี้ (ม.6/1)
          </h3>
          <div className="space-y-3">
            {[
              { period: "คาบ 1", time: "08:30 - 09:30", subject: "ภาษาไทยพื้นฐาน (ท33101)", status: "done" },
              { period: "คาบ 2", time: "09:30 - 10:30", subject: "ภาษาไทยพื้นฐาน (ท33101)", status: "done" },
              { period: "คาบ 3", time: "10:30 - 11:30", subject: "คาบว่าง (เตรียมการสอน)", status: "free" },
              { period: "คาบ 4", time: "11:30 - 12:30", subject: "คาบว่าง (พักกลางวัน)", status: "free" },
              { period: "คาบ 5", time: "12:30 - 13:30", subject: "ภาษาไทยเพิ่มเติม (ท33201)", status: "next" },
              { period: "คาบ 6", time: "13:30 - 14:30", subject: "กิจกรรมลดเวลาเรียนเพิ่มเวลารู้", status: "next" },
            ].map((slot, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                slot.status === "done" 
                  ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 opacity-60" 
                  : slot.status === "next" 
                  ? "bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/50 shadow-sm" 
                  : "bg-white dark:bg-card border-border/40"
              }`}>
                <div className="flex items-center gap-4">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                    slot.status === "done" 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500" 
                      : slot.status === "next" 
                      ? "bg-indigo-600 text-white" 
                      : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  }`}>{slot.period}</span>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug">{slot.subject}</h4>
                    <p className="text-[11px] text-slate-400 dark:text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {slot.time}</p>
                  </div>
                </div>
                {slot.status === "done" ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> บันทึกหลังสอนแล้ว
                  </span>
                ) : slot.status === "next" ? (
                  <button 
                    onClick={() => onNavigate("Academic", "teaching")}
                    className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    เริ่มสอน / เช็คชื่อ
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-muted-foreground font-medium">ชั่วโมงอิสระ</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Checklist */}
        <div className="p-6 rounded-xl glass-card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            สิ่งที่ต้องทำในระบบ (Tasks Checklist)
          </h3>
          <div className="space-y-4">
            {[
              { title: "อนุมัติขอใช้ห้องประชุม ม.6/1", done: false, desc: "รอการพิจารณาอนุมัติ" },
              { title: "กรอกเกรด ปพ.5 ภาคเรียนที่ 1/2569", done: false, desc: "ค้างกรอก 3 รายวิชา" },
              { title: "เช็คชื่อเวรวันจันทร์ที่ประตูหน้าโรงเรียน", done: true, desc: "เสร็จสิ้นสมบูรณ์" },
              { title: "ประเมิน SDQ นักเรียน ม.6/1 ครบถ้วน", done: true, desc: "เสร็จสิ้นสมบูรณ์" },
            ].map((task, i) => (
              <div key={i} className="flex gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border mt-0.5 shrink-0 ${
                  task.done ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200/50" : "border-slate-200 dark:border-slate-800 text-transparent"
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className={`text-sm font-medium leading-tight ${task.done ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>{task.title}</h4>
                  <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-1">{task.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border/40">
            <button 
              onClick={() => onNavigate("Academic", "attendance")}
              className="w-full py-2.5 rounded-lg border border-indigo-200/50 bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-600 dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-400 dark:hover:bg-indigo-950/40 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              เช็คชื่อแถวเช้าวันนี้เลย
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Renders for Director Role
  const renderDirectorDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Attendance Chart mock */}
        <div className="p-6 rounded-xl glass-card flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">อัตราเข้าเรียนวันนี้</h3>
            <p className="text-3xl font-light tracking-tight text-slate-900 dark:text-white mt-3">96.8%</p>
            <span className="text-[10px] text-slate-500 dark:text-muted-foreground flex items-center gap-1 mt-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ดีกว่าเมื่อวาน +0.5%
            </span>
          </div>
          {/* Animated circular gauge SVG */}
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="5" fill="transparent" />
              <circle cx="32" cy="32" r="28" className="stroke-indigo-600 dark:stroke-indigo-400" strokeWidth="5" fill="transparent" strokeDasharray="175" strokeDashoffset="5" strokeLinecap="round" />
            </svg>
            <span className="absolute text-[10px] font-bold text-indigo-600 dark:text-indigo-400">96.8%</span>
          </div>
        </div>

        {/* Student at Risk Indicator */}
        <div className="p-6 rounded-xl glass-card flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">นักเรียนเสี่ยงวิกฤต</h3>
            <p className="text-3xl font-light tracking-tight text-rose-600 mt-3">{riskStudents.length} คน</p>
            <span className="text-[10px] text-slate-500 dark:text-muted-foreground flex items-center gap-1 mt-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              ต้องการแผนช่วยเหลือด่วน
            </span>
          </div>
          <button 
            onClick={() => onNavigate("Analytics", "risk")}
            className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
          >
            <AlertTriangle className="w-5 h-5" />
          </button>
        </div>

        {/* School KPI */}
        <div className="p-6 rounded-xl glass-card flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">เอกสารค้างพิจารณา</h3>
            <p className="text-3xl font-light tracking-tight text-amber-600 mt-3">{pendingLeaves.length} เรื่อง</p>
            <span className="text-[10px] text-slate-500 dark:text-muted-foreground flex items-center gap-1 mt-2">
              ใบลาครู / ขอใช้ห้อง / ขอใช้รถ
            </span>
          </div>
          <button 
            onClick={() => onNavigate("Operations", "requests")}
            className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending leave approvals list */}
        <div className="lg:col-span-2 p-6 rounded-xl glass-card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            เอกสารรอการอนุมัติ (Workflow Engine)
          </h3>
          <div className="space-y-3">
            {pendingLeaves.length > 0 ? (
              pendingLeaves.map((request) => (
                <div key={request.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:shadow-sm transition-all">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">{request.leaveType}</span>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white mt-1.5">{request.requesterName}</h4>
                    <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">เหตุผล: {request.reason}</p>
                    <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-1">วันที่ขอหยุด: {request.startDate} ถึง {request.endDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onApproveRequest(request.id, "APPROVED")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      อนุมัติ
                    </button>
                    <button 
                      onClick={() => onApproveRequest(request.id, "REJECTED")}
                      className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      ปฏิเสธ
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-400 dark:text-muted-foreground">
                ไม่มีเอกสารหรือคำขอใบลาค้างอนุมัติในระบบ
              </div>
            )}
          </div>
        </div>

        {/* Student Risk Quickview */}
        <div className="p-6 rounded-xl glass-card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            นักเรียนเสี่ยงวิกฤต (AI Student Risk)
          </h3>
          <div className="space-y-3">
            {students.filter(s => s.status !== "ปกติ").slice(0, 3).map((student) => (
              <div 
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-900 hover:border-rose-300 dark:hover:border-rose-900 bg-white dark:bg-card cursor-pointer transition-all flex justify-between items-center"
              >
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{student.fullName}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-muted-foreground">ชั้น {student.classroom} • คะแนนวินัย: {student.behaviorPoints}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                  student.status === "เสี่ยง" ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600" : "bg-rose-50 dark:bg-rose-950/20 text-rose-600"
                }`}>
                  {student.status}
                </span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate("Analytics", "risk")}
            className="w-full text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 pt-2 cursor-pointer"
          >
            <span>ดูข้อมูลและแผนช่วยเหลือทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );

  // Renders for Student / Parent Role
  const renderStudentDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl glass-card flex flex-col items-center text-center">
          <span className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center"><Award className="w-5 h-5" /></span>
          <span className="text-[10px] text-slate-400 dark:text-muted-foreground uppercase font-semibold mt-3">คะแนนวินัยสะสม</span>
          <span className="text-3xl font-light tracking-tight text-slate-900 dark:text-white mt-1">95</span>
          <span className="text-[9px] text-emerald-600 font-semibold mt-1">พฤติกรรมดีเยี่ยม</span>
        </div>

        <div className="p-5 rounded-xl glass-card flex flex-col items-center text-center">
          <span className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></span>
          <span className="text-[10px] text-slate-400 dark:text-muted-foreground uppercase font-semibold mt-3">อัตราการมาเรียน</span>
          <span className="text-3xl font-light tracking-tight text-slate-900 dark:text-white mt-1">98%</span>
          <span className="text-[9px] text-slate-450 dark:text-muted-foreground mt-1">ขาด 1 ครั้ง • สาย 1 ครั้ง</span>
        </div>

        <div className="p-5 rounded-xl glass-card flex flex-col items-center text-center">
          <span className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><GraduationCap className="w-5 h-5" /></span>
          <span className="text-[10px] text-slate-400 dark:text-muted-foreground uppercase font-semibold mt-3">เกรดเฉลี่ย GPA</span>
          <span className="text-3xl font-light tracking-tight text-slate-900 dark:text-white mt-1">3.85</span>
          <span className="text-[9px] text-slate-450 dark:text-muted-foreground mt-1">ภาคเรียนที่ 1/2569</span>
        </div>

        <div className="p-5 rounded-xl glass-card flex flex-col items-center text-center">
          <span className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center"><BookOpen className="w-5 h-5" /></span>
          <span className="text-[10px] text-slate-400 dark:text-muted-foreground uppercase font-semibold mt-3">การบ้านค้างส่ง</span>
          <span className="text-3xl font-light tracking-tight text-rose-600 mt-1">1 งาน</span>
          <span className="text-[9px] text-rose-500 font-semibold mt-1">กำหนดส่งพรุ่งนี้</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's schedule */}
        <div className="lg:col-span-2 p-6 rounded-xl glass-card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ตารางเรียนของฉันวันนี้ (ม.6/1)
          </h3>
          <div className="space-y-3">
            {[
              { period: "08:30 - 10:30", subject: "วิชาภาษาไทยพื้นฐาน", room: "ห้องเรียน 312", teacher: "ครูอัญชลี" },
              { period: "10:30 - 12:30", subject: "วิชาฟิสิกส์เพิ่มเติม", room: "ห้องปฏิบัติการฟิสิกส์", teacher: "ครูวิทยา" },
              { period: "13:30 - 15:30", subject: "วิชาพลศึกษา (บาสเกตบอล)", room: "โรงยิมพลศึกษา", teacher: "ครูสมเกียรติ" },
            ].map((slot, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-card flex justify-between items-center hover:shadow-sm transition-all">
                <div className="flex gap-4 items-center">
                  <span className="text-xs font-semibold bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300">{slot.period}</span>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug">{slot.subject}</h4>
                    <p className="text-xs text-slate-400 dark:text-muted-foreground mt-0.5">อาจารย์ผู้สอน: {slot.teacher} • สถานที่: {slot.room}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Homework list */}
        <div className="p-6 rounded-xl glass-card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            การบ้าน / ภารกิจของฉัน
          </h3>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-950 bg-rose-50/30 dark:bg-rose-950/10 space-y-1">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-xs text-slate-900 dark:text-white">แต่งคำประพันธ์ร้อยกรอง (วิชาภาษาไทย)</h4>
                <span className="text-[8px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-450 px-2 py-0.5 rounded font-bold">ค้างส่ง</span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-1">กำหนดส่ง: 21 พ.ค. 2569 (พรุ่งนี้)</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-card space-y-1 opacity-60">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-xs text-slate-900 dark:text-white line-through">บันทึกผลการทดลองแรงโน้มถ่วง (วิชาฟิสิกส์)</h4>
                <span className="text-[8px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">ส่งแล้ว</span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-1">ส่งเมื่อ: 18 พ.ค. 2569</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // Renders for Admin Role
  const renderAdminDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Admin stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl glass-card hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 dark:text-muted-foreground font-semibold">ผู้ใช้งานทั้งหมด</span>
            <span className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><Users className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-light tracking-tight text-slate-900 dark:text-white mt-3">1,240 คน</p>
          <span className="text-[10px] text-slate-400 dark:text-muted-foreground block mt-1">ใช้งานจริง (Active) 99%</span>
        </div>

        <div className="p-5 rounded-xl glass-card hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 dark:text-muted-foreground font-semibold">สถานะระบบหลัก</span>
            <span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Database className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-light tracking-tight text-emerald-600 mt-3">เสถียร</p>
          <span className="text-[10px] text-slate-400 dark:text-muted-foreground block mt-1">Uptime 99.98% (Supabase)</span>
        </div>

        <div className="p-5 rounded-xl glass-card hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 dark:text-muted-foreground font-semibold">ตารางฐานข้อมูล</span>
            <span className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><FileText className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-light tracking-tight text-indigo-600 dark:text-indigo-400 mt-3">42 ตาราง</p>
          <span className="text-[10px] text-slate-400 dark:text-muted-foreground block mt-1">ซิงค์โมเดลผ่าน Prisma CLI</span>
        </div>

        <div className="p-5 rounded-xl glass-card hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 dark:text-muted-foreground font-semibold">กติกาอัตโนมัติ</span>
            <span className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center"><BellRing className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-light tracking-tight text-amber-600 mt-3">5 กฎ</p>
          <span className="text-[10px] text-slate-400 dark:text-muted-foreground block mt-1">ผ่าน Rule Engine API Node</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System setup status */}
        <div className="lg:col-span-2 p-6 rounded-xl glass-card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            โครงสร้าง Core Systems (Hidden Core Database Status)
          </h3>
          <div className="space-y-3">
            {[
              { name: "Workflow Engine", desc: "ใช้จัดการลำดับขั้นใบลา/ขอใช้ห้อง/ขอใช้รถของโรงเรียน", status: "Active" },
              { name: "Notification Engine", desc: "ส่งออกแอปพลิเคชัน & ไลน์ API เชื่อมต่อผู้ปกครอง", status: "Active" },
              { name: "Audit Log System", desc: "เก็บประวัติความปลอดภัยและการกระทำทุกอย่างในระบบ", status: "Active" },
              { name: "Timeline Engine", desc: "ดึงข้อมูลบันทึกความประพฤติและสุขภาพจิตของนักเรียน", status: "Active" },
              { name: "File Storage Manager", desc: "จัดเก็บหนังสือราชการ (ปพ.5) ปลอดภัยบน Supabase Storage", status: "Active" },
            ].map((engine, i) => (
              <div key={i} className="flex justify-between items-center p-3.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-card">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug">{engine.name}</h4>
                  <p className="text-xs text-slate-400 dark:text-muted-foreground mt-0.5">{engine.desc}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 text-[10px] font-bold border border-emerald-200/30">
                  {engine.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Setup parameters */}
        <div className="p-6 rounded-xl glass-card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ปีการศึกษาปัจจุบัน
          </h3>
          <div className="space-y-4 text-xs text-slate-500 dark:text-muted-foreground">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-card space-y-2.5">
              <div className="flex justify-between">
                <span>ปีการศึกษา:</span>
                <span className="font-semibold text-slate-900 dark:text-white">2569</span>
              </div>
              <div className="flex justify-between">
                <span>ภาคเรียนที่:</span>
                <span className="font-semibold text-slate-900 dark:text-white">1</span>
              </div>
              <div className="flex justify-between">
                <span>เปิดเรียน:</span>
                <span className="font-semibold text-slate-900 dark:text-white">16 พ.ค. 2569</span>
              </div>
              <div className="flex justify-between">
                <span>ปิดเรียน:</span>
                <span className="font-semibold text-slate-900 dark:text-white">10 ต.ค. 2569</span>
              </div>
            </div>
            <button 
              onClick={() => onNavigate("Admin", "setup")}
              className="w-full text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-2 cursor-pointer"
            >
              ตั้งค่าภาคเรียน / ห้องเรียนใหม่
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
