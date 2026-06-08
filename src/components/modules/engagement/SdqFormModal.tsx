"use client";

import React, { useState } from "react";
import { HeartPulse, CheckCircle2, X } from "lucide-react";
import { Student } from "@/types/school-os";

interface SdqFormModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSave: (sdqScore: number, sdqRisk: string, bmi: number, bmiStatus: string, weight: number, height: number) => void;
}

export default function SdqFormModal({ student, isOpen, onClose, onSave }: SdqFormModalProps) {
  const [weight, setWeight] = useState(student.bmi ? "60" : "");
  const [height, setHeight] = useState(student.bmi ? "170" : "");
  
  // 5 SDQ Sample categories (Total 25 questions in full, we implement 5 key questions for representative scoring)
  const [scores, setScores] = useState<Record<string, number>>({
    q1: 0, q2: 0, q3: 0, q4: 0, q5: 0
  });

  if (!isOpen) return null;

  const handleSdqChange = (q: string, value: number) => {
    setScores(prev => ({ ...prev, [q]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate BMI
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // to meters
    let bmiValue = student.bmi || 20;
    let bmiStatusValue = student.bmiStatus || "สมส่วน";
    
    if (w && h) {
      bmiValue = parseFloat((w / (h * h)).toFixed(1));
      if (bmiValue < 18.5) bmiStatusValue = "ผอม";
      else if (bmiValue < 23) bmiStatusValue = "สมส่วน";
      else if (bmiValue < 25) bmiStatusValue = "น้ำหนักเกิน";
      else bmiStatusValue = "อ้วน";
    }

    // Calculate SDQ
    const totalSdq = Object.values(scores).reduce((a, b) => a + b, 0) * 5; // scaled up to represent 25 questions
    let risk = "ปกติ";
    if (totalSdq >= 17) risk = "ช่วยเหลือเร่งด่วน";
    else if (totalSdq >= 13) risk = "เสี่ยง";

    onSave(totalSdq, risk, bmiValue, bmiStatusValue, w, h * 100);
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-border/60 pb-3">
          <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <HeartPulse className="text-rose-500 w-4.5 h-4.5" /> แบบประเมินพฤติกรรม SDQ & สถิติ BMI
          </h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm font-bold">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-muted-foreground">
          {/* Section 1: BMI inputs */}
          <div className="p-3.5 bg-primary/5 rounded-xl space-y-2 border border-primary/10">
            <span className="text-[10px] text-primary uppercase font-bold block">1. ดัชนีมวลกาย (BMI)</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase block">น้ำหนัก (กิโลกรัม)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase block">ส่วนสูง (เซนติเมตร)</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:border-primary" />
              </div>
            </div>
          </div>

          {/* Section 2: SDQ checklist */}
          <div className="space-y-3">
            <span className="text-[10px] text-foreground uppercase font-bold block">2. แบบประเมินจุดแข็งและจุดอ่อน (SDQ 5 ด้านหลัก)</span>
            
            {[
              { key: "q1", title: "1. ด้านอารมณ์: มักมีอาการปวดหัว ปวดท้อง ท้องอืดบ่อยๆ" },
              { key: "q2", title: "2. ด้านเกเร: มักมีปัญหาการทะเลาะวิวาทหรือข่มขู่เพื่อน" },
              { key: "q3", title: "3. ด้านสมาธิสั้น: วอกแวกง่าย ไม่มีสมาธิในการทำงานจนเสร็จ" },
              { key: "q4", title: "4. ด้านความสัมพันธ์กับเพื่อน: มักแยกตัว เล่นคนเดียว ไม่มีเพื่อนสนิท" },
              { key: "q5", title: "5. ด้านสัมพันธภาพทางสังคม: มักช่วยเหลือผู้อื่น มีจิตสาธารณะ" },
            ].map((q) => (
              <div key={q.key} className="space-y-1.5 border-b border-border/40 pb-2.5">
                <p className="text-foreground leading-normal">{q.title}</p>
                <div className="flex gap-2">
                  {[
                    { label: "ไม่จริง (0)", val: 0 },
                    { label: "จริงบางส่วน (1)", val: 1 },
                    { label: "จริงที่สุด (2)", val: 2 }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => handleSdqChange(q.key, opt.val)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                        scores[q.key] === opt.val 
                          ? "bg-primary text-white border-primary" 
                          : "bg-muted/30 border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> บันทึกการประเมิน
          </button>
        </form>
      </div>
    </div>
  );
}
