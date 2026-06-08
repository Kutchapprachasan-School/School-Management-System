"use client";

import React, { useState, useEffect } from "react";
import { Send, Users, ShieldAlert, CheckCircle2 } from "lucide-react";

interface Student {
  id: string;
  fullName: string;
  classroom: string;
  parentName: string;
}

interface LineMessagingProps {
  students: Student[];
  triggerLineNotification: (parentName: string, message: string, studentName: string) => void;
  addAuditLog: (action: string, details: string) => void;
  triggerToast: (title: string, message: string) => void;
  currentUser?: string;
}

export default function LineMessaging({
  students,
  triggerLineNotification,
  addAuditLog,
  triggerToast,
  currentUser
}: LineMessagingProps) {
  const [lineMsgContent, setLineMsgContent] = useState("เรียนผู้ปกครอง วันนี้นักเรียนมีความตั้งใจในการเรียนและเข้าร่วมกิจกรรมกลุ่มเป็นอย่างดีครับ");
  const [targetGroup, setTargetGroup] = useState("ม.6/1_parents");
  const [lineSenderName, setLineSenderName] = useState(currentUser || "ครูประจำชั้น ม.6/1");

  // Sync default sender name when session user name is loaded
  useEffect(() => {
    if (currentUser) {
      setLineSenderName(currentUser);
    }
  }, [currentUser]);

  const handleSendCustomLine = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine target students/parents based on group selection
    let targets: Student[] = [];
    let groupLabel = "";

    if (targetGroup === "all_parents") {
      targets = students;
      groupLabel = "ผู้ปกครองนักเรียนทั้งหมด";
    } else if (targetGroup === "all_students") {
      targets = students;
      groupLabel = "นักเรียนทั้งหมด";
    } else {
      // Classroom specific group
      const parts = targetGroup.split("_");
      const classroom = parts[0]; // e.g., "ม.6/1"
      const type = parts[1]; // "parents" or "students"
      
      targets = students.filter(s => s.classroom === classroom);
      groupLabel = type === "parents" ? `ผู้ปกครองห้อง ${classroom}` : `นักเรียนห้อง ${classroom}`;
    }

    if (targets.length === 0) {
      alert("ไม่พบเป้าหมายผู้รับในกลุ่มที่เลือก!");
      return;
    }

    const messageWithSender = `${lineMsgContent}\n\n[ส่งโดย: ${lineSenderName}]`;

    // Iterate and trigger notifications (simulation)
    targets.forEach(student => {
      const recipientName = targetGroup.includes("parents") ? (student.parentName || `ผู้ปกครองของ ${student.fullName}`) : student.fullName;
      triggerLineNotification(recipientName, messageWithSender, student.fullName);
    });

    addAuditLog("SEND_LINE_API_BROADCAST", `ส่งข้อความ LINE บรอดแคสต์หา: ${groupLabel} (รวมจำนวน ${targets.length} รายการ)`);
    triggerToast("💬 LINE Broadcast Sent", `ส่งข้อความหา ${groupLabel} จำนวน ${targets.length} คน เรียบร้อยแล้ว`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      
      {/* Message Creator */}
      <div className="lg:col-span-2 p-6 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card space-y-4 h-fit">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Send className="w-4 h-4 text-emerald-500" />
          ระบบส่งข้อความแจ้งเตือนหาผู้ปกครองแบบกลุ่ม (LINE Group Broadcaster)
        </h3>
        
        <form onSubmit={handleSendCustomLine} className="space-y-4 text-xs text-muted-foreground font-semibold">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">เลือกกลุ่มเป้าหมายผู้รับข้อความ</label>
              <select 
                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold outline-none cursor-pointer"
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
              >
                <option value="ม.6/1_parents">ห้องผู้ปกครอง ม.6/1</option>
                <option value="ม.1/1_parents">ห้องผู้ปกครอง ม.1/1</option>
                <option value="ม.1/2_parents">ห้องผู้ปกครอง ม.1/2</option>
                <option value="ม.4/1_parents">ห้องผู้ปกครอง ม.4/1</option>
                <option value="all_parents">ผู้ปกครองของนักเรียนทั้งหมด</option>
                <option value="all_students">ส่งตรงหานักเรียนทุกคน (All Students)</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">ชื่อผู้ส่ง (แสดงท้ายข้อความ)</label>
              <input 
                type="text"
                required
                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold outline-none focus:border-primary"
                value={lineSenderName}
                onChange={(e) => setLineSenderName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-muted-foreground">เนื้อหาการส่งข้อความแจ้งเตือน</label>
            <textarea 
              rows={5} 
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground font-semibold outline-none resize-none focus:border-primary leading-relaxed"
              value={lineMsgContent}
              onChange={(e) => setLineMsgContent(e.target.value)}
              required
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-[10px] text-slate-550 leading-relaxed font-normal flex items-start gap-2">
            <Users className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">การจำลองส่งข้อความ LINE Messaging API</p>
              <p className="mt-0.5">ระบบจะจำลองบุกพิกัด ID การแจ้งเตือน LINE Notify และบจก. ของระบบกลาง และจะปรากฏแบนเนอร์ Alert รายบุคคลจำลองของทุกคนตามรายชื่อนักเรียนในสังกัดห้องที่ท่านเลือกจริงด้านล่างขวา</p>
            </div>
          </div>

          <button 
            type="submit"
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            บอร์ดแคสต์ API Message แจ้ง LINE ผู้ปกครองกลุ่มเป้าหมาย
          </button>
        </form>
      </div>

      {/* Connection status and target details */}
      <div className="p-6 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card space-y-4">
        <h3 className="text-sm font-bold text-foreground">สถานะบอร์ดแคสต์ LINE Node</h3>
        
        <div className="p-4 rounded-xl border border-border bg-card/50 space-y-3.5 text-xs">
          <div className="flex justify-between items-center">
            <span>สถานะระบบ API:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">ONLINE</span>
          </div>
          <div className="flex justify-between items-center">
            <span>LINE Channel ID:</span>
            <span className="font-mono text-[10px] text-muted-foreground">1657890045</span>
          </div>
          <div className="flex justify-between items-center">
            <span>จำนวนผู้รับเป้าหมายในกลุ่ม:</span>
            <span className="font-bold text-primary dark:text-indigo-400">
              {targetGroup === "all_parents" || targetGroup === "all_students" 
                ? `${students.length} คน` 
                : `${students.filter(s => s.classroom === targetGroup.split("_")[0]).length} คน`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>อัตราการส่งสำเร็จสะสม:</span>
            <span className="font-bold text-emerald-500">100%</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/30 space-y-2 text-[10px] text-slate-500">
          <p className="font-bold text-slate-700 dark:text-slate-400">กลุ่มเป้าหมายที่เลือกจะได้รับข้อความ:</p>
          <div className="max-h-[150px] overflow-y-auto space-y-1 divide-y divide-border/20 pr-1">
            {(() => {
              const cg = targetGroup.split("_")[0];
              const isAll = targetGroup.includes("all");
              const targetsList = isAll ? students : students.filter(s => s.classroom === cg);
              
              return targetsList.map(t => {
                const recipient = targetGroup.includes("parents") ? t.parentName : t.fullName;
                return (
                  <div key={t.id} className="pt-1 flex justify-between">
                    <span>{recipient}</span>
                    <span className="text-[8px] font-bold text-slate-400">[{t.classroom}]</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
