"use client";

import React, { useState } from "react";
import { BookOpen, LogIn, LogOut, Search, Clock, Plus } from "lucide-react";

interface LibraryLog {
  id: string;
  studentName: string;
  classroom: string;
  checkIn: string;
  checkOut?: string;
}

export default function LibraryLogs() {
  const [logs, setLogs] = useState<LibraryLog[]>([
    {
      id: "lib-1",
      studentName: "นายธนพล รักเรียน",
      classroom: "ม.6/1",
      checkIn: "12:15",
      checkOut: "12:45"
    },
    {
      id: "lib-2",
      studentName: "นางสาวกานต์ชนก สุขใจ",
      classroom: "ม.6/1",
      checkIn: "12:20"
    }
  ]);

  const [studentSearch, setStudentSearch] = useState("");
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-foreground">ระบบบันทึกความปลอดภัยและสถิติห้องสมุด (Library Entry Logs)</h3>
          <p className="text-[10px] text-muted-foreground">สแกนรหัสหรือบันทึกเวลาเข้าใช้บริการห้องสมุดของนักเรียนเพื่อประเมินผลการใฝ่เรียนรู้</p>
        </div>
        <button
          onClick={() => setIsCheckInOpen(true)}
          className="px-3 py-1.5 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-650/20"
        >
          <LogIn className="w-4 h-4" /> ลงชื่อเข้าห้องสมุด
        </button>
      </div>

      {/* Check In Modal */}
      {isCheckInOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <BookOpen className="text-primary w-4.5 h-4.5" /> เช็คอินเข้าใช้งานห้องสมุด
              </h4>
              <button onClick={() => setIsCheckInOpen(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">×</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const newLog: LibraryLog = {
                  id: `lib-${Date.now()}`,
                  studentName: fd.get("name") as string,
                  classroom: fd.get("classroom") as string,
                  checkIn: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
                };
                setLogs([newLog, ...logs]);
                setIsCheckInOpen(false);
              }}
              className="space-y-3.5 text-xs font-semibold text-muted-foreground"
            >
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold">ชื่อ-นามสกุลนักเรียน</label>
                <input name="name" placeholder="เช่น นายปฏิพล ดวงดี" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold">ห้องเรียน</label>
                <input name="classroom" placeholder="เช่น ม.6/1" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md">
                ยืนยันการเช็คอิน
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="p-6 rounded-xl glass glass-card space-y-4">
        <h3 className="text-sm font-bold text-foreground">บันทึกประวัติประจำวันนี้ (Daily Logsheet)</h3>
        
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/60 text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                <th className="px-4 py-3">ชื่อ-สกุลนักเรียน</th>
                <th className="px-4 py-3">ชั้นเรียน</th>
                <th className="px-4 py-3 text-center">เวลาเข้า</th>
                <th className="px-4 py-3 text-center">เวลาออก</th>
                <th className="px-4 py-3 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-semibold text-foreground">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-bold text-sm">{log.studentName}</td>
                  <td className="px-4 py-3 text-slate-500">{log.classroom}</td>
                  <td className="px-4 py-3 text-center font-mono text-emerald-600 dark:text-emerald-450">{log.checkIn}</td>
                  <td className="px-4 py-3 text-center font-mono text-muted-foreground">{log.checkOut || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    {!log.checkOut && (
                      <button
                        onClick={() => {
                          const time = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                          setLogs(logs.map(x => x.id === log.id ? { ...x, checkOut: time } : x));
                        }}
                        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-lg text-[9px] font-bold border border-rose-500/20 transition-all cursor-pointer"
                      >
                        เช็คเอาท์ <LogOut className="w-3 h-3 inline ml-1" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
