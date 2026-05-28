"use client";

import React, { useState, useEffect } from "react";
import { Search, Sparkles, User, Calendar, Settings, ArrowRight, X, HeartPulse, Hammer, FilePlus } from "lucide-react";
import { Student, UserRole } from "@/types/school-os";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onNavigate: (menu: string, tab?: string) => void;
  onSwitchRole: (role: UserRole) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  students,
  onSelectStudent,
  onNavigate,
  onSwitchRole,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Filter logic
  const filteredStudents = search
    ? students.filter((s) => s.fullName.toLowerCase().includes(search.toLowerCase()) || s.studentCode.includes(search))
    : students.slice(0, 3);

  const quickActions = [
    { name: "เช็คชื่อนักเรียนวันนี้", icon: Calendar, action: () => onNavigate("Academic", "attendance") },
    { name: "บันทึกห้องพยาบาล", icon: HeartPulse, action: () => onNavigate("People", "health") },
    { name: "ยื่นเรื่องขออนุมัติลา", icon: FilePlus, action: () => onNavigate("Operations", "requests") },
    { name: "แจ้งซ่อมอุปกรณ์ ICT", icon: Hammer, action: () => onNavigate("Operations", "maintenance") },
  ];

  const roleSwitches: { name: string; role: UserRole }[] = [
    { name: "สลับเป็นบทบาท: ครูผู้สอน", role: "teacher" },
    { name: "สลับเป็นบทบาท: ผู้อำนวยการ (ผอ.)", role: "director" },
    { name: "สลับเป็นบทบาท: นักเรียน / ผู้ปกครอง", role: "student" },
    { name: "สลับเป็นบทบาท: ผู้ดูแลระบบ (Admin)", role: "admin" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Spotlight Window */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl glass glass-card border border-white/20 dark:border-white/5 bg-background/80 dark:bg-card/85 shadow-2xl flex flex-col max-h-[500px] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 border-b border-border/80 h-14">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground text-base"
            placeholder="ค้นหาชื่อนักเรียน, งานค้าง, เมนู หรือพิมพ์คำสั่งด่วน..."
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded border border-border bg-muted text-[10px] text-muted-foreground">
            <span>ESC</span>
          </kbd>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* Quick Actions (Show when search is empty) */}
          {!search && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                ทางลัดระบบด่วน
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      action.action();
                      onClose();
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-left text-sm font-medium"
                  >
                    <div className="p-2 rounded-lg bg-primary/15 text-primary">
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span>{action.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Students Search Results */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              {search ? `ผลลัพธ์นักเรียน (${filteredStudents.length})` : "ค้นหาประวัตินักเรียนด่วน"}
            </h3>
            <div className="space-y-1">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => {
                      onSelectStudent(student);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-primary/15 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                        {student.nickname || student.fullName.slice(3, 5)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {student.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>เลขประจำตัว {student.studentCode}</span>
                          <span>•</span>
                          <span>ห้อง {student.classroom}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        student.status === "ปกติ" 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : student.status === "เสี่ยง" 
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                          : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      }`}>
                        {student.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  ไม่พบข้อมูลนักเรียนชื่อ "{search}"
                </div>
              )}
            </div>
          </div>

          {/* Role Switching Shortcut */}
          {!search && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-emerald-500" />
                สลับบทบาทผู้ใช้ (Smart Role Switcher)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {roleSwitches.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onSwitchRole(item.role);
                      onClose();
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/10 hover:text-accent-foreground text-left text-sm font-medium transition-all"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Command Bar Footer */}
        <div className="p-3 bg-muted/50 border-t border-border/80 text-xs text-muted-foreground flex justify-between items-center rounded-b-2xl">
          <span>กด <span className="font-semibold text-foreground">↑↓</span> เพื่อนำทาง, <span className="font-semibold text-foreground">Enter</span> เพื่อเลือก</span>
          <span>School OS Spotlight Search</span>
        </div>

      </div>
    </div>
  );
}
