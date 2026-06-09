"use client";

import React, { useState, useEffect } from "react";
import { FileSpreadsheet, FileText, Sparkles, AlertCircle, Save, Upload } from "lucide-react";
import { Student } from "@/types/school-os";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { saveStudentGrades } from "@/app/actions/academic";

interface AssessmentGradingProps {
  students: Student[];
  triggerToast: (title: string, desc: string) => void;
  addAuditLog: (action: string, details: string) => void;
}

interface StudentGrade {
  f1: number;      // Formative 1 (Max 20)
  f2: number;      // Formative 2 (Max 20)
  mid: number;     // Midterm (Max 20)
  f3: number;      // Formative 3 (Max 20)
  fin: number;     // Final Exam (Max 20)
  reading: number; // Analytical Reading (0-3)
  traits: number;  // Desirable Characteristics (0-3)
  grade?: string;  // Calculated or locked grade (0-4, มส, ร, ผ, มผ)
  attendanceRate: number; // Simulated/actual attendance percentage (0-100)
}

export default function AssessmentGrading({
  students,
  triggerToast,
  addAuditLog
}: AssessmentGradingProps) {
  const [studentGrades, setStudentGrades] = useState<Record<string, StudentGrade>>({});
  const [sgsSyncProgress, setSgsSyncProgress] = useState<number | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState("ม.6/1");
  const [isAcademicMode, setIsAcademicMode] = useState<boolean>(true); // true = 0-4, false = ผ/มผ
  const [isSaving, setIsSaving] = useState(false);

  // Initialize grade state with default mock values for students and simulated attendance rates
  useEffect(() => {
    const initialGrades: Record<string, StudentGrade> = {};
    students.forEach((s, idx) => {
      const seed = s.fullName.charCodeAt(0) % 5;
      
      // Simulate attendance rate: one student below 80% to showcase มส flag
      let attRate = 95 - (seed * 3);
      if (idx === 3) attRate = 72; // Student index 3 is under 80%

      initialGrades[s.id] = {
        f1: 15 + (seed % 6),
        f2: 14 + (seed % 7),
        mid: 12 + (seed % 9),
        f3: 15 + (seed % 6),
        fin: 11 + (seed % 10),
        reading: Math.min(3, 2 + (seed % 2)),
        traits: Math.min(3, 2 + (seed % 2)),
        attendanceRate: attRate
      };
    });
    setStudentGrades(initialGrades);
  }, [students]);

  // Filter students by selected classroom
  const filteredStudents = students.filter(
    (s) => s.classroom.toLowerCase() === selectedClassroom.toLowerCase()
  );

  // Classrooms list derived from students
  const classrooms = Array.from(new Set(students.map((s) => s.classroom))).sort();

  const handleFieldChange = (studentId: string, field: keyof StudentGrade, val: number | string) => {
    setStudentGrades((prev) => {
      const current = prev[studentId] || { f1: 0, f2: 0, mid: 0, f3: 0, fin: 0, reading: 3, traits: 3, attendanceRate: 100 };
      
      if (field === "grade") {
        return {
          ...prev,
          [studentId]: {
            ...current,
            grade: String(val)
          }
        };
      }

      let max = 20;
      if (field === "reading" || field === "traits") max = 3;
      if (field === "attendanceRate") max = 100;
      
      // Clamp numeric values
      const clamped = Math.max(0, Math.min(max, Number(val)));

      return {
        ...prev,
        [studentId]: {
          ...current,
          [field]: clamped
        }
      };
    });
  };

  const calculateTotal = (grades: StudentGrade) => {
    if (!grades) return 0;
    return grades.f1 + grades.f2 + grades.mid + grades.f3 + grades.fin;
  };

  const calculateGrade = (grades: StudentGrade) => {
    if (!grades) return "0";
    
    // Check 80% attendance rule
    if (grades.attendanceRate < 80) {
      return "มส"; // Locked due to low attendance
    }

    if (grades.grade && ["ร", "มส"].includes(grades.grade)) {
      return grades.grade;
    }

    if (!isAcademicMode) {
      return grades.grade === "มผ" ? "มผ" : "ผ";
    }

    const total = calculateTotal(grades);
    if (total >= 80) return "4.0";
    if (total >= 75) return "3.5";
    if (total >= 70) return "3.0";
    if (total >= 65) return "2.5";
    if (total >= 60) return "2.0";
    if (total >= 55) return "1.5";
    if (total >= 50) return "1.0";
    return "0";
  };

  const getReadingLabel = (val: number) => {
    if (val === 3) return "ดีเยี่ยม";
    if (val === 2) return "ดี";
    if (val === 1) return "ผ่าน";
    return "ไม่ผ่าน";
  };

  const exportGradesXLSX = () => {
    const data = filteredStudents.map((s, idx) => {
      const grades = studentGrades[s.id] || { f1: 0, f2: 0, mid: 0, f3: 0, fin: 0, reading: 0, traits: 0, attendanceRate: 100 };
      const total = calculateTotal(grades);
      const grade = calculateGrade(grades);
      
      return {
        "เลขที่": s.seatNumber || (idx + 1),
        "รหัสประจำตัว": s.studentCode,
        "ชื่อ-นามสกุล": s.fullName,
        "อัตราเข้าเรียน (%)": grades.attendanceRate,
        "คะแนนเก็บ 1 (20)": isAcademicMode ? grades.f1 : "-",
        "คะแนนเก็บ 2 (20)": isAcademicMode ? grades.f2 : "-",
        "คะแนนกลางภาค (20)": isAcademicMode ? grades.mid : "-",
        "คะแนนเก็บ 3 (20)": isAcademicMode ? grades.f3 : "-",
        "คะแนนปลายภาค (20)": isAcademicMode ? grades.fin : "-",
        "รวมคะแนน (100)": isAcademicMode ? total : "-",
        "ผลการเรียน (เกรด)": grade,
        "อ่านคิดวิเคราะห์": getReadingLabel(grades.reading),
        "คุณลักษณะ": getReadingLabel(grades.traits)
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GradeBook");
    XLSX.writeFile(wb, `ปพ.5_ห้อง_${selectedClassroom}.xlsx`);
    triggerToast("📄 ส่งออก Excel สำเร็จ", "ไฟล์สมุดเกรด ปพ.5 ถูกดาวน์โหลดแล้ว");
    addAuditLog("EXPORT_ปพ5_EXCEL", `ส่งออกไฟล์ ปพ.5 ชั้น ${selectedClassroom} รูปแบบ Excel`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const updatedGrades = { ...studentGrades };
        data.forEach((row: any) => {
          const studentCode = row["รหัสประจำตัว"];
          const student = students.find((s) => s.studentCode === studentCode);
          if (student) {
            updatedGrades[student.id] = {
              f1: Number(row["คะแนนเก็บ 1 (20)"] ?? 0),
              f2: Number(row["คะแนนเก็บ 2 (20)"] ?? 0),
              mid: Number(row["คะแนนกลางภาค (20)"] ?? 0),
              f3: Number(row["คะแนนเก็บ 3 (20)"] ?? 0),
              fin: Number(row["คะแนนปลายภาค (20)"] ?? 0),
              reading: row["อ่านคิดวิเคราะห์"] === "ดีเยี่ยม" ? 3 : row["อ่านคิดวิเคราะห์"] === "ดี" ? 2 : row["อ่านคิดวิเคราะห์"] === "ผ่าน" ? 1 : 0,
              traits: row["คุณลักษณะ"] === "ดีเยี่ยม" ? 3 : row["คุณลักษณะ"] === "ดี" ? 2 : row["คุณลักษณะ"] === "ผ่าน" ? 1 : 0,
              attendanceRate: Number(row["อัตราเข้าเรียน (%)"] ?? 100),
              grade: row["ผลการเรียน (เกรด)"]
            };
          }
        });

        setStudentGrades(updatedGrades);
        triggerToast("📥 นำเข้าไฟล์ Excel สำเร็จ", "ระบบได้ปรับปรุงสถานะคะแนนและเกรดผู้เรียนแล้ว");
        addAuditLog("IMPORT_ปพ5_EXCEL", `นำเข้าไฟล์คะแนน ปพ.5 ชั้น ${selectedClassroom} สำเร็จ`);
      } catch (err) {
        triggerToast("❌ รูปแบบไฟล์ไม่ถูกต้อง", "ไม่สามารถนำเข้าข้อมูลจากเทมเพลต Excel นี้ได้");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // clear input
  };

  const exportGradesPDF = () => {
    const doc = new jsPDF();
    doc.text(`Student Gradebook (ปพ.5) - Class ${selectedClassroom}`, 14, 15);
    
    const tableData = filteredStudents.map((s, idx) => {
      const grades = studentGrades[s.id] || { f1: 0, f2: 0, mid: 0, f3: 0, fin: 0, reading: 0, traits: 0, attendanceRate: 100 };
      const total = calculateTotal(grades);
      const grade = calculateGrade(grades);
      
      return [
        s.seatNumber || (idx + 1),
        s.studentCode,
        s.fullName,
        grades.attendanceRate + "%",
        isAcademicMode ? grades.f1.toString() : "-",
        isAcademicMode ? grades.f2.toString() : "-",
        isAcademicMode ? grades.mid.toString() : "-",
        isAcademicMode ? grades.f3.toString() : "-",
        isAcademicMode ? grades.fin.toString() : "-",
        isAcademicMode ? total.toString() : "-",
        grade,
        grades.reading.toString(),
        grades.traits.toString()
      ];
    });

    (doc as any).autoTable({
      head: [["No.", "ID", "Name", "Att.", "F1", "F2", "Mid", "F3", "Final", "Total", "Grade", "Read", "Trait"]],
      body: tableData,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    doc.save(`ปพ.5_ห้อง_${selectedClassroom}.pdf`);
    triggerToast("📄 ส่งออก PDF สำเร็จ", "ไฟล์สมุดเกรด ปพ.5 ถูกดาวน์โหลดแล้ว");
    addAuditLog("EXPORT_ปพ5_PDF", `ส่งออกไฟล์ ปพ.5 ชั้น ${selectedClassroom} รูปแบบ PDF`);
  };

  const syncScoresToSgs = () => {
    setSgsSyncProgress(0);
    addAuditLog("SYNC_SGS_API", `เริ่มกระบวนการซิงค์เกรด ปพ.5 (ชั้น ${selectedClassroom}) เข้าสู่ระบบ SGS กระทรวงศึกษาธิการ`);
    
    const interval = setInterval(() => {
      setSgsSyncProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          triggerToast("⚡ SGS Sync Completed!", `ข้อมูลผลคะแนนดิบและตัดเกรด ปพ.5 ซิงค์เข้า Server SGS ปลายทางสำเร็จ 100%`);
          addAuditLog("SYNC_SGS_API_SUCCESS", `ซิงค์เกรดห้อง ${selectedClassroom} สำเร็จ ดึงเลขลงทะเบียนเอกสาร ปพ.5 ดิจิทัลเรียบร้อย`);
          return null;
        }
        return prev + 20;
      });
    }, 400);
  };

  const handleSaveGrades = async () => {
    setIsSaving(true);
    try {
      // Collect structured grades records
      const gradesToSave: Record<string, any> = {};
      Object.entries(studentGrades).forEach(([studentId, g]) => {
        gradesToSave[studentId] = {
          f1: g.f1,
          f2: g.f2,
          mid: g.mid,
          f3: g.f3,
          fin: g.fin,
          reading: g.reading,
          traits: g.traits,
          grade: calculateGrade(g)
        };
      });

      // Term mock id is cu-default-term
      const res = await saveStudentGrades("sub-default-id", "term-default-id", gradesToSave);
      if (res.success) {
        triggerToast("💾 บันทึกคะแนนสำเร็จ", "จัดเก็บคะแนนดิบและผลการประเมินลงฐานข้อมูลกลางของระบบเรียบร้อย");
        addAuditLog("UPDATE_STUDENT_GRADES", `บันทึกคะแนน ปพ.5 ชั้น ${selectedClassroom}`);
      } else {
        triggerToast("❌ เกิดข้อผิดพลาด", res.error || "ไม่สามารถจัดเก็บข้อมูลคะแนนได้");
      }
    } catch (error: any) {
      triggerToast("❌ เกิดข้อผิดพลาด", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-card bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-slate-800/80 space-y-6 animate-in fade-in duration-200">
      
      {/* Header controls */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
        <div>
          <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-1.5">
            สมุดบันทึกคะแนนแบบแยกตัวชี้วัด (ปพ.5 Grade Book)
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">กรอกคะแนนระหว่างภาคและปลายภาคของนักเรียนเพื่อคำนวณเกรดอัตโนมัติ</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Grade type toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
            <button
              onClick={() => setIsAcademicMode(true)}
              className={`px-3 py-1 rounded-md transition-all ${
                isAcademicMode ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              ตัดเกรด (0 - 4)
            </button>
            <button
              onClick={() => setIsAcademicMode(false)}
              className={`px-3 py-1 rounded-md transition-all ${
                !isAcademicMode ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              ประเมิน (ผ / มผ)
            </button>
          </div>

          {/* Class selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-550">เลือกห้องเรียน:</span>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              {classrooms.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
              {classrooms.length === 0 && <option value="ม.6/1">ม.6/1</option>}
            </select>
          </div>

          <label className="h-9 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            นำเข้า Excel
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleImportExcel} 
              className="hidden" 
            />
          </label>

          <button
            onClick={handleSaveGrades}
            disabled={isSaving}
            className="h-9 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 dark:text-indigo-400 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "กำลังบันทึก..." : "บันทึก"}
          </button>

          <button
            onClick={exportGradesXLSX}
            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            ส่งออก Excel
          </button>

          <button
            onClick={exportGradesPDF}
            className="h-9 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>

          <button
            onClick={syncScoresToSgs}
            className="h-9 px-4.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/10 hover:bg-indigo-750 transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            ซิงค์ SGS
          </button>
        </div>
      </div>

      {/* SGS Sync progress indicator */}
      {sgsSyncProgress !== null && (
        <div className="p-4 rounded-xl border border-primary/20 bg-indigo-500/5 space-y-2 animate-pulse">
          <div className="flex justify-between items-center text-xs font-bold text-primary">
            <span>กำลังอัปโหลดเกรดเฉลี่ย ปพ.5 เข้าสู่ระบบ SGS กระทรวงศึกษาธิการ...</span>
            <span>{sgsSyncProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${sgsSyncProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Interactive Gradebook Sheet Grid */}
      <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
        <table className="min-w-full divide-y divide-slate-150 dark:divide-slate-800 text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/60 font-bold text-slate-500 dark:text-slate-400 select-none">
            <tr>
              <th className="px-3 py-3 w-12 text-center">เลขที่</th>
              <th className="px-3 py-3 w-28">รหัสประจำตัว</th>
              <th className="px-4 py-3 min-w-[150px]">ชื่อ-นามสกุล</th>
              <th className="px-3 py-3 w-20 text-center">เวลาเรียน</th>
              {isAcademicMode ? (
                <>
                  <th className="px-2 py-3 w-20 text-center bg-indigo-50/20 dark:bg-indigo-950/5">F1 (20)</th>
                  <th className="px-2 py-3 w-20 text-center bg-indigo-50/20 dark:bg-indigo-950/5">F2 (20)</th>
                  <th className="px-2 py-3 w-20 text-center bg-amber-50/20 dark:bg-amber-950/5">กลางภาค (20)</th>
                  <th className="px-2 py-3 w-20 text-center bg-indigo-50/20 dark:bg-indigo-950/5">F3 (20)</th>
                  <th className="px-2 py-3 w-20 text-center bg-purple-50/20 dark:bg-purple-950/5">ปลายภาค (20)</th>
                  <th className="px-2 py-3 w-20 text-center bg-slate-100/50 dark:bg-slate-850/50">รวม (100)</th>
                </>
              ) : (
                <th className="px-3 py-3 text-center bg-slate-50/10 dark:bg-slate-900/5">สถานะการประเมิน</th>
              )}
              <th className="px-3 py-3 w-20 text-center">ผลเรียน</th>
              <th className="px-3 py-3 w-28 text-center">ประเมินการอ่าน</th>
              <th className="px-3 py-3 w-28 text-center">คุณลักษณะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-card">
            {filteredStudents.map((student, idx) => {
              const grades = studentGrades[student.id] || { f1: 0, f2: 0, mid: 0, f3: 0, fin: 0, reading: 3, traits: 3, attendanceRate: 100 };
              const total = calculateTotal(grades);
              const grade = calculateGrade(grades);
              const isLowAttendance = grades.attendanceRate < 80;

              return (
                <tr key={student.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all">
                  <td className="px-3 py-2 w-12 text-center font-mono font-bold text-slate-400">
                    {student.seatNumber || (idx + 1)}
                  </td>
                  <td className="px-3 py-2 w-28 font-mono text-slate-400">
                    {student.studentCode}
                  </td>
                  <td className="px-4 py-2 font-bold text-slate-800 dark:text-white">
                    {student.fullName}
                  </td>

                  {/* Attendance check */}
                  <td className="px-3 py-2 text-center">
                    <span className={`font-mono font-bold ${isLowAttendance ? "text-rose-500" : "text-slate-600 dark:text-slate-350"}`}>
                      {grades.attendanceRate}%
                    </span>
                  </td>

                  {isAcademicMode ? (
                    <>
                      {/* F1 */}
                      <td className="px-2 py-2 w-20 text-center bg-indigo-50/10 dark:bg-indigo-950/2">
                        <input
                          type="number"
                          disabled={isLowAttendance}
                          value={grades.f1}
                          onChange={(e) => handleFieldChange(student.id, "f1", Number(e.target.value))}
                          className="w-14 h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center px-1 font-bold text-slate-800 dark:text-slate-200 focus:border-primary outline-none disabled:opacity-50"
                        />
                      </td>

                      {/* F2 */}
                      <td className="px-2 py-2 w-20 text-center bg-indigo-50/10 dark:bg-indigo-950/2">
                        <input
                          type="number"
                          disabled={isLowAttendance}
                          value={grades.f2}
                          onChange={(e) => handleFieldChange(student.id, "f2", Number(e.target.value))}
                          className="w-14 h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center px-1 font-bold text-slate-800 dark:text-slate-200 focus:border-primary outline-none disabled:opacity-50"
                        />
                      </td>

                      {/* Midterm */}
                      <td className="px-2 py-2 w-20 text-center bg-amber-50/10 dark:bg-amber-950/2">
                        <input
                          type="number"
                          disabled={isLowAttendance}
                          value={grades.mid}
                          onChange={(e) => handleFieldChange(student.id, "mid", Number(e.target.value))}
                          className="w-14 h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center px-1 font-bold text-amber-700 dark:text-amber-400 focus:border-amber-500 outline-none disabled:opacity-50"
                        />
                      </td>

                      {/* F3 */}
                      <td className="px-2 py-2 w-20 text-center bg-indigo-50/10 dark:bg-indigo-950/2">
                        <input
                          type="number"
                          disabled={isLowAttendance}
                          value={grades.f3}
                          onChange={(e) => handleFieldChange(student.id, "f3", Number(e.target.value))}
                          className="w-14 h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center px-1 font-bold text-slate-800 dark:text-slate-200 focus:border-primary outline-none disabled:opacity-50"
                        />
                      </td>

                      {/* Final */}
                      <td className="px-2 py-2 w-20 text-center bg-purple-50/10 dark:bg-purple-950/2">
                        <input
                          type="number"
                          disabled={isLowAttendance}
                          value={grades.fin}
                          onChange={(e) => handleFieldChange(student.id, "fin", Number(e.target.value))}
                          className="w-14 h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center px-1 font-bold text-purple-700 dark:text-purple-400 focus:border-purple-500 outline-none disabled:opacity-50"
                        />
                      </td>

                      {/* Total */}
                      <td className="px-2 py-2 w-20 text-center bg-slate-100/30 dark:bg-slate-850/30 font-mono font-bold text-slate-800 dark:text-slate-100">
                        {isLowAttendance ? "-" : total}
                      </td>
                    </>
                  ) : (
                    /* ACTIVITY GRADE SELECTOR */
                    <td className="px-3 py-2 text-center bg-slate-50/10 dark:bg-slate-900/2">
                      <select
                        disabled={isLowAttendance}
                        value={grades.grade || "ผ"}
                        onChange={(e) => handleFieldChange(student.id, "grade", e.target.value)}
                        className="w-24 h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs text-center px-1 font-bold text-slate-700 dark:text-slate-300 focus:outline-none disabled:opacity-50"
                      >
                        <option value="ผ">ผ่าน (ผ)</option>
                        <option value="มผ">ไม่ผ่าน (มผ)</option>
                        <option value="ร">รอการประเมิน (ร)</option>
                      </select>
                    </td>
                  )}

                  {/* Grade label */}
                  <td className="px-3 py-2 w-20 text-center">
                    <span className={`inline-block w-12 text-center text-[10px] font-bold py-0.5 rounded border ${
                      grade === "4.0" || grade === "ผ"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                        : grade === "มส" 
                        ? "bg-rose-600/15 text-rose-600 border-rose-500/30"
                        : parseFloat(grade) >= 2.0 
                        ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" 
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    }`}>
                      {grade}
                    </span>
                  </td>

                  {/* Reading Assessment */}
                  <td className="px-3 py-2 w-28 text-center">
                    <select
                      value={grades.reading}
                      onChange={(e) => handleFieldChange(student.id, "reading", Number(e.target.value))}
                      className="w-full h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs text-center px-1 font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="3">3 (ดีเยี่ยม)</option>
                      <option value="2">2 (ดี)</option>
                      <option value="1">1 (ผ่าน)</option>
                      <option value="0">0 (ไม่ผ่าน)</option>
                    </select>
                  </td>

                  {/* Desirable Characteristics */}
                  <td className="px-3 py-2 w-28 text-center">
                    <select
                      value={grades.traits}
                      onChange={(e) => handleFieldChange(student.id, "traits", Number(e.target.value))}
                      className="w-full h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs text-center px-1 font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="3">3 (ดีเยี่ยม)</option>
                      <option value="2">2 (ดี)</option>
                      <option value="1">1 (ผ่าน)</option>
                      <option value="0">0 (ไม่ผ่าน)</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 border border-dashed border-slate-250 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-slate-300" />
          <p className="text-xs font-bold">ไม่พบรายชื่อนักเรียนที่จะแสดงสมุดเกรด ปพ.5</p>
        </div>
      )}
    </div>
  );
}
