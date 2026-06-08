"use client";

import React, { useState } from "react";
import { Calendar, Clock, Plus, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

interface Booking {
  id: string;
  resourceName: string;
  resourceType: "ROOM" | "VEHICLE";
  requesterName: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
}

export default function ResourceBooking() {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: "b-1",
      resourceName: "ห้องประชุมใหญ่ (อาคาร 1 ชั้น 3)",
      resourceType: "ROOM",
      requesterName: "ครูอัญชลี รัตนโกสินทร์",
      startTime: "2026-06-01 09:00",
      endTime: "2026-06-01 12:00",
      purpose: "ประชุมสัมมนาวิชาการกลุ่มสาระภาษาไทย",
      status: "APPROVED"
    },
    {
      id: "b-2",
      resourceName: "รถตู้โรงเรียน (หมายเลขทะเบียน กข-5566)",
      resourceType: "VEHICLE",
      requesterName: "ครูสมเกียรติ กีฬาดี",
      startTime: "2026-06-03 08:00",
      endTime: "2026-06-03 16:00",
      purpose: "พานักเรียนเข้าร่วมการแข่งขันบาสเกตบอลรอบจังหวัด",
      status: "PENDING"
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-foreground">ระบบจองทรัพยากรส่วนกลาง (ห้องประชุม & รถยนต์)</h3>
          <p className="text-[10px] text-muted-foreground">ยื่นคำขอจองห้องประชุม สัมมนา หรือรถโรงเรียนสำหรับนำนักเรียนไปทัศนศึกษาหรือทำกิจกรรม</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1.5 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-650/20"
        >
          <Plus className="w-4 h-4" /> ยื่นเรื่องจองทรัพยากร
        </button>
      </div>

      {/* Creation Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Calendar className="text-primary w-4.5 h-4.5" /> จองห้องประชุม / รถยนต์โรงเรียน
              </h4>
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">×</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const type = fd.get("resourceType") as "ROOM" | "VEHICLE";
                const newB: Booking = {
                  id: `b-${Date.now()}`,
                  resourceName: fd.get("resourceName") as string,
                  resourceType: type,
                  requesterName: "ครูอัญชลี รัตนโกสินทร์",
                  startTime: `${fd.get("date")} ${fd.get("startTime")}`,
                  endTime: `${fd.get("date")} ${fd.get("endTime")}`,
                  purpose: fd.get("purpose") as string,
                  status: "PENDING"
                };
                setBookings([newB, ...bookings]);
                setShowAddForm(false);
              }}
              className="space-y-3.5 text-xs font-semibold text-muted-foreground"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold">ประเภททรัพยากร</label>
                  <select name="resourceType" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary">
                    <option value="ROOM">ห้องประชุม</option>
                    <option value="VEHICLE">รถยนต์โรงเรียน</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold">ชื่อทรัพยากรที่เลือก</label>
                  <input name="resourceName" placeholder="เช่น ห้องประชุม 1 หรือ รถตู้ กข-5566" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold">วันที่ต้องการใช้งาน</label>
                <input name="date" type="date" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold">เวลาเริ่มต้น</label>
                  <input name="startTime" type="time" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold">เวลาสิ้นสุด</label>
                  <input name="endTime" type="time" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold">วัตถุประสงค์ในการขอใช้</label>
                <textarea name="purpose" rows={3} placeholder="ระบุรายละเอียดกิจกรรม..." required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md">
                ส่งคำขอจองระบบ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="p-4 rounded-xl border border-border bg-card flex flex-col md:flex-row md:items-center justify-between hover:border-primary/20 transition-all gap-4">
            <div className="flex gap-4 items-start">
              <div className={`p-3.5 rounded-xl text-white font-bold text-center shrink-0 w-14 ${
                b.resourceType === "ROOM" ? "bg-indigo-500 shadow-md shadow-indigo-500/20" : "bg-sky-500 shadow-md shadow-sky-500/20"
              }`}>
                {b.resourceType === "ROOM" ? "ห้อง" : "รถ"}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-foreground">{b.resourceName}</h4>
                <p className="text-xs text-muted-foreground mt-0.5"><b>ผู้จอง:</b> {b.requesterName} • <b>วัตถุประสงค์:</b> {b.purpose}</p>
                <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {b.startTime} ถึง {b.endTime.split(" ")[1]}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                b.status === "APPROVED" 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                  : b.status === "PENDING"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                  : "bg-rose-500/10 text-rose-500 border-rose-500/20"
              }`}>
                {b.status === "APPROVED" ? "อนุมัติการจอง" : b.status === "PENDING" ? "รอการจัดสรร" : "ปฏิเสธคำขอ"}
              </span>
              {b.status === "PENDING" && (
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setBookings(bookings.map(x => x.id === b.id ? { ...x, status: "APPROVED" } : x));
                    }}
                    className="px-2 py-1 bg-primary hover:bg-indigo-700 text-white rounded-lg text-[9px] font-bold transition-all"
                  >
                    อนุมัติ
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
