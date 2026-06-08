"use client";

import React, { useState } from "react";
import { UserCheck, Star, Calendar, MessageSquare, Plus, CheckCircle2 } from "lucide-react";

interface SupervisionRecord {
  id: string;
  supervisorName: string;
  teacherName: string;
  subjectName: string;
  score: number; // e.g. 9.2 out of 10
  feedback: string;
  date: string;
}

export default function SupervisionSchedule() {
  const [records, setRecords] = useState<SupervisionRecord[]>([
    {
      id: "sv-1",
      supervisorName: "ผู้อำนวยการโรงเรียน",
      teacherName: "ครูอัญชลี รัตนโกสินทร์",
      subjectName: "ภาษาไทยพื้นฐาน (ท31101)",
      score: 9.5,
      feedback: "การจัดกระบวนการเรียนการสอนทำได้ยอดเยี่ยม นักเรียนมีส่วนร่วมสูงมาก สื่อประยุกต์สวยงาม",
      date: "2026-05-18"
    },
    {
      id: "sv-2",
      supervisorName: "ครูอัญชลี รัตนโกสินทร์ (หัวหน้ากลุ่มสาระ)",
      teacherName: "ครูวิทยาศาสตร์ มุ่งมั่น",
      subjectName: "วิทยาศาสตร์เพิ่มเติม (ว31201)",
      score: 8.8,
      feedback: "การสาธิตการทดลองทำได้ชัดเจนดี แต่ควรเพิ่มเวลาให้นักเรียนซักถามช่วงท้ายคาบเพิ่มเติม",
      date: "2026-05-20"
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-foreground">ระบบนิเทศการจัดการเรียนการสอน</h3>
          <p className="text-[10px] text-muted-foreground">บันทึกการสังเกตการสอนและประเมินผลการสอนภายในฝ่ายวิชาการเพื่อพัฒนาคุณภาพบุคลากร</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1.5 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-650/20"
        >
          <Plus className="w-4 h-4" /> บันทึกการนิเทศการสอน
        </button>
      </div>

      {/* Creation Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <UserCheck className="text-primary w-4.5 h-4.5" /> เพิ่มใบนิเทศการสอนใหม่
              </h4>
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">×</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const newRec: SupervisionRecord = {
                  id: `sv-${Date.now()}`,
                  supervisorName: fd.get("supervisorName") as string,
                  teacherName: fd.get("teacherName") as string,
                  subjectName: fd.get("subjectName") as string,
                  score: parseFloat(fd.get("score") as string),
                  feedback: fd.get("feedback") as string,
                  date: fd.get("date") as string
                };
                setRecords([newRec, ...records]);
                setShowAddForm(false);
              }}
              className="space-y-3.5 text-xs font-semibold text-muted-foreground"
            >
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold">ผู้นิเทศการสอน</label>
                <input name="supervisorName" placeholder="เช่น ผู้อำนวยการ หรือ หัวหน้ากลุ่มสาระ" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold">ผู้รับการนิเทศ (ครูผู้สอน)</label>
                  <input name="teacherName" placeholder="ชื่อครูผู้สอน" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold">วิชาที่สังเกตการณ์</label>
                  <input name="subjectName" placeholder="เช่น ท31101 ภาษาไทย" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold">คะแนนประเมิน (เต็ม 10)</label>
                  <input name="score" type="number" step="0.1" min="0" max="10" defaultValue="9.0" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold">วันที่เข้านิเทศ</label>
                  <input name="date" type="date" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold">ข้อเสนอแนะและข้อคิดเห็นเชิงลึก</label>
                <textarea name="feedback" rows={3} placeholder="ข้อดีที่ควรชื่นชม และจุดที่ควรพัฒนาเสริมทักษะนักเรียน..." required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md">
                บันทึกประวัติการนิเทศ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Records list */}
      <div className="space-y-4">
        {records.map((r) => (
          <div key={r.id} className="p-5 rounded-2xl glass glass-card hover:border-primary/20 transition-all flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20 flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3" /> {r.date}
                </span>
                <span className="text-xs text-muted-foreground font-bold">นิเทศโดย: {r.supervisorName}</span>
              </div>
              <h4 className="font-extrabold text-sm text-foreground">ผู้รับการประเมิน: {r.teacherName}</h4>
              <p className="text-xs text-muted-foreground"><b>วิชา:</b> {r.subjectName}</p>
              <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
                <MessageSquare className="w-3.5 h-3.5 inline mr-1 text-primary" />
                <b>ความเห็นผู้นิเทศ:</b> {r.feedback}
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-xl p-4 min-w-[120px] shadow-inner shrink-0 text-center">
              <span className="text-[9px] uppercase font-bold text-primary tracking-wider">คะแนนการสอน</span>
              <span className="text-2xl font-black text-primary mt-1 flex items-center gap-0.5">
                {r.score}
                <span className="text-xs font-semibold text-muted-foreground">/10</span>
              </span>
              <div className="flex gap-0.5 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(r.score / 2) ? "text-amber-500 fill-amber-500" : "text-slate-350"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
