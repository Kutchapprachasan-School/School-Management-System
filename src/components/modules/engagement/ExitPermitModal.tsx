"use client";

import React, { useState } from "react";
import { LogOut, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { Student } from "@/types/school-os";

interface ExitPermitModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSave: (reason: string, destination: string) => void;
}

export default function ExitPermitModal({ student, isOpen, onClose, onSave }: ExitPermitModalProps) {
  const [reason, setReason] = useState("มีอาการไข้ขึ้นกระทันหันและตัวร้อน");
  const [destination, setDestination] = useState("โรงพยาบาลหรือบ้านพักอาศัยร่วมกับผู้ปกครอง");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(reason, destination);
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-sm space-y-4">
        <div className="flex justify-between items-center border-b border-border/60 pb-3">
          <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <LogOut className="text-primary w-4.5 h-4.5" /> ใบอนุญาตนักเรียนออกนอกบริเวณโรงเรียน
          </h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm font-bold">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-muted-foreground">
          <div className="space-y-1">
            <label className="text-[9px] uppercase block">เหตุผลความจำเป็นในการออกนอกโรงเรียน</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase block">สถานที่ปลายทาง</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary"
            />
          </div>

          <div className="p-3.5 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-2">
            <span className="text-[10px] text-primary uppercase font-bold block flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              LINE Automation Alert
            </span>
            <p className="text-[10px] text-muted-foreground leading-normal">
              เมื่อกดอนุญาต ระบบจะยิงข้อความ API อัตโนมัติไปยัง LINE ของผู้ปกครองคือ <b>{student.parentName}</b> โทร: <b>{student.parentPhone}</b>
            </p>
          </div>

          <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            <CheckCircle2 className="w-4 h-4" /> อนุมัติออกนอกโรงเรียน & ส่งไลน์
          </button>
        </form>
      </div>
    </div>
  );
}
