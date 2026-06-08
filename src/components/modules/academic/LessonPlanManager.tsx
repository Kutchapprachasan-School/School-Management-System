"use client";

import React, { useState } from "react";
import { BookOpen, FileText, Plus, Search, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface LessonPlan {
  id: string;
  subjectCode: string;
  subjectName: string;
  title: string;
  objective: string;
  content: string;
  activities: string;
  media: string;
  evaluation: string;
  createdAt: string;
}

interface PostRecord {
  id: string;
  lessonPlanId: string;
  lessonPlanTitle: string;
  problems: string;
  solutions: string;
  suggestions: string;
  createdAt: string;
}

interface Research {
  id: string;
  title: string;
  subjectCode: string;
  classroom: string;
  problems: string;
  methodology: string;
  results: string;
  recommendations: string;
  createdAt: string;
}

export default function LessonPlanManager() {
  const [activeTab, setActiveTab] = useState<"plans" | "posts" | "research">("plans");
  const [plans, setPlans] = useState<LessonPlan[]>([
    {
      id: "lp-1",
      subjectCode: "ว31101",
      subjectName: "วิทยาศาสตร์พื้นฐาน",
      title: "การแยกสารละลายด้วยไฟฟ้า",
      objective: "เพื่อให้นักเรียนเข้าใจกระบวนการอิเล็กโทรลิซิสของสารละลายน้ำเกลือ",
      content: "หลักการเคลื่อนที่ของไอออนในสารละลายและขั้วไฟฟ้า",
      activities: "1. ทบทวนบทเรียนเรื่องประจุไฟฟ้า\n2. ทำการทดลองแยกสารละลายน้ำเกลือ\n3. อภิปรายสรุปผลการทดลอง",
      media: "ชุดทดลองแยกสารเคมี, วิดีโอสื่อประกอบจาก YouTube",
      evaluation: "ตรวจรายงานผลการทดลอง และแบบฝึกหัดท้ายคาบ",
      createdAt: "2026-05-25"
    },
    {
      id: "lp-2",
      subjectCode: "ท31101",
      subjectName: "ภาษาไทยพื้นฐาน",
      title: "การอ่านจับใจความสำคัญจากสื่อออนไลน์",
      objective: "วิเคราะห์และเขียนสรุปใจความสำคัญจากข่าวออนไลน์ได้อย่างถูกต้อง",
      content: "หลักการอ่านจับประเด็น 5W1H (Who, What, Where, When, Why, How)",
      activities: "1. นำเสนอตัวอย่างข่าวลวงและข่าวจริง\n2. แบ่งกลุ่มวิเคราะห์ข่าวแจก\n3. เขียนสรุปความคิดรวบยอด",
      media: "สไลด์สื่อการสอน PowerPoint, ใบงานข่าวสารประเด็นร้อน",
      evaluation: "การประเมินชิ้นงานใบงานจับใจความ",
      createdAt: "2026-05-28"
    }
  ]);

  const [posts, setPosts] = useState<PostRecord[]>([
    {
      id: "pr-1",
      lessonPlanId: "lp-1",
      lessonPlanTitle: "การแยกสารละลายด้วยไฟฟ้า",
      problems: "นักเรียนบางส่วนยังสับสนเรื่องการกำหนดขั้วบวก (Anode) และขั้วลบ (Cathode)",
      solutions: "ทบทวนคำนิยามและใช้สัญลักษณ์สีแดง/น้ำเงินช่วยชี้ให้เห็นชัดเจนขึ้นในการทดลองถัดไป",
      suggestions: "ควรมีคลิปสั้นทบทวนล่วงหน้าก่อนเข้าเรียน",
      createdAt: "2026-05-25"
    }
  ]);

  const [researches, setResearches] = useState<Research[]>([
    {
      id: "rs-1",
      title: "การแก้ปัญหานักเรียนสับสนขั้วไฟฟ้าในบทเรียนอิเล็กโทรลิซิสด้วยชุดการจำลองภาพสี",
      subjectCode: "ว31101",
      classroom: "ม.6/1",
      problems: "นักเรียนชั้น ม.6/1 จำนวน 30% จำแนกขั้วบวก/ลบของการแยกสารเคมีไม่ได้",
      methodology: "ใช้ชุดสื่อจำลองภาพและโมเดลอนิเมชั่น 3D ในการเปรียบเทียบขั้วไฟฟ้า",
      results: "ผลสัมฤทธิ์ทางการเรียนเพิ่มขึ้นเฉลี่ย 25% นักเรียนเข้าใจตรงกันมากขึ้น",
      recommendations: "ควรขยายผลไปใช้กับเรื่องเซลล์เคมีไฟฟ้ากัลวานิกในคาบเรียนถัดไป",
      createdAt: "2026-05-30"
    }
  ]);

  // Form states
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);
  const [showAddResearch, setShowAddResearch] = useState(false);

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50 w-fit">
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "plans" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          แผนการจัดการเรียนรู้ ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "posts" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          บันทึกหลังสอน ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab("research")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "research" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          วิจัยในชั้นเรียน ({researches.length})
        </button>
      </div>

      {/* 1. PLANS TAB */}
      {activeTab === "plans" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-foreground">ทะเบียนแผนการจัดการเรียนรู้</h3>
              <p className="text-[10px] text-muted-foreground">เขียนและจัดเก็บแผนการสอนหลักสูตรแกนกลางเพื่อเตรียมความพร้อมรายสัปดาห์</p>
            </div>
            <button
              onClick={() => setShowAddPlan(true)}
              className="px-3 py-1.5 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-650/20"
            >
              <Plus className="w-4 h-4" /> สร้างแผนการสอน
            </button>
          </div>

          {/* Creation Modal */}
          {showAddPlan && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-lg space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <BookOpen className="text-primary w-4.5 h-4.5" /> เขียนแผนการสอนใหม่
                  </h4>
                  <button onClick={() => setShowAddPlan(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">×</button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const newPlan: LessonPlan = {
                      id: `lp-${Date.now()}`,
                      subjectCode: fd.get("subjectCode") as string,
                      subjectName: fd.get("subjectName") as string,
                      title: fd.get("title") as string,
                      objective: fd.get("objective") as string,
                      content: fd.get("content") as string,
                      activities: fd.get("activities") as string,
                      media: fd.get("media") as string,
                      evaluation: fd.get("evaluation") as string,
                      createdAt: new Date().toISOString().substring(0, 10)
                    };
                    setPlans([newPlan, ...plans]);
                    setShowAddPlan(false);
                  }}
                  className="space-y-3.5 text-xs font-semibold text-muted-foreground"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold">รหัสวิชา</label>
                      <input name="subjectCode" placeholder="เช่น ว31101" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold">ชื่อวิชา</label>
                      <input name="subjectName" placeholder="เช่น วิทยาศาสตร์" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">หัวเรื่อง/สาระการเรียนรู้</label>
                    <input name="title" placeholder="เช่น โครงสร้างอะตอม" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">วัตถุประสงค์การเรียนรู้</label>
                    <textarea name="objective" rows={2} required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">เนื้อหาสาระ</label>
                    <textarea name="content" rows={2} className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">กิจกรรมการจัดเรียนรู้</label>
                    <textarea name="activities" rows={3} placeholder="1. ขั้นนำ... 2. ขั้นสอน..." className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold">สื่อ/อุปกรณ์การสอน</label>
                      <input name="media" placeholder="เช่น ชุดอุปกรณ์วิทยาศาสตร์" className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold">วิธีวัดและประเมินผล</label>
                      <input name="evaluation" placeholder="เช่น การทำใบงานท้ายบท" className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md">
                    บันทึกแผนการสอน
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="p-5 rounded-2xl glass glass-card hover:border-primary/20 transition-all flex flex-col justify-between gap-3 relative overflow-hidden">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-bold font-mono">
                      {p.subjectCode} - {p.subjectName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{p.createdAt}</span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground mt-2">{p.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2"><b>วัตถุประสงค์:</b> {p.objective}</p>
                </div>
                <div className="border-t border-border/40 pt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>สื่อ: {p.media || "-"}</span>
                  <button
                    onClick={() => {
                      setActiveTab("posts");
                      setShowAddPost(true);
                    }}
                    className="text-primary font-bold hover:underline"
                  >
                    + บันทึกหลังสอน
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. POSTS TAB */}
      {activeTab === "posts" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-foreground">สมุดบันทึกสรุปผลหลังการจัดเรียนรู้</h3>
              <p className="text-[10px] text-muted-foreground">ประเมินปัญหาที่พบในห้องเรียน เพื่อปรับปรุงสื่อและการจัดการครั้งถัดไป</p>
            </div>
            <button
              onClick={() => setShowAddPost(true)}
              className="px-3 py-1.5 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-650/20"
            >
              <Plus className="w-4 h-4" /> เขียนบันทึกหลังสอน
            </button>
          </div>

          {/* Creation Modal */}
          {showAddPost && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <FileText className="text-primary w-4.5 h-4.5" /> เขียนบันทึกหลังเรียนสอนใหม่
                  </h4>
                  <button onClick={() => setShowAddPost(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">×</button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const planId = fd.get("planId") as string;
                    const plan = plans.find(p => p.id === planId);
                    const newPost: PostRecord = {
                      id: `pr-${Date.now()}`,
                      lessonPlanId: planId,
                      lessonPlanTitle: plan ? plan.title : "ไม่ระบุแผน",
                      problems: fd.get("problems") as string,
                      solutions: fd.get("solutions") as string,
                      suggestions: fd.get("suggestions") as string,
                      createdAt: new Date().toISOString().substring(0, 10)
                    };
                    setPosts([newPost, ...posts]);
                    setShowAddPost(false);
                  }}
                  className="space-y-3.5 text-xs font-semibold text-muted-foreground"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">เลือกแผนการสอนที่เชื่อมโยง</label>
                    <select name="planId" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary">
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.subjectCode} - {p.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">ปัญหา/อุปสรรคที่พบ</label>
                    <textarea name="problems" rows={3} placeholder="เช่น นักเรียนบางส่วนส่งงานไม่ทันคาบ หรือสื่อการทดลองไม่พอ" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">แนวทางแก้ไข/ข้อเสนอแนะ</label>
                    <textarea name="solutions" rows={3} placeholder="เช่น จัดกลุ่มคู่บัดดี้ หรือเพิ่มเวลาแล็บ 10 นาที" className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">ข้อเสนอแนะถึงฝ่ายวิชาการ/วิจัย</label>
                    <textarea name="suggestions" rows={2} placeholder="เช่น เสนอของบประมาณเพิ่มชุดอุปกรณ์หรือจัดทำสื่อเสริมความเข้าใจ" className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md">
                    บันทึกสรุปหลังสอน
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Posts List */}
          <div className="space-y-3">
            {posts.map((record) => (
              <div key={record.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">{record.createdAt}</span>
                    <h4 className="font-bold text-xs text-primary">{record.lessonPlanTitle}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-normal">
                    <b>ปัญหา:</b> <span className="text-rose-500 dark:text-rose-450">{record.problems}</span>
                  </p>
                  <p className="text-xs text-muted-foreground leading-normal">
                    <b>แนวทางแก้:</b> <span className="text-emerald-600 dark:text-emerald-450">{record.solutions}</span>
                  </p>
                </div>
                {record.suggestions && (
                  <div className="text-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg max-w-xs font-semibold shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 text-primary mb-1 inline mr-1" />
                    <b>คำแนะนำ/วิจัยในอนาคต:</b> {record.suggestions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. RESEARCH TAB */}
      {activeTab === "research" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-foreground">ทะเบียนผลงานวิจัยในชั้นเรียน (Action Research)</h3>
              <p className="text-[10px] text-muted-foreground">ผลักดันการแก้ปัญหาพฤติกรรมหรือวิชาการผ่านกระบวนการวิจัยแบบบูรณาการในชั้นเรียน</p>
            </div>
            <button
              onClick={() => setShowAddResearch(true)}
              className="px-3 py-1.5 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-650/20"
            >
              <Plus className="w-4 h-4" /> สร้างรายการวิจัย
            </button>
          </div>

          {/* Creation Modal */}
          {showAddResearch && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-lg space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Sparkles className="text-primary w-4.5 h-4.5" /> เพิ่มรายงานวิจัยในชั้นเรียนใหม่
                  </h4>
                  <button onClick={() => setShowAddResearch(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">×</button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const newRes: Research = {
                      id: `rs-${Date.now()}`,
                      title: fd.get("title") as string,
                      subjectCode: fd.get("subjectCode") as string,
                      classroom: fd.get("classroom") as string,
                      problems: fd.get("problems") as string,
                      methodology: fd.get("methodology") as string,
                      results: fd.get("results") as string,
                      recommendations: fd.get("recommendations") as string,
                      createdAt: new Date().toISOString().substring(0, 10)
                    };
                    setResearches([newRes, ...researches]);
                    setShowAddResearch(false);
                  }}
                  className="space-y-3.5 text-xs font-semibold text-muted-foreground"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">ชื่องานวิจัยในชั้นเรียน</label>
                    <input name="title" placeholder="เช่น การศึกษาพฤติกรรมการขาดเรียนโดยใช้แรงจูงใจสะสมแต้มความดี" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold">รหัสวิชา</label>
                      <input name="subjectCode" placeholder="เช่น ว31101" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold">ห้องเรียนกลุ่มเป้าหมาย</label>
                      <input name="classroom" placeholder="เช่น ม.6/1" required className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">ปัญหาสำคัญของนักเรียน</label>
                    <textarea name="problems" rows={2} placeholder="เช่น เด็กขาดทักษะการคำนวณเคมีพื้นฐาน" className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">นวัตกรรม/เครื่องมือที่ใช้แก้ปัญหา</label>
                    <textarea name="methodology" rows={2} placeholder="เช่น เกมกระดานสมการ หรือสื่อภาพจำลองอนิเมชั่น" className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">ผลการดำเนินการ</label>
                    <textarea name="results" rows={2} placeholder="เช่น คะแนนหลังเรียนสูงกว่าก่อนเรียนเฉลี่ย 15 คะแนน" className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold">ข้อเสนอแนะเพื่อขยายผล</label>
                    <textarea name="recommendations" rows={2} placeholder="เช่น ควรจัดกลุ่มเรียนรวมในวิชาสาขาใกล้เคียง" className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary" />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md">
                    บันทึกงานวิจัยชั้นเรียน
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Research reports list */}
          <div className="space-y-4">
            {researches.map((r) => (
              <div key={r.id} className="p-6 rounded-2xl glass glass-card space-y-4 hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-500/20 font-mono">
                      วิจัยในชั้นเรียน • {r.subjectCode} • {r.classroom}
                    </span>
                    <h4 className="font-extrabold text-sm text-foreground mt-2">{r.title}</h4>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">{r.createdAt}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-muted-foreground border-t border-border/40 pt-4">
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-bold text-muted-foreground">เครื่องมือที่ใช้แก้</span>
                    <p className="text-slate-800 dark:text-slate-200">{r.methodology}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-bold text-muted-foreground">ผลลัพธ์การวิจัย</span>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold">{r.results}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-bold text-muted-foreground">ข้อเสนอแนะ</span>
                    <p className="text-slate-700 dark:text-slate-300">{r.recommendations || "-"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
