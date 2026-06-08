"use client";

import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, Award, ClipboardList, BarChart3, HelpCircle, Users, Check, FileText, ArrowRight } from "lucide-react";

interface Question {
  id: string;
  title: string;
  type: "likert" | "text" | "checkbox";
}

interface EvaluationTemplate {
  id: string;
  title: string;
  description: string;
  assignedWorkshop: string;
  questions: Question[];
  responsesCount: number;
  averageScore?: number;
}

interface EvaluationViewProps {
  triggerToast: (title: string, desc: string) => void;
  addAuditLog: (action: string, details: string) => void;
}

export default function EvaluationView({
  triggerToast,
  addAuditLog
}: EvaluationViewProps) {
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([
    {
      id: "eval-1",
      title: "แบบประเมินอบรมการใช้งาน AI ในห้องเรียนยุคใหม่",
      description: "ประเมินความพึงพอใจการอบรมการประยุกต์ใช้งานโมเดลภาษาขนาดใหญ่ (LLM) ในกระบวนการจัดการเรียนรู้",
      assignedWorkshop: "โครงการอบรมครู AI ยุคดิจิทัล",
      responsesCount: 38,
      averageScore: 4.65,
      questions: [
        { id: "q1", title: "วิทยากรมีความเชี่ยวชาญและถ่ายทอดเข้าใจง่าย", type: "likert" },
        { id: "q2", title: "เนื้อหาที่อบรมสามารถนำไปใช้ในห้องเรียนได้จริง", type: "likert" },
        { id: "q3", title: "ข้อเสนอแนะเพิ่มเติมเพื่อพัฒนาการอบรมครั้งถัดไป", type: "text" }
      ]
    },
    {
      id: "eval-2",
      title: "แบบประเมินความพึงพอใจการจัดกิจกรรมกีฬาสีภายใน",
      description: "ประเมินความคิดเห็นการอำนวยความสะดวก อาหาร และตารางเวลาแข่งขัน",
      assignedWorkshop: "มหกรรมกีฬาภายใน ประจำปีการศึกษา 2569",
      responsesCount: 142,
      averageScore: 4.12,
      questions: [
        { id: "q1", title: "สถานที่แข่งขันมีความเหมาะสมและปลอดภัย", type: "likert" },
        { id: "q2", title: "การดูแลและการปฐมพยาบาลมีความรวดเร็ว", type: "likert" },
        { id: "q3", title: "คุณได้รับประทานอาหารและเครื่องดื่มเพียงพอหรือไม่", type: "checkbox" }
      ]
    }
  ]);

  const [selectedEval, setSelectedEval] = useState<EvaluationTemplate | null>(templates[0]);
  const [isCreating, setIsCreating] = useState(false);

  // New Template state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newWorkshop, setNewWorkshop] = useState("");
  const [newQuestions, setNewQuestions] = useState<Question[]>([
    { id: "q-1", title: "ความรู้ความเข้าใจหลังเข้าร่วมกิจกรรมอยู่ในระดับใด", type: "likert" }
  ]);

  const addQuestionField = () => {
    setNewQuestions(prev => [
      ...prev,
      { id: `q-${Date.now()}`, title: "", type: "likert" }
    ]);
  };

  const removeQuestionField = (id: string) => {
    setNewQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleQuestionChange = (id: string, field: "title" | "type", val: string) => {
    setNewQuestions(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, [field]: val };
      }
      return q;
    }));
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newWorkshop.trim()) {
      triggerToast("⚠️ ข้อผิดพลาด", "กรุณากรอกหัวข้อและโครงการอบรม");
      return;
    }

    const hasEmptyQuestions = newQuestions.some(q => !q.title.trim());
    if (hasEmptyQuestions) {
      triggerToast("⚠️ ข้อผิดพลาด", "กรุณากรอกข้อคำถามให้ครบทุกช่อง");
      return;
    }

    const newTemplate: EvaluationTemplate = {
      id: `eval-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      assignedWorkshop: newWorkshop,
      questions: newQuestions,
      responsesCount: 0,
      averageScore: 0
    };

    setTemplates([newTemplate, ...templates]);
    setSelectedEval(newTemplate);
    setIsCreating(false);
    triggerToast("✨ สร้างแบบประเมินสำเร็จ", `สร้างแบบประเมิน ${newTitle} พร้อมใช้งาน`);
    addAuditLog("CREATE_EVALUATION_TEMPLATE", `สร้างแบบประเมินกิจกรรมสำหรับโครงการ: ${newWorkshop}`);
    
    // Reset form states
    setNewTitle("");
    setNewDesc("");
    setNewWorkshop("");
    setNewQuestions([{ id: "q-1", title: "ความรู้ความเข้าใจหลังเข้าร่วมกิจกรรมอยู่ในระดับใด", type: "likert" }]);
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    if (!confirm(`ยืนยันการลบแบบประเมิน "${name}" หรือไม่?`)) return;
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (selectedEval?.id === id) {
      setSelectedEval(null);
    }
    triggerToast("🗑️ ลบแบบประเมินสำเร็จ", "ลบแบบประเมินออกจากระบบเรียบร้อย");
    addAuditLog("DELETE_EVALUATION_TEMPLATE", `ลบแบบประเมิน: ${name}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      
      {/* Templates List Sidebar */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">แบบประเมินทั้งหมด</h4>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> สร้างแบบประเมินใหม่
          </button>
        </div>

        <div className="space-y-2">
          {templates.map((t) => {
            const isSelected = selectedEval?.id === t.id && !isCreating;
            return (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedEval(t);
                  setIsCreating(false);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? "bg-primary/5 border-primary shadow-sm"
                    : "bg-white dark:bg-card border-slate-100 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold text-slate-400 leading-normal">{t.assignedWorkshop}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(t.id, t.title);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h5 className="font-bold text-xs text-slate-800 dark:text-white mt-1 leading-snug line-clamp-2">
                  {t.title}
                </h5>
                <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    ผู้ตอบ {t.responsesCount} คน
                  </span>
                  {t.responsesCount > 0 && t.averageScore && (
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3 text-indigo-500" />
                      คะแนนเฉลี่ย {t.averageScore}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Panel Content Area */}
      <div className="lg:col-span-2">
        {isCreating ? (
          /* Create Form */
          <div className="p-6 rounded-2xl glass-card bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ClipboardList className="w-5 h-5 text-primary" />
              สร้างแบบประเมินโครงการใหม่ (Survey Template Builder)
            </h3>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs text-muted-foreground font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">ชื่อแบบประเมิน</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น แบบประเมินอบรมวิจัยในชั้นเรียน..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">โครงการ/กิจกรรม (Workshop Assigned)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น โครงการพัฒนาทักษะการทำวิจัยครู..."
                    value={newWorkshop}
                    onChange={(e) => setNewWorkshop(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">คำอธิบายเพิ่มเติม</label>
                <input
                  type="text"
                  placeholder="เช่น แบบสอบถามชิ้นนี้มีเป้าหมายเพื่อนำคำแนะนำมาปรับปรุงกระบวนการพัฒนาบุคลากร..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold outline-none focus:border-primary"
                />
              </div>

              {/* Questionnaire Builder */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">รายการข้อคำถามการประเมิน (Questions)</label>
                  <button
                    type="button"
                    onClick={addQuestionField}
                    className="h-7 px-3 bg-primary/10 hover:bg-indigo-500/20 text-primary font-bold text-[10px] rounded-lg transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> เพิ่มคำถาม
                  </button>
                </div>

                <div className="space-y-2">
                  {newQuestions.map((q, idx) => (
                    <div key={q.id} className="flex gap-2 items-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                      <span className="font-bold text-slate-450 font-mono w-6 text-center">{idx + 1}</span>
                      <input
                        type="text"
                        required
                        placeholder="ข้อความคำถามประเมิน เช่น วิทยากรอธิบายเนื้อหาครบถ้วน"
                        value={q.title}
                        onChange={(e) => handleQuestionChange(q.id, "title", e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg h-9 px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                      <select
                        value={q.type}
                        onChange={(e) => handleQuestionChange(q.id, "type", e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg h-9 px-2 text-xs font-bold"
                      >
                        <option value="likert">ความพึงพอใจ 5 ระดับ</option>
                        <option value="checkbox">กล่องเครื่องหมาย</option>
                        <option value="text">ข้อเขียน/ข้อเสนอแนะ</option>
                      </select>
                      {newQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestionField(q.id)}
                          className="p-2 rounded text-slate-450 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-primary text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  บันทึกเทมเพลตแบบประเมิน
                </button>
              </div>
            </form>
          </div>
        ) : selectedEval ? (
          /* Report Dashboard */
          <div className="p-6 rounded-2xl glass-card bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-slate-800/80 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[10px] font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {selectedEval.assignedWorkshop}
                </span>
                <p className="text-xs text-slate-450 font-bold">
                  ผู้ตอบแบบประเมิน: <b>{selectedEval.responsesCount} คน</b>
                </p>
              </div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white mt-2 leading-snug">
                {selectedEval.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{selectedEval.description}</p>
            </div>

            {/* Simulated Summary Statistics */}
            {selectedEval.responsesCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 text-center">
                  <span className="text-[10px] font-bold text-slate-500 block">คะแนนความพึงพอใจเฉลี่ย</span>
                  <span className="text-2xl font-mono font-bold text-primary mt-1.5 block">
                    {selectedEval.averageScore} / 5.00
                  </span>
                  <span className="text-[9px] text-emerald-500 font-bold block mt-1">อยู่ในเกณฑ์ดีเยี่ยม (Excellent)</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-500 block">อัตราการกรอกประเมิน</span>
                  <span className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100 mt-1.5 block">
                    92.4%
                  </span>
                  <span className="text-[9px] text-slate-450 block mt-1">จากผู้ลงทะเบียนโครงการทั้งหมด</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-500 block">จำนวนหัวข้อคำถาม</span>
                  <span className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100 mt-1.5 block">
                    {selectedEval.questions.length} ข้อ
                  </span>
                  <span className="text-[9px] text-slate-450 block mt-1">แบ่งตามเกณฑ์ Likert และข้อเขียน</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-50/30 border border-dashed border-slate-200 text-slate-400 gap-1 flex flex-col justify-center items-center">
                <HelpCircle className="w-8 h-8 text-slate-350" />
                <h5 className="font-bold text-xs mt-1">ยังไม่มีข้อมูลการตอบรับประเมิน (0 Responses)</h5>
                <p className="text-[10px]">แชร์ลิงก์หรือสแกน QR-code เพื่อรับความเห็นจากอาจารย์ผู้เข้าร่วมอบรม</p>
              </div>
            )}

            {/* Questions detail lists */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 uppercase">รายละเอียดโครงสร้างข้อคำถาม</h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {selectedEval.questions.map((q, idx) => (
                  <div key={q.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-450 mr-2">{idx + 1}.</span>
                      <span className="font-bold text-slate-800 dark:text-white">{q.title}</span>
                    </div>
                    <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                      {q.type === "likert" ? "ประเมินความพึงพอใจ 5 ระดับ" : q.type === "checkbox" ? "กล่องเครื่องหมาย" : "เขียนบรรยายข้อเสนอแนะ"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Print Analytics Button */}
            {selectedEval.responsesCount > 0 && (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => triggerToast("🖨️ กำลังออกรายงานประเมิน", "กำลังรวบรวมไฟล์สถิติเฉลี่ยรายหัวข้อ...")}
                  className="h-9 px-4.5 bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 dark:hover:bg-slate-750 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  ดาวน์โหลดรายงานผลสรุป (PDF)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <ClipboardList className="w-10 h-10 text-slate-300" />
            <h4 className="font-bold text-xs mt-1">กรุณาเลือกหรือสร้างแบบประเมินใหม่เพื่อใช้งาน</h4>
          </div>
        )}
      </div>
    </div>
  );
}
