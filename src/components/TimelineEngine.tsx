"use client";

import React, { useState } from "react";
import { 
  X, Calendar, ShieldAlert, GraduationCap, HeartPulse, Home, FilePlus, 
  TrendingUp, Star, Award, AlertCircle, Plus, Send, BellRing
} from "lucide-react";
import { Student, TimelineEvent } from "@/types/school-os";
import { initialTimelineEvents } from "@/lib/mock-data";

interface TimelineEngineProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onAddAuditLog: (action: string, details: string) => void;
}

export default function TimelineEngine({
  student,
  isOpen,
  onClose,
  onAddAuditLog,
}: TimelineEngineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(initialTimelineEvents);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventCat, setNewEventCat] = useState<TimelineEvent["category"]>("behavior");

  if (!student || !isOpen) return null;

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      title: newEventTitle,
      description: newEventDesc,
      category: newEventCat,
      icon: newEventCat === "attendance" ? "CalendarX" : newEventCat === "behavior" ? "ShieldAlert" : "FilePlus",
      actor: "ครูผู้เชี่ยวชาญ (คุณ)"
    };

    setEvents([newEvent, ...events]);
    onAddAuditLog("CREATE_TIMELINE_EVENT", `บันทึกกิจกรรมใน Timeline ของ ${student.fullName}: ${newEventTitle}`);
    
    // Reset forms
    setNewEventTitle("");
    setNewEventDesc("");
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "attendance":
        return { bg: "bg-rose-500/10 text-rose-500 border-rose-500/20", icon: ShieldAlert };
      case "behavior":
        return { bg: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: AlertCircle };
      case "academic":
        return { bg: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: GraduationCap };
      case "health":
        return { bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: HeartPulse };
      case "home_visit":
        return { bg: "bg-sky-500/10 text-sky-500 border-sky-500/20", icon: Home };
      default:
        return { bg: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: FilePlus };
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg flex flex-col bg-background/95 dark:bg-card/98 border-l border-border/80 shadow-2xl animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center shadow-md">
            {student.nickname || student.fullName.slice(3, 5)}
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight text-foreground">{student.fullName}</h2>
            <p className="text-xs text-muted-foreground">ชั้น {student.classroom} • เลขประจำตัว {student.studentCode}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Core Stats Overview Widget */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex flex-col items-center text-center shadow-sm">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">คะแนนพฤติกรรม</span>
            <span className="text-2xl font-extrabold text-indigo-600 mt-1">{student.behaviorPoints}</span>
            <span className="text-[9px] text-muted-foreground mt-0.5">เต็ม 100</span>
          </div>
          <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex flex-col items-center text-center shadow-sm">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">ความเสี่ยง SDQ</span>
            <span className={`text-sm font-bold mt-2.5 px-2 py-0.5 rounded-full ${
              student.sdqRisk === "ปกติ" 
                ? "bg-emerald-500/10 text-emerald-500" 
                : student.sdqRisk === "เสี่ยง" 
                ? "bg-amber-500/10 text-amber-500" 
                : "bg-rose-500/10 text-rose-500"
            }`}>
              {student.sdqRisk}
            </span>
            <span className="text-[9px] text-muted-foreground mt-1">คะแนน: {student.sdqScore}</span>
          </div>
          <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex flex-col items-center text-center shadow-sm">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">ดัชนี BMI</span>
            <span className="text-2xl font-extrabold text-indigo-600 mt-1">{student.bmi}</span>
            <span className="text-[9px] text-muted-foreground mt-0.5">{student.bmiStatus}</span>
          </div>
        </div>

        {/* Quick actions box / Parent Details */}
        <div className="p-3 rounded-xl border border-border bg-card/60 space-y-2">
          <h4 className="text-xs font-bold text-foreground">ข้อมูลการติดต่อผู้ปกครอง</h4>
          <div className="text-xs space-y-1 text-muted-foreground">
            <div className="flex justify-between">
              <span>ชื่อผู้ปกครอง:</span>
              <span className="font-medium text-foreground">{student.parentName}</span>
            </div>
            <div className="flex justify-between">
              <span>เบอร์โทรศัพท์:</span>
              <span className="font-medium text-foreground">{student.parentPhone}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-border/60">
              <span>สถานะการเยี่ยมบ้าน:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                student.homeVisited 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-500 border-amber-500/20"
              }`}>
                {student.homeVisited ? "เยี่ยมแล้ว" : "ยังไม่ได้เยี่ยม"}
              </span>
            </div>
          </div>
        </div>

        {/* New Log Event Form */}
        <form onSubmit={handleAddEvent} className="p-4 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 space-y-3">
          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            เพิ่มบันทึกพฤติกรรม / กิจกรรมนักเรียน (Timeline Engine)
          </h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="หัวเรื่องบันทึก (เช่น ได้รับรางวัลดีเด่น, ลาป่วยกะทันหัน)"
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-indigo-500"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="รายละเอียดเหตุการณ์เพิ่มเติม..."
              rows={2}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-indigo-500 resize-none"
              value={newEventDesc}
              onChange={(e) => setNewEventDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <select
                className="bg-background border border-border rounded-lg px-2 py-1.5 text-[11px] text-foreground outline-none flex-1"
                value={newEventCat}
                onChange={(e) => setNewEventCat(e.target.value as TimelineEvent["category"])}
              >
                <option value="behavior">บันทึกพฤติกรรม (วินัย)</option>
                <option value="attendance">การมาเรียน / ลา</option>
                <option value="academic">ผลการเรียน / พัฒนาการ</option>
                <option value="health">การเจ็บป่วย / พยาบาล</option>
                <option value="home_visit">ข้อมูลแวดล้อมครอบครัว</option>
              </select>
              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>บันทึก</span>
              </button>
            </div>
          </div>
        </form>

        {/* Vertical Timeline Engine Graphic */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">บันทึกประวัติการพัฒนาการ (Timeline Engine)</h3>
          
          <div className="relative border-l border-border ml-3.5 pl-6 space-y-6">
            {events.map((event) => {
              const styles = getCategoryStyles(event.category);
              const Icon = styles.icon;
              return (
                <div key={event.id} className="relative group">
                  {/* Circle Pin Icon */}
                  <span className={`absolute -left-[38px] top-0 p-1.5 rounded-full border bg-background shadow-sm transition-transform duration-200 group-hover:scale-110 ${styles.bg}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>

                  {/* Bubble card */}
                  <div className="p-3.5 rounded-xl border border-border bg-card/40 hover:bg-card/75 transition-all shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {event.date}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-medium">บันทึกโดย: {event.actor}</span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground mt-1.5">{event.title}</h4>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{event.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
