"use client";

import { useEffect, useState } from "react";
import { getSubjects } from "@/app/actions/subject";
import { getClassrooms } from "@/app/actions/classroom";
import { getRooms } from "@/app/actions/room";
import { getTimetableData, resolveScheduleConflicts } from "@/app/actions/timetable";
import { 
  BookOpen, Users, DoorOpen, Calendar, 
  AlertTriangle, Sparkles, CheckCircle2, 
  Loader2, Play, Users2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TimetableDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    subjects: 0,
    classrooms: 0,
    rooms: 0,
    periods: 0
  });
  const [teachersLoad, setTeachersLoad] = useState<Array<{ name: string; hours: number }>>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isSolving, setIsSolving] = useState(false);
  const [solveResult, setSolveResult] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [subRes, clsRes, roomRes, timetableRes] = await Promise.all([
        getSubjects(),
        getClassrooms(),
        getRooms(),
        getTimetableData()
      ]);

      const subCount = subRes.success ? subRes.data?.length || 0 : 0;
      const clsCount = clsRes.success ? clsRes.data?.length || 0 : 0;
      const roomCount = roomRes.success ? roomRes.data?.length || 0 : 0;

      let periodsCount = 0;
      const teacherHours: Record<string, number> = {};

      if (timetableRes.success && timetableRes.data) {
        const slots = Object.values(timetableRes.data);
        periodsCount = slots.length;

        // Calculate hours per teacher
        slots.forEach((slot: any) => {
          const teacherName = slot.teacherName || "ครูผู้สอน";
          teacherHours[teacherName] = (teacherHours[teacherName] || 0) + 1; // 1 period
        });
      }

      const loadList = Object.entries(teacherHours).map(([name, hours]) => ({
        name,
        hours
      })).sort((a, b) => b.hours - a.hours);

      setStats({
        subjects: subCount,
        classrooms: clsCount,
        rooms: roomCount,
        periods: periodsCount
      });
      setTeachersLoad(loadList);
      setConflicts(timetableRes.conflicts || []);
    } catch (err) {
      console.error("Failed to load timetable dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAISolve = async () => {
    setIsSolving(true);
    setSolveResult(null);
    try {
      const res = await resolveScheduleConflicts();
      if (res.success) {
        setSolveResult(res.message || "ประมวลผลสำเร็จ");
        await loadDashboardData();
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (e: any) {
      alert("เกิดข้อผิดพลาดในการประมวลผล: " + e.message);
    } finally {
      setIsSolving(false);
    }
  };

  if (loading && teachersLoad.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-border rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold">กำลังโหลดข้อมูลระบบตารางสอน...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-primary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            ภาพรวมงานจัดตารางสอนโรงเรียน
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            สถิติการสอนรายวิชา ข้อมูลชั่วโมงทำงาน และแจ้งเตือนจุดขัดแย้งของตารางสอน
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "วิชาทั้งหมด", value: `${stats.subjects} รายวิชา`, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "ชั้นเรียนทั้งหมด", value: `${stats.classrooms} ห้องเรียน`, icon: Users, color: "text-green-500", bg: "bg-green-500/10" },
          { title: "ห้องปฏิบัติการ/กายภาพ", value: `${stats.rooms} ห้อง`, icon: DoorOpen, color: "text-amber-500", bg: "bg-amber-500/10" },
          { title: "คาบเรียนรวมในระบบ", value: `${stats.periods} คาบ/สัปดาห์`, icon: Calendar, color: "text-indigo-500", bg: "bg-indigo-500/10" }
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-card border border-border/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", kpi.bg)}>
                <Icon className={cn("w-5 h-5", kpi.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-muted-foreground truncate">{kpi.title}</p>
                <p className="text-base font-black text-foreground mt-1 truncate">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conflicts Alert Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className={cn("w-5 h-5", conflicts.length > 0 ? "text-rose-500" : "text-emerald-500")} />
                สถานะความขัดแย้งของตารางเรียน (Conflicts Detector)
              </h3>
              {conflicts.length > 0 && (
                <button
                  onClick={handleAISolve}
                  disabled={isSolving}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/10 cursor-pointer"
                >
                  <Sparkles className={cn("w-3.5 h-3.5", isSolving && "animate-spin")} />
                  {isSolving ? "กำลังประมวลผล..." : "แก้ไขโดย AI"}
                </button>
              )}
            </div>

            {solveResult && (
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{solveResult}</span>
              </div>
            )}

            <div className="space-y-2">
              {conflicts.length === 0 ? (
                <div className="p-8 border border-dashed border-border rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-foreground">ไม่พบปัญหาตารางเรียนชนกัน</p>
                  <p className="text-[10px] text-muted-foreground">ตารางเรียนทุกห้องและวิชาสอนของครูถูกต้องตามเงื่อนไขความปลอดภัย 100%</p>
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
                  {conflicts.map((conf, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs font-medium text-rose-800 dark:text-rose-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: conf }}>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teacher load section */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border/80 rounded-2xl p-6 flex flex-col h-full max-h-[420px]">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4 shrink-0">
              <Users2 className="w-5 h-5 text-indigo-500" />
              ภาระงานชั่วโมงสอนครู (Teaching Load)
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {teachersLoad.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">ยังไม่มีตารางสอนจัดในระบบ</p>
              ) : (
                teachersLoad.map((load, idx) => {
                  const maxLimit = 22; // Standard maximum hours limit
                  const percentage = Math.min((load.hours / maxLimit) * 100, 100);
                  const isOver = load.hours > maxLimit;
                  return (
                    <div key={idx} className="p-3 bg-muted/20 border border-border/60 rounded-xl space-y-2.5 animate-in slide-in-from-bottom-1 duration-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground">{load.name}</span>
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-lg border",
                          isOver 
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                            : "bg-primary/10 text-primary border-primary/20"
                        )}>
                          {load.hours} / {maxLimit} คาบ
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isOver ? "bg-rose-500" : "bg-primary"
                          )} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
