"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Save, BookOpen, Layers, Users, Home, Loader2, Info, X } from "lucide-react";
import { ScheduleGrid } from "@/components/timetable/ScheduleGrid";
import { getClassrooms } from "@/app/actions/classroom";
import { getTeachers } from "@/app/actions/teacher";
import { getRooms } from "@/app/actions/room";
import { getPeriods } from "@/app/actions/period";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function SchedulePage() {
  const { data: session } = useSession();
  
  // Selection States
  const [viewMode, setViewMode] = useState<"classroom" | "teacher" | "room">("classroom");
  const [viewId, setViewId] = useState<string>("");
  const [paletteOpen, setPaletteOpen] = useState(true);
  
  // Data lists
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Active workload list (left palette)
  const [workloads, setWorkloads] = useState<any[]>([]);
  const [selectedSubjectForAssign, setSelectedSubjectForAssign] = useState<any | null>(null);

  const role = (session?.user as any)?.role?.toLowerCase() || "teacher";
  const isAdmin = role === "admin" || session?.user?.email === "admin@school.os";
  const currentUserId = session?.user?.id;

  const loadSelectionData = async () => {
    setLoading(true);
    const [classroomsRes, teachersRes, roomsRes, periodsRes] = await Promise.all([
      getClassrooms(),
      getTeachers(),
      getRooms(),
      getPeriods()
    ]);

    if (classroomsRes.success && classroomsRes.data) {
      setClassrooms(classroomsRes.data);
      // Default to first classroom if viewMode is classroom
      if (classroomsRes.data.length > 0) {
        setViewId(classroomsRes.data[0].id);
      }
    }
    if (teachersRes.success && teachersRes.data) {
      setTeachers(teachersRes.data);
    }
    if (roomsRes.success && roomsRes.data) {
      setRooms(roomsRes.data);
    }
    if (periodsRes.success && periodsRes.data) {
      setPeriods(periodsRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSelectionData();
  }, []);

  // Update default viewId when viewMode changes
  useEffect(() => {
    setSelectedSubjectForAssign(null);
    if (viewMode === "classroom" && classrooms.length > 0) {
      setViewId(classrooms[0].id);
    } else if (viewMode === "teacher" && teachers.length > 0) {
      // Default to current logged-in teacher if exists, otherwise first teacher
      const self = teachers.find(t => t.id === currentUserId);
      setViewId(self?.id || teachers[0].id);
    } else if (viewMode === "room" && rooms.length > 0) {
      setViewId(rooms[0].id);
    } else {
      setViewId("");
    }
  }, [viewMode]);

  const handleDataLoaded = (loadedWorkloads: any[]) => {
    setWorkloads(loadedWorkloads);
  };

  const getActiveName = () => {
    if (viewMode === "classroom") {
      return classrooms.find(c => c.id === viewId)?.name || "ชั้นเรียน";
    } else if (viewMode === "teacher") {
      return teachers.find(t => t.id === viewId)?.name || "คุณครู";
    } else if (viewMode === "room") {
      return rooms.find(r => r.id === viewId)?.name || "ห้องเรียน";
    }
    return "";
  };

  // Helper calculations for workload progress
  const totalHours = workloads.reduce((acc, w) => acc + w.hours, 0);
  const remainingHours = workloads.reduce((acc, w) => acc + w.remainingHours, 0);
  const placedHours = totalHours - remainingHours;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary animate-pulse" />
            จัดตารางสอนอัจฉริยะ (Academic Scheduler)
          </h2>
          <p className="text-muted-foreground text-xs mt-1">
            ระบุวิชาลงช่องตารางสอนด้วยการลากวาง (Drag & Drop) หรือคลิกเพื่อแตะวาง (Tap-to-Place) บนหน้าจอสัมผัส
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          {/* Collapsible Palette Toggle Button */}
          <button
            onClick={() => setPaletteOpen(!paletteOpen)}
            className={cn(
              "px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm",
              paletteOpen 
                ? "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" 
                : "bg-background text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <BookOpen className="w-4 h-4" />
            {paletteOpen ? "ซ่อนหลักสูตร" : "แสดงหลักสูตร"}
          </button>

          {/* Toggle Mode Navigation */}
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border/80 text-xs font-bold flex-1 sm:flex-initial">
            {[
              { key: "classroom", label: "ภาพรวมชั้นเรียน", icon: Layers },
              { key: "teacher", label: "ตารางสอนครู", icon: Users },
              { key: "room", label: "ตารางการใช้ห้อง", icon: Home }
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => setViewMode(m.key as any)}
                  className={cn(
                    "flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    viewMode === m.key
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-border rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold">กำลังโหลดทรัพยากรหลัก...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Sidebar: Palette of workloads */}
          {paletteOpen && (
            <div className="lg:col-span-3 p-5 bg-card border border-border/80 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-left duration-250">
              <div className="border-b border-border/80 pb-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  รายวิชาหลักสูตรที่จะจัดสอน
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  คลิกวิชาเพื่อเข้าโหมด แตะเพื่อวาง คาบในตาราง
                </p>
              </div>

              {selectedSubjectForAssign && (
                <div className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400 text-xs font-bold space-y-1 animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center">
                    <span>📍 แตะเพื่อวางคาบ:</span>
                    <button 
                      onClick={() => setSelectedSubjectForAssign(null)} 
                      className="p-0.5 hover:bg-emerald-500/10 rounded-md text-emerald-600 dark:text-emerald-400 cursor-pointer"
                      title="ยกเลิกการเลือก"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] font-medium opacity-90 truncate">
                    วิชา {selectedSubjectForAssign.subjectCode} ({selectedSubjectForAssign.classroomName})
                  </p>
                </div>
              )}

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {workloads.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-[11px] font-semibold border border-dashed border-border rounded-xl bg-muted/10">
                    ไม่มีภาระงานสอนค้างจัด หรือกรุณาเลือกเป้าหมายที่ต้องการจัดตาราง
                  </div>
                ) : (
                  workloads.map((w) => {
                    const isSelected = selectedSubjectForAssign?.workloadId === w.id;
                    const isCompleted = w.remainingHours === 0;

                    return (
                      <div
                        key={w.id}
                        draggable={!isCompleted && isAdmin}
                        onDragStart={(e) => {
                          if (isCompleted || !isAdmin) return;
                          e.dataTransfer.setData("application/json", JSON.stringify({
                            type: "subject",
                            subjectId: w.subjectId,
                            userId: w.userId,
                            classroomId: w.classroomId,
                            roomId: w.roomId
                          }));
                        }}
                        onClick={() => {
                          if (isCompleted || !isAdmin) return;
                          setSelectedSubjectForAssign(isSelected ? null : {
                            workloadId: w.id,
                            subjectId: w.subjectId,
                            subjectCode: w.subjectCode,
                            userId: w.userId,
                            classroomId: w.classroomId,
                            roomId: w.roomId,
                            classroomName: w.classroomName
                          });
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-xs font-semibold select-none transition-all duration-200 relative group cursor-pointer shadow-sm",
                          isCompleted 
                            ? "bg-slate-500/5 border-slate-500/10 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                            : isSelected
                              ? "bg-emerald-500/10 border-emerald-500 border-2 text-emerald-800 dark:text-emerald-400 scale-[1.02] shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse"
                              : "bg-muted/30 hover:bg-muted/50 border-border hover:border-primary/40 text-foreground"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-black text-foreground">{w.subjectCode}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black border",
                            isCompleted
                              ? "bg-slate-500/10 text-slate-500 border-slate-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          )}>
                            เหลือ {w.remainingHours} / {w.hours} คาบ
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 truncate font-medium">{w.subjectName}</p>
                        
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40 text-[9px] text-muted-foreground font-semibold">
                          <span className="truncate max-w-[100px]">👤 {w.teacherName || "ยังไม่ระบุครู"}</span>
                          <span>{viewMode !== "classroom" && `🏫 ${w.classroomName}`}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Right Main Panel: Timetable Grid and Details Selector */}
          <div className={cn(paletteOpen ? "lg:col-span-9" : "lg:col-span-12", "space-y-4 transition-all duration-305")}>
            
            {/* View Target Selector Dropdown and Metrics */}
            <div className="p-4 bg-card border border-border/80 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-500 shrink-0">
                  {viewMode === "classroom" ? "เลือกชั้นเรียน:" : viewMode === "teacher" ? "เลือกคุณครู:" : "เลือกห้องเรียน:"}
                </span>
                
                {viewMode === "classroom" && (
                  <select
                    value={viewId}
                    onChange={(e) => setViewId(e.target.value)}
                    className="w-56 text-xs font-bold rounded-xl border border-input bg-background p-2 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}

                {viewMode === "teacher" && (
                  <select
                    value={viewId}
                    onChange={(e) => setViewId(e.target.value)}
                    className="w-56 text-xs font-bold rounded-xl border border-input bg-background p-2 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}

                {viewMode === "room" && (
                  <select
                    value={viewId}
                    onChange={(e) => setViewId(e.target.value)}
                    className="w-56 text-xs font-bold rounded-xl border border-input bg-background p-2 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                )}
              </div>

              {/* Status metrics display */}
              <div className="flex gap-4 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    เป้าหมาย: <strong className="text-foreground">{getActiveName()}</strong>
                  </span>
                </div>
                {workloads.length > 0 && (
                  <div className="flex items-center gap-3 bg-muted/40 px-3 py-1.5 rounded-xl border border-border">
                    <span>จัดแล้ว: <strong className="text-indigo-650">{placedHours}</strong> คาบ</span>
                    <span className="w-1 h-3 bg-slate-300"></span>
                    <span>เหลือจัด: <strong className="text-rose-600">{remainingHours}</strong> / {totalHours} คาบ</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Timetable Grid component */}
            <div className="bg-card border border-border/80 rounded-2xl shadow-sm p-6 overflow-hidden">
              <ScheduleGrid
                viewMode={viewMode}
                viewId={viewId}
                selectedTeacherId={viewMode === "classroom" ? undefined : undefined}
                selectedClassroomId={viewMode === "teacher" ? undefined : undefined}
                selectedRoomId={viewMode === "room" ? undefined : undefined}
                dbPeriods={periods}
                isAdmin={isAdmin}
                selectedSubjectForAssign={selectedSubjectForAssign}
                onClearSelectedSubject={() => setSelectedSubjectForAssign(null)}
                onScheduleUpdated={() => {
                  // Reload palette by triggering state refresh
                  loadSelectionData();
                }}
              />
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
