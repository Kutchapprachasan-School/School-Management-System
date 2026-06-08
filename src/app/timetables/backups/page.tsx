"use client";

import { useEffect, useState } from "react";
import { getBackups, createBackup, restoreBackup, deleteBackup } from "@/app/actions/backup";
import { Download, RefreshCw, Trash2, Calendar, FileText, CheckCircle2, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function BackupsPage() {
  const { data: session } = useSession();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [label, setLabel] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const role = (session?.user as any)?.role?.toLowerCase() || "teacher";
  const isAdmin = role === "admin" || session?.user?.email === "admin@school.os";

  const loadBackups = async () => {
    setLoading(true);
    const res = await getBackups();
    if (res.success && res.data) {
      setBackups(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setIsSubmitting(true);
    setSuccessMsg(null);

    const res = await createBackup(label);
    if (res.success) {
      setLabel("");
      setSuccessMsg(res.message || "สำรองข้อมูลสำเร็จ");
      await loadBackups();
    } else {
      alert(res.error || "เกิดข้อผิดพลาดในการสำรองข้อมูล");
    }
    setIsSubmitting(false);
  };

  const handleRestore = async (id: string, backupLabel: string) => {
    const doubleConfirm = confirm(
      `⚠️ คำเตือนสำคัญสำหรับการกู้คืนระบบ!\n\nการกู้คืนข้อมูลสำรอง "${backupLabel}" จะทำการเขียนทับตารางเรียน ตารางสอน รายวิชา ห้องเรียนกายภาพ และห้องเรียนทั้งหมดในฐานข้อมูลระบบเป็นรุ่นข้อมูลดังกล่าว\n\nคุณแน่ใจหรือไม่ว่าต้องการดำเนินการกู้คืนระบบ?`
    );
    if (!doubleConfirm) return;

    setIsSubmitting(true);
    setSuccessMsg(null);
    const res = await restoreBackup(id);
    if (res.success) {
      setSuccessMsg(res.message || "กู้คืนระบบสำเร็จ");
      alert(res.message || "กู้คืนข้อมูลสำเร็จแล้ว");
    } else {
      alert(res.error || "เกิดข้อผิดพลาดในการกู้คืนระบบ");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบจุดสำรองข้อมูลนี้?")) return;
    const res = await deleteBackup(id);
    if (res.success) {
      await loadBackups();
    } else {
      alert(res.error || "ลบล้มเหลว");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <Download className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            ระบบสำรองและกู้คืนข้อมูลตารางสอน (Backup & Restore Hub)
          </h2>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-3 bg-amber-500/5 text-amber-800 dark:text-amber-300 border border-amber-500/10 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>โหมดดูข้อมูลเท่านั้น: เฉพาะผู้ดูแลระบบ (Admin) ที่สามารถสร้างจุดสำรองข้อมูลหรือทำการกู้คืนระบบฐานข้อมูลได้</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Snapshot Form (Admin Only) */}
        {isAdmin && (
          <div className="lg:col-span-1 p-6 bg-card border border-border/80 rounded-2xl h-fit space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              สร้างจุดบันทึกตารางสอน (Manual Snapshot)
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              ระบบจะนำข้อมูลตาราง Schedule, Subject, Classroom และ Room ณ ปัจจุบันทั้งหมดมาแปลงเป็น JSON string และเก็บเป็นประวัติในระบบ เพื่อนำกลับมากู้คืนหรือย้อนประวัติหากพบการจัดตารางผิดพลาด
            </p>
            <form onSubmit={handleCreateBackup} className="space-y-3 text-xs text-muted-foreground font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">บันทึกชื่อย่อ/คำอธิบายจุดสำรอง</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="เช่น ตารางรุ่นที่ 1 ก่อนแก้ปัญหาชน ม.6"
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                สร้างประวัติสำรองข้อมูล
              </button>
            </form>
          </div>
        )}

        {/* Backups List Card */}
        <div className={cn(isAdmin ? "lg:col-span-2" : "lg:col-span-3", "p-6 bg-card border border-border/80 rounded-2xl shadow-sm space-y-4 overflow-hidden")}>
          <h3 className="text-sm font-bold text-foreground">
            จุดประวัติสำรองระบบจัดตารางสอนทั้งหมด
          </h3>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground font-medium flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>กำลังตรวจสอบประวัติ Snapshot...</span>
            </div>
          ) : backups.length === 0 ? (
            <div className="py-12 border border-dashed border-border rounded-xl text-center text-muted-foreground">
              ยังไม่มีการสำรองข้อมูลตารางสอนใดๆ ในประวัติระบบ
            </div>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
              {backups.map((b) => (
                <div key={b.id} className="p-4 bg-muted/20 border border-border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-muted/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-bold text-foreground text-xs">{b.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(b.createdAt).toLocaleString("th-TH")}</span>
                      <span>ผู้สำรอง: <strong className="text-foreground">{b.createdBy}</strong></span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleRestore(b.id, b.label)}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                          title="กู้คืนระบบตารางสอนตามรุ่นนี้"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          กู้คืนตารางนี้
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={isSubmitting}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="ลบจุดบันทึกนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
