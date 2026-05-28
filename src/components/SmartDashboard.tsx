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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card/40 hover:bg-card/75 transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground font-semibold">คาบสอนวันนี้</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><BookOpen className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">4 คาบ</p>
          <span className="text-[10px] text-muted-foreground">ชั้น ม.6/1 (วิชาภาษาไทย)</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/40 hover:bg-card/75 transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground font-semibold">นักเรียนขาดเรียน</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500"><ShieldAlert className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-extrabold text-rose-500 mt-2">{absentToday} คน</p>
          <span className="text-[10px] text-muted-foreground">จากทั้งหมด {totalStudentsCount} คน</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/40 hover:bg-card/75 transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground font-semibold">นักเรียนมาสาย</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><Clock className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-extrabold text-amber-500 mt-2">{lateToday} คน</p>
          <span className="text-[10px] text-muted-foreground">ควรติดตามระเบียบแถว</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/40 hover:bg-card/75 transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground font-semibold">เคสห้องพยาบาล</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><HeartPulse className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-500 mt-2">2 เคส</p>
          <span className="text-[10px] text-muted-foreground">มีการจ่ายยาพาราเซตามอล</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timetable slots */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card/50 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
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
                  ? "bg-slate-500/5 border-border/40 opacity-70" 
                  : slot.status === "next" 
                  ? "bg-indigo-500/5 border-indigo-500/20 ring-1 ring-indigo-500/10 shadow-sm" 
                  : "bg-card border-border/80"
              }`}>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    slot.status === "done" ? "bg-slate-200 dark:bg-slate-800 text-muted-foreground" : slot.status === "next" ? "bg-indigo-600 text-white animate-pulse" : "bg-muted text-foreground"
                  }`}>{slot.period}</span>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{slot.subject}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {slot.time}</p>
                  </div>
                </div>
                {slot.status === "done" ? (
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> บันทึกหลังสอนแล้ว
                  </span>
                ) : slot.status === "next" ? (
                  <button 
                    onClick={() => onNavigate("Academic", "teaching")}
                    className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    เริ่มสอน / เช็คชื่อ
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground font-semibold">ชั่วโมงอิสระ</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Checklist */}
        <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-500" />
            สิ่งที่ต้องทำในระบบ (Tasks Checklist)
          </h3>
          <div className="space-y-3.5">
            {[
              { title: "อนุมัติขอใช้ห้องประชุม ม.6/1 ( Operations )", done: false, desc: "รออนุมัติ" },
              { title: "กรอกเกรด ปพ.5 ภาคเรียนที่ 1/2569", done: false, desc: "ค้างกรอก 3 คน" },
              { title: "เช็คชื่อเวรวันจันทร์ที่ประตูหน้าโรงเรียน", done: true, desc: "เสร็จสิ้น" },
              { title: "ประเมิน SDQ นักเรียน ม.6/1 ครบถ้วน", done: true, desc: "เสร็จสิ้น" },
            ].map((task, i) => (
              <div key={i} className="flex gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border mt-0.5 ${
                  task.done ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "border-border text-transparent"
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className={`text-sm font-semibold leading-tight ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border/80">
            <button 
              onClick={() => onNavigate("Academic", "attendance")}
              className="w-full py-2.5 rounded-xl border border-indigo-500/25 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Attendance Chart mock */}
        <div className="p-5 rounded-2xl border border-border bg-card/40 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">อัตราการเข้าเรียนเฉลี่ยวันนี้</h3>
            <p className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">96.8%</p>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ดีกว่าเมื่อวาน +0.5%
            </span>
          </div>
          {/* Animated circular gauge SVG */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="6" fill="transparent" />
              <circle cx="32" cy="32" r="28" className="stroke-indigo-600" strokeWidth="6" fill="transparent" strokeDasharray="175" strokeDashoffset="5" strokeLinecap="round" />
            </svg>
            <span className="absolute text-[10px] font-bold text-indigo-600">96.8%</span>
          </div>
        </div>

        {/* Student at Risk Indicator */}
        <div className="p-5 rounded-2xl border border-border bg-card/40 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">นักเรียนกลุ่มเสี่ยงวิกฤต</h3>
            <p className="text-4xl font-extrabold text-rose-500 mt-2">{riskStudents.length} คน</p>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              ต้องการความช่วยเหลือด่วน
            </span>
          </div>
          <button 
            onClick={() => onNavigate("Analytics", "risk")}
            className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 hover:scale-105 transition-transform"
          >
            <AlertTriangle className="w-6 h-6" />
          </button>
        </div>

        {/* School KPI */}
        <div className="p-5 rounded-2xl border border-border bg-card/40 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">งานค้างอนุมัติสะสม</h3>
            <p className="text-4xl font-extrabold text-amber-500 mt-2">{pendingLeaves.length} เรื่อง</p>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              ใบลาครู / ใช้ห้อง / ใช้รถ
            </span>
          </div>
          <button 
            onClick={() => onNavigate("Operations", "requests")}
            className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 hover:scale-105 transition-transform"
          >
            <FileText className="w-6 h-6" />
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending leave approvals list */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card/50 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-500" />
            เอกสารรอการอนุมัติ (Workflow Engine)
          </h3>
          <div className="space-y-3">
            {pendingLeaves.length > 0 ? (
              pendingLeaves.map((request) => (
                <div key={request.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-indigo-500/40 transition-all shadow-sm">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 font-semibold">{request.leaveType}</span>
                    <h4 className="font-bold text-sm text-foreground mt-1.5">{request.requesterName}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">เหตุผล: {request.reason}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">วันที่ขอหยุด: {request.startDate} ถึง {request.endDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onApproveRequest(request.id, "APPROVED")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                    >
                      อนุมัติ
                    </button>
                    <button 
                      onClick={() => onApproveRequest(request.id, "REJECTED")}
                      className="border border-border hover:bg-muted text-foreground px-3 py-1.5 rounded-lg text-xs font-bold"
                    >
                      ปฏิเสธ
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                ไม่มีเอกสารหรือคำขอใบลาค้างอนุมัติในระบบ
              </div>
            )}
          </div>
        </div>

        {/* Student Risk Quickview */}
        <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            นักเรียนเสี่ยงวิกฤต (AI Student Risk)
          </h3>
          <div className="space-y-3">
            {students.filter(s => s.status !== "ปกติ").slice(0, 3).map((student) => (
              <div 
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className="p-3 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-rose-500/40 cursor-pointer transition-all flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-xs text-foreground">{student.fullName}</h4>
                  <p className="text-[10px] text-muted-foreground">ชั้น {student.classroom} • คะแนนวินัย: {student.behaviorPoints}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  student.status === "เสี่ยง" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                }`}>
                  {student.status}
                </span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate("Analytics", "risk")}
            className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center justify-center gap-1 pt-2"
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card/40 shadow-sm flex flex-col items-center text-center">
          <Award className="w-8 h-8 text-amber-500" />
          <span className="text-[10px] text-muted-foreground uppercase font-semibold mt-2">คะแนนพฤติกรรมสะสม</span>
          <span className="text-3xl font-extrabold text-foreground mt-1">95</span>
          <span className="text-[9px] text-emerald-500 font-semibold mt-0.5">พฤติกรรมดีเยี่ยม</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/40 shadow-sm flex flex-col items-center text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <span className="text-[10px] text-muted-foreground uppercase font-semibold mt-2">อัตราการมาเรียนของฉัน</span>
          <span className="text-3xl font-extrabold text-foreground mt-1">98%</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">ขาด 1 ครั้ง สาย 1 ครั้ง</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/40 shadow-sm flex flex-col items-center text-center">
          <GraduationCap className="w-8 h-8 text-indigo-500" />
          <span className="text-[10px] text-muted-foreground uppercase font-semibold mt-2">เกรดเฉลี่ยสะสม GPA</span>
          <span className="text-3xl font-extrabold text-foreground mt-1">3.85</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">ภาคเรียนที่ 1/2569</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/40 shadow-sm flex flex-col items-center text-center">
          <BookOpen className="w-8 h-8 text-indigo-500" />
          <span className="text-[10px] text-muted-foreground uppercase font-semibold mt-2">การบ้านค้างส่ง</span>
          <span className="text-3xl font-extrabold text-rose-500 mt-1">1 งาน</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">กำหนดส่งพรุ่งนี้</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's schedule */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card/50 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            ตารางเรียนของฉันวันนี้ (ม.6/1)
          </h3>
          <div className="space-y-3">
            {[
              { period: "08:30 - 10:30", subject: "วิชาภาษาไทยพื้นฐาน", room: "ห้องเรียน 312", teacher: "ครูอัญชลี" },
              { period: "10:30 - 12:30", subject: "วิชาฟิสิกส์เพิ่มเติม", room: "ห้องปฏิบัติการฟิสิกส์", teacher: "ครูวิทยา" },
              { period: "13:30 - 15:30", subject: "วิชาพลศึกษา (บาสเกตบอล)", room: "โรงยิมพลศึกษา", teacher: "ครูสมเกียรติ" },
            ].map((slot, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-border bg-card flex justify-between items-center hover:border-indigo-500/25 transition-all">
                <div className="flex gap-4 items-center">
                  <span className="text-xs font-bold bg-muted px-2.5 py-1 rounded-lg text-foreground">{slot.period}</span>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{slot.subject}</h4>
                    <p className="text-xs text-muted-foreground">อาจารย์ผู้สอน: {slot.teacher} • สถานที่: {slot.room}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Homework list */}
        <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-500" />
            การบ้าน / ภารกิจของฉัน
          </h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-xs text-foreground">แต่งคำประพันธ์ร้อยกรอง (วิชาภาษาไทย)</h4>
                <span className="text-[8px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded font-bold">ค้างส่ง</span>
              </div>
              <p className="text-[10px] text-muted-foreground">กำหนดส่ง: 21 พ.ค. 2569 (พรุ่งนี้)</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card space-y-1 opacity-70">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-xs text-foreground line-through">บันทึกผลการทดลองแรงโน้มถ่วง (วิชาฟิสิกส์)</h4>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-bold">ส่งแล้ว</span>
              </div>
              <p className="text-[10px] text-muted-foreground">ส่งเมื่อ: 18 พ.ค. 2569</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card/40 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground font-semibold">ผู้ใช้งานในระบบทั้งหมด</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><Users className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-extrabold text-foreground mt-2">1,240 คน</p>
          <span className="text-[10px] text-muted-foreground">ใช้งานอยู่ (Active) 99%</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/40 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground font-semibold">สถานะเซิร์ฟเวอร์ (API Nodes)</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><Database className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-500 mt-2">เสถียร</p>
          <span className="text-[10px] text-muted-foreground">Uptime 99.98% (Supabase)</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/40 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground font-semibold">ตารางสกรีนฐานข้อมูล</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><FileText className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">42 ตาราง</p>
          <span className="text-[10px] text-muted-foreground">เชื่อมโยงด้วย Drizzle ORM</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/40 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground font-semibold">กติกาอัตโนมัติที่เปิดใช้งาน</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><BellRing className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-extrabold text-amber-500 mt-2">5 กฎ</p>
          <span className="text-[10px] text-muted-foreground">ผ่าน Rule Engine API Node</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System setup status */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card/50 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
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
              <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-border bg-card">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{engine.name}</h4>
                  <p className="text-xs text-muted-foreground">{engine.desc}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                  {engine.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Setup parameters */}
        <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            ปีการศึกษาปัจจุบัน
          </h3>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
              <div className="flex justify-between">
                <span>ปีการศึกษา:</span>
                <span className="font-bold text-foreground">2569</span>
              </div>
              <div className="flex justify-between">
                <span>ภาคเรียนที่:</span>
                <span className="font-bold text-foreground">1</span>
              </div>
              <div className="flex justify-between">
                <span>เปิดเรียน:</span>
                <span className="font-bold text-foreground">16 พ.ค. 2569</span>
              </div>
              <div className="flex justify-between">
                <span>ปิดเรียน:</span>
                <span className="font-bold text-foreground">10 ต.ค. 2569</span>
              </div>
            </div>
            <button 
              onClick={() => onNavigate("Admin", "setup")}
              className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-2"
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
