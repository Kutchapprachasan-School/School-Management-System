"use client";

import React, { useState } from "react";
import { Home, MapPin, CheckCircle2 } from "lucide-react";
import { Student } from "@/types/school-os";

interface HomeVisitModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSave: (allowance: number) => void;
}

export default function HomeVisitModal({ student, isOpen, onClose, onSave }: HomeVisitModalProps) {
  const [lat, setLat] = useState("13.7563");
  const [lng, setLng] = useState("100.5018");
  const [distance, setDistance] = useState("15");
  const [income, setIncome] = useState("3500");
  const [houseCondition, setHouseCondition] = useState("ไม้กึ่งปูน สภาพทรุดโทรมปานกลาง");

  if (!isOpen) return null;

  // Allowance math: ฿15 per km travel allowance
  const travelCost = parseFloat(distance) * 15 * 2; // round-trip

  const handleGetLocation = () => {
    // Mock GPS locator
    setLat("13.7244");
    setLng("100.5215");
    alert("📍 ดึงพิกัด GPS ปัจจุบันสำเร็จ!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(travelCost);
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-border/60 pb-3">
          <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <Home className="text-primary w-4.5 h-4.5" /> บันทึกการเยี่ยมบ้านนักเรียน (กสศ. นร.01)
          </h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm font-bold">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-muted-foreground">
          {/* Section 1: GPS Mapping */}
          <div className="p-3.5 bg-primary/5 rounded-xl space-y-3 border border-primary/10">
            <span className="text-[10px] text-primary uppercase font-bold block">1. ปักหมุดแผนที่นำทาง AI (AI Mapping)</span>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase block">ละติจูด (Latitude)</label>
                <input type="text" value={lat} onChange={(e) => setLat(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase block">ลองจิจูด (Longitude)</label>
                <input type="text" value={lng} onChange={(e) => setLng(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:border-primary" />
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleGetLocation}
              className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-border rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5 text-primary" /> ใช้พิกัดปัจจุบันของครู
            </button>
          </div>

          {/* Section 2: Nor Por 01 Form */}
          <div className="space-y-3">
            <span className="text-[10px] text-foreground uppercase font-bold block">2. รายละเอียดข้อมูง กสศ. นร.01</span>
            
            <div className="space-y-1">
              <label className="text-[9px] uppercase block">รายได้เฉลี่ยครอบครัว (บาทต่อเดือน)</label>
              <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:border-primary" />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase block">สภาพที่อยู่อาศัย / ฝาบ้าน / หลังคา</label>
              <input type="text" value={houseCondition} onChange={(e) => setHouseCondition(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:border-primary" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase block">ระยะทางห่างจากโรงเรียน (กิโลเมตร)</label>
                <input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase block">ค่าเดินทางไป-กลับที่คำนวณได้</label>
                <div className="w-full bg-muted/30 border border-border rounded-lg p-2.5 text-xs text-primary font-bold">
                  ฿{travelCost.toLocaleString()} บาท
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> บันทึกการเยี่ยมบ้าน
          </button>
        </form>
      </div>
    </div>
  );
}
