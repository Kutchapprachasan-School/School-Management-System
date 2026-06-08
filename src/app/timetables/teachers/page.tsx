"use client";

import { useEffect, useState } from "react";
import { getTeachers } from "@/app/actions/teacher";
import { Users, Save, X, Loader2, Search, ShieldAlert, Sliders, BookOpen, Clock } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  getTeacherConstraints,
  updateTeacherConstraints,
  getTeacherSubjectAssignments,
  updateTeacherSubjectAssignments
} from "@/app/actions/timetable";
import { getSubjects } from "@/app/actions/subject";

const DAYS = [
  { id: 1, name: "วันจันทร์", color: "bg-yellow-400/20 border-yellow-500/30 text-yellow-800 dark:text-yellow-400" },
  { id: 2, name: "วันอังคาร", color: "bg-pink-400/20 border-pink-500/30 text-pink-800 dark:text-pink-400" },
  { id: 3, name: "วันพุธ", color: "bg-green-400/20 border-green-500/30 text-green-800 dark:text-green-400" },
  { id: 4, name: "วันพฤหัสบดี", color: "bg-orange-400/20 border-orange-500/30 text-orange-800 dark:text-orange-400" },
  { id: 5, name: "วันศุกร์", color: "bg-blue-400/20 border-blue-500/30 text-blue-800 dark:text-blue-400" },
];

export default function TeachersPage() {
  const { data: session } = useSession();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected teacher for constraints workspace
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [maxHours, setMaxHours] = useState<number>(20);
  const [unavailableSlots, setUnavailableSlots] = useState<Record<string, "soft" | "hard" | "available">>({});
  const [assignedSubjectIds, setAssignedSubjectIds] = useState<string[]>([]);
  const [constraintLoading, setConstraintLoading] = useState(false);
  const [paintMode, setPaintMode] = useState<"available" | "soft" | "hard">("hard");
  const [isMouseDown, setIsMouseDown] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const role = (session?.user as any)?.role?.toLowerCase() || "teacher";
  const isAdmin = role === "admin" || session?.user?.email === "admin@school.os";
  const currentUserId = session?.user?.id;

  // Editable check: Admin can edit anyone, a teacher can only edit themselves
  const isEditable = isAdmin || (selectedTeacher && selectedTeacher.id === currentUserId);

  const loadData = async () => {
    setLoading(true);
    const [teachersRes, subjectsRes] = await Promise.all([
      getTeachers(),
      getSubjects()
    ]);
    if (teachersRes.success && teachersRes.data) {
      setTeachers(teachersRes.data);
    }
    if (subjectsRes.success && subjectsRes.data) {
      setSubjects(subjectsRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadTeacherConstraintsAndSubjects = async (teacherId: string) => {
    setConstraintLoading(true);
    try {
      // 1. Get constraints
      const constraint = await getTeacherConstraints(teacherId);
      setMaxHours(constraint.maxHoursPerWeek);
      
      const slots: Record<string, "soft" | "hard"> = {};
      try {
        const parsed = JSON.parse(constraint.unavailableSlots || "[]");
        if (Array.isArray(parsed)) {
          parsed.forEach((s: string) => {
            if (s.endsWith(":soft")) {
              const key = s.substring(0, s.length - 5);
              slots[key] = "soft";
            } else {
              slots[s] = "hard";
            }
          });
        }
      } catch (e) {
        console.error("Error parsing unavailableSlots:", e);
      }
      setUnavailableSlots(slots);

      // 2. Get subject assignments
      const assignments = await getTeacherSubjectAssignments(teacherId);
      setAssignedSubjectIds(assignments.map((a: any) => a.subjectId));
    } catch (error) {
      console.error(error);
    } finally {
      setConstraintLoading(false);
    }
  };

  const handleSelectTeacher = async (teacher: any) => {
    if (selectedTeacher?.id === teacher.id) return;
    setSelectedTeacher(teacher);
    await loadTeacherConstraintsAndSubjects(teacher.id);
  };

  const handleSaveConstraintsAndAssignments = async () => {
    if (!selectedTeacher || !isEditable) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const slotsArray: string[] = [];
      Object.entries(unavailableSlots).forEach(([key, val]) => {
        if (val === "hard") {
          slotsArray.push(key);
        } else if (val === "soft") {
          slotsArray.push(`${key}:soft`);
        }
      });

      const resConstraints = await updateTeacherConstraints(
        selectedTeacher.id,
        maxHours,
        JSON.stringify(slotsArray),
        5
      );

      const resAssignments = await updateTeacherSubjectAssignments(
        selectedTeacher.id,
        assignedSubjectIds
      );

      if (resConstraints.success && resAssignments.success) {
        alert("บันทึกข้อจำกัดและวิชาสอนของครูสำเร็จ!");
        await loadData();
        await loadTeacherConstraintsAndSubjects(selectedTeacher.id);
      } else {
        setErrorMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูลข้อจำกัด");
      }
    } catch (e: any) {
      setErrorMsg("ข้อผิดพลาดระบบ: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.subjectGroup && t.subjectGroup.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.position && t.position.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const showWorkspace = selectedTeacher !== null;
  const tableColSpan = showWorkspace ? "lg:col-span-8" : "lg:col-span-12";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            จัดการตั้งค่าข้อจำกัดและภาระงานครู
          </h2>
          <p className="text-muted-foreground mt-1">
            ระบุความต้องการในการจัดเวลาตารางสอน คาบว่าง หรือช่วงเวลาที่ครูไม่สะดวกสอน
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, กลุ่มสาระ, หรือตำแหน่ง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-background text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Teachers List Table */}
        <div className={cn(tableColSpan, "p-6 bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden space-y-4")}>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground">
              รายชื่อครูและฝ่ายบุคลากรการสอน
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold">
              💡 คลิกแถวคุณครูเพื่อตั้งค่าข้อจำกัดการสอนฝั่งขวา
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="pb-3 px-3">ชื่อ-นามสกุล</th>
                  <th className="pb-3 px-3">ตำแหน่ง / สาระวิชา</th>
                  <th className="pb-3 px-3 text-center">สิทธิ์ในระบบ</th>
                  <th className="pb-3 px-3 text-center">สถานะส่วนตัว</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-semibold text-slate-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground font-medium">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground font-medium">
                      ไม่พบข้อมูลคุณครูในระบบ
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((t) => {
                    const isSelf = t.id === currentUserId;
                    return (
                      <tr 
                        key={t.id} 
                        onClick={() => handleSelectTeacher(t)}
                        className={cn(
                          "hover:bg-muted/30 transition-all cursor-pointer", 
                          selectedTeacher?.id === t.id && "bg-primary/10 border-l-4 border-l-primary"
                        )}
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground">{t.name || t.fullName}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black border border-emerald-500/20">คุณ</span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono opacity-60 mt-0.5">{t.email}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div>{t.position || "ครู"}</div>
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{t.subjectGroup || "ทั่วไป"}</span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg text-[9px] font-black border",
                            t.role === "ADMIN" 
                              ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" 
                              : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                          )}>
                            {t.role || "TEACHER"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {isSelf || isAdmin ? (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">แก้ไขข้อจำกัดได้</span>
                          ) : (
                            <span className="text-[9px] font-medium text-slate-400">ดูข้อมูลเท่านั้น</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Constraint Workspace */}
        {showWorkspace && (
          <div className="lg:col-span-4 p-6 bg-card border border-border/80 rounded-2xl h-fit space-y-5 shadow-sm animate-in fade-in slide-in-from-right duration-350">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  ข้อจำกัด: {selectedTeacher.name || selectedTeacher.fullName}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTeacher(null)} 
                className="p-1 hover:bg-muted/80 rounded-lg text-slate-400 hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {constraintLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs font-semibold">กำลังโหลดข้อจำกัดคุณครู...</span>
              </div>
            ) : (
              <div className="space-y-5 text-xs text-muted-foreground font-semibold">
                {errorMsg && (
                  <p className="text-xs font-semibold text-rose-500 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                    {errorMsg}
                  </p>
                )}

                {/* Self-Service warning banner */}
                {!isEditable && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl border border-border flex items-center gap-2 text-[10px]">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>คุณไม่มีสิทธิ์แก้ไขข้อจำกัดของครูท่านอื่น (เฉพาะแอดมินหรือครูเจ้าของตารางเท่านั้น)</span>
                  </div>
                )}

                {/* 1. Subject Assignments */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-foreground font-bold">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>การมอบหมายวิชาเรียน (Subject Assignments)</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">รายวิชาที่รับผิดชอบสอนในสัปดาห์นี้:</p>
                  <div className="border border-border/80 rounded-xl p-3 bg-muted/20 max-h-[160px] overflow-y-auto space-y-1.5 custom-scrollbar">
                    {subjects.length === 0 ? (
                      <p className="text-center text-[10px] py-4">ไม่พบรายวิชาในระบบ</p>
                    ) : (
                      subjects.map((sub) => {
                        const isAssigned = assignedSubjectIds.includes(sub.id);
                        return (
                          <label key={sub.id} className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              disabled={!isEditable}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignedSubjectIds([...assignedSubjectIds, sub.id]);
                                } else {
                                  setAssignedSubjectIds(assignedSubjectIds.filter(id => id !== sub.id));
                                }
                              }}
                              className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4"
                            />
                            <span>{sub.code} - {sub.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. Max Hours Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-foreground font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-primary" />
                      ภาระคาบเรียนสูงสุด (Max Hours Slider)
                    </span>
                    <span className="text-primary font-black text-sm">{maxHours} คาบ/สัปดาห์</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={40}
                    value={maxHours}
                    disabled={!isEditable}
                    onChange={(e) => setMaxHours(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground px-1">
                    <span>1 คาบ</span>
                    <span>20 คาบ (ปกติ)</span>
                    <span>40 คาบ</span>
                  </div>
                </div>

                {/* 3. Unavailable Slots Interactive Grid */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-foreground font-bold">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>ตารางช่วงเวลาว่าง/ไม่ว่างของครู (Interactive Grid)</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">เลือกโหมดแล้วระบายสีลงในตาราง (คลิกค้างระบาย/Touch Screen):</p>
                  
                  {/* Toolbar */}
                  {isEditable && (
                    <div className="flex items-center justify-between gap-1 bg-muted/40 p-1 rounded-xl border border-border/85">
                      {[
                        { id: "available", label: "พร้อมสอน", color: "text-emerald-500" },
                        { id: "soft", label: "ไม่สะดวก (Soft Block)", color: "text-amber-500" },
                        { id: "hard", label: "ล็อกห้ามจัด (Hard Block)", color: "text-rose-500" }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaintMode(m.id as any)}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer text-center",
                            paintMode === m.id 
                              ? "bg-card shadow-sm border-primary/30 text-primary font-black" 
                              : "text-muted-foreground hover:bg-muted border-transparent"
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Period Grid */}
                  <div 
                    className="grid grid-cols-[60px_repeat(8,1fr)] gap-1 text-[9px]"
                    onMouseLeave={() => setIsMouseDown(false)}
                  >
                    {/* Header Row */}
                    <div></div>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="text-center font-bold text-muted-foreground py-1">
                        ค.{i + 1}
                      </div>
                    ))}

                    {/* Days Rows */}
                    {DAYS.map((day) => (
                      <div key={day.id} className="contents">
                        {/* Day label */}
                        <div className="flex items-center justify-center font-bold text-muted-foreground border border-border bg-muted/10 rounded-lg py-1">
                          {day.name.substring(3)}
                        </div>
                        
                        {/* 8 Periods */}
                        {Array.from({ length: 8 }).map((_, periodIdx) => {
                          const pOrder = periodIdx + 1; // 1-8 order
                          const cellKey = `${day.id}-${pOrder}`;
                          const state = unavailableSlots[cellKey] || "available";
                          
                          const handleCellAction = () => {
                            if (!isEditable) return;
                            setUnavailableSlots(prev => {
                              const copy = { ...prev };
                              if (paintMode === "available") {
                                delete copy[cellKey];
                              } else {
                                copy[cellKey] = paintMode;
                              }
                              return copy;
                            });
                          };

                          return (
                            <div
                              key={cellKey}
                              data-cell-id={cellKey}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (!isEditable) return;
                                setIsMouseDown(true);
                                handleCellAction();
                              }}
                              onMouseEnter={() => {
                                if (isMouseDown && isEditable) {
                                  handleCellAction();
                                }
                              }}
                              onMouseUp={() => setIsMouseDown(false)}
                              onTouchStart={(e) => {
                                if (!isEditable) return;
                                setIsMouseDown(true);
                                handleCellAction();
                              }}
                              onTouchMove={(e) => {
                                if (!isMouseDown || !isEditable) return;
                                const touch = e.touches[0];
                                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                                if (element) {
                                  const cid = element.getAttribute("data-cell-id");
                                  if (cid) {
                                    setUnavailableSlots(prev => {
                                      const copy = { ...prev };
                                      if (paintMode === "available") {
                                        delete copy[cid];
                                      } else {
                                        copy[cid] = paintMode;
                                      }
                                      return copy;
                                    });
                                  }
                                }
                              }}
                              onTouchEnd={() => setIsMouseDown(false)}
                              className={cn(
                                "aspect-square border rounded-lg cursor-pointer transition-all duration-150 flex items-center justify-center text-[9px] font-black select-none",
                                state === "available" && "border-border hover:bg-muted bg-card/45",
                                state === "soft" && "bg-amber-400/20 border-amber-400/50 text-amber-850 dark:text-amber-400",
                                state === "hard" && "bg-rose-500/20 border-rose-500/50 text-rose-850 dark:text-rose-450"
                              )}
                              title={`${day.name} คาบที่ ${pOrder} (${state === "available" ? "พร้อมสอน" : state === "soft" ? "ไม่สะดวก" : "ล็อกห้ามจัด"})`}
                            >
                              {state === "soft" && "S"}
                              {state === "hard" && "H"}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex justify-start gap-4 text-[9px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-card/45 border border-border block"></span> พร้อมสอน (Available)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400/20 border border-amber-400/50 block"></span> ไม่สะดวก (Soft Block)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/50 block"></span> ห้ามจัด (Hard Block)</span>
                  </div>
                </div>

                {/* Save Button */}
                {isEditable && (
                  <button
                    onClick={handleSaveConstraintsAndAssignments}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    บันทึกข้อจำกัดและวิชาสอนครู
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
