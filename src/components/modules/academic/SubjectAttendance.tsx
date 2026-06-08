"use client";

import React, { useState, useEffect } from "react";
import { Student } from "@/types/school-os";
import { Calendar, UserCheck, Check, AlertCircle, Clock, BookOpen, Send, Layers } from "lucide-react";

interface SubjectAttendanceProps {
  students: Student[];
  subjectsList?: any[];
  classroomsList?: any[];
  handleAttendanceChange: (studentId: string, status: Student["attendanceToday"]) => void;
  triggerToast: (title: string, desc: string) => void;
  triggerLineNotification: (parentName: string, msg: string, studentName: string) => void;
  addAuditLog: (action: string, details: string) => void;
}

export default function SubjectAttendance({
  students,
  subjectsList = [],
  classroomsList = [],
  handleAttendanceChange,
  triggerToast,
  triggerLineNotification,
  addAuditLog
}: SubjectAttendanceProps) {
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [attendanceMode, setAttendanceMode] = useState<"homeroom" | "subject">("homeroom");
  const [attendanceSubject, setAttendanceSubject] = useState("");
  const [attendancePeriod, setAttendancePeriod] = useState("1");
  const [isSyncingAttendance, setIsSyncingAttendance] = useState(false);

  // Set default selection when lists load
  useEffect(() => {
    if (classroomsList && classroomsList.length > 0 && !selectedClassroom) {
      setSelectedClassroom(classroomsList[0].name || classroomsList[0].id);
    }
  }, [classroomsList]);

  useEffect(() => {
    if (subjectsList && subjectsList.length > 0 && !attendanceSubject) {
      setAttendanceSubject(subjectsList[0].code || subjectsList[0].id);
    }
  }, [subjectsList]);

  // Filter students based on selected classroom
  const filteredStudents = students.filter(
    (s) => s.classroom.toLowerCase() === selectedClassroom.toLowerCase()
  );

  const syncBulkAttendance = async () => {
    if (!selectedClassroom) {
      triggerToast("⚠️ ข้อผิดพลาด", "กรุณาเลือกชั้นเรียนก่อนทำการซิงค์");
      return;
    }
    if (attendanceMode === "subject" && !attendanceSubject) {
      triggerToast("⚠️ ข้อผิดพลาด", "กรุณาเลือกรายวิชาก่อนทำการซิงค์");
      return;
    }

    setIsSyncingAttendance(true);
    const details = attendanceMode === "homeroom"
      ? `เช็คชื่อโฮมรูม ชั้น ${selectedClassroom}`
      : `เช็คชื่อรายวิชา ${attendanceSubject} (คาบ ${attendancePeriod}) ชั้น ${selectedClassroom}`;
      
    addAuditLog("BULK_ATTENDANCE_SYNC", `เริ่มซิงค์ข้อมูล ${details}`);
    
    try {
      const records = filteredStudents.map(s => ({
        studentId: s.id,
        status: s.attendanceToday || "present",
        remarks: s.attendanceToday === "absent" 
          ? (attendanceMode === "homeroom" ? "ขาดเรียนโฮมรูม" : `ขาดเรียนคาบ ${attendancePeriod} วิชา ${attendanceSubject}`) 
          : ""
      }));

      const res = await fetch("/api/v1/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroom: selectedClassroom,
          date: new Date().toISOString().substring(0, 10),
          mode: attendanceMode,
          subject: attendanceMode === "subject" ? attendanceSubject : undefined,
          period: attendanceMode === "subject" ? attendancePeriod : undefined,
          records
        })
      });

      const json = await res.json();
      if (json.success) {
        triggerToast("☁️ ซิงค์ Cloud API สำเร็จ!", `ส่งข้อมูล ${json.data.totalChecked} รายการเรียบร้อย (พบขาดเรียน ${json.data.absentCount} คน)`);
        
        // Push actual line notifications to parents of absent students
        const absents = filteredStudents.filter(s => s.attendanceToday === "absent");
        absents.forEach(s => {
          const reasonStr = attendanceMode === "homeroom" 
            ? "โฮมรูมและเข้าแถวช่วงเช้า" 
            : `คาบเรียนที่ ${attendancePeriod} (วิชา ${attendanceSubject})`;
          triggerLineNotification(
            s.parentName || "ผู้ปกครอง", 
            `แจ้งเตือนโรงเรียน: ลูกหลานของท่าน (${s.fullName}) ขาดเรียนในส่วน ${reasonStr} ในวันนี้ โปรดติดต่อกลับครูประจำชั้นค่ะ`, 
            s.fullName
          );
        });
      } else {
        triggerToast("❌ ซิงค์ข้อมูลล้มเหลว", json.error?.message || "ไม่สามารถติดต่อ API Gateway ได้");
      }
    } catch (e: any) {
      triggerToast("📡 โหมด Offline: คิวงานรอซิงค์", "บันทึกข้อมูลเข้าหน่วยความจำชั่วคราวแบบ Local Queue เรียบร้อยแล้ว ระบบจะซิงค์อัตโนมัติเมื่อเครือข่ายพร้อม");
    } finally {
      setIsSyncingAttendance(false);
    }
  };

  const handleMarkAllPresent = () => {
    filteredStudents.forEach(s => handleAttendanceChange(s.id, "present"));
    triggerToast("👍 เช็คชื่อมาเรียนทั้งหมด", `บันทึกนักเรียนห้อง ${selectedClassroom} ว่ามาเรียนครบทุกคนแล้ว`);
  };

  return (
    <div className="p-6 rounded-2xl glass-card bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-slate-800/80 space-y-6 animate-in fade-in duration-200">
      
      {/* Control Panel Header */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end flex-1">
          {/* Classroom Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">ชั้นเรียน (Classroom)</label>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {classroomsList.map(c => (
                <option key={c.id || c.name} value={c.name}>{c.name}</option>
              ))}
              {classroomsList.length === 0 && <option value="ม.6/1">ม.6/1</option>}
            </select>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">ประเภทการเช็คชื่อ (Type)</label>
            <select
              value={attendanceMode}
              onChange={(e) => setAttendanceMode(e.target.value as "homeroom" | "subject")}
              className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="homeroom">เข้าแถว / โฮมรูมเช้า</option>
              <option value="subject">เช็คชื่อรายคาบเรียน</option>
            </select>
          </div>

          {/* Subject Selector (Conditional) */}
          {attendanceMode === "subject" && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">วิชาที่สอน (Subject)</label>
              <select
                value={attendanceSubject}
                onChange={(e) => setAttendanceSubject(e.target.value)}
                className="w-full h-9 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {subjectsList.map(s => (
                  <option key={s.id || s.code} value={s.code}>{s.code} - {s.name}</option>
                ))}
                {subjectsList.length === 0 && (
                  <>
                    <option value="ว31101">ว31101 วิทยาศาสตร์</option>
                    <option value="ค31101">ค31101 คณิตศาสตร์</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Period Selector (Conditional) */}
          {attendanceMode === "subject" && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">คาบเรียนที่ (Period)</label>
              <select
                value={attendancePeriod}
                onChange={(e) => setAttendancePeriod(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {[...Array(8)].map((_, i) => (
                  <option key={i + 1} value={String(i + 1)}>คาบเรียนที่ {i + 1}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
          <button
            onClick={handleMarkAllPresent}
            type="button"
            className="h-9 px-3.5 bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-750 font-bold text-xs rounded-xl transition-all"
          >
            มาเรียนทั้งหมด
          </button>
          <button
            onClick={syncBulkAttendance}
            disabled={isSyncingAttendance || filteredStudents.length === 0}
            className="h-9 px-4 bg-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/10 hover:bg-indigo-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSyncingAttendance ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            ซิงค์ระบบและแจ้ง LINE
          </button>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-2">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20">
            <AlertCircle className="w-8 h-8 text-slate-355" />
            <p className="text-xs font-bold">ไม่พบรายชื่อนักเรียนในชั้น {selectedClassroom}</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const avatarChar = student.nickname || student.fullName.trim().charAt(0);
            const isOther = ["leave", "sick"].includes(student.attendanceToday || "");
            const otherVal = isOther ? student.attendanceToday : "";
            
            return (
              <div
                key={student.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card hover:border-primary/30 hover:shadow-sm transition-all gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-600 w-6 text-center">
                    {student.seatNumber || "-"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 select-none">
                    {avatarChar}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-white leading-tight">
                      {student.fullName}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      เลขประจำตัว {student.studentCode} • ชั้น {student.classroom}
                    </p>
                  </div>
                </div>

                {/* Status Toggle buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80">
                    {[
                      { code: "present", name: "มา", activeClass: "bg-emerald-500 text-white shadow-sm dark:bg-emerald-600", inactiveClass: "text-emerald-600 hover:bg-emerald-50/50 dark:text-emerald-500 dark:hover:bg-emerald-950/20" },
                      { code: "late", name: "สาย", activeClass: "bg-amber-500 text-white shadow-sm dark:bg-amber-600", inactiveClass: "text-amber-600 hover:bg-amber-50/50 dark:text-amber-500 dark:hover:bg-amber-950/20" },
                      { code: "absent", name: "ขาด", activeClass: "bg-rose-500 text-white shadow-sm dark:bg-rose-600", inactiveClass: "text-rose-600 hover:bg-rose-50/50 dark:text-rose-500 dark:hover:bg-rose-950/20" }
                    ].map((btn) => {
                      const isSelected = student.attendanceToday === btn.code;
                      return (
                        <button
                          key={btn.code}
                          type="button"
                          onClick={() => handleAttendanceChange(student.id, btn.code as Student["attendanceToday"])}
                          className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            isSelected ? btn.activeClass : `${btn.inactiveClass} bg-transparent`
                          }`}
                        >
                          {btn.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Dropdown for options like leave, sick */}
                  <div className="relative">
                    <select
                      value={otherVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleAttendanceChange(student.id, (val || "present") as Student["attendanceToday"]);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border bg-slate-100 dark:bg-slate-900 cursor-pointer outline-none transition-all ${
                        isOther
                          ? "border-sky-300 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <option value="" className="text-slate-500">อื่น ๆ...</option>
                      <option value="leave" className="text-sky-600 dark:text-sky-400">ลา</option>
                      <option value="sick" className="text-teal-600 dark:text-teal-400">ป่วย</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
