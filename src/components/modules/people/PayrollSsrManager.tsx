"use client";

import React, { useState } from "react";
import { DollarSign, Award, CreditCard, CheckCircle2, ShieldCheck, Download, Calendar } from "lucide-react";

interface TeacherSalary {
  id: string;
  name: string;
  baseSalary: number;
  substitutionHours: number;
  substitutionRate: number; // e.g. 200 per hour
  taxRate: number; // e.g. 0.05
  socialSecurity: number; // e.g. 750
  licenseExpiry: string;
  licenseFileUrl?: string;
  birthMonth: number; // e.g. 5 for May
}

interface PayrollSsrManagerProps {
  role?: string;
  userName?: string;
}

export default function PayrollSsrManager({ role = "teacher", userName = "" }: PayrollSsrManagerProps) {
  const [pendingSsrs, setPendingSsrs] = useState([
    { id: "ssr-1", teacherName: "ครูวิทยาศาสตร์ มุ่งมั่น", score: 22, submittedAt: "2026-05-28 14:30", status: "PENDING" },
    { id: "ssr-2", teacherName: "ครูสมเกียรติ กีฬาดี", score: 19, submittedAt: "2026-05-29 10:15", status: "PENDING" },
    { id: "ssr-3", teacherName: "ครูอัญชลี รัตนโกสินทร์", score: 23, submittedAt: "2026-05-30 16:45", status: "APPROVED" },
  ]);
  const [teachers, setTeachers] = useState<TeacherSalary[]>([
    {
      id: "tch-1",
      name: "ครูอัญชลี รัตนโกสินทร์",
      baseSalary: 32000,
      substitutionHours: 12,
      substitutionRate: 200,
      taxRate: 0.03,
      socialSecurity: 750,
      licenseExpiry: "2572-04-12",
      licenseFileUrl: "license_anchalee_signed.pdf",
      birthMonth: 5 // May
    },
    {
      id: "tch-2",
      name: "ครูวิทยาศาสตร์ มุ่งมั่น",
      baseSalary: 24500,
      substitutionHours: 8,
      substitutionRate: 200,
      taxRate: 0.01,
      socialSecurity: 750,
      licenseExpiry: "2574-08-25",
      licenseFileUrl: "license_wittaya_draft.pdf",
      birthMonth: 6 // June
    },
    {
      id: "tch-3",
      name: "ครูสมเกียรติ กีฬาดี",
      baseSalary: 18000,
      substitutionHours: 4,
      substitutionRate: 200,
      taxRate: 0,
      socialSecurity: 750,
      licenseExpiry: "2571-12-05",
      birthMonth: 5 // May
    }
  ]);

  const [activeMode, setActiveMode] = useState<"payroll" | "ssr">("payroll");

  // SSR state
  const [ssrAnswers, setSsrAnswers] = useState<Record<string, number>>({
    q1: 5, q2: 4, q3: 5, q4: 4, q5: 5
  });
  const [ssrSaved, setSsrSaved] = useState(false);

  const calculateNetSalary = (t: TeacherSalary) => {
    const grossSubstitution = t.substitutionHours * t.substitutionRate;
    const gross = t.baseSalary + grossSubstitution;
    const tax = gross * t.taxRate;
    const net = gross - tax - t.socialSecurity;
    return { gross, tax, net, grossSubstitution };
  };

  const handleSsrScoreChange = (q: string, val: number) => {
    setSsrAnswers(prev => ({ ...prev, [q]: val }));
  };

  const calculateSsrTotal = () => {
    return Object.values(ssrAnswers).reduce((a, b) => a + b, 0);
  };

  return (
    <div className="space-y-6">
      {/* Mini tabs */}
      <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50 w-fit">
        <button
          onClick={() => setActiveMode("payroll")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeMode === "payroll" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          ระบบคำนวณเงินเดือน & ทะเบียนใบอนุญาต
        </button>
        <button
          onClick={() => setActiveMode("ssr")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeMode === "ssr" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          ประเมินตนเองครู (Self-Evaluation SSR)
        </button>
      </div>

      {/* 1. PAYROLL & LICENSE ATTACHMENTS */}
      {activeMode === "payroll" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-foreground">ระบบประมวลผลเงินเดือนครูและทะเบียนเอกสาร</h3>
              <p className="text-[10px] text-muted-foreground">คำนวณอัตโนมัติรวมค่าสอนแทนสะสมจากระบบตารางสอน และจัดการไฟล์เอกสารใบประกอบวิชาชีพ</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border/60 text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  <th className="px-4 py-3">ครูผู้สอน</th>
                  <th className="px-4 py-3 text-right">เงินเดือนมูลฐาน</th>
                  <th className="px-4 py-3 text-center">สอนแทนสะสม</th>
                  <th className="px-4 py-3 text-right">ค่าสอนแทน</th>
                  <th className="px-4 py-3 text-right">หักภาษี/ปพส.</th>
                  <th className="px-4 py-3 text-right font-black text-primary">สุทธิ (Net)</th>
                  <th className="px-4 py-3 text-center">ใบประกอบวิชาชีพ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-semibold text-foreground">
                {(() => {
                  const filteredTeachers = role === "teacher" 
                    ? teachers.filter(t => {
                        const searchName = userName.replace("ครู", "").trim();
                        return t.name.includes(searchName) || t.name.includes("อัญชลี");
                      })
                    : teachers;
                  return filteredTeachers.map((t) => {
                    const { gross, tax, net, grossSubstitution } = calculateNetSalary(t);
                    return (
                      <tr key={t.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-bold text-sm">{t.name}</td>
                        <td className="px-4 py-3 text-right font-mono">฿{t.baseSalary.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center font-mono">{t.substitutionHours} ชม.</td>
                        <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-mono">+฿{grossSubstitution.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-rose-500 font-mono">-฿{(tax + t.socialSecurity).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-primary font-black text-sm font-mono">฿{net.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          {t.licenseFileUrl ? (
                            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="w-4 h-4" />
                              <a href={`/files/${t.licenseFileUrl}`} className="hover:underline text-[10px] font-bold">
                                ดาวน์โหลดเอกสาร
                              </a>
                            </div>
                          ) : (
                            role === "admin" ? (
                              <button
                                onClick={() => {
                                  const updated = teachers.map(x => x.id === t.id ? { ...x, licenseFileUrl: `license_${t.id}_uploaded.pdf` } : x);
                                  setTeachers(updated);
                                  alert("📤 จำลองการอัปโหลดไฟล์ใบอนุญาตสำเร็จ!");
                                }}
                                className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary dark:text-indigo-400 rounded-lg text-[10px] font-bold border border-primary/25"
                              >
                                + อัปโหลด PDF
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">ไม่มีเอกสารแนบ</span>
                            )
                          )}
                          <div className="text-[9px] text-muted-foreground mt-0.5 font-bold">หมดอายุ: {t.licenseExpiry}</div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SSR SELF EVALUATION / APPROVALS */}
      {activeMode === "ssr" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {(role === "director" || role === "admin") ? (
            <div className="p-6 rounded-xl glass glass-card space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  รายการอนุมัติผลการประเมินตนเองของครู (Teacher SSR Approvals)
                </h3>
                <p className="text-[10px] text-muted-foreground">รายการยื่นประเมินสมรรถนะรายบุคคลของครูเพื่อรอการตรวจสอบและอนุมัติเลื่อนขั้นเงินเดือน</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border/60 text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                      <th className="px-4 py-3">ครูผู้สอน</th>
                      <th className="px-4 py-3 text-center">คะแนนประเมิน (เต็ม 25)</th>
                      <th className="px-4 py-3">ยื่นเมื่อวันที่</th>
                      <th className="px-4 py-3 text-center">สถานะ</th>
                      <th className="px-4 py-3 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-semibold text-foreground">
                    {pendingSsrs.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3.5 font-bold">{item.teacherName}</td>
                        <td className="px-4 py-3.5 text-center font-mono text-sm">{item.score}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">{item.submittedAt}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            item.status === "APPROVED" 
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                              : item.status === "REJECTED" 
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                          }`}>
                            {item.status === "APPROVED" ? "อนุมัติแล้ว" : item.status === "REJECTED" ? "ส่งกลับแก้ไข" : "รออนุมัติ"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {item.status === "PENDING" ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setPendingSsrs(prev => prev.map(x => x.id === item.id ? { ...x, status: "APPROVED" } : x));
                                  alert(`✅ อนุมัติการประเมิน SSR ของ ${item.teacherName} สำเร็จ`);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              >
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => {
                                  setPendingSsrs(prev => prev.map(x => x.id === item.id ? { ...x, status: "REJECTED" } : x));
                                  alert(`❌ ส่งกลับประเมิน SSR ของ ${item.teacherName} ไปแก้ไข`);
                                }}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              >
                                ปฏิเสธ
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">เสร็จสิ้นแล้ว</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Read-only preview questionnaire for Inspector */}
              <div className="mt-6 pt-6 border-t border-border/60">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                  ตัวอย่างแบบสอบถามเกณฑ์ประเมิน (Inspection Preview)
                </h4>
                <div className="space-y-2 text-xs font-semibold text-muted-foreground opacity-70">
                  <div className="p-3 bg-muted/20 border border-border rounded-xl flex justify-between items-center">
                    <span>1. การจัดทำแผนการสอนล่วงหน้าและความสอดคล้องกับหลักสูตรแกนกลาง</span>
                    <span className="font-bold text-foreground">5 คะแนน (ดีเยี่ยม)</span>
                  </div>
                  <div className="p-3 bg-muted/20 border border-border rounded-xl flex justify-between items-center">
                    <span>2. การเลือกใช้และประยุกต์ใช้สื่อเทคโนโลยีการสอน/คอมพิวเตอร์ในห้องเรียน</span>
                    <span className="font-bold text-foreground">4 คะแนน (ดีมาก)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl glass glass-card space-y-4">
              <div className="flex justify-between items-center border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">แบบประเมินตนเองสำหรับข้าราชการครู (SSR Questionnaires)</h3>
                  <p className="text-[10px] text-muted-foreground">บันทึกระดับความพึงพอใจและประเมินสมรรถนะการจัดเตรียมสื่อและการวัดผลสัมฤทธิ์</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase block font-bold">คะแนนเฉลี่ยรวม</span>
                  <span className="text-xl font-black text-primary font-mono">{calculateSsrTotal()} / 25</span>
                </div>
              </div>

              {ssrSaved ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground">ส่งแบบประเมินประเมินตนเอง SSR สำเร็จเรียบร้อย</h4>
                  <p className="text-xs text-muted-foreground">ข้อมูลจะถูกส่งเข้าบันทึกฐานข้อมูลประวัติและส่งต่อไปยังฝ่ายบุคคลเพื่อใช้วิเคราะห์ประเมินผลเลื่อนขั้น</p>
                  <button
                    onClick={() => setSsrSaved(false)}
                    className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-border"
                  >
                    ทำแบบประเมินใหม่
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-xs font-semibold text-muted-foreground">
                  {[
                    { key: "q1", title: "1. การจัดทำแผนการสอนล่วงหน้าและความสอดคล้องกับหลักสูตรแกนกลาง" },
                    { key: "q2", title: "2. การเลือกใช้และประยุกต์ใช้สื่อเทคโนโลยีการสอน/คอมพิวเตอร์ในห้องเรียน" },
                    { key: "q3", title: "3. การแก้ปัญหาพฤติกรรมของนักเรียนกลุ่มเสี่ยงและการปรึกษาแนะแนว" },
                    { key: "q4", title: "4. การบันทึกหลังสอนอย่างสม่ำเสมอและการทำวิจัยปฏิบัติการในชั้นเรียน" },
                    { key: "q5", title: "5. การให้ความร่วมมือในภารกิจเวรประจำวันและกิจกรรมพัฒนาโรงเรียน" }
                  ].map((q) => (
                    <div key={q.key} className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <span className="text-foreground font-bold">{q.title}</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleSsrScoreChange(q.key, num)}
                            className={`w-7 h-7 rounded-lg font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                              ssrAnswers[q.key] === num
                                ? "bg-primary text-white shadow-sm"
                                : "bg-muted/40 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      setSsrSaved(true);
                      // Add new item into parent pending list for demonstration
                      const newSsr = {
                        id: `ssr-${Date.now()}`,
                        teacherName: userName || "ครูอัญชลี รัตนโกสินทร์",
                        score: calculateSsrTotal(),
                        submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                        status: "PENDING"
                      };
                      setPendingSsrs(prev => [newSsr, ...prev.filter(x => x.teacherName !== newSsr.teacherName)]);
                    }}
                    className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> ส่งผลการประเมินตนเอง
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
