"use client";

import React, { useState } from "react";
import { UserCheck, Shuffle, Shield, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface DutySlot {
  id: string;
  dayName: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  location: string;
  assignedStaff: string[];
}

export default function DutyScheduler() {
  const [locations, setLocations] = useState<string[]>([
    "ประตูทางเข้าโรงเรียน (เช้า)",
    "โรงอาหารใหญ่ (กลางวัน)",
    "อาคารเรียน 1 (เย็น)",
    "จุดคัดกรองความปลอดภัย (เช้า)"
  ]);
  const [newLocation, setNewLocation] = useState("");

  const [dutySlots, setDutySlots] = useState<DutySlot[]>([
    { id: "ds-1", dayName: "Monday", location: "ประตูทางเข้าโรงเรียน (เช้า)", assignedStaff: ["ครูอัญชลี รัตนฯ"] },
    { id: "ds-2", dayName: "Monday", location: "โรงอาหารใหญ่ (กลางวัน)", assignedStaff: ["ครูวิทยาศาสตร์ มุ่งมั่น"] },
    { id: "ds-3", dayName: "Tuesday", location: "ประตูทางเข้าโรงเรียน (เช้า)", assignedStaff: ["ครูสมเกียรติ กีฬาดี"] }
  ]);

  const [staffPool] = useState<string[]>([
    "ครูอัญชลี รัตนโกสินทร์",
    "ครูวิทยาศาสตร์ มุ่งมั่น",
    "ครูสมเกียรติ กีฬาดี",
    "ครูวรรณภา สอนเก่ง",
    "ครูสมชาย สอนดี",
    "ครูพรชนก เกียรติทวี"
  ]);

  // 1. Flexible guard duty randomizer
  const handleRandomize = () => {
    const days: DutySlot["dayName"][] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const randomized: DutySlot[] = [];
    
    let index = 0;
    days.forEach((day) => {
      locations.forEach((loc) => {
        // Pick 1-2 random teachers
        const shuffled = [...staffPool].sort(() => 0.5 - Math.random());
        const picked = shuffled.slice(0, 1 + Math.round(Math.random()));
        
        randomized.push({
          id: `ds-rand-${index++}`,
          dayName: day,
          location: loc,
          assignedStaff: picked
        });
      });
    });

    setDutySlots(randomized);
    alert("🎲 ระบบ AI สุ่มจัดเวรครูลงปฏิบัติหน้าที่ประจำจุดต่างๆ ทั้งสัปดาห์เสร็จสิ้น!");
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    setLocations([...locations, newLocation.trim()]);
    setNewLocation("");
  };

  const handleDeleteLocation = (loc: string) => {
    setLocations(locations.filter(l => l !== loc));
  };

  const translateDay = (day: string) => {
    switch (day) {
      case "Monday": return "วันจันทร์";
      case "Tuesday": return "วันอังคาร";
      case "Wednesday": return "วันพุธ";
      case "Thursday": return "วันพฤหัสบดี";
      case "Friday": return "วันศุกร์";
      default: return day;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      {/* Left Column: Manage Locations & Control */}
      <div className="lg:col-span-1 space-y-4">
        <div className="p-6 rounded-xl glass glass-card space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Shield className="w-4.5 h-4.5 text-primary" />
            ตั้งค่าจุดปฏิบัติงานเวร
          </h3>
          
          <form onSubmit={handleAddLocation} className="flex gap-2">
            <input
              type="text"
              placeholder="เพิ่มจุดปฏิบัติเวร..."
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="px-3.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
            >
              เพิ่ม
            </button>
          </form>

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {locations.map((loc, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-muted/40 border border-border/50 rounded-xl text-xs font-bold text-foreground">
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteLocation(loc)}
                  className="p-1 text-slate-450 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl glass glass-card text-center space-y-3">
          <h4 className="font-extrabold text-sm text-foreground">ตัวสุ่มจัดเวรอัตโนมัติ (Flexible AI Randomizer)</h4>
          <p className="text-[10px] text-muted-foreground leading-normal">สุ่มเกลี่ยบุคลากรครูที่ว่างลงปฏิบัติงานเวรเช้า-เย็นในจุดต่างๆ อย่างสม่ำเสมอและยุติธรรม</p>
          
          <button
            onClick={handleRandomize}
            className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            สุ่มจัดเวรประจำสัปดาห์
          </button>
        </div>
      </div>

      {/* Right Column: Weekly Duty Grid View */}
      <div className="lg:col-span-2 p-6 rounded-xl glass glass-card space-y-4">
        <h3 className="text-sm font-bold text-foreground">ตารางปฏิบัติงานเวรประจำสัปดาห์</h3>
        
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 text-xs">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((dayName) => {
            const slotsForDay = dutySlots.filter(s => s.dayName === dayName);
            return (
              <div key={dayName} className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-black text-sm text-primary border-b border-border/60 pb-1.5 flex items-center gap-1">
                  <UserCheck className="w-4.5 h-4.5" />
                  {translateDay(dayName)}
                </h4>
                
                {slotsForDay.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">ยังไม่มีการสุ่มหรือมอบหมายหน้าที่</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-semibold text-slate-700 dark:text-slate-350">
                    {slotsForDay.map((slot) => (
                      <div key={slot.id} className="p-2.5 bg-muted/20 border border-border/40 rounded-xl flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{slot.location}</span>
                        <p className="text-foreground text-xs mt-1.5 font-bold">👤 {slot.assignedStaff.join(" , ")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
