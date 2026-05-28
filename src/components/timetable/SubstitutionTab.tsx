"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, UserCheck, ShieldAlert, Sparkles, Plus, Clock, User, 
  BookOpen, Trash2, Printer, Download, Search, AlertCircle, CheckCircle2, ChevronRight, X
} from "lucide-react";
import { Teacher, LeaveRequest } from "@/types/school-os";

interface SubstitutionTabProps {
  teachers: Teacher[];
  leaveRequests: LeaveRequest[];
  lang: "th" | "en";
}

interface SubstitutionLog {
  id: string;
  date: string;
  absentTeacherId: string;
  absentTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  period: number;
  subjectCode: string;
  subjectName: string;
  classroom: string;
  remark: string;
  createdAt: string;
}

// Initial mock substitution logs for 2026-05-20
const initialLogs: SubstitutionLog[] = [
  {
    id: "sub-log-1",
    date: "2026-05-20",
    absentTeacherId: "tch-1",
    absentTeacherName: "ครูอัญชลี รัตนโกสินทร์",
    substituteTeacherId: "tch-3",
    substituteTeacherName: "ครูสมเกียรติ กีฬาดี",
    period: 1,
    subjectCode: "ท31101",
    subjectName: "ภาษาไทยพื้นฐาน",
    classroom: "ม.6/1",
    remark: "ครูลาไปทำธุระต่างจังหวัด จัดสอนแทนช่วงเช้า",
    createdAt: "2026-05-20 08:00"
  }
];

// Schedules of teachers (1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday)
// Day 3 = Wednesday (since 2026-05-20 is a Wednesday)
const TEACHER_SCHEDULES: Record<string, Record<number, { subjectCode: string; subjectName: string; classroom: string }>> = {
  "tch-1": { // ครูอัญชลี (Absent)
    1: { subjectCode: "ท31101", subjectName: "ภาษาไทยพื้นฐาน", classroom: "ม.6/1" },
    3: { subjectCode: "ท31101", subjectName: "ภาษาไทยพื้นฐาน", classroom: "ม.1/1" },
    6: { subjectCode: "ท31101", subjectName: "ภาษาไทยพื้นฐาน", classroom: "ม.5/2" },
  },
  "tch-2": { // ครูวิทยาศาสตร์ (Science)
    2: { subjectCode: "ว31102", subjectName: "วิทยาศาสตร์พื้นฐาน", classroom: "ม.6/1" },
    5: { subjectCode: "ว31201", subjectName: "ฟิสิกส์เพิ่มเติม", classroom: "ม.4/1" },
    7: { subjectCode: "ว31103", subjectName: "เคมีพื้นฐาน", classroom: "ม.6/1" },
  },
  "tch-3": { // ครูสมเกียรติ (PE)
    4: { subjectCode: "พ31101", subjectName: "สุขศึกษาและพลศึกษา", classroom: "ม.6/1" },
    8: { subjectCode: "พ31101", subjectName: "สุขศึกษาและพลศึกษา", classroom: "ม.1/2" },
  }
};

export default function SubstitutionTab({ teachers, leaveRequests, lang }: SubstitutionTabProps) {
  const [selectedDate, setSelectedDate] = useState("2026-05-20");
  const [activeAbsentTeacher, setActiveAbsentTeacher] = useState<Teacher | null>(null);
  const [subLogs, setSubLogs] = useState<SubstitutionLog[]>(initialLogs);
  
  // Substitution loads (simulating "สอนแทนไปน้อยก่อน" rule)
  const [subLoads, setSubLoads] = useState<Record<string, number>>({
    "tch-1": 0,
    "tch-2": 1,
    "tch-3": 2,
  });

  // Modal selector states
  const [isAssigning, setIsAssigning] = useState(false);
  const [targetPeriod, setTargetPeriod] = useState<number | null>(null);
  const [targetSubject, setTargetSubject] = useState<{ code: string; name: string; classroom: string } | null>(null);

  // Success state for toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Determine day of the week for the selected date (1=Mon, ..., 5=Fri)
  const getDayOfWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (day === 0 || day === 6) return 3; // default to Wednesday for weekends in mock
    return day;
  };

  // Fetch absent teachers on this date from eLeave state!
  const getAbsentTeachers = () => {
    // 1. Get approved leaves covering this date
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0,0,0,0);

    const absentNames = leaveRequests
      .filter(req => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);
        // Match status APPROVED and date bounds
        return req.status === "APPROVED" && targetDate >= start && targetDate <= end;
      })
      .map(req => req.requesterName);

    // 2. Map names to actual Teacher records
    const absentRecords = teachers.filter(t => 
      absentNames.some(name => t.fullName.includes(name) || name.includes(t.fullName))
    );

    // 3. If no approved leaves exist for testing, automatically fall back to ครูอัญชลี (tch-1) for date 2026-05-20
    if (absentRecords.length === 0 && selectedDate === "2026-05-20") {
      const anchalee = teachers.find(t => t.id === "tch-1");
      if (anchalee) absentRecords.push(anchalee);
    }

    return absentRecords;
  };

  const absentTeachers = getAbsentTeachers();

  // Set default active absent teacher when selected date changes or list changes
  useEffect(() => {
    if (absentTeachers.length > 0) {
      // Retain active teacher if still absent, otherwise pick first
      const stillAbsent = absentTeachers.find(t => t.id === activeAbsentTeacher?.id);
      if (!stillAbsent) {
        setActiveAbsentTeacher(absentTeachers[0]);
      }
    } else {
      setActiveAbsentTeacher(null);
    }
  }, [selectedDate, leaveRequests]);

  // Find candidate teachers who are FREE in this period
  const getCandidatesForPeriod = (periodNum: number) => {
    // A teacher is a candidate if:
    // 1. They are NOT the absent teacher
    // 2. They are NOT absent themselves on this date
    // 3. They do NOT have a teaching class scheduled in this period on this day
    const absentIds = absentTeachers.map(t => t.id);
    
    return teachers
      .filter(t => !absentIds.includes(t.id))
      .map(t => {
        // Check schedule
        const schedule = TEACHER_SCHEDULES[t.id];
        const isTeaching = schedule && schedule[periodNum];
        return {
          teacher: t,
          isAvailable: !isTeaching,
          load: subLoads[t.id] || 0,
          currentClass: isTeaching ? `${schedule[periodNum].subjectCode} (${schedule[periodNum].classroom})` : null
        };
      })
      // Sort: 1st by availability, 2nd by load ("สอนแทนไปน้อยก่อน" - ascending load)
      .sort((a, b) => {
        if (a.isAvailable && !b.isAvailable) return -1;
        if (!a.isAvailable && b.isAvailable) return 1;
        return a.load - b.load; // lower load first
      });
  };

  // Perform substitute assignment
  const handleAssignSubstitute = (subTeacher: Teacher) => {
    if (!activeAbsentTeacher || targetPeriod === null || !targetSubject) return;

    // Create log entry
    const newLog: SubstitutionLog = {
      id: `sub-log-${Date.now()}`,
      date: selectedDate,
      absentTeacherId: activeAbsentTeacher.id,
      absentTeacherName: activeAbsentTeacher.fullName,
      substituteTeacherId: subTeacher.id,
      substituteTeacherName: subTeacher.fullName,
      period: targetPeriod,
      subjectCode: targetSubject.code,
      subjectName: targetSubject.name,
      classroom: targetSubject.classroom,
      remark: `จัดสอนแทนอัตโนมัติ สาระวิชา ${activeAbsentTeacher.department}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setSubLogs(prev => [newLog, ...prev]);

    // Increase substitute load for this teacher
    setSubLoads(prev => ({
      ...prev,
      [subTeacher.id]: (prev[subTeacher.id] || 0) + 1
    }));

    setIsAssigning(false);
    triggerToast(lang === "th" ? "บันทึกการจัดครูสอนแทนเรียบร้อยแล้ว!" : "Successfully assigned substitute teacher!");
  };

  // Delete substitution log
  const handleDeleteLog = (logId: string) => {
    const log = subLogs.find(l => l.id === logId);
    if (!log) return;

    if (window.confirm(lang === "th" ? "ต้องการลบประวัติการสอนแทนนี้หรือไม่?" : "Are you sure you want to delete this substitution log?")) {
      setSubLogs(prev => prev.filter(l => l.id !== logId));
      
      // Refund substitute load
      setSubLoads(prev => ({
        ...prev,
        [log.substituteTeacherId]: Math.max(0, (prev[log.substituteTeacherId] || 1) - 1)
      }));

      triggerToast(lang === "th" ? "ลบประวัติสำเร็จ!" : "Deleted log successfully!");
    }
  };

  // Print Preview
  const handlePrint = () => {
    const logsForDate = subLogs.filter(l => l.date === selectedDate);
    
    let rowsHtml = "";
    if (logsForDate.length === 0) {
      rowsHtml = `<tr><td colspan="6" style="text-align:center; padding:15px; color:#666;">ไม่มีรายการจัดสอนแทนในวันนี้</td></tr>`;
    } else {
      logsForDate.forEach((l, index) => {
        rowsHtml += `
          <tr>
            <td style="text-align:center;">${index + 1}</td>
            <td>คาบที่ ${l.period}</td>
            <td>${l.absentTeacherName}</td>
            <td><strong>${l.substituteTeacherName}</strong></td>
            <td>${l.subjectCode} - ${l.subjectName}</td>
            <td style="text-align:center;">${l.classroom}</td>
          </tr>
        `;
      });
    }

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>รายงานการจัดสอนแทน - วันที่ ${selectedDate}</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; padding: 30px; color: #333; }
            h2 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 5px; }
            .meta { margin-bottom: 20px; font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
            th { background-color: #f3f4f6; font-weight: bold; color: #1f2937; }
            .footer { margin-top: 40px; text-align: right; font-size: 14px; }
          </style>
        </head>
        <body onload="window.print()">
          <h2>รายงานสรุปการจัดสอนแทนประจำวัน</h2>
          <div class="meta">
            <strong>วันที่ลา / วันที่สอนแทน:</strong> ${selectedDate} | 
            <strong>จำนวนรายการทั้งหมด:</strong> ${logsForDate.length} รายการ | 
            <strong>ออกรายงานเมื่อ:</strong> ${new Date().toLocaleDateString('th-TH')}
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align:center;">ลำดับ</th>
                <th style="width: 80px;">คาบที่</th>
                <th>ครูผู้ลา</th>
                <th>ครูผู้สอนแทน</th>
                <th>วิชาเรียน</th>
                <th style="width: 100px; text-align:center;">ชั้นเรียน</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            <p>ลงชื่อ......................................................ผู้จัดสอนแทน</p>
            <p>(.................................................................)</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const logsForDate = subLogs.filter(l => l.date === selectedDate);
    if (logsForDate.length === 0) {
      alert(lang === "th" ? "ไม่มีข้อมูลจัดสอนแทนในวันที่เลือก" : "No logs available for the selected date");
      return;
    }

    const headers = ["No", "Period", "Absent Teacher", "Substitute Teacher", "Subject Code", "Subject Name", "Classroom", "Remark"];
    const rows = logsForDate.map((l, idx) => [
      idx + 1,
      l.period,
      l.absentTeacherName,
      l.substituteTeacherName,
      l.subjectCode,
      l.subjectName,
      l.classroom,
      l.remark
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `substitution_report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine active absent teacher timetable schedule
  const activeTeacherSchedule = activeAbsentTeacher ? TEACHER_SCHEDULES[activeAbsentTeacher.id] || {} : {};

  return (
    <div className="space-y-6">
      {/* Dynamic Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white font-extrabold px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden border border-indigo-500/20 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest w-fit border border-indigo-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              {lang === "th" ? "โมดูลผสานรวม e-Leave & Scheduler" : "e-Leave & Scheduler Integration Suite"}
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-none">
              {lang === "th" ? "ระบบจัดสอนแทนอัจฉริยะ" : "Smart Substitution System"}
            </h2>
            <p className="text-indigo-200/80 text-sm font-medium max-w-xl leading-relaxed">
              {lang === "th" 
                ? "ผสานรวมอัตโนมัติกับใบลาที่ได้รับอนุมัติในระบบ e-Leave เพื่อค้นหาและจัดครูสอนแทนด้วยเกณฑ์ความเป็นธรรม (สอนแทนน้อยสุดก่อน) แบบลีน สะดวก รวดเร็ว" 
                : "Automatically synced with approved e-Leaves to arrange substitution teachers fairly (least substitution load first) with maximum efficiency."}
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10 shadow-inner">
            <Calendar className="w-5 h-5 text-indigo-300" />
            <div className="flex flex-col">
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">
                {lang === "th" ? "เลือกวันที่ลา" : "Select Absent Date"}
              </span>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-black text-sm border-none focus:ring-0 cursor-pointer outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Unified Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Absent Teachers on Selected Date */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                {lang === "th" ? "ครูผู้ลาในวันที่เลือก" : "Absent Instructors"}
              </h3>
              <span className="text-xs font-black bg-rose-500/10 text-rose-600 px-3 py-1 rounded-full border border-rose-500/20">
                {absentTeachers.length} {lang === "th" ? "ราย" : "Absent"}
              </span>
            </div>
            
            {absentTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border/80 bg-muted/20 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400" />
                <p className="text-sm font-bold text-slate-500">
                  {lang === "th" ? "ไม่มีคุณครูส่งใบลาที่ได้รับการอนุมัติในวันนี้" : "No approved absent teachers found."}
                </p>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  {lang === "th" ? "กรุณาเลือกรอบวันที่ 2026-05-20 หรือวันที่ที่มีใบลาอนุมัติ" : "Select 2026-05-20 to test with mock approved leave records."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {absentTeachers.map((t) => {
                  const isSelected = activeAbsentTeacher?.id === t.id;
                  const periodsCount = Object.keys(TEACHER_SCHEDULES[t.id] || {}).length;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveAbsentTeacher(t)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected 
                          ? "bg-rose-500/5 border-rose-500/30 ring-2 ring-rose-500/10" 
                          : "border-border/60 hover:bg-muted/40 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          isSelected ? "bg-rose-500 text-white" : "bg-muted text-slate-600"
                        }`}>
                          {t.fullName.substring(3, 5)}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-foreground">{t.fullName}</p>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">{t.position} • {t.department}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black uppercase bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-md">
                          {periodsCount} {lang === "th" ? "คาบสอน" : "classes"}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? "translate-x-1" : ""}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Timetable to Substitute */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/40">
              <div>
                <h3 className="text-lg font-black text-foreground">
                  {lang === "th" ? "ตารางคาบสอนที่ต้องจัดสอนแทน" : "Timetable & Classes Requiring Substitution"}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold mt-1">
                  {activeAbsentTeacher 
                    ? `${lang === "th" ? "ครูผู้ลา:" : "Absent Instructor:"} ${activeAbsentTeacher.fullName}` 
                    : lang === "th" ? "กรุณาเลือกครูผู้ลาจากคอลัมน์ซ้ายมือเพื่อเริ่มดำเนินการ" : "Please select an absent instructor on the left."}
                </p>
              </div>
              {activeAbsentTeacher && (
                <div className="text-xs px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full font-black">
                  {lang === "th" ? "วิกฤต: ต้องการจัดสอนแทน" : "Urgent action required"}
                </div>
              )}
            </div>

            {/* Timetable slots */}
            {!activeAbsentTeacher ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground/60 space-y-2">
                <Clock className="w-12 h-12 text-slate-300" />
                <p className="text-sm font-bold">{lang === "th" ? "ไม่มีผู้ลาให้จัดสอนแทนในวันนี้" : "Select an absent teacher to view schedules."}</p>
              </div>
            ) : Object.keys(activeTeacherSchedule).length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground/60 space-y-2">
                <BookOpen className="w-12 h-12 text-slate-300" />
                <p className="text-sm font-bold">{lang === "th" ? "ครูผู้ลาไม่มีตารางสอนในวันนี้" : "No teaching schedule found for this instructor on this day."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 6, 7, 8].map((pNum) => {
                  const classData = activeTeacherSchedule[pNum];
                  if (!classData) return null;

                  // Check if substitution log already assigned for this period
                  const assignedLog = subLogs.find(l => 
                    l.date === selectedDate && 
                    l.absentTeacherId === activeAbsentTeacher.id && 
                    l.period === pNum
                  );

                  return (
                    <div 
                      key={pNum} 
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between h-44 ${
                        assignedLog 
                          ? "bg-emerald-500/5 border-emerald-500/30" 
                          : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            assignedLog ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                          }`}>
                            {lang === "th" ? `คาบที่ ${pNum}` : `Period ${pNum}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-black">
                            {pNum === 1 ? "08:30-09:20" : pNum === 2 ? "09:20-10:10" : pNum === 3 ? "10:10-11:00" : pNum === 4 ? "11:00-11:50" : pNum === 6 ? "12:50-13:40" : pNum === 7 ? "13:40-14:30" : "14:30-15:20"}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 px-3 py-1 rounded-full border border-slate-200/50">
                          {classData.classroom}
                        </span>
                      </div>

                      <div className="my-3">
                        <p className="font-extrabold text-sm text-foreground">{classData.subjectName}</p>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">{lang === "th" ? "รหัสวิชา:" : "Code:"} {classData.subjectCode}</p>
                      </div>

                      <div className="pt-3 border-t border-border/40 flex justify-between items-center">
                        {assignedLog ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-xs font-extrabold text-emerald-700">
                              {lang === "th" ? `ครูผู้สอนแทน: ${assignedLog.substituteTeacherName.substring(3)}` : `Sub: ${assignedLog.substituteTeacherName}`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                            <span className="text-xs font-extrabold text-amber-700">
                              {lang === "th" ? "ยังไม่ระบุครูสอนแทน" : "Unassigned"}
                            </span>
                          </div>
                        )}

                        {assignedLog ? (
                          <button 
                            onClick={() => handleDeleteLog(assignedLog.id)}
                            className="p-2 hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 rounded-xl transition-colors"
                            title={lang === "th" ? "ยกเลิกการสอนแทน" : "Cancel substitution"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setTargetPeriod(pNum);
                              setTargetSubject({
                                code: classData.subjectCode,
                                name: classData.subjectName,
                                classroom: classData.classroom
                              });
                              setIsAssigning(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {lang === "th" ? "ระบุผู้สอนแทน" : "Assign"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 3. Substitution Logs & Report Printing Panel */}
      <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/40">
          <div>
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-500" />
              {lang === "th" ? "บันทึกและประวัติการสอนแทนประจำวัน" : "Daily Substitution Logs & Statistics"}
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              {lang === "th" 
                ? "แสดงสถิติและรายการจัดสอนแทนที่ยืนยันแล้ว สามารถออกรายงานหรือพิมพ์เพื่อส่งฝ่ายสารบรรณ" 
                : "View statistics and print summaries of approved daily teacher substitutions."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-all border border-border flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              {lang === "th" ? "พิมพ์สรุปรายงาน" : "Print Summary"}
            </button>
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
            >
              <Download className="w-3.5 h-3.5" />
              {lang === "th" ? "ดาวน์โหลด CSV" : "Export CSV"}
            </button>
          </div>
        </div>

        {subLogs.filter(l => l.date === selectedDate).length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground/50 space-y-2">
            <AlertCircle className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-bold">{lang === "th" ? "ยังไม่มีรายการจัดสอนแทนสำหรับวันที่เลือก" : "No assignments registered for this date."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border/60">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:text-slate-300 uppercase tracking-wider font-extrabold border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-center">{lang === "th" ? "คาบเรียน" : "Period"}</th>
                  <th className="px-6 py-4">{lang === "th" ? "ครูผู้ลา" : "Absent Teacher"}</th>
                  <th className="px-6 py-4">{lang === "th" ? "ครูผู้สอนแทน" : "Substitute Teacher"}</th>
                  <th className="px-6 py-4">{lang === "th" ? "วิชา" : "Subject"}</th>
                  <th className="px-6 py-4 text-center">{lang === "th" ? "ชั้นเรียน" : "Classroom"}</th>
                  <th className="px-6 py-4">{lang === "th" ? "การดำเนินการ" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subLogs
                  .filter(l => l.date === selectedDate)
                  .map((l) => (
                    <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-indigo-600">
                        {lang === "th" ? `คาบที่ ${l.period}` : `Period ${l.period}`}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {l.absentTeacherName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                            ✓
                          </div>
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                            {l.substituteTeacherName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-foreground">{l.subjectCode}</span>
                        <span className="text-xs text-muted-foreground font-semibold ml-2">({l.subjectName})</span>
                      </td>
                      <td className="px-6 py-4 text-center font-extrabold text-slate-700 bg-slate-50/50 dark:bg-slate-800/20 dark:text-slate-200">
                        {l.classroom}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleDeleteLog(l.id)}
                          className="text-xs text-rose-500 hover:text-rose-600 font-extrabold flex items-center gap-1 hover:underline"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {lang === "th" ? "ลบรายการ" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Smart Substitute Assignment Modal */}
      {isAssigning && targetPeriod !== null && targetSubject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 bg-indigo-900 text-white flex justify-between items-center relative">
              <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <span className="text-[10px] font-black uppercase bg-white/20 text-white px-2 py-0.5 rounded-md">
                  {lang === "th" ? `จัดสอนแทน คาบที่ ${targetPeriod}` : `Assign Substitute Period ${targetPeriod}`}
                </span>
                <h4 className="text-lg font-black mt-1">
                  {targetSubject.code} - {targetSubject.name} ({targetSubject.classroom})
                </h4>
              </div>
              <button 
                onClick={() => setIsAssigning(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-indigo-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List candidate teachers */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-indigo-900/80 dark:text-indigo-200/80">
                  <p className="font-extrabold">{lang === "th" ? "เกณฑ์การกระจายภาระงาน (โหลดเท่าเทียม)" : "Fair Work Distribution Principle"}</p>
                  <p className="mt-1 font-semibold">
                    {lang === "th" 
                      ? "ระบบจัดเรียงผู้สอนจาก (1) ครูที่ว่างไม่มีสอนในคาบนี้ และ (2) มีคาบสอนแทนสะสมน้อยที่สุด เพื่อกระจายการสอนแทนให้เท่ากันอย่างมีประสิทธิภาพ" 
                      : "Instructors are sorted by their cumulative substitution count (ascending) to distribute hours equally."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  {lang === "th" ? "รายชื่อบุคลากรที่แนะนำ" : "Available Candidates"}
                </h5>

                {getCandidatesForPeriod(targetPeriod).map(({ teacher: t, isAvailable, load, currentClass }) => {
                  const isSameGroup = activeAbsentTeacher && t.department === activeAbsentTeacher.department;
                  return (
                    <div 
                      key={t.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        isAvailable 
                          ? "border-border bg-card hover:border-indigo-500/40 hover:bg-indigo-500/[0.01]" 
                          : "border-border/40 bg-muted/40 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          isAvailable ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-400"
                        }`}>
                          {t.fullName.substring(3, 5)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-foreground">{t.fullName}</span>
                            {isSameGroup && (
                              <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-md border border-emerald-500/10">
                                {lang === "th" ? "กลุ่มสาระเดียวกัน" : "Same Dept"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            {t.position} • {t.department}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-stretch sm:self-auto justify-between border-t sm:border-none border-border/40 pt-2 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isAvailable ? "bg-indigo-500/10 text-indigo-600" : "bg-rose-500/10 text-rose-600"
                          }`}>
                            {isAvailable 
                              ? lang === "th" ? `สอนแทนสะสม: ${load} คาบ` : `Load: ${load} periods`
                              : lang === "th" ? `ติดสอน: ${currentClass}` : `Busy: ${currentClass}`}
                          </span>
                        </div>
                        {isAvailable && (
                          <button
                            onClick={() => handleAssignSubstitute(t)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 self-end sm:self-auto"
                          >
                            {lang === "th" ? "เลือกผู้สอนแทน" : "Choose"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
