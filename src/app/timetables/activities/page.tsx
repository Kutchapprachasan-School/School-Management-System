"use client";

import { useEffect, useState } from "react";
import { getActivitiesRegistry, saveActivitiesRegistry, SchoolActivity } from "@/app/actions/timetable_registry";
import { getSystemInitialData } from "@/app/actions/init";
import { getRooms } from "@/app/actions/room";
import { ShieldAlert, Plus, Trash2, Loader2, Calendar, HelpCircle, Save, CheckSquare, Square, Users, Sparkles } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const DAYS = [
  { id: 1, name: "วันจันทร์" },
  { id: 2, name: "วันอังคาร" },
  { id: 3, name: "วันพุธ" },
  { id: 4, name: "วันพฤหัสบดี" },
  { id: 5, name: "วันศุกร์" }
];

export default function ActivitiesPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activities, setActivities] = useState<SchoolActivity[]>([]);

  // DB resources
  const [dbClassrooms, setDbClassrooms] = useState<any[]>([]);
  const [dbTeachers, setDbTeachers] = useState<any[]>([]);
  const [dbRooms, setDbRooms] = useState<any[]>([]);
  const [dbPeriods, setDbPeriods] = useState<any[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [periodOrder, setPeriodOrder] = useState(1);
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [excludedTeacherIds, setExcludedTeacherIds] = useState<string[]>([]);
  const [roomId, setRoomId] = useState("");

  const role = (session?.user as any)?.role?.toLowerCase() || "teacher";
  const isAdmin = role === "admin" || session?.user?.email === "admin@school.os";

  const loadData = async () => {
    setLoading(true);
    const [actRes, initRes, roomsRes] = await Promise.all([
      getActivitiesRegistry(),
      getSystemInitialData(),
      getRooms()
    ]);

    if (actRes.success && actRes.data) {
      setActivities(actRes.data.activities || []);
    }

    if (initRes.success && initRes.data) {
      setDbClassrooms(initRes.data.classrooms || []);
      setDbTeachers(initRes.data.teachers || []);
      setDbPeriods(initRes.data.periods || []);
    }

    if (roomsRes.success && roomsRes.data) {
      setDbRooms(roomsRes.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const newActivity: SchoolActivity = {
      id: `act-${Date.now()}`,
      name: name.trim(),
      dayOfWeek,
      periodOrder,
      classrooms: selectedClassroomIds,
      teachers: selectedTeacherIds,
      excludedTeachers: excludedTeacherIds,
      roomId: roomId || undefined
    };

    const updated = [...activities, newActivity];
    const res = await saveActivitiesRegistry({ activities: updated });
    if (res.success) {
      setActivities(updated);
      setName("");
      setSelectedClassroomIds([]);
      setSelectedTeacherIds([]);
      setExcludedTeacherIds([]);
      setRoomId("");
    } else {
      alert(res.error || "เกิดข้อผิดพลาดในการบันทึก");
    }
    setIsSubmitting(false);
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm("คุณต้องการลบกิจกรรมโรงเรียนที่เลือกล็อกนี้ใช่หรือไม่? คาบเรียนจะกลับมาว่างสอน")) return;
    setIsSubmitting(true);

    const updated = activities.filter(act => act.id !== id);
    const res = await saveActivitiesRegistry({ activities: updated });
    if (res.success) {
      setActivities(updated);
    } else {
      alert(res.error || "เกิดข้อผิดพลาด");
    }
    setIsSubmitting(false);
  };

  const handleToggleClassroom = (id: string) => {
    setSelectedClassroomIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleToggleTeacher = (id: string) => {
    setSelectedTeacherIds(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleToggleExcludedTeacher = (id: string) => {
    setExcludedTeacherIds(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold">กำลังโหลดสาระกิจกรรมโรงเรียน...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            จัดการกิจกรรมโรงเรียนและคาบล็อก (School Activities & Locked Grid Slots)
          </h2>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-3 bg-amber-500/5 text-amber-800 dark:text-amber-300 border border-amber-500/10 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>โหมดดูข้อมูลเท่านั้น: คุณครูสามารถดูรายการกิจกรรมโรงเรียนที่ถูกล็อกได้เท่านั้น แอดมินวิชาการสามารถแก้ไข/เพิ่มกิจกรรมได้</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Form */}
        {isAdmin && (
          <div className="lg:col-span-1 p-6 bg-card border border-border/80 rounded-2xl h-fit space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              เพิ่มกิจกรรมและล็อกตารางสอน
            </h3>
            <form onSubmit={handleCreateActivity} className="space-y-4 text-xs text-muted-foreground font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold">ชื่อกิจกรรม</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น โฮมรูม, ชุมนุม, แนะแนว, ลูกเสือ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold">วันเรียน</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  >
                    {DAYS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold">คาบที่</label>
                  <select
                    value={periodOrder}
                    onChange={(e) => setPeriodOrder(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  >
                    {dbPeriods.map(p => (
                      <option key={p.id} value={p.order}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold">ห้องปฏิบัติการที่ใช้ (ถ้ามี)</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value="">-- ไม่ล็อกห้องเรียน --</option>
                  {dbRooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} - {r.building || "ไม่มีอาคาร"}</option>
                  ))}
                </select>
              </div>

              {/* Classrooms select filter list */}
              <div className="space-y-1.5 border border-border/80 p-3 rounded-xl bg-muted/20">
                <label className="text-[10px] uppercase font-bold flex justify-between">
                  <span>ห้องเรียนที่ร่วมกิจกรรม</span>
                  <span className="text-[8px] text-muted-foreground lowercase font-normal">(ไม่เลือก = ทุกห้อง)</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                  {dbClassrooms.map(c => {
                    const isSelected = selectedClassroomIds.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => handleToggleClassroom(c.id)}
                        className={cn(
                          "p-1.5 border rounded-lg text-left text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all",
                          isSelected ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {isSelected ? <CheckSquare className="w-3.5 h-3.5 shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Teachers selection lists */}
              <div className="space-y-1.5 border border-border/80 p-3 rounded-xl bg-muted/20">
                <label className="text-[10px] uppercase font-bold flex justify-between">
                  <span>ครูที่ร่วมสอนกิจกรรม</span>
                  <span className="text-[8px] text-muted-foreground lowercase font-normal">(ไม่เลือก = ครูทุกคน)</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                  {dbTeachers.map(t => {
                    const isSelected = selectedTeacherIds.includes(t.id);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => handleToggleTeacher(t.id)}
                        className={cn(
                          "p-1.5 border rounded-lg text-left text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all",
                          isSelected ? "border-green-600 bg-green-500/10 text-green-700" : "border-border/60 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {isSelected ? <CheckSquare className="w-3.5 h-3.5 shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{t.fullName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exclude Teachers checklist */}
              <div className="space-y-1.5 border border-border/80 p-3 rounded-xl bg-muted/20">
                <label className="text-[10px] uppercase font-bold flex justify-between text-rose-500">
                  <span>รายชื่อครูที่ยกเว้น</span>
                  <span className="text-[8px] text-rose-400 lowercase font-normal">(เช่น ผอ., ครูพาร์ทไทม์)</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                  {dbTeachers.map(t => {
                    const isSelected = excludedTeacherIds.includes(t.id);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => handleToggleExcludedTeacher(t.id)}
                        className={cn(
                          "p-1.5 border rounded-lg text-left text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all",
                          isSelected ? "border-rose-600 bg-rose-500/10 text-rose-700" : "border-border/60 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {isSelected ? <CheckSquare className="w-3.5 h-3.5 shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{t.fullName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                บันทึกกิจกรรมและบล็อกช่องตาราง
              </button>
            </form>
          </div>
        )}

        {/* Right Column: List Table */}
        <div className={cn(isAdmin ? "lg:col-span-2" : "lg:col-span-3", "p-6 bg-card border border-border/80 rounded-2xl shadow-sm space-y-4 h-fit")}>
          <h3 className="text-sm font-bold text-foreground">
            กิจกรรมโรงเรียนและวันเวลาที่มีการบล็อกตารางสอน ({activities.length} กิจกรรม)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="pb-2 px-3">ชื่อกิจกรรม</th>
                  <th className="pb-2 px-3">วัน / คาบเวลาเรียน</th>
                  <th className="pb-2 px-3">ห้องเรียนร่วม</th>
                  <th className="pb-2 px-3">คุณครูที่เกี่ยวข้อง</th>
                  <th className="pb-2 px-3">ห้องกายภาพ</th>
                  {isAdmin && <th className="pb-2 px-3 text-right">ลบ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-semibold text-slate-700 dark:text-slate-300">
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-muted-foreground font-medium">
                      ไม่มีการล็อกกิจกรรมใดๆ ในปัจจุบัน ตารางเรียนว่างตามปกติ
                    </td>
                  </tr>
                ) : (
                  activities.map((act) => {
                    const day = DAYS.find(d => d.id === act.dayOfWeek);
                    const period = dbPeriods.find(p => p.order === act.periodOrder);
                    const room = dbRooms.find(r => r.id === act.roomId);

                    return (
                      <tr key={act.id} className="hover:bg-muted/30 transition-all">
                        <td className="py-3 px-3 text-foreground font-bold">{act.name}</td>
                        <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-400">
                          {day?.name || ""} คาบที่ {act.periodOrder} {period ? `(${period.startTime} - ${period.endTime})` : ""}
                        </td>
                        <td className="py-3 px-3">
                          {act.classrooms.length === 0 ? (
                            <span className="text-primary font-bold">ทุกห้องเรียน</span>
                          ) : (
                            <span className="truncate max-w-[120px] block" title={act.classrooms.map(cid => dbClassrooms.find(c => c.id === cid)?.name || cid).join(", ")}>
                              {act.classrooms.map(cid => dbClassrooms.find(c => c.id === cid)?.name || cid).join(", ")}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-0.5">
                            {act.teachers.length === 0 ? (
                              <span className="text-emerald-700 font-bold">ครูทุกคน</span>
                            ) : (
                              <span className="truncate max-w-[120px] block" title={act.teachers.map(tid => dbTeachers.find(t => t.id === tid)?.fullName || tid).join(", ")}>
                                {act.teachers.map(tid => dbTeachers.find(t => t.id === tid)?.fullName || tid).join(", ")}
                              </span>
                            )}
                            {act.excludedTeachers && act.excludedTeachers.length > 0 && (
                              <span className="text-[9px] text-rose-500 font-semibold" title={act.excludedTeachers.map(tid => dbTeachers.find(t => t.id === tid)?.fullName || tid).join(", ")}>
                                ยกเว้น: {act.excludedTeachers.map(tid => dbTeachers.find(t => t.id === tid)?.fullName || tid).join(", ")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {room ? <span className="font-bold text-slate-800 dark:text-slate-200">{room.name}</span> : <span className="text-muted-foreground/45">-</span>}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDeleteActivity(act.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
