"use client";

import React, { useState, useEffect } from "react";
import { getAcademicEvents, createAcademicEvent, deleteAcademicEvent } from "@/app/actions/calendar";
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Clock, MapPin, AlignLeft, X } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  color: string | null;
}

export default function AcademicCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState("#4f46e5");
  const [submitting, setSubmitting] = useState(false);

  const colors = [
    { value: "#4f46e5", label: "Indigo (ระบบ)" },
    { value: "#ef4444", label: "Rose (สำคัญ/วันหยุด)" },
    { value: "#f59e0b", label: "Amber (กิจกรรม)" },
    { value: "#10b981", label: "Emerald (สอบ/วิชาการ)" },
    { value: "#06b6d4", label: "Cyan (อื่นๆ)" },
  ];

  const fetchEvents = async () => {
    setLoading(true);
    const res = await getAcademicEvents();
    if (res.success && res.data) {
      const parsed = res.data.map((e: any) => ({
        ...e,
        startDate: new Date(e.startDate),
        endDate: e.endDate ? new Date(e.endDate) : null,
      }));
      setEvents(parsed);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate) return;

    setSubmitting(true);
    const res = await createAcademicEvent({
      title,
      description: description || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      color,
    });

    if (res.success) {
      await fetchEvents();
      setShowAddModal(false);
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setColor("#4f46e5");
    } else {
      alert("ไม่สามารถเพิ่มกิจกรรมได้: " + res.error);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("คุณแน่ใจว่าต้องการลบกิจกรรมวิชาการนี้ใช่หรือไม่?")) return;

    const res = await deleteAcademicEvent(id);
    if (res.success) {
      await fetchEvents();
    } else {
      alert("ไม่สามารถลบกิจกรรมได้: " + res.error);
    }
  };

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid days
  const days = [];
  // Padding from previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
    });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }
  // Padding for next month to complete grid row (multiple of 7)
  const totalSlots = Math.ceil(days.length / 7) * 7;
  const nextMonthDaysNeeded = totalSlots - days.length;
  for (let i = 1; i <= nextMonthDaysNeeded; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((e) => {
      const start = new Date(e.startDate.getFullYear(), e.startDate.getMonth(), e.startDate.getDate());
      const end = e.endDate 
        ? new Date(e.endDate.getFullYear(), e.endDate.getMonth(), e.endDate.getDate())
        : start;
      const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return current >= start && current <= end;
    });
  };

  const monthNamesTH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const dayNamesTH = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
      
      {/* Calendar Grid Area */}
      <div className="lg:col-span-3 p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card flex flex-col">
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-sm md:text-base text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              ปฏิทินวิชาการและกิจกรรมโรงเรียน
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">ปีการศึกษา {year + 543} (เดือน {monthNamesTH[month]})</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-border bg-background/50 text-foreground hover:bg-muted/40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-foreground min-w-[90px] text-center">
              {monthNamesTH[month]} {year + 543}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-border bg-background/50 text-foreground hover:bg-muted/40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="ml-3 h-8 px-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              เพิ่มกิจกรรม
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase font-bold text-muted-foreground mb-2">
          {dayNamesTH.map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>

        {/* Calendar Monthly Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[380px]">
          {days.map((day, idx) => {
            const dayEvents = getEventsForDate(day.date);
            const isToday = new Date().toDateString() === day.date.toDateString();

            return (
              <div 
                key={idx}
                className={`p-1.5 rounded-xl border flex flex-col gap-1 min-h-[70px] transition-all relative overflow-hidden group ${
                  day.isCurrentMonth
                    ? "bg-card/40 border-border/60 hover:border-indigo-500/30"
                    : "bg-slate-100/10 dark:bg-slate-900/10 border-border/20 opacity-40"
                } ${isToday ? "ring-2 ring-indigo-500/40 bg-indigo-500/5" : ""}`}
              >
                {/* Date indicator */}
                <span className={`text-[10px] font-bold self-start px-1.5 py-0.5 rounded-md ${
                  isToday 
                    ? "bg-indigo-650 text-white" 
                    : "text-foreground"
                }`}>
                  {day.date.getDate()}
                </span>

                {/* Day events tags */}
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[50px] scrollbar-none">
                  {dayEvents.slice(0, 3).map((e) => (
                    <div 
                      key={e.id}
                      style={{ borderLeftColor: e.color || "#4f46e5" }}
                      className="px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-800 dark:text-slate-100 border-l-2 bg-slate-100/70 dark:bg-slate-800/80 truncate cursor-pointer"
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[7px] text-indigo-500 font-bold pl-1">
                      + อีก {dayEvents.length - 3} กิจกรรม
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar List of Upcoming Events */}
      <div className="p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card flex flex-col gap-4">
        <h3 className="text-xs font-black text-foreground border-b border-border/80 pb-2">
          รายการกิจกรรมวิชาการทั้งหมด ({events.length})
        </h3>

        <div className="flex-1 overflow-y-auto space-y-3 max-h-[460px] pr-1.5 custom-scrollbar">
          {events.length === 0 ? (
            <p className="text-center text-[10px] py-12 text-muted-foreground font-semibold">ไม่มีกิจกรรมที่บันทึกไว้</p>
          ) : (
            events.map((e) => {
              const startStr = e.startDate.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
              const endStr = e.endDate ? e.endDate.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "";
              
              return (
                <div 
                  key={e.id}
                  className="p-3 rounded-xl border border-border/60 bg-card/35 hover:bg-card/60 transition-colors flex flex-col gap-1.5 relative group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span 
                      style={{ backgroundColor: e.color || "#4f46e5" }}
                      className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                    />
                    <h4 className="font-bold text-xs text-foreground flex-1 leading-snug">
                      {e.title}
                    </h4>
                    
                    <button 
                      onClick={(evt) => handleDelete(e.id, evt)}
                      className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="ลบกิจกรรม"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {e.description && (
                    <p className="text-[10px] text-muted-foreground pl-4 leading-normal font-normal">
                      {e.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 pl-4 font-bold">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>
                      {startStr} {endStr ? ` - ${endStr}` : ""}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modern Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 shadow-2xl glass space-y-4 animate-in zoom-in-95 duration-150 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h4 className="font-bold text-sm text-foreground">เพิ่มกิจกรรมวิชาการ / ตารางปฏิทิน</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">บันทึกข้อมูลตารางกิจกรรมส่วนกลางของโรงเรียน</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-muted-foreground">
              <div className="space-y-1">
                <label className="text-[10px] text-foreground block">หัวข้อกิจกรรม *</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น สอบกลางภาคเรียนที่ 1, วันกิจกรรมวิทยาศาสตร์"
                  className="w-full h-10 px-3 border border-border bg-background rounded-xl text-foreground focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-foreground block">รายละเอียดกิจกรรม (ตัวเลือกเพิ่มเติม)</label>
                <textarea 
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติมของกิจกรรมวิชาการนี้..."
                  className="w-full p-3 border border-border bg-background rounded-xl text-foreground focus:outline-none focus:border-primary text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-foreground block">วันเริ่มต้นกิจกรรม *</label>
                  <input 
                    type="date" 
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 border border-border bg-background rounded-xl text-foreground focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-foreground block">วันสิ้นสุดกิจกรรม (กรณีมีหลายวัน)</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 border border-border bg-background rounded-xl text-foreground focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-foreground block">สีสัญลักษณ์กิจกรรม</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      style={{ backgroundColor: c.value }}
                      className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center text-white ${
                        color === c.value 
                          ? "border-foreground scale-110 shadow" 
                          : "border-transparent hover:scale-105"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-10 px-4 bg-muted hover:bg-muted/75 text-foreground font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 shadow-md"
                >
                  {submitting ? "กำลังบันทึก..." : "ยืนยันการเพิ่มกิจกรรม"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
