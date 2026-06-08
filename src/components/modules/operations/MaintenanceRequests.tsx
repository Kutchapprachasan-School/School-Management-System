"use client";

import React, { useState } from "react";
import { Hammer, CheckCircle2 } from "lucide-react";

interface MaintenanceTicket {
  id: string;
  title: string;
  location: string;
  date: string;
  status: string;
  daysPending: number;
}

interface MaintenanceRequestsProps {
  triggerToast: (title: string, message: string) => void;
  addAuditLog: (action: string, details: string) => void;
}

export default function MaintenanceRequests({ triggerToast, addAuditLog }: MaintenanceRequestsProps) {
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([
    { id: "mnt-1", title: "คอมพิวเตอร์ห้องทะเบียนหน้าบอร์ดดับ", location: "ห้องทะเบียน อาคาร 1", date: "20 พ.ค. 2569", status: "กำลังดำเนินการ", daysPending: 2 },
    { id: "mnt-2", title: "สาย LAN ขาดที่ห้องสมุดกลาง", location: "ห้องสมุด อาคาร 3", date: "18 พ.ค. 2569", status: "เสร็จสิ้น", daysPending: 0 },
  ]);
  const [mntTitle, setMntTitle] = useState("");
  const [mntDesc, setMntDesc] = useState("");
  const [mntLocation, setMntLocation] = useState("");

  const handleMaintenanceSubmit = () => {
    if (!mntTitle.trim() || !mntLocation.trim()) return;
    const newTicket: MaintenanceTicket = {
      id: `mnt-${Date.now()}`,
      title: mntTitle,
      location: mntLocation,
      date: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
      status: "กำลังดำเนินการ",
      daysPending: 1
    };
    setMaintenanceTickets([newTicket, ...maintenanceTickets]);
    setMntTitle("");
    setMntDesc("");
    setMntLocation("");
    triggerToast("🛠️ ส่งแจ้งซ่อมเรียบร้อย", "เจ้าหน้าที่ฝ่ายเทคนิคคอมพิวเตอร์ได้รับตั๋วงานเรียบร้อยแล้ว");
    addAuditLog("CREATE_MAINTENANCE_TICKET", `แจ้งซ่อม: ${mntTitle}`);
  };

  const markMaintenanceDone = (id: string) => {
    setMaintenanceTickets(prev => prev.map(t => t.id === id ? { ...t, status: "เสร็จสิ้น", daysPending: 0 } : t));
    triggerToast("✅ งานซ่อมเสร็จสิ้น", "อัปเดตสถานะงานซ่อมบำรุงเรียบร้อย");
  };

  return (
    <div className="p-6 rounded-xl glass glass-card space-y-4 animate-in fade-in duration-200">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <Hammer className="w-4 h-4 text-amber-500" />
        แจ้งซ่อมบำรุงและครุภัณฑ์คอมพิวเตอร์ / ICT
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">กรอกแจ้งซ่อมเครื่องใหม่</h4>
          <div className="space-y-2 text-xs text-muted-foreground font-semibold">
            <div className="space-y-1">
              <label className="text-[8px] font-bold">ชื่อครุภัณฑ์ที่เสียหาย</label>
              <input type="text" value={mntTitle} onChange={e => setMntTitle(e.target.value)} placeholder="เช่น โปรเจคเตอร์ห้อง ม.6/1 ดับ เปิดไม่ติด" className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold">สถานที่ / ห้อง</label>
              <input type="text" value={mntLocation} onChange={e => setMntLocation(e.target.value)} placeholder="เช่น ห้องทะเบียน อาคาร 1" className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold">อาการเสีย / รายละเอียด</label>
              <textarea rows={2} value={mntDesc} onChange={e => setMntDesc(e.target.value)} placeholder="พัดลมหมุนเสียงดัง แต่ไฟหลอดภาพไม่สว่าง มีควันชื้นเล็กน้อย" className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground outline-none resize-none" />
            </div>
            <button 
              onClick={handleMaintenanceSubmit}
              className="w-full py-2 bg-primary hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-all"
            >
              ส่งข้อมูลไปฝ่ายอาคารและ ICT
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">ประวัติการซ่อมบำรุงในโรงเรียน</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {maintenanceTickets.map((ticket) => (
              <div key={ticket.id} className="flex flex-col p-3 rounded-lg border border-border/60 text-xs bg-muted/20 gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-foreground">{ticket.title}</h5>
                    <div className="text-[9px] text-muted-foreground mt-0.5 space-y-0.5">
                      <p>📍 {ticket.location}</p>
                      <p>แจ้งเมื่อ: {ticket.date} {ticket.status === "กำลังดำเนินการ" && <span className="text-rose-500 font-bold ml-1">({ticket.daysPending} วัน)</span>}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold shrink-0 ${
                    ticket.status === "เสร็จสิ้น" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  }`}>{ticket.status}</span>
                </div>
                {ticket.status === "กำลังดำเนินการ" && (
                  <div className="flex justify-end mt-1">
                    <button 
                      onClick={() => markMaintenanceDone(ticket.id)}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 text-[10px] font-bold rounded-md transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> ยืนยันซ่อมเสร็จสิ้น
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
