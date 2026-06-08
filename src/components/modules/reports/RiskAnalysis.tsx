"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Student } from "@/types/school-os";

interface RiskAnalysisProps {
  students: Student[];
  setSelectedStudent: (student: Student | null) => void;
  setTimelineOpen: (isOpen: boolean) => void;
  triggerToast: (title: string, message: string) => void;
  addAuditLog: (action: string, details: string) => void;
}

export default function RiskAnalysis({
  students,
  setSelectedStudent,
  setTimelineOpen,
  triggerToast,
  addAuditLog
}: RiskAnalysisProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      
      {/* Risk list */}
      <div className="lg:col-span-2 p-6 rounded-xl glass glass-card space-y-4">
        <h3 className="text-sm font-bold text-foreground">นักเรียนที่ประเมินพฤติกรรมมีความเสี่ยง (AI Insights Flagged)</h3>
        <div className="space-y-3">
          {students.filter(s => s.status !== "ปกติ").map((student) => (
            <div key={student.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className={`text-[8px] px-2 py-0.5 rounded font-bold ${
                  student.status === "เสี่ยง" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                }`}>{student.status}</span>
                <h4 className="font-bold text-sm text-foreground mt-1.5">{student.fullName}</h4>
                <p className="text-xs text-muted-foreground"><b>สาเหตุวิเคราะห์:</b> พฤติกรรมสะสมเหลือเพียง {student.behaviorPoints} คะแนน, ประเมินสุขภาพจิต SDQ ผิดปกติ</p>
              </div>
              
              <button 
                onClick={() => {
                  setSelectedStudent(student);
                  setTimelineOpen(true);
                }}
                className="text-xs font-bold bg-primary hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-all"
              >
                แผนช่วยเหลือระบบ
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AI insights analysis card */}
      <div className="p-6 rounded-xl glass glass-card space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Insight Assistant
        </h3>
        <div className="p-4 rounded-xl border border-border bg-indigo-500/5 space-y-3 text-xs leading-normal">
          <p className="font-semibold text-primary dark:text-indigo-400">บทวิเคราะห์ระบบโรงเรียนประจำสัปดาห์:</p>
          <p className="text-muted-foreground">
            พบเด็กในกลุ่มเป้าหมาย ม.6/1 มีแนวโน้มการขาดเรียนสัมพันธ์กับการลดลงของคะแนนพฤติกรรมอย่างมีนัยสำคัญ. แนะแนวโรงเรียนควรเร่งรัดทำ Home Visit ร่วมกับฝ่ายพยาบาล
          </p>
          <button 
            onClick={() => {
              triggerToast("📝 ร่างจดหมายแนะแนวแสนสุข", "AI ช่วยร่างเนื้อหาจดหมายเชิญผู้ปกครองเพื่อร่วมปรึกษาหาทางออกร่วมกันเรียบร้อยแล้ว");
              addAuditLog("GENERATE_AI_REPORT", "AI บรรยายร่างใบส่งตัวปรึกษานักเรียนกลุ่มเสี่ยงวิกฤต");
            }}
            className="w-full py-2 bg-primary hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-all"
          >
            ให้ AI ร่างหนังสือเชิญประชุมผู้ปกครอง
          </button>
        </div>
      </div>

    </div>
  );
}
