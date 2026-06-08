"use client";

import { useEffect, useState } from "react";
import { 
  getCurriculumRegistry, 
  saveCurriculumRegistry, 
  syncCurriculumToClassrooms, 
  CurriculumPlan, 
  Workload 
} from "@/app/actions/timetable_registry";
import { getSystemInitialData } from "@/app/actions/init";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Copy, 
  Edit2, 
  Loader2, 
  ShieldAlert, 
  Save, 
  Library, 
  Check, 
  CheckCircle,
  X 
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function CurriculumsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registry, setRegistry] = useState<{ curriculums: CurriculumPlan[]; classPlanMap: Record<string, string>; workloads: Workload[] }>({
    curriculums: [],
    classPlanMap: {},
    workloads: []
  });

  // DB entities
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);
  const [dbClassrooms, setDbClassrooms] = useState<any[]>([]);

  // Selected state for current plan detail view
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // New Plan form states
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanGrade, setNewPlanGrade] = useState("");
  const [newPlanTerm, setNewPlanTerm] = useState("1");

  // Edit Plan details states
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editPlanName, setEditPlanName] = useState("");
  const [editPlanGrade, setEditPlanGrade] = useState("");
  const [editPlanTerm, setEditPlanTerm] = useState("1");

  // New Subject in Plan form states
  const [planSubCode, setPlanSubCode] = useState("");
  const [planSubHours, setPlanSubHours] = useState(2);
  const [planSubCons, setPlanSubCons] = useState(1);
  const [planSubTiming, setPlanSubTiming] = useState("");

  // Multi-Classroom selection state
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([]);

  const role = (session?.user as any)?.role?.toLowerCase() || "teacher";
  const isAdmin = role === "admin" || session?.user?.email === "admin@school.os";

  const loadData = async () => {
    setLoading(true);
    const [regRes, dbRes] = await Promise.all([
      getCurriculumRegistry(),
      getSystemInitialData()
    ]);

    if (regRes.success && regRes.data) {
      setRegistry({
        curriculums: regRes.data.curriculums || [],
        classPlanMap: regRes.data.classPlanMap || {},
        workloads: regRes.data.workloads || []
      });
    }

    if (dbRes.success && dbRes.data) {
      setDbSubjects(dbRes.data.subjects || []);
      setDbClassrooms(dbRes.data.classrooms || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedPlan = registry.curriculums.find(c => c.id === selectedPlanId);

  // Sync selectedClassrooms state when selectedPlan changes
  useEffect(() => {
    if (selectedPlan) {
      setSelectedClassrooms(selectedPlan.assignedClassrooms || []);
      setEditPlanName(selectedPlan.name);
      setEditPlanGrade(selectedPlan.grade);
      setEditPlanTerm(selectedPlan.term);
      setIsEditingPlan(false);
    } else {
      setSelectedClassrooms([]);
    }
  }, [selectedPlanId, registry.curriculums]);

  // 1. Plan Operations
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;

    setIsSubmitting(true);
    const newPlan: CurriculumPlan = {
      id: `plan-${Date.now()}`,
      name: newPlanName,
      grade: newPlanGrade,
      term: newPlanTerm,
      assignedClassrooms: [],
      subjects: []
    };

    const updated = {
      ...registry,
      curriculums: [...registry.curriculums, newPlan]
    };

    const res = await saveCurriculumRegistry(updated);
    if (res.success) {
      setRegistry(updated);
      setNewPlanName("");
      setNewPlanGrade("");
      setSelectedPlanId(newPlan.id);
    } else {
      alert(res.error || "เกิดข้อผิดพลาด");
    }
    setIsSubmitting(false);
  };

  const handleUpdatePlanDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !editPlanName.trim()) return;

    setIsSubmitting(true);
    const updatedCurriculums = registry.curriculums.map(c => {
      if (c.id === selectedPlanId) {
        return {
          ...c,
          name: editPlanName,
          grade: editPlanGrade,
          term: editPlanTerm
        };
      }
      return c;
    });

    const updated = { ...registry, curriculums: updatedCurriculums };
    const res = await saveCurriculumRegistry(updated);
    if (res.success) {
      setRegistry(updated);
      setIsEditingPlan(false);
    } else {
      alert(res.error || "เกิดข้อผิดพลาด");
    }
    setIsSubmitting(false);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบหลักสูตรนี้และโครงสร้างวิชาภายในหลักสูตรทั้งหมด?")) return;
    setIsSubmitting(true);

    const updated = {
      ...registry,
      curriculums: registry.curriculums.filter(c => c.id !== planId)
    };

    const res = await saveCurriculumRegistry(updated);
    if (res.success) {
      setRegistry(updated);
      if (selectedPlanId === planId) setSelectedPlanId(null);
    } else {
      alert(res.error || "ลบล้มเหลว");
    }
    setIsSubmitting(false);
  };

  const handleClonePlan = async (planId: string) => {
    const planToClone = registry.curriculums.find(c => c.id === planId);
    if (!planToClone) return;

    setIsSubmitting(true);
    const clonedPlan: CurriculumPlan = {
      ...planToClone,
      id: `plan-clone-${Date.now()}`,
      name: `${planToClone.name} (คัดลอก)`,
      assignedClassrooms: [], // Don't assign classrooms immediately to cloned copy
      subjects: planToClone.subjects.map(s => ({ ...s }))
    };

    const updated = {
      ...registry,
      curriculums: [...registry.curriculums, clonedPlan]
    };

    const res = await saveCurriculumRegistry(updated);
    if (res.success) {
      setRegistry(updated);
      setSelectedPlanId(clonedPlan.id);
      alert(`คัดลอกหลักสูตร "${planToClone.name}" สำเร็จ`);
    } else {
      alert(res.error || "คัดลอกล้มเหลว");
    }
    setIsSubmitting(false);
  };

  const handleAddSubjectToPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !planSubCode) return;

    setIsSubmitting(true);
    const matchedDbSub = dbSubjects.find(s => s.code === planSubCode);
    const subName = matchedDbSub?.name || "วิชาใหม่";

    const updatedCurriculums = registry.curriculums.map(c => {
      if (c.id === selectedPlanId) {
        if (c.subjects.some(s => s.code === planSubCode)) {
          alert("วิชานี้อยู่ในหลักสูตรนี้แล้ว");
          return c;
        }
        return {
          ...c,
          subjects: [
            ...c.subjects,
            {
              code: planSubCode,
              name: subName,
              hours: planSubHours,
              consReq: planSubCons,
              timingPref: planSubTiming
            }
          ]
        };
      }
      return c;
    });

    const updated = { ...registry, curriculums: updatedCurriculums };
    const res = await saveCurriculumRegistry(updated);
    if (res.success) {
      setRegistry(updated);
      setPlanSubCode("");
    } else {
      alert(res.error || "บันทึกไม่สำเร็จ");
    }
    setIsSubmitting(false);
  };

  const handleDeleteSubjectFromPlan = async (planId: string, subCode: string) => {
    setIsSubmitting(true);
    const updatedCurriculums = registry.curriculums.map(c => {
      if (c.id === planId) {
        return {
          ...c,
          subjects: c.subjects.filter(s => s.code !== subCode)
        };
      }
      return c;
    });

    const updated = { ...registry, curriculums: updatedCurriculums };
    const res = await saveCurriculumRegistry(updated);
    if (res.success) {
      setRegistry(updated);
    } else {
      alert(res.error || "เกิดข้อผิดพลาด");
    }
    setIsSubmitting(false);
  };

  // 2. Classroom Mapping & Sync
  const handleToggleClassroomSelection = (classId: string) => {
    if (selectedClassrooms.includes(classId)) {
      setSelectedClassrooms(selectedClassrooms.filter(id => id !== classId));
    } else {
      setSelectedClassrooms([...selectedClassrooms, classId]);
    }
  };

  const handleSyncClassrooms = async () => {
    if (!selectedPlanId) return;
    setIsSubmitting(true);

    const res = await syncCurriculumToClassrooms(selectedPlanId, selectedClassrooms);
    if (res.success) {
      alert(res.message);
      // Reload registry to reflect classroom links and workload updates
      await loadData();
    } else {
      alert(res.error || "การซิงค์ล้มเหลว");
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold">กำลังโหลดโครงสร้างหลักสูตร...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border/80 pb-3">
        <div className="flex items-center gap-2.5">
          <Library className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              จัดการโครงสร้างหลักสูตร (Curriculum Management)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              สร้าง แก้ไข คัดลอกหลักสูตร และผูกชั้นเรียนเพื่อใช้งานในปีการศึกษา
            </p>
          </div>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-3.5 bg-amber-500/5 text-amber-800 dark:text-amber-300 border border-amber-500/10 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>โหมดดูข้อมูลเท่านั้น: คุณครูสามารถดูโครงสร้างหลักสูตรรายวิชาได้ แต่ไม่สามารถแก้ไขหรือจัดระดับชั้นเรียนได้</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Create and List Curriculums (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Create Form */}
          {isAdmin && (
            <div className="p-5 bg-card border border-border/80 rounded-xl space-y-4 shadow-sm">
              <h3 className="text-xs uppercase font-extrabold text-foreground flex items-center gap-1.5 tracking-wider">
                <Plus className="w-4 h-4 text-primary" />
                สร้างหลักสูตรใหม่
              </h3>
              <form onSubmit={handleCreatePlan} className="space-y-3 text-xs text-muted-foreground font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold">ชื่อหลักสูตร</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น แผนวิทย์-คณิต ม.4, แผนคณิต-อังกฤษ ม.5"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold">ระดับชั้น</label>
                    <input
                      type="text"
                      placeholder="เช่น ม.4"
                      value={newPlanGrade}
                      onChange={(e) => setNewPlanGrade(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold">ภาคเรียนที่</label>
                    <select
                      value={newPlanTerm}
                      onChange={(e) => setNewPlanTerm(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    >
                      <option value="1">เทอม 1</option>
                      <option value="2">เทอม 2</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> สร้างแผนหลักสูตร
                </button>
              </form>
            </div>
          )}

          {/* List of Curriculums */}
          <div className="p-5 bg-card border border-border/80 rounded-xl space-y-4 shadow-sm">
            <h3 className="text-xs uppercase font-extrabold text-foreground tracking-wider">
              รายการหลักสูตรทั้งหมด ({registry.curriculums.length})
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {registry.curriculums.length === 0 ? (
                <p className="text-center text-xs py-8 text-muted-foreground font-medium">ยังไม่มีข้อมูลหลักสูตรในระบบ</p>
              ) : (
                registry.curriculums.map(plan => {
                  const numClasses = plan.assignedClassrooms?.length || 0;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "p-3 border rounded-lg flex items-center justify-between transition-all cursor-pointer font-bold text-xs select-none",
                        selectedPlanId === plan.id
                          ? "border-primary bg-primary/[0.03] text-primary"
                          : "border-border/60 hover:bg-muted/40 text-foreground"
                      )}
                    >
                      <div className="space-y-1">
                        <p className="font-semibold">{plan.name}</p>
                        <div className="flex flex-wrap gap-1 items-center text-[10px] text-muted-foreground font-semibold">
                          <span>ระดับ {plan.grade || "-"}</span>
                          <span>•</span>
                          <span>เทอม {plan.term}</span>
                          <span>•</span>
                          <span className="text-primary/90">{plan.subjects.length} วิชา</span>
                          {numClasses > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400">ใช้กับ {numClasses} ห้อง</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClonePlan(plan.id);
                            }}
                            title="คัดลอกหลักสูตรนี้"
                            className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlan(plan.id);
                            }}
                            title="ลบหลักสูตร"
                            className="p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Detail view + Subjects & Multi-classroom Mapping (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPlan ? (
            <div className="space-y-6">
              {/* Top Card: Plan Header & Info / Edit Details */}
              <div className="p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  {!isEditingPlan ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-foreground">{selectedPlan.name}</h3>
                        {isAdmin && (
                          <button
                            onClick={() => setIsEditingPlan(true)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                        ระดับชั้น: {selectedPlan.grade || "ทั่วไป"} • ภาคเรียนที่ {selectedPlan.term}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdatePlanDetails} className="w-full grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-semibold items-end bg-muted/20 p-3 rounded-lg border border-border/60">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">ชื่อหลักสูตร</label>
                        <input
                          type="text"
                          required
                          value={editPlanName}
                          onChange={(e) => setEditPlanName(e.target.value)}
                          className="w-full bg-background border border-border rounded-md p-2 text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">ระดับชั้น</label>
                        <input
                          type="text"
                          value={editPlanGrade}
                          onChange={(e) => setEditPlanGrade(e.target.value)}
                          className="w-full bg-background border border-border rounded-md p-2 text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1 flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">เทอม</label>
                          <select
                            value={editPlanTerm}
                            onChange={(e) => setEditPlanTerm(e.target.value)}
                            className="w-full bg-background border border-border rounded-md p-2 text-foreground focus:outline-none"
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                          </select>
                        </div>
                        <div className="flex gap-1 items-end">
                          <button
                            type="submit"
                            title="บันทึก"
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingPlan(false)}
                            title="ยกเลิก"
                            className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-foreground rounded-md cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="flex gap-1">
                    {isAdmin && (
                      <button
                        onClick={() => handleClonePlan(selectedPlan.id)}
                        className="px-3 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted/40 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        คัดลอกหลักสูตร
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Classroom Mapping checklist card */}
              <div className="p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-border/70 pb-2 flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-xs uppercase text-foreground tracking-wider flex items-center gap-1">
                      ชั้นเรียนที่ผูกใช้งานหลักสูตรนี้
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                      เลือกห้องเรียนที่จะนำหลักสูตรนี้ไปจัดตาราง และซิงค์วิชาในแผนเข้าไปเป็นภาระงานของห้องนั้นๆ
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={handleSyncClassrooms}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-600/95 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      บันทึกและซิงค์ภาระงาน
                    </button>
                  )}
                </div>

                {dbClassrooms.length === 0 ? (
                  <p className="text-center text-xs py-4 text-muted-foreground font-medium">ไม่พบชั้นเรียนในระบบ</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {dbClassrooms.map(c => {
                      const isChecked = selectedClassrooms.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => isAdmin && handleToggleClassroomSelection(c.id)}
                          className={cn(
                            "p-2.5 border rounded-lg text-center font-bold text-xs cursor-pointer select-none transition-all flex flex-col items-center justify-center gap-1.5",
                            isChecked
                              ? "border-emerald-500 bg-emerald-500/[0.04] text-emerald-700 dark:text-emerald-400"
                              : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                          )}
                        >
                          <span className="font-semibold text-xs">{c.name}</span>
                          {isChecked ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Subjects List in this curriculum */}
              <div className="p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-4">
                <h3 className="font-bold text-xs uppercase text-foreground tracking-wider">
                  รายวิชาทั้งหมดในหลักสูตร
                </h3>

                {/* Add Subject to Plan form (Admin Only) */}
                {isAdmin && (
                  <form onSubmit={handleAddSubjectToPlan} className="p-3.5 bg-muted/20 border border-border/80 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 text-xs text-muted-foreground font-semibold items-end">
                    <div className="space-y-1 md:col-span-4">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">เลือกรายวิชาในระบบ</label>
                      <select
                        value={planSubCode}
                        onChange={(e) => setPlanSubCode(e.target.value)}
                        required
                        className="w-full bg-background border border-border rounded-md p-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- เลือกวิชา --</option>
                        {dbSubjects.map(s => (
                          <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">คาบ/สัปดาห์</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={planSubHours}
                        onChange={(e) => setPlanSubHours(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-md p-2 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-3">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">คาบเรียนติดกัน</label>
                      <select
                        value={planSubCons}
                        onChange={(e) => setPlanSubCons(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-md p-2 text-xs text-foreground focus:outline-none"
                      >
                        <option value="1">1 คาบเดี่ยว</option>
                        <option value="2">2 คาบติดกัน</option>
                        <option value="3">3 คาบติดกัน</option>
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-3 flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">ช่วงเวลาชอบเรียน</label>
                        <select
                          value={planSubTiming}
                          onChange={(e) => setPlanSubTiming(e.target.value)}
                          className="w-full bg-background border border-border rounded-md p-2 text-xs text-foreground focus:outline-none"
                        >
                          <option value="">-- ตามความเหมาะสม --</option>
                          <option value="M">☀️ ช่วงเช้า</option>
                          <option value="A">🌤️ ช่วงบ่าย</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="p-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-md shadow-sm transition-all cursor-pointer flex items-center justify-center"
                        title="เพิ่มรายวิชา"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* Table */}
                <div className="overflow-x-auto border border-border/80 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        <th className="py-2.5 px-3">รหัสวิชา</th>
                        <th className="py-2.5 px-3">ชื่อวิชา</th>
                        <th className="py-2.5 px-3 text-center">คาบ/สัปดาห์</th>
                        <th className="py-2.5 px-3 text-center">ชั่วโมงติดกัน</th>
                        <th className="py-2.5 px-3 text-center">ช่วงเวลาชอบเรียน</th>
                        {isAdmin && <th className="py-2.5 px-3 text-right">ลบ</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-semibold text-slate-700 dark:text-slate-300">
                      {selectedPlan.subjects.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-muted-foreground font-medium">
                            ยังไม่มีวิชาเรียนที่ผูกกับหลักสูตรนี้
                          </td>
                        </tr>
                      ) : (
                        selectedPlan.subjects.map(s => (
                          <tr key={s.code} className="hover:bg-muted/20 transition-all">
                            <td className="py-2.5 px-3 font-mono font-bold text-foreground">{s.code}</td>
                            <td className="py-2.5 px-3 font-medium">{s.name}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full border border-border text-[10px] bg-muted/40 font-bold">
                                {s.hours} คาบ
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-medium">
                              {s.consReq === 1 ? "คาบเดี่ยว" : `${s.consReq} คาบติด`}
                            </td>
                            <td className="py-2.5 px-3 text-center font-medium">
                              {s.timingPref === "M" ? "☀️ เช้า" : s.timingPref === "A" ? "🌤️ บ่าย" : "ยืดหยุ่น"}
                            </td>
                            {isAdmin && (
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => handleDeleteSubjectFromPlan(selectedPlan.id, s.code)}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-500/10 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-slate-400 border border-dashed border-border/80 rounded-xl p-6 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-bold text-foreground">กรุณาเลือกหลักสูตรที่แถบซ้าย หรือสร้างใหม่</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-[320px]">
                เพื่อเข้าถึงเมนูกำหนดโครงสร้างวิชา, คัดลอกหลักสูตร และจัดระดับชั้นเรียน
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
