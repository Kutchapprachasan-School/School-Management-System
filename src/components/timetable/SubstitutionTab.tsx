"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, UserCheck, ShieldAlert, Sparkles, Plus, Clock, User, 
  BookOpen, Trash2, Printer, Download, Search, AlertCircle, CheckCircle2, ChevronRight, X
} from "lucide-react";
import { Teacher, LeaveRequest } from "@/types/school-os";
import { 
  getSubstitutePageData, 
  saveSubstitutionLogs, 
  deleteSubstitutionLog, 
  addAbsentTeacherManually,
  bulkAddAbsentTeachersManually,
  removeAbsentTeacherManually,
  autoAssignSubstitutesForTeacher
} from "@/app/actions/substitution";

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
  periodId: string;
  subjectCode: string;
  subjectName: string;
  classroom: string;
  remark: string;
  createdAt: string;
}

export default function SubstitutionTab({ teachers: initialTeachers, leaveRequests: initialLeaves, lang }: SubstitutionTabProps) {
  // Safe helper to get local ISO date (YYYY-MM-DD)
  const getTodayStr = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [dbData, setDbData] = useState<{
    teachers: any[];
    leaveRequests: any[];
    schedules: any[];
    logs: SubstitutionLog[];
    loads: Record<string, number>;
    periods: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeAbsentTeacher, setActiveAbsentTeacher] = useState<any | null>(null);

  // Modal selector states
  const [isAssigning, setIsAssigning] = useState(false);
  const [targetPeriod, setTargetPeriod] = useState<number | null>(null);
  const [targetPeriodId, setTargetPeriodId] = useState<string | null>(null);
  const [targetScheduleId, setTargetScheduleId] = useState<string | null>(null);
  const [targetSubject, setTargetSubject] = useState<{ code: string; name: string; classroom: string } | null>(null);

  // Manual Add Absent Teacher states
  const [isAddingAbsent, setIsAddingAbsent] = useState(false);
  const [selectedAbsentTeacherIds, setSelectedAbsentTeacherIds] = useState<string[]>([]);
  const [manualTeacherSearchQuery, setManualTeacherSearchQuery] = useState("");

  // Success state for toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string | undefined) => {
    if (!msg) return;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch page data from db actions
  const loadPageData = async () => {
    setLoading(true);
    try {
      const res = await getSubstitutePageData(selectedDate);
      if (res.success && res.teachers) {
        setDbData({
          teachers: res.teachers,
          leaveRequests: res.leaveRequests || [],
          schedules: res.schedules || [],
          logs: (res.logs as any[]) || [],
          loads: res.loads || {},
          periods: res.periods || []
        });
      } else {
        console.error("Failed to load page data:", res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [selectedDate]);

  // Determine absent teachers on this date from leaveRequests
  const getAbsentTeachers = () => {
    if (!dbData) return [];
    return dbData.teachers.filter(t => 
      dbData.leaveRequests.some(req => 
        req.requesterName === t.fullName || 
        t.fullName.includes(req.requesterName) || 
        req.requesterName.includes(t.fullName)
      )
    );
  };

  const absentTeachers = getAbsentTeachers();

  // Set default active absent teacher when list changes
  useEffect(() => {
    if (absentTeachers.length > 0) {
      const stillAbsent = absentTeachers.find(t => t.id === activeAbsentTeacher?.id);
      if (!stillAbsent) {
        setActiveAbsentTeacher(absentTeachers[0]);
      }
    } else {
      setActiveAbsentTeacher(null);
    }
  }, [dbData]);

  // Find candidate teachers who are FREE in this period
  const getCandidatesForPeriod = (periodId: string, scheduleId: string) => {
    if (!dbData) return [];
    const absentIds = absentTeachers.map(t => t.id);
    
    return dbData.teachers
      .filter(t => !absentIds.includes(t.id))
      .map(t => {
        // Check schedule
        const isTeaching = dbData.schedules.find(s => s.teacherId === t.id && s.periodId === periodId);
        const scoreInfo = t.fitnessScores?.[scheduleId] || { fitnessScore: 0, reasons: [] };
        return {
          teacher: t,
          isAvailable: !isTeaching,
          load: dbData.loads[t.id] || 0,
          score: scoreInfo.fitnessScore,
          reasons: scoreInfo.reasons,
          currentClass: isTeaching ? `${isTeaching.subjectCode} (${isTeaching.classroom})` : null
        };
      })
      .sort((a, b) => {
        if (a.isAvailable && !b.isAvailable) return -1;
        if (!a.isAvailable && b.isAvailable) return 1;
        return b.score - a.score; // higher fitness score first
      });
  };

  // Perform substitute assignment
  const handleAssignSubstitute = async (subTeacher: any) => {
    if (!dbData || !activeAbsentTeacher || targetPeriod === null || !targetPeriodId || !targetSubject) return;

    // Get existing logs for this absent teacher, excluding target period
    const otherLogs = dbData.logs.filter(
      l => l.absentTeacherId === activeAbsentTeacher.id && l.periodId !== targetPeriodId
    );

    const recordsToSave = [
      ...otherLogs.map(l => ({
        date: selectedDate,
        absentTeacherId: l.absentTeacherId,
        substituteTeacherId: l.substituteTeacherId,
        periodId: l.periodId,
        subjectCode: l.subjectCode,
        subjectName: l.subjectName,
        classroom: l.classroom,
        remark: l.remark
      })),
      {
        date: selectedDate,
        absentTeacherId: activeAbsentTeacher.id,
        substituteTeacherId: subTeacher.id,
        periodId: targetPeriodId,
        subjectCode: targetSubject.code,
        subjectName: targetSubject.name,
        classroom: targetSubject.classroom,
        remark: `จัดสอนแทนโดยระบบวิชาการ สาระวิชา ${activeAbsentTeacher.department}`
      }
    ];

    try {
      const res = await saveSubstitutionLogs(recordsToSave);
      if (res.success) {
        triggerToast(lang === "th" ? "บันทึกการจัดครูสอนแทนเรียบร้อยแล้ว!" : "Successfully assigned substitute teacher!");
        await loadPageData();
      } else {
        alert(res.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  // Delete substitution log
  const handleDeleteLog = async (logId: string) => {
    if (window.confirm(lang === "th" ? "ต้องการลบประวัติการสอนแทนนี้หรือไม่?" : "Are you sure you want to delete this substitution log?")) {
      try {
        const res = await deleteSubstitutionLog(logId);
        if (res.success) {
          triggerToast(lang === "th" ? "ลบประวัติสำเร็จ!" : "Deleted log successfully!");
          await loadPageData();
        } else {
          alert(res.error || "เกิดข้อผิดพลาดในการลบ");
        }
      } catch (err: any) {
        alert("เกิดข้อผิดพลาด: " + err.message);
      }
    }
  };

  // Print Preview
  const handlePrint = () => {
    if (!dbData) return;
    const logsForDate = dbData.logs;
    
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
    if (!dbData) return;
    const logsForDate = dbData.logs;
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

      {!dbData ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-border rounded-xl">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold">{lang === "th" ? "กำลังโหลดข้อมูล..." : "Loading..."}</span>
        </div>
      ) : (
        <>
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

                {/* Add Manual Absent Teacher Button */}
                <button
                  onClick={() => setIsAddingAbsent(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 border border-rose-200/50 dark:border-rose-800/30 rounded-2xl text-xs font-extrabold transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {lang === "th" ? "ระบุครูผู้ลาเพิ่มเติม (นอกระบบ)" : "Add Absent Teacher Manually"}
                </button>
                
                {absentTeachers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border/80 bg-muted/20 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400" />
                    <p className="text-sm font-bold text-slate-500">
                      {lang === "th" ? "ไม่มีคุณครูส่งใบลาที่ได้รับการอนุมัติในวันนี้" : "No approved absent teachers found."}
                    </p>
                    <p className="text-xs text-slate-400 max-w-[200px]">
                      {lang === "th" ? "ระบุวันอื่น หรือคลิกปุ่มด้านบนเพื่อเพิ่มครูผู้ลานอกระบบด้วยตนเอง" : "Select another date or click above to add manually."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {absentTeachers.map((t) => {
                      const isSelected = activeAbsentTeacher?.id === t.id;
                      const periodsCount = dbData ? dbData.schedules.filter(s => s.teacherId === t.id).length : 0;
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
                              {t.fullName.substring(0, 2)}
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
                            <div className="flex items-center gap-1.5 mt-1">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm(lang === "th" ? `ต้องการยกเลิกสถานะลาของคุณครู ${t.fullName} หรือไม่? (ระบบจะทำการล้างคาบสอนแทนของครูท่านนี้บนวันที่เลือกทั้งหมดด้วย)` : `Do you want to cancel the absent status for ${t.fullName}? This will also wipe their substitutions on this day.`)) {
                                    setLoading(true);
                                    try {
                                      const res = await removeAbsentTeacherManually(t.id, selectedDate);
                                      if (res.success) {
                                        triggerToast(res.message);
                                        if (activeAbsentTeacher?.id === t.id) {
                                          setActiveAbsentTeacher(null);
                                        }
                                        await loadPageData();
                                      } else {
                                        alert(res.error || "ไม่สามารถดำเนินการได้");
                                      }
                                    } catch (err: any) {
                                      alert("เกิดข้อผิดพลาด: " + err.message);
                                    } finally {
                                      setLoading(false);
                                    }
                                  }
                                }}
                                className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-550 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title={lang === "th" ? "ยกเลิกผู้ลา" : "Cancel Absentee"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? "translate-x-1" : ""}`} />
                            </div>
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
                    <div className="flex items-center gap-2">
                      {/* AI Auto-Substitute Button */}
                      <button
                        onClick={async () => {
                          if (confirm(lang === "th" ? `ต้องการให้ AI คำนวณและจัดสอนแทนอัตโนมัติสำหรับคุณครู ${activeAbsentTeacher.fullName} หรือไม่?` : `Do you want AI to automatically find and assign substitutes for ${activeAbsentTeacher.fullName}?`)) {
                            setLoading(true);
                            try {
                              const res = await autoAssignSubstitutesForTeacher(activeAbsentTeacher.id, selectedDate);
                              if (res.success) {
                                triggerToast(res.message);
                                await loadPageData();
                              } else {
                                alert(res.error || "เกิดข้อผิดพลาดในการจัดสอนแทนอัตโนมัติ");
                              }
                            } catch (err: any) {
                              alert("เกิดข้อผิดพลาด: " + err.message);
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                        className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {lang === "th" ? "จัดแทนอัตโนมัติ (AI)" : "Auto Substitute (AI)"}
                      </button>
                      
                      <div className="text-xs px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full font-black">
                        {lang === "th" ? "วิกฤต: ต้องการจัดสอนแทน" : "Urgent action required"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Timetable slots */}
                {!activeAbsentTeacher ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground/60 space-y-2">
                    <Clock className="w-12 h-12 text-slate-300" />
                    <p className="text-sm font-bold">{lang === "th" ? "ไม่มีผู้ลาให้จัดสอนแทนในวันนี้" : "Select an absent teacher to view schedules."}</p>
                  </div>
                ) : !dbData || dbData.schedules.filter(s => s.teacherId === activeAbsentTeacher.id).length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground/60 space-y-2">
                    <BookOpen className="w-12 h-12 text-slate-300" />
                    <p className="text-sm font-bold">{lang === "th" ? "ครูผู้ลาไม่มีตารางสอนในวันนี้" : "No teaching schedule found for this instructor on this day."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dbData.periods.map((period) => {
                      const classData = dbData.schedules.find(
                        s => s.teacherId === activeAbsentTeacher.id && s.periodId === period.id
                      );
                      if (!classData) return null;

                      // Check if substitution log already assigned for this period
                      const assignedLog = dbData.logs.find(
                        l => l.absentTeacherId === activeAbsentTeacher.id && l.periodId === period.id
                      );

                      return (
                        <div 
                          key={period.id} 
                          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between h-48 ${
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
                                {lang === "th" ? `คาบที่ ${period.order}` : `Period ${period.order}`}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-black">
                                {period.startTime} - {period.endTime}
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
                                <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                                  {lang === "th" ? `ครูผู้แทน: ${assignedLog.substituteTeacherName}` : `Sub: ${assignedLog.substituteTeacherName}`}
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
                                className="p-2 hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                                title={lang === "th" ? "ยกเลิกการสอนแทน" : "Cancel substitution"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  setTargetPeriod(period.order);
                                  setTargetPeriodId(period.id);
                                  setTargetScheduleId(classData.id);
                                  setTargetSubject({
                                    code: classData.subjectCode,
                                    name: classData.subjectName,
                                    classroom: classData.classroom
                                  });
                                  setIsAssigning(true);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1 cursor-pointer"
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
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-all border border-border flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {lang === "th" ? "พิมพ์สรุปรายงาน" : "Print Summary"}
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {lang === "th" ? "ดาวน์โหลด CSV" : "Export CSV"}
                </button>
              </div>
            </div>

            {dbData.logs.length === 0 ? (
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
                    {dbData.logs.map((l) => (
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
                            className="text-xs text-rose-500 hover:text-rose-600 font-extrabold flex items-center gap-1 hover:underline cursor-pointer"
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
        </>
      )}

      {/* 4. Smart Substitute Assignment Modal */}
      {isAssigning && targetPeriod !== null && targetPeriodId && targetScheduleId && targetSubject && dbData && (
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
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-indigo-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List candidate teachers */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-indigo-900/80 dark:text-indigo-200/80">
                  <p className="font-extrabold">{lang === "th" ? "เกณฑ์แนะนำความเหมาะสม (Fitness Score)" : "Recommendation Criteria (Fitness Score)"}</p>
                  <p className="mt-1 font-semibold">
                    {lang === "th" 
                      ? "ระบบวิเคราะห์คุณลักษณะ (1) กลุ่มสาระ/ประวัติสอน (+40) (2) คาบว่างในตารางปกติ (+40) และ (3) สถิติสอนแทนสะสมย้อนหลังน้อยที่สุด (+20) เพื่อกระจายงานแทนที่เป็นธรรมสูงสุด" 
                      : "Sorted by matching attributes: Same subject group/history (+40), Free schedule period (+40), and low cumulative substitute load (+20)."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  {lang === "th" ? "รายชื่อบุคลากรที่แนะนำ" : "Available Candidates"}
                </h5>

                {getCandidatesForPeriod(targetPeriodId, targetScheduleId).map(({ teacher: t, isAvailable, load, score, reasons, currentClass }) => {
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
                          {t.fullName.substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-sm text-foreground">{t.fullName}</span>
                            {isSameGroup && (
                              <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-md border border-emerald-500/10">
                                {lang === "th" ? "กลุ่มสาระเดียวกัน" : "Same Dept"}
                              </span>
                            )}
                            {isAvailable && (
                              <span className="text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded-md border border-indigo-500/10">
                                Fit: {score}%
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            {t.position} • {t.department}
                          </p>
                          
                          {/* Reasons explanation */}
                          {isAvailable && reasons && reasons.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {reasons.map((reason: string, idx: number) => (
                                <span key={idx} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-medium">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          )}
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
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 self-end sm:self-auto cursor-pointer"
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

      {/* 5. Add Manual Absent Teachers Modal (Bulk checklist) */}
      {isAddingAbsent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h4 className="text-lg font-black text-foreground">
                  {lang === "th" ? "ระบุครูผู้ลาเพิ่มเติม (นอกระบบ)" : "Add Absent Teachers Manually"}
                </h4>
                <p className="text-xs text-muted-foreground font-semibold mt-1">
                  {lang === "th" 
                    ? "เลือกคุณครูผู้ลาพร้อมกันหลายท่านเพื่อจำลองสถานะการลาภายนอกระบบ e-Leave"
                    : "Select multiple teachers to create mock approved leave statuses."}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsAddingAbsent(false);
                  setSelectedAbsentTeacherIds([]);
                  setManualTeacherSearchQuery("");
                }}
                className="p-1.5 hover:bg-muted rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Actions Bar */}
            <div className="px-6 py-3 bg-muted/20 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={lang === "th" ? "ค้นหาชื่อคุณครู..." : "Search teacher..."}
                  value={manualTeacherSearchQuery}
                  onChange={(e) => setManualTeacherSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-805 border border-border/40 rounded-xl font-bold focus:ring-2 focus:ring-indigo-550 focus:border-indigo-600 outline-none text-foreground"
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    const eligible = initialTeachers
                      .filter(t => !absentTeachers.some(at => at.id === t.id))
                      .filter(t => t.fullName.toLowerCase().includes(manualTeacherSearchQuery.toLowerCase()))
                      .map(t => t.id);
                    setSelectedAbsentTeacherIds(prev => Array.from(new Set([...prev, ...eligible])));
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground text-[10px] font-black rounded-lg transition-colors cursor-pointer border border-border/60"
                >
                  {lang === "th" ? "เลือกทั้งหมด" : "Select All"}
                </button>
                <button
                  onClick={() => {
                    setSelectedAbsentTeacherIds([]);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground text-[10px] font-black rounded-lg transition-colors cursor-pointer border border-border/60"
                >
                  {lang === "th" ? "ล้างทั้งหมด" : "Clear All"}
                </button>
              </div>
            </div>

            {/* Checkbox List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-2 max-h-[40vh] custom-scrollbar">
              {initialTeachers
                .filter(t => !absentTeachers.some(at => at.id === t.id))
                .filter(t => t.fullName.toLowerCase().includes(manualTeacherSearchQuery.toLowerCase()))
                .length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
                    {lang === "th" ? "ไม่พบรายชื่อคุณครูที่สามารถระบุลาได้" : "No available teachers found."}
                  </div>
                ) : (
                  initialTeachers
                    .filter(t => !absentTeachers.some(at => at.id === t.id))
                    .filter(t => t.fullName.toLowerCase().includes(manualTeacherSearchQuery.toLowerCase()))
                    .map(t => {
                      const isChecked = selectedAbsentTeacherIds.includes(t.id);
                      return (
                        <label 
                          key={t.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isChecked 
                              ? "border-rose-350 bg-rose-500/[0.03] dark:border-rose-950/40" 
                              : "border-border/60 hover:bg-muted/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedAbsentTeacherIds(prev => prev.filter(id => id !== t.id));
                              } else {
                                setSelectedAbsentTeacherIds(prev => [...prev, t.id]);
                              }
                            }}
                            className="rounded border-border text-rose-600 focus:ring-rose-500/20 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs font-extrabold text-foreground">{t.fullName}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{t.position} • {t.department}</p>
                          </div>
                        </label>
                      );
                    })
                )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border flex justify-between items-center shrink-0 bg-muted/10">
              <span className="text-xs font-bold text-muted-foreground">
                {lang === "th" ? `เลือกแล้ว ${selectedAbsentTeacherIds.length} ท่าน` : `Selected ${selectedAbsentTeacherIds.length} teachers`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsAddingAbsent(false);
                    setSelectedAbsentTeacherIds([]);
                    setManualTeacherSearchQuery("");
                  }}
                  className="px-4 py-2 text-xs font-extrabold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  {lang === "th" ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  onClick={async () => {
                    if (selectedAbsentTeacherIds.length === 0) {
                      alert(lang === "th" ? "กรุณาเลือกคุณครูอย่างน้อย 1 ท่าน" : "Please select at least 1 teacher");
                      return;
                    }
                    setLoading(true);
                    try {
                      const res = await bulkAddAbsentTeachersManually(selectedAbsentTeacherIds, selectedDate);
                      if (res.success) {
                        triggerToast(res.message);
                        setIsAddingAbsent(false);
                        setSelectedAbsentTeacherIds([]);
                        setManualTeacherSearchQuery("");
                        await loadPageData();
                      } else {
                        alert(res.error || "เกิดข้อผิดพลาดในการบันทึก");
                      }
                    } catch (err: any) {
                      alert("เกิดข้อผิดพลาด: " + err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {lang === "th" ? "บันทึก" : "Save"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
