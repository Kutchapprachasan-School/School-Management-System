"use client";

import React, { useState } from "react";
import { Users, Plus, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";

interface Club {
  id: string;
  name: string;
  advisor: string;
  capacity: number;
  enrolledCount: number;
  description: string;
}

export default function ClubsManager() {
  const [clubs, setClubs] = useState<Club[]>([
    {
      id: "c-1",
      name: "ชมรมวิทยาศาสตร์สิ่งแวดล้อม (Eco-Sci)",
      advisor: "ครูวิทยาศาสตร์ มุ่งมั่น",
      capacity: 30,
      enrolledCount: 18,
      description: "ศึกษาและทำกิจกรรมเกี่ยวกับพลังงานสะอาดและการรีไซเคิลขยะในชุมชน"
    },
    {
      id: "c-2",
      name: "ชมรมคอมพิวเตอร์และเขียนโปรแกรม (Code Club)",
      advisor: "ครูวรรณภา สอนเก่ง",
      capacity: 25,
      enrolledCount: 25, // Full!
      description: "เรียนรู้อัลกอริทึม พัฒนาเว็บไซต์ และแข่งขันทักษะไอซีที"
    },
    {
      id: "c-3",
      name: "ชมรมภาษาไทยกวีวรรณศิลป์",
      advisor: "ครูอัญชลี รัตนโกสินทร์",
      capacity: 40,
      enrolledCount: 12,
      description: "แต่งโคลง ฉันท์ กาพย์ กลอน และศึกษาประวัติศาสตร์วรรณคดีชิ้นเอก"
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-foreground">ระบบจัดการชุมนุม / กิจกรรมพัฒนาผู้เรียน</h3>
          <p className="text-[10px] text-muted-foreground">เปิดรับสมัคร ตั้งคลับชมรม และให้นักเรียนล็อกอินเข้าเลือกชุมนุมตามเงื่อนไขจำนวนโควตาระบบ</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1.5 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-650/20"
        >
          <Plus className="w-4 h-4" /> ตั้งชมรมใหม่
        </button>
      </div>

      {/* Creation Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Users className="text-primary w-4.5 h-4.5" /> จัดตั้งชมรมกิจกรรมใหม่
              </h4>
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">×</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const capacity = parseInt(fd.get("capacity") as string);
                const newClub: Club = {
                  id: `c-${Date.now()}`,
                  name: fd.get("name") as string,
                  advisor: fd.get("advisor") as string,
                  capacity: capacity,
                  enrolledCount: 0,
                  description: fd.get("description") as string
                };
                setClubs([...clubs, newClub]);
                setShowAddForm(false);
              }}
              className="space-y-3.5 text-xs font-semibold text-muted-foreground"
            >
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold">ชื่อชมรมกิจกรรม</label>
                <input name="name" placeholder="เช่น ชมรมหุ่นยนต์สมองกล" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold">ครูที่ปรึกษาชมรม</label>
                  <input name="advisor" placeholder="ชื่อครูผู้รับผิดชอบ" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold">จำนวนรับสมัครสูงสุด (โควตา)</label>
                  <input name="capacity" type="number" defaultValue="30" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold">คำอธิบายชมรมเบื้องต้น</label>
                <textarea name="description" rows={3} placeholder="อธิบายกิจกรรมหลักที่จะทำในชมรม..." className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md">
                บันทึกการเปิดรับสมัครชมรม
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.map((c) => {
          const isFull = c.enrolledCount >= c.capacity;
          return (
            <div key={c.id} className="p-5 rounded-2xl glass glass-card hover:border-primary/20 transition-all flex flex-col justify-between h-48 relative overflow-hidden group">
              <div>
                <div className="flex justify-between items-start gap-1">
                  <h4 className="font-extrabold text-sm text-foreground leading-snug group-hover:text-primary transition-colors">{c.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold shrink-0 border ${
                    isFull 
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  }`}>
                    {isFull ? "เต็มแล้ว" : "ว่าง"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-1">ที่ปรึกษา: {c.advisor}</p>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{c.description || "ไม่มีรายละเอียด"}</p>
              </div>

              <div className="border-t border-border/40 pt-3 flex items-center justify-between mt-auto">
                <span className="text-[10px] text-muted-foreground font-bold font-mono">
                  สมาชิก: {c.enrolledCount} / {c.capacity} คน
                </span>
                
                {!isFull && (
                  <button
                    onClick={() => {
                      setClubs(clubs.map(x => x.id === c.id ? { ...x, enrolledCount: x.enrolledCount + 1 } : x));
                    }}
                    className="px-2.5 py-1 bg-primary text-white rounded-lg text-[9px] font-bold shadow-sm shadow-indigo-650/20"
                  >
                    เข้าร่วมชมรม
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
