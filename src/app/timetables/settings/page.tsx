"use client";

import { useEffect, useState } from "react";
import { 
  getCurriculumRegistry, 
  saveCurriculumRegistry,
  CurriculumPlan,
  Workload
} from "@/app/actions/timetable_registry";
import { getSystemInitialData } from "@/app/actions/init";
import { 
  Settings, 
  Users, 
  Shield, 
  Lock, 
  Unlock, 
  Check, 
  Loader2, 
  Save, 
  ShieldAlert, 
  BookOpen 
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function TimetableSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [registry, setRegistry] = useState<{ curriculums: CurriculumPlan[]; classPlanMap: Record<string, string>; workloads: Workload[]; settings?: any }>({
    curriculums: [],
    classPlanMap: {},
    workloads: [],
    settings: {
      deptHeads: {},
      allowTeacherSelfAssign: true,
      pageAccess: {},
      subAdmins: [],
      substitutePermissionMode: "admin_only"
    }
  });

  const [dbTeachers, setDbTeachers] = useState<any[]>([]);

  // Local state for settings form
  const [deptHeads, setDeptHeads] = useState<Record<string, string>>({});
  const [allowTeacherSelfAssign, setAllowTeacherSelfAssign] = useState(true);
  const [subAdminsState, setSubAdminsState] = useState<string[]>([]);
  const [substitutePermissionMode, setSubstitutePermissionMode] = useState("admin_only");

  const role = (session?.user as any)?.role?.toLowerCase() || "teacher";
  const isAdmin = role === "admin" || session?.user?.email === "admin@school.os";
  
  const subAdmins = registry.settings?.subAdmins || [];
  const isSubAdmin = session?.user?.id ? subAdmins.includes(session.user.id) : false;
  const hasAdminAccess = isAdmin || isSubAdmin;

  const loadData = async () => {
    setLoading(true);
    const [regRes, dbRes] = await Promise.all([
      getCurriculumRegistry(),
      getSystemInitialData()
    ]);

    if (regRes.success && regRes.data) {
      const currentSettings = regRes.data.settings || {};
      setRegistry({
        curriculums: regRes.data.curriculums || [],
        classPlanMap: regRes.data.classPlanMap || {},
        workloads: regRes.data.workloads || [],
        settings: {
          deptHeads: currentSettings.deptHeads || {},
          allowTeacherSelfAssign: currentSettings.allowTeacherSelfAssign ?? true,
          pageAccess: currentSettings.pageAccess || {},
          subAdmins: currentSettings.subAdmins || [],
          substitutePermissionMode: currentSettings.substitutePermissionMode || "admin_only"
        }
      });
      
      setDeptHeads(currentSettings.deptHeads || {});
      setAllowTeacherSelfAssign(currentSettings.allowTeacherSelfAssign ?? true);
      setSubAdminsState(currentSettings.subAdmins || []);
      setSubstitutePermissionMode(currentSettings.substitutePermissionMode || "admin_only");
    }

    if (dbRes.success && dbRes.data) {
      setDbTeachers(dbRes.data.teachers || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    if (!hasAdminAccess) return;
    setIsSubmitting(true);

    const updatedRegistry = {
      ...registry,
      settings: {
        ...registry.settings,
        deptHeads,
        allowTeacherSelfAssign,
        subAdmins: subAdminsState,
        substitutePermissionMode
      }
    };

    const res = await saveCurriculumRegistry(updatedRegistry);
    if (res.success) {
      alert("บันทึกการตั้งค่าระบบตารางสอนสำเร็จ");
      setRegistry(updatedRegistry);
    } else {
      alert(res.error || "เกิดข้อผิดพลาดในการบันทึก");
    }
    setIsSubmitting(false);
  };

  const handleDeptHeadChange = (dept: string, userId: string) => {
    setDeptHeads((prev) => ({
      ...prev,
      [dept]: userId
    }));
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold">กำลังโหลดการตั้งค่าระบบ...</span>
      </div>
    );
  }

  const deptList = [
    "คณิตศาสตร์",
    "วิทยาศาสตร์และเทคโนโลยี",
    "ภาษาไทย",
    "ภาษาต่างประเทศ",
    "สังคมศึกษา ศาสนา และวัฒนธรรม",
    "สุขศึกษาและพลศึกษา",
    "ศิลปะ",
    "การงานอาชีพ"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border/80 pb-3">
        <div className="flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              ตั้งค่าระบบจัดตารางสอน (Timetable Settings)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              กำหนดสิทธิ์หัวหน้ากลุ่มสาระและควบคุมระบบลงทะเบียนภาระงานสอน
            </p>
          </div>
        </div>
        {hasAdminAccess && (
          <button
            onClick={handleSaveSettings}
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            บันทึกตั้งค่า
          </button>
        )}
      </div>

      {!hasAdminAccess && (
        <div className="p-3.5 bg-amber-500/5 text-amber-800 dark:text-amber-300 border border-amber-500/10 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>โหมดดูข้อมูลเท่านั้น: เฉพาะแอดมินหรือผู้ได้รับสิทธิ์ตั้งค่าตารางสอนเท่านั้นที่สามารถแก้ไขการมอบหมายสิทธิ์ระบบได้</span>
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Department Heads (left) */}
        <div className="p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-4">
          <h3 className="text-xs uppercase font-extrabold text-foreground flex items-center gap-1.5 tracking-wider border-b border-border/60 pb-2">
            <Users className="w-4 h-4 text-primary" />
            ผู้รับผิดชอบหัวหน้ากลุ่มสาระฯ (Department Heads)
          </h3>
          <p className="text-[10px] text-muted-foreground font-semibold leading-normal">
            มอบหมายครูผู้เป็นหัวหน้าหมวดของแต่ละกลุ่มสาระ ซึ่งหัวหน้าหมวดจะได้รับสิทธิ์มอบหมายภาระงานสอนในหมวดของตนเองให้ครูคนอื่นได้
          </p>

          <div className="space-y-3.5 pt-2">
            {deptList.map((dept) => {
              const currentHeadId = deptHeads[dept] || "";
              return (
                <div key={dept} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-foreground">
                  <span className="sm:w-1/2">{dept}</span>
                  <select
                    value={currentHeadId}
                    onChange={(e) => hasAdminAccess && handleDeptHeadChange(dept, e.target.value)}
                    disabled={!hasAdminAccess}
                    className="sm:w-1/2 bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium disabled:opacity-75"
                  >
                    <option value="">-- ยังไม่ได้กำหนด --</option>
                    {dbTeachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Permissions Configuration (right) */}
        <div className="space-y-6">
          <div className="p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-foreground flex items-center gap-1.5 tracking-wider border-b border-border/60 pb-2">
              <Shield className="w-4 h-4 text-primary" />
              การควบคุมสิทธิ์ภาระงานสอน (Self-Service Control)
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold leading-normal">
              ตั้งค่าว่าครูทั่วไปสามารถเลือกรับภาระงานสอนวิชาเรียนที่ว่างอยู่ด้วยตนเองในกลุ่มสาระตรงกันได้หรือไม่
            </p>

            <div className="pt-2 flex items-center justify-between p-3.5 border border-border/80 rounded-lg bg-muted/20">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">
                  เปิดให้ครูลงภาระงานสอนเอง
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold block">
                  หากเปิด ครูทั่วไปสามารถคลิก "รับสอน" รายวิชาที่ว่างอยู่ได้
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowTeacherSelfAssign}
                onChange={(e) => hasAdminAccess && setAllowTeacherSelfAssign(e.target.checked)}
                disabled={!hasAdminAccess}
                className="w-4 h-4 text-primary border-border focus:ring-primary cursor-pointer disabled:opacity-75"
              />
            </div>

            <div className="p-3 border border-indigo-500/10 rounded-lg bg-indigo-500/[0.02] flex items-start gap-2.5 text-[10px] text-slate-500 font-semibold leading-relaxed">
              {allowTeacherSelfAssign ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    ขณะนี้ **ระบบเปิด** ให้ครูบันทึกภาระงานสอนได้เอง ช่วยลดภาระการกรอกข้อมูลของแอดมิน โดยครูจะลงทะเบียนได้เฉพาะวิชาที่มีรหัสตรงกับกลุ่มสาระวิชาตนเองเท่านั้น
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    ขณะนี้ **ระบบปิด** การลงทะเบียนเอง ครูทั่วไปสามารถดูได้อย่างเดียว สิทธิ์การแก้ไขและมอบหมายจะผูกกับแอดมินและหัวหน้าหมวดเท่านั้น
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Sub-Admins setting */}
          <div className="p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-foreground flex items-center gap-1.5 tracking-wider border-b border-border/60 pb-2">
              <Shield className="w-4 h-4 text-primary" />
              ผู้ดูแลระบบจัดตารางสอนย่อย (Sub-Admins)
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold leading-normal">
              มอบหมายครูผู้สอนท่านอื่นให้ได้รับสิทธิ์การจัดตารางสอนและการตั้งค่าตารางสอนได้เสมือนแอดมินหลัก
            </p>

            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 border border-border/50 rounded-lg p-2 bg-background/50">
              {dbTeachers.map((t) => {
                const isSelected = subAdminsState.includes(t.id);
                return (
                  <label key={t.id} className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer hover:bg-muted/30 p-1.5 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!hasAdminAccess}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSubAdminsState(prev => [...prev, t.id]);
                        } else {
                          setSubAdminsState(prev => prev.filter(id => id !== t.id));
                        }
                      }}
                      className="w-4 h-4 text-primary border-border focus:ring-primary cursor-pointer disabled:opacity-75"
                    />
                    <div>
                      <span className="block font-bold">{t.fullName}</span>
                      <span className="block text-[9px] text-muted-foreground font-medium">{t.email}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Substitution Permission settings */}
          <div className="p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-foreground flex items-center gap-1.5 tracking-wider border-b border-border/60 pb-2">
              <Users className="w-4 h-4 text-primary" />
              สิทธิ์การจัดครูสอนแทนประจำวัน
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold leading-normal">
              เลือกขอบเขตสิทธิ์ของคุณครูที่จะเข้ามาทำหน้าที่บันทึกหรือสลับตารางสำหรับครูผู้ลาในแต่ละวัน
            </p>

            <select
              value={substitutePermissionMode}
              disabled={!hasAdminAccess}
              onChange={(e) => setSubstitutePermissionMode(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-bold disabled:opacity-75"
            >
              <option value="admin_only">เฉพาะผู้ดูแลระบบและ Sub-Admin เท่านั้น</option>
              <option value="dept_heads">แอดมิน, Sub-Admin และหัวหน้ากลุ่มสาระฯ</option>
              <option value="all">เปิดให้ครูทุกคนจัดสอนแทนได้ (อิสระ)</option>
            </select>
          </div>

          <div className="p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-3">
            <h3 className="text-xs uppercase font-extrabold text-foreground flex items-center gap-1.5 tracking-wider border-b border-border/60 pb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              การเข้าถึงหน้าจัดการตารางสอน (Modules Page Access)
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
              ตามสิทธิ์สถาบัน หน้าบริหารอย่างกิจกรรมโรงเรียน, ทะเบียนครู, ตั้งเวลาเรียน คาบเรียน ตารางการจัดสอบสอนแทน จะจำกัดสิทธิ์เฉพาะแอดมินหรือผู้บริหารเท่านั้น ส่วนครูสามารถเข้าจัดตารางสอนแบบ Read-only หรือแก้ไขในส่วนที่ได้รับมอบหมาย
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
