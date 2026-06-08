"use client";

import React, { useState } from "react";
import { Award, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Student } from "@/types/school-os";

interface BehaviorLogModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSave: (pointsChange: number, description: string) => void;
}

const RULES = [
  { id: "r-1", category: "DEDUCTION", description: "มาสายเกินเวลาเข้าแถวเคารพธงชาติ", points: -5 },
  { id: "r-2", category: "DEDUCTION", description: "แต่งกายผิดระเบียบของสถานศึกษา", points: -5 },
  { id: "r-3", category: "DEDUCTION", description: "หลบเลี่ยงชั่วโมงเรียนหรือหนีเรียน", points: -10 },
  { id: "r-4", category: "DEDUCTION", description: "การทะเลาะวิวาทหรือทำร้ายร่างกายเพื่อน", points: -20 },
  { id: "r-5", category: "MERIT", description: "บำเพ็ญประโยชน์ต่อส่วนรวม/ทำความสะอาดห้องเรียน", points: 10 },
  { id: "r-6", category: "MERIT", description: "ได้รับรางวัลประกวดการแข่งขันวิชาการ", points: 15 },
  { id: "r-7", category: "MERIT", description: "ช่วยคัดกรองงานจิตอาสากลุ่มสาระการเรียนรู้", points: 10 },
];

export default function BehaviorLogModal({ student, isOpen, onClose, onSave }: BehaviorLogModalProps) {
  const [selectedRuleId, setSelectedRuleId] = useState("r-1");
  const [customPoints, setCustomPoints] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useCustom) {
      const pts = parseInt(customPoints);
      if (pts && customDesc.trim()) {
        onSave(pts, customDesc.trim());
      }
    } else {
      const rule = RULES.find(r => r.id === selectedRuleId);
      if (rule) {
        onSave(rule.points, rule.description);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-border/60 pb-3">
          <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <ShieldAlert className="text-amber-500 w-4.5 h-4.5" /> ระบบบันทึกคะแนนความประพฤติและหักคะแนน
          </h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm font-bold">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-muted-foreground">
          {/* Rules Toggle */}
          <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50 w-fit">
            <button
              type="button"
              onClick={() => setUseCustom(false)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                !useCustom ? "bg-primary text-white" : "text-muted-foreground"
              }`}
            >
              เลือกตามตารางระเบียบ
            </button>
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                useCustom ? "bg-primary text-white" : "text-muted-foreground"
              }`}
            >
              ป้อนแบบระบุเอง
            </button>
          </div>

          {!useCustom ? (
            <div className="space-y-2">
              <label className="text-[9px] uppercase block">เลือกความผิด / ความดีความชอบตามกฎเกณฑ์</label>
              <select
                value={selectedRuleId}
                onChange={(e) => setSelectedRuleId(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary"
              >
                {RULES.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.points > 0 ? "➕" : "➖"} {r.description} ({r.points > 0 ? `+${r.points}` : r.points} คะแนน)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase block">ระบุข้อกำหนดเหตุผลการปรับคะแนน</label>
                <input
                  type="text"
                  placeholder="เช่น ทำลายทรัพย์สินสาธารณะ หรือ ทะเลาะวิวาท"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase block">คะแนนที่ปรับเปลี่ยน (บวกหรือติดลบ)</label>
                <input
                  type="number"
                  placeholder="เช่น -10 หรือ 5"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary font-mono"
                />
              </div>
            </div>
          )}

          <div className="p-3.5 bg-muted/40 rounded-xl space-y-1 text-center font-bold">
            <span className="text-[10px] text-muted-foreground uppercase">สถานะคะแนนความประพฤติปัจจุบัน:</span>
            <p className="text-foreground text-sm font-black mt-1">฿{student.behaviorPoints} คะแนน</p>
          </div>

          <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> บันทึกปรับคะแนน
          </button>
        </form>
      </div>
    </div>
  );
}
