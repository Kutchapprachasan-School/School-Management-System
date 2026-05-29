"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle2, XCircle, Clock, Save, Sparkles, ChevronLeft, ChevronRight, UserCheck } from "lucide-react";
import { Student } from "@/types/school-os";
import { Button } from "@/components/ui/button";

interface SmartAttendanceTableProps {
  students: Student[];
  lang?: "th" | "en";
  onSave: (attendanceData: Record<string, string>) => void;
}

export default function SmartAttendanceTable({ 
  students, 
  lang = "th",
  onSave 
}: SmartAttendanceTableProps) {
  const [attendance, setAttendance] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    students.forEach(s => {
      initial[s.id] = s.attendanceToday || "present";
    });
    return initial;
  });

  // Chunking (Miller's Law - Grouping data into manageable sizes)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(students.length / itemsPerPage);
  const currentChunk = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return students.slice(start, start + itemsPerPage);
  }, [students, currentPage]);

  const handleStatusChange = (studentId: string, status: string) => {
    // Silent save/update in local state (Invisible UX for the process)
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllAsPresent = () => {
    const updated: Record<string, string> = { ...attendance };
    currentChunk.forEach(s => {
      updated[s.id] = "present";
    });
    setAttendance(updated);
  };

  const handleSubmit = () => {
    onSave(attendance);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Efficiency Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_16px_rgba(0,0,0,0.015)]">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            {lang === "th" ? "เช็คชื่อนักเรียน" : "Take Attendance"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === "th" 
              ? `หน้า ${currentPage} จาก ${totalPages} (ทั้งหมด ${students.length} คน)` 
              : `Page ${currentPage} of ${totalPages} (${students.length} Total)`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={markAllAsPresent}
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:border-emerald-900/50"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {lang === "th" ? "มาเรียนทุกคน (หน้านี้)" : "Mark All Present"}
          </Button>
        </div>
      </div>

      {/* Accessible Data Table & Minimal Surfaces */}
      <div className="bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{lang === "th" ? "เลขที่" : "No."}</th>
                <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{lang === "th" ? "ชื่อ-นามสกุล" : "Name"}</th>
                <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">{lang === "th" ? "สถานะการมาเรียน" : "Status"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {currentChunk.map((student, index) => (
                <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{student.fullName}</span>
                      <span className="text-[10px] text-slate-400">{student.studentId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(student.id, "present")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          attendance[student.id] === "present"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                            : "bg-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {lang === "th" ? "มาเรียน" : "Present"}
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange(student.id, "late")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          attendance[student.id] === "late"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                            : "bg-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {lang === "th" ? "สาย" : "Late"}
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange(student.id, "absent")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          attendance[student.id] === "absent"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 shadow-sm"
                            : "bg-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {lang === "th" ? "ขาด" : "Absent"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-slate-500"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {lang === "th" ? "ก่อนหน้า" : "Prev"}
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center transition-all ${
                  currentPage === i + 1 
                    ? "bg-[#2d2d2d] text-white shadow-sm dark:bg-amber-400 dark:text-amber-950" 
                    : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="text-slate-500"
          >
            {lang === "th" ? "ถัดไป" : "Next"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Save Action - Visibility of System Status & Kept as requested by user */}
      <div className="flex justify-end pt-4 pb-12">
        <Button 
          variant="premium" 
          size="lg" 
          onClick={handleSubmit}
          className="min-w-[200px]"
        >
          <Save className="w-5 h-5 mr-2" />
          {lang === "th" ? "บันทึกการเช็คชื่อ" : "Save Attendance"}
        </Button>
      </div>

    </div>
  );
}
