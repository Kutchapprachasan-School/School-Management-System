"use client";

import React, { useState, useEffect } from "react";
import { Student, Teacher, LeaveRequest } from "@/types/school-os";
import { Printer, Sliders, Type, Columns, FileText, ChevronRight, Save } from "lucide-react";

interface PrintReportCenterProps {
  students: Student[];
  teachers: Teacher[];
  classroomsList: any[];
  subjectsList: any[];
  leaveRequests: LeaveRequest[];
}

export default function PrintReportCenter({
  students = [],
  teachers = [],
  classroomsList = [],
  subjectsList = [],
  leaveRequests = [],
}: PrintReportCenterProps) {
  const [reportType, setReportType] = useState<"leave_summary" | "teacher_timetable" | "student_timetable" | "academic_grades">("leave_summary");

  // Style customization states
  const [fontFamily, setFontFamily] = useState("Sarabun");
  const [fontSize, setFontSize] = useState(12);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margins, setMargins] = useState<"narrow" | "normal" | "wide">("normal");

  // Selection states
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const fontFamilies = [
    { value: "Sarabun", label: "Sarabun (ทางการ/อ่านง่าย)" },
    { value: "Krungthep", label: "Krungthep (พรีเมียมหัวข้อ)" },
    { value: "Inter", label: "Inter (สไตล์เวิร์ดคลาส)" },
    { value: "Niramit", label: "Niramit (ตัวอักษรกลมมน)" },
    { value: "Krabimuan", label: "Krabimuan (ตัวเขียนตระกูลไทย)" },
  ];

  // Set default selection when lists load
  useEffect(() => {
    if (classroomsList.length > 0 && !selectedClassroom) {
      setSelectedClassroom(classroomsList[0].name || classroomsList[0].id);
    }
  }, [classroomsList]);

  useEffect(() => {
    if (teachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers]);

  useEffect(() => {
    if (subjectsList.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjectsList[0].code || subjectsList[0].id);
    }
  }, [subjectsList]);

  // Load configuration from localStorage per report type
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`schoolos_print_settings_${reportType}`);
      if (saved) {
        try {
          const config = JSON.parse(saved);
          if (config.fontFamily) setFontFamily(config.fontFamily);
          if (config.fontSize) setFontSize(Number(config.fontSize));
          if (config.orientation) setOrientation(config.orientation);
          if (config.margins) setMargins(config.margins);
        } catch (e) {
          console.warn("Failed to load print settings", e);
        }
      } else {
        // Defaults
        setFontFamily("Sarabun");
        setFontSize(reportType.includes("timetable") ? 10 : 12);
        setOrientation(reportType.includes("timetable") ? "landscape" : "portrait");
        setMargins("normal");
      }
    }
  }, [reportType]);

  // Save configuration to localStorage
  const saveConfig = () => {
    const config = { fontFamily, fontSize, orientation, margins };
    localStorage.setItem(`schoolos_print_settings_${reportType}`, JSON.stringify(config));
  };

  const handlePrint = () => {
    saveConfig();

    // Inject print styling and open printer dialog
    const styleId = "print-report-dynamic-style";
    let existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const marginStyles = {
      narrow: "5mm",
      normal: "15mm",
      wide: "25mm"
    };

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-preview-area, #printable-preview-area * {
          visibility: visible;
        }
        #printable-preview-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white !important;
          color: black !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          font-family: '${fontFamily}', 'Sarabun', sans-serif !important;
          font-size: ${fontSize}pt !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        th, td {
          border: 1px solid #000 !important;
          color: #000 !important;
          padding: 6px !important;
        }
        th {
          background-color: #f0f0f0 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @page {
          size: A4 ${orientation};
          margin: ${marginStyles[margins]};
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
  };

  // Get active items for rendering preview data
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
  const filteredStudents = students.filter(s => s.classroom === selectedClassroom);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
      {/* Control Panel (Left Column) */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Report Selector */}
        <div className="p-5 bg-card border border-border/80 rounded-2xl space-y-3 shadow-sm">
          <label className="text-[10px] font-bold text-muted-foreground uppercase block tracking-wider">
            เลือกรายงานที่ต้องการพิมพ์
          </label>
          <div className="flex flex-col gap-1.5">
            {[
              { id: "leave_summary", label: "สรุปผลการลาของบุคลากร", desc: "สถิติและประวัติยื่นใบลาสะสม" },
              { id: "teacher_timetable", label: "ตารางสอนรายบุคคล (ครู)", desc: "ตารางวิชาประจำตัวคุณครู" },
              { id: "student_timetable", label: "ตารางเรียนรายห้องเรียน (เด็ก)", desc: "ตารางคาบเรียนประจำชั้น" },
              { id: "academic_grades", label: "รายงานคะแนน & ปพ.5", desc: "สรุปคะแนนประเมินและเกรด" }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setReportType(r.id as any)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                  reportType === r.id 
                    ? "bg-primary border-primary text-white" 
                    : "border-border/60 bg-background/50 hover:bg-muted/30 text-foreground"
                }`}
              >
                <span className="text-xs font-bold">{r.label}</span>
                <span className={`text-[9px] ${reportType === r.id ? "text-indigo-100" : "text-muted-foreground"}`}>
                  {r.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters Box */}
        <div className="p-5 bg-card border border-border/80 rounded-2xl space-y-4 shadow-sm">
          <h4 className="text-xs font-bold text-foreground border-b border-border/80 pb-2">
            ตัวเลือกกรองข้อมูล
          </h4>

          {/* Conditional Filters based on Report Type */}
          {reportType === "student_timetable" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground">เลือกห้องเรียน</label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold outline-none cursor-pointer"
              >
                {classroomsList.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === "teacher_timetable" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground">เลือกคุณครู</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold outline-none cursor-pointer"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === "academic_grades" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground">เลือกห้องเรียน</label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold outline-none cursor-pointer"
                >
                  {classroomsList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground">เลือกรายวิชา</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold outline-none cursor-pointer"
                >
                  {subjectsList.map(s => (
                    <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {reportType === "leave_summary" && (
            <p className="text-[10px] text-muted-foreground">รายงานสรุปภาพรวมประวัติคำขอลาของบุคลากรครูและข้าราชการทั้งหมดในระบบ</p>
          )}
        </div>

        {/* Print Options */}
        <div className="p-5 bg-card border border-border/80 rounded-2xl space-y-4 shadow-sm">
          <h4 className="text-xs font-bold text-foreground border-b border-border/80 pb-2 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-500" />
            ตั้งค่ารูปแบบหน้าเอกสาร
          </h4>

          {/* Font Family */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-slate-400" /> รูปแบบตัวอักษร
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold outline-none cursor-pointer"
            >
              {fontFamilies.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
              <span>ขนาดตัวอักษร</span>
              <span className="text-primary">{fontSize} px</span>
            </div>
            <input
              type="range"
              min="10"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Orientation */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground">การวางแนวหน้ากระดาษ</label>
            <div className="grid grid-cols-2 gap-2 bg-muted/60 p-1 rounded-xl border border-border/60">
              <button
                onClick={() => setOrientation("portrait")}
                className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  orientation === "portrait" ? "bg-white dark:bg-slate-800 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                แนวตั้ง (Portrait)
              </button>
              <button
                onClick={() => setOrientation("landscape")}
                className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  orientation === "landscape" ? "bg-white dark:bg-slate-800 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                แนวนอน (Landscape)
              </button>
            </div>
          </div>

          {/* Margins */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground">ระยะขอบกระดาษ (Margins)</label>
            <select
              value={margins}
              onChange={(e) => setMargins(e.target.value as any)}
              className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold outline-none cursor-pointer"
            >
              <option value="narrow">แคบ (5 มม.)</option>
              <option value="normal">ปกติ (15 มม.)</option>
              <option value="wide">กว้าง (25 มม.)</option>
            </select>
          </div>

          {/* Print Trigger */}
          <button
            onClick={handlePrint}
            className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            พิมพ์เอกสารรายงาน
          </button>
        </div>
      </div>

      {/* Live Preview Area (Right Columns) */}
      <div className="lg:col-span-3 p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card flex flex-col gap-4 overflow-hidden">
        <div className="border-b border-border/80 pb-2.5 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              ภาพจำลองก่อนพิมพ์จริง (Interactive Print Preview)
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
              ขนาดและรูปแบบตัวอักษรจะสะท้อนตามแถบควบคุมทางซ้ายมือโดยรอบ
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black border border-amber-500/20 uppercase tracking-widest animate-pulse">
            A4 {orientation === "portrait" ? "แนวตั้ง" : "แนวนอน"}
          </span>
        </div>

        {/* Stylized Sheet simulating A4 Paper */}
        <div className="flex-1 overflow-auto bg-slate-200/50 dark:bg-slate-950/40 p-6 rounded-xl border border-border/60 flex justify-center">
          <div 
            id="printable-preview-area"
            style={{ 
              fontFamily: `${fontFamily}, Sarabun, sans-serif`,
              fontSize: `${fontSize}px`,
            }}
            className={`bg-white text-slate-900 shadow-xl border border-slate-300 p-8 select-none transition-all ${
              orientation === "portrait" 
                ? "w-[595px] min-h-[842px]" 
                : "w-[842px] min-h-[595px]"
            }`}
          >
            {/* School Header */}
            <div className="flex justify-between items-start mb-6 border-b border-slate-300 pb-4">
              <div>
                <h1 className="text-sm font-black uppercase text-indigo-900 tracking-wider">
                  รายงานระบบบริหารจัดการสถานศึกษา (School OS)
                </h1>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  โรงเรียนสาธิตวิทยาการอัจฉริยะ • ฝ่ายแผนการดำเนินงานวิชาการ
                </p>
              </div>
              <div className="text-right text-[8px] text-slate-400">
                <p>เอกสารพิมพ์อัตโนมัติ</p>
                <p>วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")}</p>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-center font-black mb-6 uppercase text-slate-800 tracking-wide text-xs">
              {reportType === "leave_summary" && "สรุปผลการขออนุมัติยื่นใบลาของบุคลากรและข้าราชการครู"}
              {reportType === "teacher_timetable" && `ตารางสอนและภาระการจัดวิชา ประจำตัวครู ${selectedTeacher?.fullName || ""}`}
              {reportType === "student_timetable" && `ตารางคาบเรียนประจำสัปดาห์ ของห้องเรียน ${selectedClassroom}`}
              {reportType === "academic_grades" && `รายงานคะแนนกลางภาคเรียนและปลายภาคเรียน ชั้น ${selectedClassroom}`}
            </h2>

            {/* Report Content Templates */}
            {reportType === "leave_summary" && (
              <div className="space-y-4">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 font-bold">
                      <th className="p-2">ชื่อบุคลากรผู้ขอลา</th>
                      <th className="p-2">ประเภทการลา</th>
                      <th className="p-2">วันเริ่มต้น</th>
                      <th className="p-2">วันสิ้นสุด</th>
                      <th className="p-2 text-center">รวม (วัน)</th>
                      <th className="p-2">สถานะอนุมัติ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {leaveRequests.map((leave, i) => (
                      <tr key={leave.id || i}>
                        <td className="p-2 font-bold">{leave.requesterName}</td>
                        <td className="p-2">{leave.leaveType === "SICK" || leave.leaveType === "ป่วย" ? "ลาป่วย" : leave.leaveType === "PERSONAL" || leave.leaveType === "กิจ" ? "ลากิจ" : "ลาพักผ่อน"}</td>
                        <td className="p-2">{new Date(leave.startDate).toLocaleDateString("th-TH")}</td>
                        <td className="p-2">{new Date(leave.endDate).toLocaleDateString("th-TH")}</td>
                        <td className="p-2 text-center">{Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}</td>
                        <td className="p-2 font-bold text-emerald-700">{leave.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === "teacher_timetable" && (
              <div className="space-y-4">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 font-bold">
                      <th className="p-2 text-left">วัน / คาบ</th>
                      <th className="p-2">1</th>
                      <th className="p-2">2</th>
                      <th className="p-2">3</th>
                      <th className="p-2">4</th>
                      <th className="p-2 bg-slate-200/50">พัก</th>
                      <th className="p-2">5</th>
                      <th className="p-2">6</th>
                      <th className="p-2">7</th>
                      <th className="p-2">8</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"].map((d, i) => (
                      <tr key={d}>
                        <td className="p-2 font-bold text-left bg-slate-50">{d}</td>
                        <td className="p-2 text-[9px]">{i % 2 === 0 ? "ว31101 (ม.1/1)" : "-"}</td>
                        <td className="p-2 text-[9px]">{i % 3 === 0 ? "ค31101 (ม.4/1)" : "-"}</td>
                        <td className="p-2 text-[9px]">-</td>
                        <td className="p-2 text-[9px]">{i === 1 ? "ว31101 (ม.1/2)" : "-"}</td>
                        <td className="p-2 bg-slate-100 font-bold text-[9px]">พัก</td>
                        <td className="p-2 text-[9px]">-</td>
                        <td className="p-2 text-[9px]">{i === 3 ? "ส31101 (ม.6/1)" : "-"}</td>
                        <td className="p-2 text-[9px]">-</td>
                        <td className="p-2 text-[9px]">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === "student_timetable" && (
              <div className="space-y-4">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 font-bold">
                      <th className="p-2 text-left">วัน / คาบ</th>
                      <th className="p-2">1</th>
                      <th className="p-2">2</th>
                      <th className="p-2">3</th>
                      <th className="p-2">4</th>
                      <th className="p-2 bg-slate-200/50">พัก</th>
                      <th className="p-2">5</th>
                      <th className="p-2">6</th>
                      <th className="p-2">7</th>
                      <th className="p-2">8</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"].map((d, i) => (
                      <tr key={d}>
                        <td className="p-2 font-bold text-left bg-slate-50">{d}</td>
                        <td className="p-2 text-[9px]">{i === 0 ? "ท31101" : i === 2 ? "ว31101" : "อ31101"}</td>
                        <td className="p-2 text-[9px]">{i % 2 === 0 ? "ค31101" : "-"}</td>
                        <td className="p-2 text-[9px]">ว31101</td>
                        <td className="p-2 text-[9px]">{i === 4 ? "ส31101" : "-"}</td>
                        <td className="p-2 bg-slate-100 font-bold text-[9px]">พัก</td>
                        <td className="p-2 text-[9px]">แนะแนว</td>
                        <td className="p-2 text-[9px]">{i % 3 === 0 ? "พละ" : "-"}</td>
                        <td className="p-2 text-[9px]">-</td>
                        <td className="p-2 text-[9px]">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === "academic_grades" && (
              <div className="space-y-4">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 font-bold">
                      <th className="p-2 w-16">เลขที่</th>
                      <th className="p-2">รหัสนักเรียน</th>
                      <th className="p-2">ชื่อ - นามสกุล</th>
                      <th className="p-2 text-center">กลางภาค (40)</th>
                      <th className="p-2 text-center">ปลายภาค (60)</th>
                      <th className="p-2 text-center">รวม (100)</th>
                      <th className="p-2 text-center">เกรด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          ไม่พบข้อมูลนักเรียนของห้องเรียน {selectedClassroom}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((std, i) => {
                        const midVal = 25 + (i % 7) * 2;
                        const finVal = 35 + (i % 9) * 2;
                        const total = midVal + finVal;
                        const grade = total >= 80 ? "4.0" : total >= 70 ? "3.0" : total >= 60 ? "2.0" : "1.0";
                        return (
                          <tr key={std.id}>
                            <td className="p-2 text-center">{std.seatNumber || i + 1}</td>
                            <td className="p-2 font-mono">{std.studentCode}</td>
                            <td className="p-2 font-bold">{std.fullName}</td>
                            <td className="p-2 text-center">{midVal}</td>
                            <td className="p-2 text-center">{finVal}</td>
                            <td className="p-2 text-center font-bold">{total}</td>
                            <td className="p-2 text-center font-bold text-indigo-750">{grade}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Signatures */}
            <div className="mt-16 grid grid-cols-2 gap-8 text-center text-[10px]">
              <div>
                <p>ลงชื่อ.............................................................. ผู้จัดทำ</p>
                <p className="mt-2 text-slate-500">( นายแอดมินใจดี รักษ์ปัญญา )</p>
                <p className="text-slate-400">ตำแหน่ง เจ้าหน้าที่งานวิชาการและทะเบียนกลาง</p>
              </div>
              <div>
                <p>ลงชื่อ.............................................................. ผู้อนุมัติ</p>
                <p className="mt-2 text-slate-500">( ดร.สมชาย มุ่งมั่นเพื่อครู )</p>
                <p className="text-slate-400">ตำแหน่ง ผู้อำนวยการสถานศึกษาฝ่ายวิชาการ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
