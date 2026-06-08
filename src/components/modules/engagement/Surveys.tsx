"use client";

import React, { useState, useEffect } from "react";
import { ClipboardList, Plus, Trash2, BarChart2, MessageSquare, ArrowLeftRight, Save, HelpCircle, CheckCircle2 } from "lucide-react";

interface SurveyCriterion {
  id: string;
  question: string;
}

interface SurveyResult {
  year: string;
  totalParticipants: number;
  ratings: Record<string, number>; // questionId -> average rating out of 5
}

export default function Surveys() {
  const [activeTab, setActiveTab] = useState<"evaluate" | "criteria" | "analytics" | "compare">("evaluate");
  const [academicYear, setAcademicYear] = useState("2569");

  // State variables for criteria list
  const [criteria, setCriteria] = useState<SurveyCriterion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");

  // Evaluation input states
  const [participantsCount, setParticipantsCount] = useState(30);
  const [inputRatings, setInputRatings] = useState<Record<string, number>>({});

  // Saved evaluation logs
  const [savedResults, setSavedResults] = useState<SurveyResult[]>([]);

  // Comparison years state
  const [compareYear1, setCompareYear1] = useState("2568");
  const [compareYear2, setCompareYear2] = useState("2569");

  const defaultCriteria: SurveyCriterion[] = [
    { id: "1", question: "คุณภาพการสอนและการสนับสนุนการเรียนรู้ของคุณครู" },
    { id: "2", question: "ความเพียงพอและคุณภาพของสื่ออุปกรณ์การเรียนและเทคโนโลยี" },
    { id: "3", question: "สภาพแวดล้อมและความสะอาดปลอดภัยของห้องเรียน/อาคารเรียน" },
    { id: "4", question: "โภชนาการ คุณภาพความสะอาด และรสชาติของอาหารกลางวันโรงเรียน" },
    { id: "5", question: "การจัดกิจกรรมเสริมทักษะ พลศึกษา และนันทนาการเพื่อผ่อนคลาย" }
  ];

  const defaultResults: SurveyResult[] = [
    {
      year: "2568",
      totalParticipants: 120,
      ratings: { "1": 4.1, "2": 3.6, "3": 4.4, "4": 3.2, "5": 3.8 }
    },
    {
      year: "2569",
      totalParticipants: 145,
      ratings: { "1": 4.5, "2": 4.0, "3": 4.2, "4": 3.5, "5": 4.1 }
    }
  ];

  // Load from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCriteria = localStorage.getItem("schoolos_survey_criteria");
      if (savedCriteria) {
        setCriteria(JSON.parse(savedCriteria));
      } else {
        setCriteria(defaultCriteria);
        localStorage.setItem("schoolos_survey_criteria", JSON.stringify(defaultCriteria));
      }

      const savedLogs = localStorage.getItem("schoolos_survey_results");
      if (savedLogs) {
        setSavedResults(JSON.parse(savedLogs));
      } else {
        setSavedResults(defaultResults);
        localStorage.setItem("schoolos_survey_results", JSON.stringify(defaultResults));
      }
    }
  }, []);

  // Initialize input form ratings when criteria loads
  useEffect(() => {
    const initialRatings: Record<string, number> = {};
    criteria.forEach(c => {
      initialRatings[c.id] = 4; // default to 4 stars
    });
    setInputRatings(initialRatings);
  }, [criteria]);

  // Save criteria
  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const newId = String(Date.now());
    const updated = [...criteria, { id: newId, question: newQuestion.trim() }];
    setCriteria(updated);
    localStorage.setItem("schoolos_survey_criteria", JSON.stringify(updated));
    setNewQuestion("");

    // add default value
    setInputRatings(prev => ({ ...prev, [newId]: 4 }));
  };

  const handleDeleteCriterion = (id: string) => {
    const updated = criteria.filter(c => c.id !== id);
    setCriteria(updated);
    localStorage.setItem("schoolos_survey_criteria", JSON.stringify(updated));
  };

  // Submit evaluation data
  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if result for this year already exists
    const filterSaved = savedResults.filter(r => r.year !== academicYear);
    const newLog: SurveyResult = {
      year: academicYear,
      totalParticipants: Number(participantsCount),
      ratings: { ...inputRatings }
    };

    const updated = [...filterSaved, newLog].sort((a, b) => Number(a.year) - Number(b.year));
    setSavedResults(updated);
    localStorage.setItem("schoolos_survey_results", JSON.stringify(updated));
    alert(`บันทึกแบบประเมินความพึงพอใจ ปีการศึกษา ${academicYear} สำเร็จเรียบร้อย!`);
    setActiveTab("analytics");
  };

  const handleRatingChange = (id: string, val: number) => {
    setInputRatings(prev => ({ ...prev, [id]: val }));
  };

  // Math helpers
  const currentResult = savedResults.find(r => r.year === academicYear) || {
    year: academicYear,
    totalParticipants: 0,
    ratings: {} as Record<string, number>
  };

  const getOverallAverage = (res: SurveyResult) => {
    const vals = Object.values(res.ratings);
    if (vals.length === 0) return 0;
    return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
  };

  // AI Insights Recommendation Summary
  const getAIRecommendation = (res: SurveyResult) => {
    if (!res || Object.keys(res.ratings).length === 0) {
      return "กรุณากรอกข้อมูลแบบสำรวจก่อนเพื่อให้อัลกอริทึมสรุปคำแนะนำการประเมิน";
    }

    // Find highest and lowest scoring questions
    let highestId = "";
    let highestScore = -1;
    let lowestId = "";
    let lowestScore = 6;

    Object.entries(res.ratings).forEach(([id, score]) => {
      if (score > highestScore) {
        highestScore = score;
        highestId = id;
      }
      if (score < lowestScore) {
        lowestScore = score;
        lowestId = id;
      }
    });

    const highestQ = criteria.find(c => c.id === highestId)?.question || "";
    const lowestQ = criteria.find(c => c.id === lowestId)?.question || "";

    const avg = getOverallAverage(res);

    return (
      <div className="space-y-3">
        <p className="font-bold text-indigo-700 dark:text-indigo-400">
          🤖 สรุปวิเคราะห์ผลการประเมิน ปีการศึกษา {res.year} (AI Recommendation Summary):
        </p>
        <p className="text-muted-foreground leading-relaxed">
          ภาพรวมของโรงเรียนมีระดับความพึงพอใจเฉลี่ยอยู่ที่ <span className="font-bold text-foreground">{avg} / 5.00</span> คะแนน ซึ่งอยู่ในระดับ <span className="font-semibold text-emerald-600">{avg >= 4.0 ? "พึงพอใจอย่างยิ่ง (Excellent)" : "พึงพอใจปานกลาง (Good)"}</span>
        </p>
        <div className="p-3 rounded-xl border border-emerald-500/10 bg-emerald-550/5 text-emerald-800 dark:text-emerald-300 text-[10px]">
          <b>จุดแข็งอันดับ 1:</b> "{highestQ}" ที่ได้รับคะแนนสูงถึง {highestScore.toFixed(2)}/5.00 คะแนน สะท้อนว่าโครงการพัฒนาและกระบวนการส่งเสริมในด้านนี้ทำได้ดีเยี่ยม ควรดำเนินงานตามแนวทางเดิมต่อไป
        </div>
        <div className="p-3 rounded-xl border border-rose-500/10 bg-rose-550/5 text-rose-800 dark:text-rose-300 text-[10px]">
          <b>ข้อเสนอแนะเร่งด่วน:</b> "{lowestQ}" ได้รับคะแนนต่ำสุดเฉลี่ยเพียง {lowestScore.toFixed(2)}/5.00 คะแนน <br />
          <u>ข้อแนะนำผู้บริหารในปีถัดไป:</u> ฝ่ายบริหารโรงเรียนควรทบทวนงบประมาณและปรับปรุงคุณภาพในจุดนี้อย่างเร่งด่วน มีการสอบถามข้อมูลเชิงลึกจากผู้ปกครองและแต่งตั้งผู้รับผิดชอบจัดตั้งมาตรการเฝ้าระวังเพื่อยกระดับคะแนนในปีถัดไป
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Control Bar */}
      <div className="p-5 bg-card border border-border/80 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-500" />
            ระบบสำรวจความพึงพอใจและวางแผนประเมิน
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            ปรับเปลี่ยนหัวข้อการประเมินวิชาการ บันทึกคะแนนดิบสะสม และสรุปรายงาน AI เชิงลึกประยุกต์ใช้ในปีถัดไป
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex bg-muted/65 p-1 rounded-xl border border-border/60">
          {[
            { id: "evaluate", label: "กรอกผลประเมิน", icon: ClipboardList },
            { id: "criteria", label: "หัวข้อประเมิน", icon: Save },
            { id: "analytics", label: "สรุปวิเคราะห์ AI", icon: BarChart2 },
            { id: "compare", label: "เปรียบเทียบปีการศึกษา", icon: ArrowLeftRight }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === t.id 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Contents Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form / Config (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab 1: Evaluate inputs */}
          {activeTab === "evaluate" && (
            <div className="p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card space-y-4">
              <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border/80 flex justify-between items-center">
                <span>กรอกสถิติและคะแนนผลการสำรวจความพึงพอใจ</span>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="bg-background border border-border rounded-xl p-1 px-3 text-xs font-bold text-foreground"
                >
                  <option value="2568">ปีการศึกษา 2568</option>
                  <option value="2569">ปีการศึกษา 2569</option>
                  <option value="2570">ปีการศึกษา 2570</option>
                </select>
              </h3>

              <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs font-semibold text-muted-foreground">
                <div className="space-y-1">
                  <label className="text-[10px] text-foreground block">จำนวนผู้ร่วมทำแบบประเมินทั้งหมด (คน)</label>
                  <input
                    type="number"
                    required
                    value={participantsCount}
                    onChange={(e) => setParticipantsCount(Number(e.target.value))}
                    className="w-full sm:w-1/3 h-9 px-3 border border-border bg-background rounded-xl text-foreground text-xs"
                  />
                </div>

                <div className="space-y-3.5 border-t border-border pt-4">
                  <label className="text-[10px] text-foreground block uppercase font-bold tracking-wider mb-2">
                    ระดับความพึงพอใจเฉลี่ยในแต่ละหัวข้อ (1 - 5 คะแนนเต็ม)
                  </label>
                  
                  {criteria.map((c) => (
                    <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border bg-background/30 gap-3">
                      <span className="text-foreground text-xs font-bold leading-normal flex-1">{c.question}</span>
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {[1, 2, 3, 4, 5].map((stars) => {
                          const isSel = inputRatings[c.id] === stars;
                          return (
                            <button
                              key={stars}
                              type="button"
                              onClick={() => handleRatingChange(c.id, stars)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                isSel 
                                  ? "bg-amber-500 text-white shadow" 
                                  : "bg-muted/40 hover:bg-muted hover:text-foreground text-muted-foreground"
                              }`}
                            >
                              {stars}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    type="submit"
                    className="h-10 px-5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-md shadow-indigo-500/10"
                  >
                    <Save className="w-4 h-4" />
                    บันทึกผลการประเมินลงคลังปี {academicYear}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Custom checklist manager */}
          {activeTab === "criteria" && (
            <div className="p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card space-y-4">
              <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border/80">
                ปรับปรุงและออกแบบรายการคำถามหัวข้อประเมินความพึงพอใจ
              </h3>

              <div className="space-y-3">
                {criteria.map((c, idx) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-border bg-card flex justify-between items-start gap-4">
                    <div className="flex items-start gap-2 text-xs font-bold leading-relaxed">
                      <span className="text-slate-400 font-mono">Q{idx + 1}.</span>
                      <span className="text-foreground">{c.question}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteCriterion(c.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="ลบหัวข้อนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Form Add */}
              <form onSubmit={handleAddCriterion} className="flex gap-2 pt-4 border-t border-border">
                <input
                  type="text"
                  required
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="พิมพ์คำถามข้อประเมินใหม่ที่นี่..."
                  className="flex-1 h-10 px-3.5 border border-border bg-background rounded-xl text-foreground text-xs font-semibold"
                />
                <button
                  type="submit"
                  className="h-10 px-4 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มหัวข้อ
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Analytics dashboard */}
          {activeTab === "analytics" && (
            <div className="p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card space-y-6">
              <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border/80 flex justify-between items-center">
                <span>สรุปสถิติดรรชนีความสำเร็จความพึงพอใจเชิงลึก</span>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="bg-background border border-border rounded-xl p-1 px-3 text-xs font-bold text-foreground"
                >
                  {savedResults.map(r => (
                    <option key={r.year} value={r.year}>ปีการศึกษา {r.year}</option>
                  ))}
                </select>
              </h3>

              {currentResult.totalParticipants === 0 ? (
                <div className="py-16 text-center text-xs font-bold text-slate-400 border border-dashed border-border rounded-xl">
                  ไม่พบข้อมูลบันทึกประเมินของปีการศึกษา {academicYear}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Head Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-card/40 text-center">
                      <span className="text-[10px] text-muted-foreground font-bold block">จำนวนผู้ประเมินรวม</span>
                      <span className="text-xl font-black text-primary mt-1 block">{currentResult.totalParticipants} คน</span>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card/40 text-center">
                      <span className="text-[10px] text-muted-foreground font-bold block">คะแนนเฉลี่ยภาพรวม</span>
                      <span className="text-xl font-black text-amber-500 mt-1 block">{getOverallAverage(currentResult as any)} / 5.00</span>
                    </div>
                  </div>

                  {/* Criteria Chart Bars */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">คะแนนความพึงพอใจแยกตามหมวดหมู่</h4>
                    
                    <div className="space-y-3">
                      {criteria.map((c) => {
                        const score = currentResult.ratings[c.id] || 0;
                        const pct = (score / 5) * 100;
                        
                        return (
                          <div key={c.id} className="space-y-1 text-xs">
                            <div className="flex justify-between font-bold text-foreground">
                              <span className="truncate max-w-[280px]">{c.question}</span>
                              <span className="text-primary">{score.toFixed(2)} / 5.00</span>
                            </div>
                            <div className="w-full bg-slate-200/50 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-border/20">
                              <div 
                                style={{ width: `${pct}%` }}
                                className="bg-indigo-650 h-full rounded-full transition-all duration-300"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Compare Multi Years */}
          {activeTab === "compare" && (
            <div className="p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card space-y-4">
              <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border/80">
                เปรียบเทียบความแตกต่างผลสำรวจรายปีการศึกษา
              </h3>

              <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border/60 text-xs font-bold">
                <span className="text-slate-500">ปีเริ่มต้น:</span>
                <select
                  value={compareYear1}
                  onChange={(e) => setCompareYear1(e.target.value)}
                  className="bg-background border border-border rounded-lg p-1.5 text-xs text-foreground outline-none"
                >
                  {savedResults.map(r => (
                    <option key={r.year} value={r.year}>ปีการศึกษา {r.year}</option>
                  ))}
                </select>

                <ArrowLeftRight className="w-4 h-4 text-slate-400 shrink-0 mx-2" />

                <span className="text-slate-500">ปีเปรียบเทียบ:</span>
                <select
                  value={compareYear2}
                  onChange={(e) => setCompareYear2(e.target.value)}
                  className="bg-background border border-border rounded-lg p-1.5 text-xs text-foreground outline-none"
                >
                  {savedResults.map(r => (
                    <option key={r.year} value={r.year}>ปีการศึกษา {r.year}</option>
                  ))}
                </select>
              </div>

              {(() => {
                const r1 = savedResults.find(r => r.year === compareYear1);
                const r2 = savedResults.find(r => r.year === compareYear2);

                if (!r1 || !r2) {
                  return (
                    <div className="py-12 text-center text-xs font-semibold text-slate-400 border border-dashed border-border rounded-xl">
                      กรุณาจัดให้มีข้อมูลบันทึกประเมินอย่างน้อย 2 ปีการศึกษาในระบบเพื่อทำการเปรียบเทียบเปรียบต่าง
                    </div>
                  );
                }

                const overall1 = getOverallAverage(r1);
                const overall2 = getOverallAverage(r2);
                const overallDiff = overall2 - overall1;

                return (
                  <div className="space-y-4">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-y border-border font-bold text-foreground">
                          <th className="p-2.5">หัวข้อประเมินความพึงพอใจ</th>
                          <th className="p-2.5 text-center">ปี {compareYear1}</th>
                          <th className="p-2.5 text-center">ปี {compareYear2}</th>
                          <th className="p-2.5 text-center">เปรียบเทียบ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {criteria.map((c) => {
                          const s1 = r1.ratings[c.id] || 0;
                          const s2 = r2.ratings[c.id] || 0;
                          const diff = s2 - s1;
                          
                          return (
                            <tr key={c.id}>
                              <td className="p-2.5 font-bold text-foreground max-w-[240px] truncate">{c.question}</td>
                              <td className="p-2.5 text-center font-mono">{s1.toFixed(2)}</td>
                              <td className="p-2.5 text-center font-mono">{s2.toFixed(2)}</td>
                              <td className={`p-2.5 text-center font-bold font-mono ${
                                diff > 0 ? "text-emerald-500" : diff < 0 ? "text-rose-500" : "text-slate-400"
                              }`}>
                                {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-50 dark:bg-slate-900/40 border-t border-border font-bold">
                          <td className="p-2.5 text-primary">คะแนนรวมเฉลี่ยประเมินภาพรวม</td>
                          <td className="p-2.5 text-center font-mono">{overall1.toFixed(2)}</td>
                          <td className="p-2.5 text-center font-mono">{overall2.toFixed(2)}</td>
                          <td className={`p-2.5 text-center font-black font-mono ${
                            overallDiff > 0 ? "text-emerald-500" : overallDiff < 0 ? "text-rose-500" : "text-slate-400"
                          }`}>
                            {overallDiff > 0 ? `+${overallDiff.toFixed(2)}` : overallDiff.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

        </div>

        {/* Right Column: AI Recommendations (1 col) */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card space-y-4 h-fit">
          <h3 className="text-xs font-black text-foreground border-b border-border/80 pb-2 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            บทวิเคราะห์สรุปคำแนะนำ
          </h3>
          
          <div className="text-[10px] leading-relaxed">
            {(() => {
              const res = savedResults.find(r => r.year === academicYear);
              return res ? getAIRecommendation(res) : (
                <p className="text-center text-slate-400 py-12">กรุณาเลือกปีการศึกษาที่มีข้อมูลสำเร็จด้านซ้าย</p>
              );
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}
