"use client";

import { useEffect, useState } from "react";
import { getPeriods, createPeriod, updatePeriodTime, deletePeriod, bulkUpdatePeriodTimes } from "@/app/actions/period";
import { getSystemInitialData } from "@/app/actions/init";
import { getLunchConfig, saveLunchConfig } from "@/app/actions/timetable_registry";
import { Calendar, Plus, Trash2, Edit3, Save, X, Loader2, Clock, ShieldAlert, Sparkles, Coffee, User, Home } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function PeriodsPage() {
  const { data: session } = useSession();
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // DB entities
  const [dbClassrooms, setDbClassrooms] = useState<any[]>([]);
  const [dbTeachers, setDbTeachers] = useState<any[]>([]);

  // Edit inline states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTimes, setEditTimes] = useState({ startTime: "", endTime: "" });

  // Auto-calculation states
  const [autoStart, setAutoStart] = useState("08:30");
  const [studyMins, setStudyMins] = useState(50);
  const [breakMins, setBreakMins] = useState(10);
  const [lunchOrder, setLunchOrder] = useState(4);
  const [lunchMins, setLunchMins] = useState(60);

  // Lunch Break config states
  const [classroomLunch, setClassroomLunch] = useState<Record<string, number>>({});
  const [teacherLunch, setTeacherLunch] = useState<Record<string, number>>({});
  const [globalLunch, setGlobalLunch] = useState<number>(5);

  const role = (session?.user as any)?.role?.toLowerCase() || "teacher";
  const isAdmin = role === "admin" || session?.user?.email === "admin@school.os";

  const loadData = async () => {
    setLoading(true);
    const [periodsRes, initRes, lunchRes] = await Promise.all([
      getPeriods(),
      getSystemInitialData(),
      getLunchConfig()
    ]);

    if (periodsRes.success && periodsRes.data) {
      setPeriods(periodsRes.data);
    }
    
    if (initRes.success && initRes.data) {
      setDbClassrooms(initRes.data.classrooms || []);
      setDbTeachers(initRes.data.teachers || []);
    }

    if (lunchRes.success && lunchRes.data) {
      const cfg = lunchRes.data;
      setClassroomLunch(cfg.classroomLunch || {});
      setTeacherLunch(cfg.teacherLunch || {});
      setGlobalLunch(cfg.globalLunch ?? 5);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPeriod = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const res = await createPeriod(fd);
    if (res.success) {
      e.currentTarget.reset();
      await loadData();
    } else {
      setErrorMsg(res.error || "เกิดข้อผิดพลาดในการเพิ่มคาบเรียน");
    }
    setIsSubmitting(false);
  };

  const handleStartEdit = (p: any) => {
    setEditingId(p.id);
    setEditTimes({
      startTime: p.startTime,
      endTime: p.endTime
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateTimes = async (id: string) => {
    setIsSubmitting(true);
    const res = await updatePeriodTime(id, editTimes.startTime, editTimes.endTime);
    if (res.success) {
      setEditingId(null);
      await loadData();
    } else {
      alert(res.error || "ปรับปรุงเวลาไม่สำเร็จ");
    }
    setIsSubmitting(false);
  };

  const handleDeletePeriod = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบคาบเรียนนี้?")) return;
    const res = await deletePeriod(id);
    if (res.success) {
      await loadData();
    } else {
      alert(res.error || "ไม่สามารถลบคาบเรียนได้");
    }
  };

  const handleAutoCalculateTimes = async () => {
    if (periods.length === 0) return;
    setIsSubmitting(true);

    const parts = autoStart.split(":");
    let currentMins = parseInt(parts[0]) * 60 + parseInt(parts[1]);

    const updatedTimes = periods.map((p) => {
      const startH = Math.floor(currentMins / 60).toString().padStart(2, '0');
      const startM = (currentMins % 60).toString().padStart(2, '0');
      const startTime = `${startH}:${startM}`;

      currentMins += studyMins;

      const endH = Math.floor(currentMins / 60).toString().padStart(2, '0');
      const endM = (currentMins % 60).toString().padStart(2, '0');
      const endTime = `${endH}:${endM}`;

      // Calculate next period start time
      if (p.order === lunchOrder) {
        currentMins += lunchMins;
      } else {
        currentMins += breakMins;
      }

      return {
        id: p.id,
        startTime,
        endTime
      };
    });

    const res = await bulkUpdatePeriodTimes(updatedTimes);
    if (res.success) {
      alert("คำนวณและรันเวลาเรียนเรียบร้อยสำเร็จ!");
      await loadData();
    } else {
      alert(res.error || "เกิดข้อผิดพลาด");
    }
    setIsSubmitting(false);
  };

  // Lunch Break config handlers
  const handleSaveLunchSettings = async () => {
    if (!isAdmin) return;
    setIsSubmitting(true);

    const res = await saveLunchConfig({
      classroomLunch,
      teacherLunch,
      globalLunch
    });

    if (res.success) {
      alert("บันทึกการตั้งค่าช่วงเวลาพักกลางวันสำเร็จ");
    } else {
      alert(res.error || "เกิดข้อผิดพลาดในการบันทึก");
    }
    setIsSubmitting(false);
  };

  const handleClassroomLunchChange = (classId: string, orderVal: number) => {
    setClassroomLunch((prev) => ({
      ...prev,
      [classId]: orderVal
    }));
  };

  const handleTeacherLunchChange = (teacherId: string, orderVal: number) => {
    setTeacherLunch((prev) => ({
      ...prev,
      [teacherId]: orderVal
    }));
  };

  const handleApplySameLunchToAllClassrooms = () => {
    const updated: Record<string, number> = {};
    dbClassrooms.forEach((c) => {
      updated[c.id] = globalLunch;
    });
    setClassroomLunch(updated);
    alert(`ตั้งค่าช่วงเวลาพักกลางวัน คาบที่ ${globalLunch} ให้แก่ชั้นเรียนทุกห้องแล้ว (กรุณากด บันทึกพักกลางวัน เพื่อเซฟลงฐานข้อมูล)`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            จัดการโครงสร้างคาบเวลาเรียนและพักกลางวัน (Time Profile Manager)
          </h2>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-3 bg-amber-500/5 text-amber-800 dark:text-amber-300 border border-amber-500/10 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>โหมดดูข้อมูลเท่านั้น: คุณครูสามารถดูช่วงเวลาจัดคาบเรียนและเวลาพักกลางวันได้เท่านั้น เฉพาะผู้ดูแลระบบที่แก้ไขคาบเวลาและสิทธิ์ช่วงพักได้</span>
        </div>
      )}

      {/* Main Grid: Add/Calculations & Periods List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Create / Auto Calculate */}
        <div className="lg:col-span-4 space-y-6">
          {/* Add Period Form */}
          {isAdmin && (
            <div className="p-5 bg-card border border-border/80 rounded-xl space-y-4 shadow-sm">
              <h3 className="text-xs uppercase font-extrabold text-foreground flex items-center gap-1.5 tracking-wider">
                <Plus className="w-4 h-4 text-primary" />
                เพิ่มคาบเรียนใหม่
              </h3>
              {errorMsg && (
                <p className="text-xs font-semibold text-rose-500 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                  {errorMsg}
                </p>
              )}
              <form onSubmit={handleAddPeriod} className="space-y-3.5 text-xs text-muted-foreground font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">ชื่อคาบเรียน</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="เช่น คาบ 9"
                    required
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">ลำดับคาบเรียน (ตัวเลข)</label>
                  <input
                    type="number"
                    name="order"
                    placeholder="เช่น 9"
                    required
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">เวลาเริ่มเรียน</label>
                    <input
                      type="text"
                      name="startTime"
                      placeholder="16:10"
                      required
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">เวลาหมดชั่วโมง</label>
                    <input
                      type="text"
                      name="endTime"
                      placeholder="17:00"
                      required
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  บันทึกคาบเรียน
                </button>
              </form>
            </div>
          )}

          {/* Auto Calculation Card */}
          {isAdmin && (
            <div className="p-5 bg-card border border-border/80 rounded-xl space-y-4 shadow-sm bg-gradient-to-br from-indigo-500/[0.02] to-primary/[0.02]">
              <h3 className="text-xs uppercase font-extrabold text-foreground flex items-center gap-1.5 tracking-wider">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                คำนวณและรันเวลาอัตโนมัติ
              </h3>
              <div className="space-y-3.5 text-xs text-muted-foreground font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">เวลาเริ่มคาบแรก</label>
                  <input
                    type="time"
                    value={autoStart}
                    onChange={(e) => setAutoStart(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">เวลาต่อคาบ (นาที)</label>
                    <input
                      type="number"
                      value={studyMins}
                      onChange={(e) => setStudyMins(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">พักเบรค (นาที)</label>
                    <input
                      type="number"
                      value={breakMins}
                      onChange={(e) => setBreakMins(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">พักกลางหลังคาบที่</label>
                    <input
                      type="number"
                      value={lunchOrder}
                      onChange={(e) => setLunchOrder(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">พักกลางวัน (นาที)</label>
                    <input
                      type="number"
                      value={lunchMins}
                      onChange={(e) => setLunchMins(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none font-medium"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting || periods.length === 0}
                  onClick={handleAutoCalculateTimes}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  รันเวลาตารางสอนอัตโนมัติ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Periods List Table (8 cols) */}
        <div className="lg:col-span-8 p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-4">
          <h3 className="text-xs uppercase font-extrabold text-foreground tracking-wider">
            ตารางคาบเวลาเรียนและจัดชั่วโมงสอน
          </h3>
          <div className="overflow-x-auto border border-border/80 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="py-2.5 px-3">ลำดับคาบ</th>
                  <th className="py-2.5 px-3">ชื่อคาบ</th>
                  <th className="py-2.5 px-3 text-center">ช่วงเวลาจัดกิจกรรมการสอน</th>
                  {isAdmin && <th className="py-2.5 px-3 text-right">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-semibold text-slate-700 dark:text-slate-300">
                {periods.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="py-8 text-center text-muted-foreground font-medium">
                      ยังไม่มีข้อมูลคาบเวลาเรียนในฐานข้อมูล
                    </td>
                  </tr>
                ) : (
                  periods.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/10 transition-all">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">คาบที่ {p.order}</td>
                      <td className="py-2.5 px-3 font-bold text-foreground">{p.name}</td>
                      <td className="py-2.5 px-3 text-center">
                        {editingId === p.id ? (
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="text"
                              value={editTimes.startTime}
                              onChange={(e) => setEditTimes({ ...editTimes, startTime: e.target.value })}
                              className="w-16 bg-background border border-border rounded p-1 text-center font-bold text-[11px]"
                            />
                            <span className="text-muted-foreground">-</span>
                            <input
                              type="text"
                              value={editTimes.endTime}
                              onChange={(e) => setEditTimes({ ...editTimes, endTime: e.target.value })}
                              className="w-16 bg-background border border-border rounded p-1 text-center font-bold text-[11px]"
                            />
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-muted/65 text-foreground font-mono font-bold text-xs border border-border/80">
                            {p.startTime} น. - {p.endTime} น.
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            {editingId === p.id ? (
                              <>
                                <button
                                  onClick={() => handleUpdateTimes(p.id)}
                                  className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer"
                                  title="บันทึก"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-1 text-slate-400 hover:bg-slate-500/10 rounded cursor-pointer"
                                  title="ยกเลิก"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(p)}
                                  className="p-1 text-slate-400 hover:text-primary rounded hover:bg-primary/10 transition-all cursor-pointer"
                                  title="แก้ไขเวลา"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePeriod(p.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-500/10 transition-all cursor-pointer"
                                  title="ลบคาบเรียน"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <hr className="border-border/60" />

      {/* Lunch break configuration grid */}
      <div className="p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-5">
        <div className="flex justify-between items-center border-b border-border/70 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-bold text-sm text-foreground">
                การจัดการคาบพักกลางวันรายบุคคลและรายชั้นเรียน (Lunch Break Allocations)
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                กำหนดคาบเวลาสำหรับรับประทานอาหารกลางวัน โดย AI scheduler และระบบจัดมือจะไม่จัดคาบเรียนทับคาบพักเหล่านี้เด็ดขาด
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={handleSaveLunchSettings}
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              บันทึกพักกลางวัน
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Global Default Lunch (3 cols) */}
          <div className="md:col-span-3 space-y-4 bg-muted/20 border border-border/80 rounded-xl p-4 font-semibold text-xs text-muted-foreground">
            <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wide flex items-center gap-1">
              <Coffee className="w-4 h-4 text-slate-400" />
              ค่าพักกลางวันเริ่มต้น
            </h4>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold">คาบพักเริ่มต้น (ทั้งโรงเรียน)</label>
              <select
                value={globalLunch}
                onChange={(e) => setGlobalLunch(Number(e.target.value))}
                disabled={!isAdmin}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.order}>คาบที่ {p.order} ({p.startTime} - {p.endTime} น.)</option>
                ))}
              </select>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={handleApplySameLunchToAllClassrooms}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-foreground text-xs rounded-lg font-bold transition-all cursor-pointer"
              >
                ตั้งค่าเดียวกันทุกห้องเรียน
              </button>
            )}
          </div>

          {/* Classrooms Lunch Config (4 cols) */}
          <div className="md:col-span-4 p-4 border border-border/80 rounded-xl bg-card space-y-3">
            <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wide flex items-center gap-1">
              <Home className="w-4 h-4 text-slate-400" />
              พักกลางวันแยกตามชั้นเรียน
            </h4>
            <p className="text-[9px] text-muted-foreground leading-normal font-semibold">
              ปรับปรุงคาบพักกลางวันของแต่ละชั้นเรียน เช่น ม.ต้น พักคาบ 4, ม.ปลาย พักคาบ 5
            </p>
            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
              {dbClassrooms.map((c) => {
                const lunchVal = classroomLunch[c.id] ?? globalLunch;
                return (
                  <div key={c.id} className="flex items-center justify-between text-xs font-bold text-foreground gap-2">
                    <span>ชั้นเรียน {c.name}</span>
                    <select
                      value={lunchVal}
                      onChange={(e) => handleClassroomLunchChange(c.id, Number(e.target.value))}
                      disabled={!isAdmin}
                      className="bg-background border border-border rounded-md p-1.5 text-xs text-foreground focus:outline-none font-medium"
                    >
                      {periods.map((p) => (
                        <option key={p.id} value={p.order}>คาบ {p.order}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teachers Lunch Config (5 cols) */}
          <div className="md:col-span-5 p-4 border border-border/80 rounded-xl bg-card space-y-3">
            <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wide flex items-center gap-1">
              <User className="w-4 h-4 text-slate-400" />
              พักกลางวันบังคับคุณครู (ถ้ามี)
            </h4>
            <p className="text-[9px] text-muted-foreground leading-normal font-semibold">
              กำหนดคาบพักประจำคุณครู เพื่อห้ามจัดชั่วโมงสอนเด็ดขาด (ปกติจะเว้นตามชั่วโมงที่เหลือจากคาบว่างสอน)
            </p>
            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
              {dbTeachers.map((t) => {
                const lunchVal = teacherLunch[t.id] ?? "";
                return (
                  <div key={t.id} className="flex items-center justify-between text-xs font-bold text-foreground gap-2">
                    <span className="truncate max-w-[180px]">{t.fullName}</span>
                    <select
                      value={lunchVal}
                      onChange={(e) => handleTeacherLunchChange(t.id, Number(e.target.value))}
                      disabled={!isAdmin}
                      className="bg-background border border-border rounded-md p-1.5 text-xs text-foreground focus:outline-none font-medium"
                    >
                      <option value="">-- ไม่ระบุ (ใช้ชั่วโมงว่าง) --</option>
                      {periods.map((p) => (
                        <option key={p.id} value={p.order}>คาบ {p.order}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
