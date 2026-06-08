"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, Sparkles, Download, Copy, Check, ArrowRight,
  Brain, FileSpreadsheet, Activity, ChevronRight, Info, Eye, ClipboardCheck
} from "lucide-react";

interface NotebookLmHubProps {
  triggerToast: (title: string, message: string) => void;
  addAuditLog: (action: string, details: string) => void;
}

export default function NotebookLmHub({ triggerToast, addAuditLog }: NotebookLmHubProps) {
  const [classroom, setClassroom] = useState("ม.6/1");
  const [includeScores, setIncludeScores] = useState(true);
  const [includeBehavior, setIncludeBehavior] = useState(true);
  const [includeSDQ, setIncludeSDQ] = useState(true);
  const [includePlans, setIncludePlans] = useState(true);
  const [includeResearch, setIncludeResearch] = useState(true);

  const [copiedPromptId, setCopiedPromptId] = useState<number | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<"export" | "prompts" | "guide">("export");

  // Prompts for NotebookLM
  const prompts = [
    {
      id: 1,
      title: "📝 ร่างแผนช่วยเหลือรายบุคคล (IEP Draft)",
      desc: "วิเคราะห์เด็กกลุ่มมีปัญหาหรือเสี่ยงจาก SDQ และ BMI และร่างแผนช่วยเหลือทางการเรียนและการปรับพฤติกรรมเฉพาะเจาะจง",
      prompt: "จากข้อมูลผลการคัดกรอง SDQ และดัชนี BMI ของนักเรียนที่ปรากฏในเอกสารรายงาน ช่วยสรุปปัญหาเด่นและจัดทำร่างแผนการจัดการเรียนรู้รายบุคคล (IEP) สำหรับกลุ่มนักเรียนที่มีความเสี่ยงสูง โดยเน้นขั้นตอนช่วยเหลือด้านจิตวิทยาและการปรับพฤติกรรมในห้องเรียนอย่างเป็นรูปธรรม",
      color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-700 dark:text-blue-300"
    },
    {
      id: 2,
      title: "🔬 คิดหัวข้อและโครงร่างวิจัยชั้นเรียน (Action Research)",
      desc: "ใช้ปัญหาจากบันทึกหลังสอนมาต่อยอดสร้างหัวข้อวิจัย นวัตกรรมใบงาน Micro-worksheets และขั้นตอนทดลอง",
      prompt: "จากบันทึกหลังสอนและข้อมูลปัญหาของนักเรียนในเอกสารอ้างอิง ช่วยระดมความคิด (Brainstorming) เพื่อสร้างหัวข้อวิจัยในชั้นเรียน (Classroom Action Research) พร้อมเสนอแนะแนวทางจัดการเรียนรู้โดยใช้ชุดใบงานย่อย (Micro-worksheets) และระบุวิธีการวัดผลการแก้ปัญหาอย่างละเอียด",
      color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-700 dark:text-purple-300"
    },
    {
      id: 3,
      title: "✉️ ร่างจดหมายเชิญผู้ปกครองเพื่อร่วมมือช่วยเหลือ",
      desc: "ค้นหานักเรียนที่มีแนวโน้มขาดเรียนสะสมสูงสุด และเขียนจดหมายเชิญผู้ปกครองปรึกษาแบบเป็นกันเองและให้เกียรติ",
      prompt: "ค้นหารายชื่อนักเรียนที่มีประวัติขาดเรียนสะสม หรือมีพฤติกรรมที่ต้องพูดคุยจากตารางคะแนนพฤติกรรมในเอกสารอ้างอิง แล้วช่วยเขียนจดหมายประสานงานผู้ปกครองที่เป็นทางการแต่มีความอ่อนโยน เข้าอกเข้าใจ เพื่อเชิญชวนผู้ปกครองมาร่วมกันวางแผนหาทางออกร่วมกับครูประจำชั้น",
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300"
    },
    {
      id: 4,
      title: "📊 ประเมินผลคะแนนวิชาการและหานักเรียนกลุ่มตกหล่น",
      desc: "วิเคราะห์เกรดวิชาต่างๆ รวมกับสุขภาพจิต SDQ จัดแบ่งกลุ่มนักเรียน 3 ระดับ พร้อมแนวทางยกระดับคะแนน",
      prompt: "ช่วยทำการประมวลผลคะแนนวิชาการและระดับเกรดในเอกสารนี้ คัดกรองและแบ่งกลุ่มนักเรียนออกเป็น 3 กลุ่ม ได้แก่ กลุ่มผ่านเกณฑ์ปกติ, กลุ่มเสี่ยงตกหล่น, และกลุ่มที่ต้องดูแลเร่งด่วน พร้อมอธิบายแนวทางชดเชยคะแนนเรียนสั้นๆ สำหรับกลุ่มสุดท้าย",
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
    },
    {
      id: 5,
      title: "🏫 วิเคราะห์ประเมินตนเองครูประจำปี (SSR Report)",
      desc: "นำแผนการสอนและงานวิจัยที่ทำมาวิเคราะห์เป็นผลงานเชิงคุณภาพเพื่อเขียนประเมินวิทยฐานะ คศ.1/คศ.2",
      prompt: "อ้างอิงจากแผนการจัดการเรียนรู้ ผลการสอน และบทสรุปงานวิจัยในชั้นเรียนในเอกสารอ้างอิงนี้ ช่วยจัดทำร่างผลสัมฤทธิ์ทางการสอนเพื่อนำไปกรอกแบบประเมินตนเอง (SSR) ของครูในวิทยฐานะ คศ.1 หรือ คศ.2 โดยจัดกลุ่มเป็นผลงานเชิงปริมาณและเชิงคุณภาพ",
      color: "from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-700 dark:text-rose-300"
    }
  ];

  // Load live Preview content
  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const query = `classroom=${encodeURIComponent(classroom)}&includeScores=${includeScores}&includeBehavior=${includeBehavior}&includeSDQ=${includeSDQ}&includePlans=${includePlans}&includeResearch=${includeResearch}`;
      const res = await fetch(`/api/v1/notebooklm/export?${query}`);
      const text = await res.text();
      // Keep only first 2000 chars for preview safety
      if (text.length > 2500) {
        setPreviewContent(text.substring(0, 2500) + "\n\n... (ข้อมูลถูกตัดบางส่วนในหน้าต่าง Preview กรุณาดาวน์โหลดไฟล์เต็มเพื่ออ่านเนื้อหาทั้งหมด) ...");
      } else {
        setPreviewContent(text);
      }
    } catch (e) {
      setPreviewContent("เกิดข้อผิดพลาดในการโหลดเนื้อหา Preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [classroom, includeScores, includeBehavior, includeSDQ, includePlans, includeResearch]);

  // Handle Download File
  const handleDownload = () => {
    const query = `classroom=${encodeURIComponent(classroom)}&includeScores=${includeScores}&includeBehavior=${includeBehavior}&includeSDQ=${includeSDQ}&includePlans=${includePlans}&includeResearch=${includeResearch}`;
    window.open(`/api/v1/notebooklm/export?${query}`, "_blank");
    addAuditLog("NOTEBOOKLM_EXPORT", `ดาวน์โหลดเอกสารสำหรับ NotebookLM ของห้อง ${classroom}`);
    triggerToast("📥 ดาวน์โหลดสำเร็จ", `สร้างไฟล์รายงานห้องเรียน ${classroom} เรียบร้อยแล้ว นำไปวางใน NotebookLM ได้เลย`);
  };

  // Handle Copy Prompt
  const handleCopyPrompt = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    triggerToast("📋 คัดลอกพร้อมท์สำเร็จ", "คัดลอกคำสั่งไปยังคลิปบอร์ดแล้ว นำไปวางในแชทของ NotebookLM ได้ทันที");
    addAuditLog("NOTEBOOKLM_COPY_PROMPT", `คัดลอก Prompt แม่แบบไอเดียที่ ${id}`);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Premium Gradient Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-6 md:p-8 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-pink-500/10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/20">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              NotebookLM Integration Hub
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              เชื่อมต่อนักวิเคราะห์ AI อัจฉริยะ (NotebookLM)
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              ส่งออกข้อมูลโรงเรียน 360 องศาเป็นไฟล์เอกสารสรุปความประพฤติ คะแนนเรียน ผลสุขภาพจิต SDQ และเยี่ยมบ้านของชั้นเรียน 
              เพื่อนำไปอัปโหลดเป็น Source ใน NotebookLM ช่วยครูแนะแนว ครูประจำชั้น และผู้บริหารวิเคราะห์ต่อยอดแบบไร้ขีดจำกัด
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/80">
        <button
          onClick={() => setActiveTab("export")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "export" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          📂 ดาวน์โหลดแหล่งข้อมูลห้องเรียน (.md)
        </button>
        <button
          onClick={() => setActiveTab("prompts")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "prompts" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          💡 ชุดคำสั่ง AI ปรึกษา NotebookLM (Prompt Templates)
        </button>
        <button
          onClick={() => setActiveTab("guide")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "guide" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          📖 วิธีใช้งานแบบ Step-by-Step
        </button>
      </div>

      {/* Content Area */}
      {activeTab === "export" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Settings panel */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Brain className="w-4 h-4 text-indigo-500" />
                ตั้งค่าโครงสร้างชุดข้อมูลส่งออก
              </h2>

              {/* Classroom Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">ชั้นเรียนที่ต้องการวิเคราะห์</label>
                <select
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-indigo-500 transition-all font-semibold"
                >
                  <option value="ม.6/1">ชั้นมัธยมศึกษาปีที่ 6 ห้อง 1 (ม.6/1)</option>
                  <option value="ม.5/2">ชั้นมัธยมศึกษาปีที่ 5 ห้อง 2 (ม.5/2)</option>
                  <option value="ม.4/3">ชั้นมัธยมศึกษาปีที่ 4 ห้อง 3 (ม.4/3)</option>
                </select>
              </div>

              {/* Options Checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">ตัวเลือกหัวข้อการส่งออก</label>
                
                <div className="space-y-2">
                  {/* Scores */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-indigo-500/30 hover:bg-muted/10 transition-all cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={includeScores}
                      onChange={(e) => setIncludeScores(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">ผลการสอบและเกรดวิชาเรียน (Academic Scores)</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">รวมประวัติระดับคะแนนและระดับเกรดแยกรายบุคคลของห้องเรียน</p>
                    </div>
                  </label>

                  {/* Behavior */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-indigo-500/30 hover:bg-muted/10 transition-all cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={includeBehavior}
                      onChange={(e) => setIncludeBehavior(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">ประวัติบันทึกพฤติกรรม (Behavior Logs)</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">รวมประวัติการได้คะแนนความดีและประวัติโดนหักแต้มวินัย</p>
                    </div>
                  </label>

                  {/* SDQ & BMI */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-indigo-500/30 hover:bg-muted/10 transition-all cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={includeSDQ}
                      onChange={(e) => setIncludeSDQ(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">ผลสุขภาพจิต SDQ คัดกรอง 5 ด้าน และ BMI</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">ผลคัดกรองความเสี่ยง พฤติกรรมอารมณ์ และเกณฑ์ความสมบูรณ์ร่างกาย</p>
                    </div>
                  </label>

                  {/* Plans & post teaching */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-indigo-500/30 hover:bg-muted/10 transition-all cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={includePlans}
                      onChange={(e) => setIncludePlans(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">แผนการจัดการเรียนรู้ & บันทึกหลังสอน (Lesson Plans)</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">วัตถุประสงค์การสอน ปัญหาการสอนหลังคาบเรียนที่ครูบันทึก</p>
                    </div>
                  </label>

                  {/* Classroom Research */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-indigo-500/30 hover:bg-muted/10 transition-all cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={includeResearch}
                      onChange={(e) => setIncludeResearch(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">ผลการศึกษาและหัวข้องานวิจัยในชั้นเรียน (Action Research)</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">ระเบียบวิจัย ปัญหา ข้อค้นพบ และแนวเสนอแนะนวัตกรรมแก้ไขการเรียน</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                ส่งออกเป็นไฟล์ Markdown (.md)
              </button>
            </div>
            
            <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] leading-relaxed">
                <strong>ทำไมต้องใช้ Markdown?</strong> ไฟล์ฟอร์แมต Markdown (.md) มีขนาดกะทัดรัดและใช้โครงสร้างอักขระพิเศษเพื่อทำความเข้าใจตารางและลำดับหัวข้อได้ดีที่สุดบน NotebookLM ช่วยถนอมจำนวนโทเคนของ AI ทำให้ตอบคำถามได้ถูกต้องรวดเร็วขึ้น
              </p>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-7 flex flex-col h-[520px] rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">ตัวอย่างโครงสร้างไฟล์เอกสารที่จะได้รับ (Live Preview)</span>
              </div>
              {loadingPreview && <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-indigo-600"></span>}
            </div>
            
            <div className="flex-1 p-4 overflow-auto bg-muted/20 font-mono text-[10px] text-muted-foreground whitespace-pre leading-relaxed select-all">
              {previewContent}
            </div>
            
            <div className="px-4 py-3 bg-muted/30 border-t border-border flex justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(previewContent);
                  triggerToast("📋 คัดลอกตัวอย่างสำเร็จ", "คัดลอกเนื้อหาตัวอย่างไปยังคลิปบอร์ดแล้ว");
                }}
                className="px-3.5 py-1.5 border border-border bg-background hover:bg-muted text-foreground rounded-lg transition-all flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                คัดลอกเนื้อหาทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "prompts" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 mt-0.5">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">คำแนะนำการใช้งานแม่แบบคำสั่ง AI</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                เลือกคัดลอกชุดคำสั่งด้านล่างนี้ โดยนำไปวางในแชทกล่องข้อความของ NotebookLM หลังจากที่ท่านอัปโหลดไฟล์ Markdown เรียบร้อยแล้ว AI จะประมวลผลคำตอบโดยอ้างอิงจากข้อมูลวิชาการและกิจการนักเรียนของห้องที่ท่านส่งออกไปโดยเฉพาะ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prompts.map((p) => (
              <div 
                key={p.id}
                className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold border bg-gradient-to-tr ${p.color}`}>
                    {p.title}
                  </div>
                  <p className="text-xs text-foreground font-semibold leading-relaxed">
                    {p.desc}
                  </p>
                  <div className="p-3 bg-muted/40 dark:bg-muted/10 rounded-xl text-[11px] font-mono leading-relaxed text-muted-foreground max-h-[100px] overflow-y-auto border border-border/40 select-all">
                    {p.prompt}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyPrompt(p.id, p.prompt)}
                  className={`mt-4 w-full py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    copiedPromptId === p.id 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                      : "border-indigo-500/20 hover:border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
                  }`}
                >
                  {copiedPromptId === p.id ? (
                    <>
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      คัดลอกคำสั่งเรียบร้อย!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      คัดลอก Prompt ไปยัง NotebookLM
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "guide" && (
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
          <h2 className="text-base font-bold text-foreground border-b border-border pb-3">
            📖 วิธีนำข้อมูลวิเคราะห์ใน Google NotebookLM (Step-by-Step Guide)
          </h2>

          <div className="relative border-l-2 border-indigo-600/30 ml-4 pl-6 space-y-6">
            {/* Step 1 */}
            <div className="relative">
              <span className="absolute -left-[35px] top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs">
                1
              </span>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">ดาวน์โหลดข้อมูลห้องเรียนจากระบบ</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  ไปที่แท็บ <strong>"ดาวน์โหลดแหล่งข้อมูลห้องเรียน (.md)"</strong> ด้านบน เลือกชั้นเรียนที่คุณต้องการช่วยเหลือเป็นพิเศษ ปรับเลือก Checkbox เพื่อเปิดใช้งานหัวข้อข้อมูลที่ต้องการ เช่น ผลคะแนนพฤติกรรม, แบบสำรวจ SDQ, และบันทึกหลังสอนของครู แล้วกดปุ่ม <strong>"ส่งออกเป็นไฟล์ Markdown (.md)"</strong> เพื่อเซฟไฟล์ลงในเครื่องของคุณ
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <span className="absolute -left-[35px] top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs">
                2
              </span>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">เปิดเว็บไซต์ Google NotebookLM</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  เข้าใช้งานผ่านเบราว์เซอร์ของคุณที่เว็บ <a href="https://notebooklm.google" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">https://notebooklm.google</a> โดยล็อกอินด้วยบัญชี Gmail หรือ Google Workspace ของคุณ จากนั้นกดสร้างสมุดบันทึกใหม่ <strong>(Create Notebook)</strong>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <span className="absolute -left-[35px] top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs">
                3
              </span>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">อัปโหลดไฟล์รายงานเป็น Source</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  ในหน้าจอเพิ่มแหล่งอ้างอิง (Add Source) เลือกคำสั่งอัปโหลดไฟล์จากเครื่องคอมพิวเตอร์ของคุณ แล้วอัปโหลดไฟล์ <code>.md</code> ที่คุณเพิ่งดาวน์โหลดมาจาก SchoolOS ในขั้นตอนที่ 1 เมื่อประมวลผลเสร็จ NotebookLM จะมีฐานข้อมูลเด็กทั้งห้องเรียนทันทีอย่างปลอดภัย
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <span className="absolute -left-[35px] top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs">
                4
              </span>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">คัดลอกคำสั่งเพื่อถามตอบและสร้างไอเดีย</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  สลับกลับมาที่หน้า SchoolOS ของเรา ไปที่แท็บ <strong>"ชุดคำสั่ง AI ปรึกษา NotebookLM"</strong> กดคัดลอกคำสั่งที่ต้องการ นำไปวางในช่องแชทด้านล่างของ Google NotebookLM แล้วกดส่งข้อความ AI จะประมวลผลเพื่อสร้างคำตอบ แผนการจัดการเรียนรู้รายบุคคล หรือจดหมายผู้ปกครองด้วยความน่าเชื่อถือจากความจริงของห้องเรียนของคุณ
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
