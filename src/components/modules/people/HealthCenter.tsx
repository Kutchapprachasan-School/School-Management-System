"use client";

import React, { useState } from "react";
import { Plus, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { Student, HealthVisit } from "@/types/school-os";
import { createHealthVisit } from "@/app/actions/student";

interface HealthCenterProps {
  students: Student[];
  healthVisits: HealthVisit[];
  setHealthVisits: React.Dispatch<React.SetStateAction<HealthVisit[]>>;
  addAuditLog: (action: string, details: string) => void;
  triggerToast: (title: string, desc: string) => void;
  triggerLineNotification: (target: string, msg: string, studentName: string) => void;
  refreshDbData: () => Promise<void>;
}

export default function HealthCenter({
  students,
  healthVisits,
  setHealthVisits,
  addAuditLog,
  triggerToast,
  triggerLineNotification,
  refreshDbData
}: HealthCenterProps) {
  const [healthGrade, setHealthGrade] = useState("");
  const [healthRoom, setHealthRoom] = useState("");
  const [healthName, setHealthName] = useState("");
  const [healthSymptoms, setHealthSymptoms] = useState("");
  const [healthTemp, setHealthTemp] = useState("");
  const [healthMedicine, setHealthMedicine] = useState("");
  const [healthAction, setHealthAction] = useState("");

  const handleHealthVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthSymptoms.trim() || !healthName) return;

    const targetStudent = students.find(s => s.fullName === healthName);
    if (!targetStudent) {
      alert("กรุณาเลือกนักเรียนที่มีอยู่จริง");
      return;
    }

    try {
      const res = await createHealthVisit({
        studentId: targetStudent.id,
        symptoms: healthSymptoms,
        temperature: healthTemp ? parseFloat(healthTemp) : undefined,
        medicineUsed: healthMedicine || undefined,
        actionTaken: healthAction || undefined
      });

      if (res.success) {
        addAuditLog("CREATE_HEALTH_LOG", `ลงทะเบียนดูแลอาการเจ็บป่วยของ ${healthName} อาการ: "${healthSymptoms}"`);
        triggerToast("🏥 บันทึกเรียบร้อย", `บันทึกประวัติการใช้ยาและการรักษาเข้าห้องพยาบาลสำเร็จ`);

        // Automation notification to parent
        triggerLineNotification(
          targetStudent.parentName, 
          `แจ้งข่าวสุขภาพจากห้องพยาบาล: บุตรหลานของท่าน (${targetStudent.fullName}) มาตรวจอาการด้วยอาการ ${healthSymptoms}. ได้รับการปฐมพยาบาล: ${healthAction || "ให้นอนพักห้องพยาบาล"}`, 
          targetStudent.fullName
        );

        // Reset form
        setHealthSymptoms("");
        setHealthTemp("");
        setHealthMedicine("");
        setHealthAction("");
        setHealthName("");
        await refreshDbData();
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + (err.message || err));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      {/* Log new visit form */}
      <div className="p-6 rounded-xl glass glass-card space-y-4 h-fit">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-emerald-500" />
          บันทึกการเข้ารับการรักษาพยาบาล
        </h3>
        <form onSubmit={handleHealthVisitSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">ระดับชั้น</label>
              <select 
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold"
                value={healthGrade}
                onChange={(e) => { setHealthGrade(e.target.value); setHealthRoom(""); setHealthName(""); }}
              >
                <option value="">ทั้งหมด</option>
                <option value="ม.1">ม.1</option>
                <option value="ม.2">ม.2</option>
                <option value="ม.3">ม.3</option>
                <option value="ม.4">ม.4</option>
                <option value="ม.5">ม.5</option>
                <option value="ม.6">ม.6</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">ห้องเรียน</label>
              <select 
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold"
                value={healthRoom}
                onChange={(e) => { setHealthRoom(e.target.value); setHealthName(""); }}
                disabled={!healthGrade}
              >
                <option value="">ทั้งหมด</option>
                <option value={`${healthGrade}/1`}>{healthGrade}/1</option>
                <option value={`${healthGrade}/2`}>{healthGrade}/2</option>
                <option value={`${healthGrade}/3`}>{healthGrade}/3</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">เลือกนักเรียนที่มารักษา</label>
            <select 
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold"
              value={healthName}
              onChange={(e) => setHealthName(e.target.value)}
            >
              <option value="">-- กรุณาเลือกนักเรียน --</option>
              {students
                .filter(s => (!healthGrade || s.classroom.startsWith(healthGrade)) && (!healthRoom || s.classroom === healthRoom))
                .map(s => (
                <option key={s.id} value={s.fullName}>{s.fullName} ({s.classroom})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">อาการเจ็บป่วยเบื้องต้น</label>
            <input 
              type="text" 
              placeholder="เช่น ปวดศีรษะ ตัวร้อน หรือมีแผลถลอก"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
              value={healthSymptoms}
              onChange={(e) => setHealthSymptoms(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">อุณหภูมิร่างกาย (เซลเซียส)</label>
            <input 
              type="number" 
              step="0.1"
              placeholder="เช่น 37.5"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
              value={healthTemp}
              onChange={(e) => setHealthTemp(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">ยาที่จ่ายให้คนไข้</label>
            <input 
              type="text" 
              placeholder="เช่น พาราเซตามอล 1 เม็ด หรือทายาแดง"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
              value={healthMedicine}
              onChange={(e) => setHealthMedicine(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">การดำเนินการปฐมพยาบาล</label>
            <input 
              type="text" 
              placeholder="เช่น นอนพักห้องพยาบาล 1 คาบ หรือส่งตัวต่อโรงพยาบาล"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
              value={healthAction}
              onChange={(e) => setHealthAction(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            บันทึกการส่งเข้าห้องพยาบาล
          </button>
        </form>
      </div>

      {/* Health log grid list */}
      <div className="lg:col-span-2 p-6 rounded-xl glass glass-card space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-sm font-bold text-foreground">รายงานสรุปการใช้บริการห้องพยาบาล (Summary Report)</h3>
          <button className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-emerald-200 dark:border-emerald-500/20">
            <FileSpreadsheet className="w-3.5 h-3.5" /> ส่งออก Excel
          </button>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/60 text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                <th className="px-4 py-3">เวลาเข้า</th>
                <th className="px-4 py-3">ชื่อ-สกุล (ห้องเรียน)</th>
                <th className="px-4 py-3">อาการเบื้องต้น</th>
                <th className="px-4 py-3 text-center">อุณหภูมิ</th>
                <th className="px-4 py-3">การรักษา/จ่ายยา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-semibold text-foreground">
              {healthVisits.map((visit) => (
                <tr key={visit.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400">{visit.visitTime.split(" ")[1]}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-sm text-foreground">{visit.studentName}</div>
                    <div className="text-[10px] text-muted-foreground">{visit.classroom}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-rose-500 dark:text-rose-400 font-bold">{visit.symptoms}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {visit.temperature ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${visit.temperature >= 37.5 ? "bg-rose-100 text-rose-600 border border-rose-200" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}>
                        {visit.temperature}°C
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[10px]">
                    {visit.medicineUsed && <div className="flex items-center gap-1"><span className="text-indigo-500 font-bold">ยา:</span> {visit.medicineUsed}</div>}
                    {visit.actionTaken && <div className="flex items-center gap-1 mt-0.5"><span className="text-primary font-bold">วิธี:</span> {visit.actionTaken}</div>}
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
