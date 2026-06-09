"use client";

import { useEffect, useState } from "react";
import { 
  getCurriculumRegistry,
  assignTeacherToWorkload,
  unassignTeacherFromWorkload,
  Workload,
  CurriculumPlan
} from "@/app/actions/timetable_registry";
import Papa from "papaparse";
import { getSystemInitialData } from "@/app/actions/init";
import { getRooms } from "@/app/actions/room";
import { 
  Library,
  User,
  Users,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Home,
  MapPin,
  Lock,
  Unlock,
  Check,
  X,
  Download,
  Upload
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function getSubjectGroupFromCode(code: string): string {
  if (!code) return "ทั่วไป";
  const prefix = code.charAt(0);
  switch (prefix) {
    case "ค": return "คณิตศาสตร์";
    case "ว": return "วิทยาศาสตร์และเทคโนโลยี";
    case "ท": return "ภาษาไทย";
    case "อ": return "ภาษาต่างประเทศ";
    case "ส": return "สังคมศึกษา ศาสนา และวัฒนธรรม";
    case "พ": return "สุขศึกษาและพลศึกษา";
    case "ศ": return "ศิลปะ";
    case "ง": return "การงานอาชีพ";
    default: return "ทั่วไป";
  }
}

export default function WorkloadsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const [registry, setRegistry] = useState<{ curriculums: CurriculumPlan[]; classPlanMap: Record<string, string>; workloads: Workload[]; settings?: any }>({
    curriculums: [],
    classPlanMap: {},
    workloads: [],
    settings: {
      deptHeads: {},
      allowTeacherSelfAssign: true,
      pageAccess: {}
    }
  });

  // DB entities
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);
  const [dbClassrooms, setDbClassrooms] = useState<any[]>([]);
  const [dbTeachers, setDbTeachers] = useState<any[]>([]);
  const [dbRooms, setDbRooms] = useState<any[]>([]);

  // Filter States
  const [filterClassroom, setFilterClassroom] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // "", "assigned", "unassigned"

  const role = (session?.user as any)?.role?.toLowerCase() || "teacher";
  const currentUserPosition = (session?.user as any)?.position || "";
  const currentUserId = session?.user?.id || "";

  const isAdmin = role === "admin" || session?.user?.email === "admin@school.os";
  const subAdmins = registry.settings?.subAdmins || [];
  const isSubAdmin = session?.user?.id ? subAdmins.includes(session.user.id) : false;
  const hasAdminAccess = isAdmin || isSubAdmin;
  const deptHeads = registry.settings?.deptHeads || {};
  
  // Find which department group(s) the current user is a head of
  const currentUserHeadDepts = Object.keys(deptHeads).filter(
    (dept) => deptHeads[dept] === currentUserId
  );
  const isDeptHead = currentUserHeadDepts.length > 0;
  
  const allowTeacherSelfAssign = registry.settings?.allowTeacherSelfAssign ?? true;

  const loadData = async () => {
    setLoading(true);
    const [regRes, dbRes, roomsRes] = await Promise.all([
      getCurriculumRegistry(),
      getSystemInitialData(),
      getRooms()
    ]);

    if (regRes.success && regRes.data) {
      setRegistry({
        curriculums: regRes.data.curriculums || [],
        classPlanMap: regRes.data.classPlanMap || {},
        workloads: regRes.data.workloads || [],
        settings: regRes.data.settings || {
          deptHeads: {},
          allowTeacherSelfAssign: true,
          pageAccess: {}
        }
      });
    }

    if (dbRes.success && dbRes.data) {
      setDbSubjects(dbRes.data.subjects || []);
      setDbClassrooms(dbRes.data.classrooms || []);
      setDbTeachers(dbRes.data.teachers || []);
    }

    if (roomsRes.success && roomsRes.data) {
      setDbRooms(roomsRes.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Action handlers
  const handleAssignTeacher = async (workloadId: string, teacherId: string, roomId?: string) => {
    setUpdatingId(workloadId);
    const workload = registry.workloads.find((w) => w.id === workloadId);
    const finalRoomId = roomId !== undefined ? roomId : (workload?.roomId || "");
    
    const res = await assignTeacherToWorkload(workloadId, teacherId, finalRoomId);
    if (res.success) {
      // Update locally
      setRegistry((prev) => ({
        ...prev,
        workloads: prev.workloads.map((w) => 
          w.id === workloadId ? { ...w, userId: teacherId, roomId: finalRoomId } : w
        )
      }));
    } else {
      alert(res.error || "เกิดข้อผิดพลาด");
    }
    setUpdatingId(null);
  };

  const handleAssignRoom = async (workloadId: string, roomId: string) => {
    const workload = registry.workloads.find((w) => w.id === workloadId);
    if (!workload) return;
    
    setUpdatingId(workloadId);
    const res = await assignTeacherToWorkload(workloadId, workload.userId, roomId);
    if (res.success) {
      setRegistry((prev) => ({
        ...prev,
        workloads: prev.workloads.map((w) => 
          w.id === workloadId ? { ...w, roomId } : w
        )
      }));
    } else {
      alert(res.error || "เกิดข้อผิดพลาด");
    }
    setUpdatingId(null);
  };

  const handleUnassignTeacher = async (workloadId: string) => {
    setUpdatingId(workloadId);
    const res = await unassignTeacherFromWorkload(workloadId);
    if (res.success) {
      setRegistry((prev) => ({
        ...prev,
        workloads: prev.workloads.map((w) => 
          w.id === workloadId ? { ...w, userId: "", roomId: "" } : w
        )
      }));
    } else {
      alert(res.error || "เกิดข้อผิดพลาด");
    }
    setUpdatingId(null);
  };

  const handleExportCSV = () => {
    // Prepare workloads for export
    const exportData = registry.workloads.map((w) => {
      const classroom = dbClassrooms.find((c) => c.id === w.classroomId);
      const sub = dbSubjects.find((s) => s.id === w.subjectId || s.code === w.subjectId);
      const teacher = dbTeachers.find((t) => t.id === w.userId);
      return {
        "รหัสวิชา (SubjectCode)": sub?.code || w.subjectId,
        "ชื่อชั้นเรียน (ClassroomName)": classroom?.name || w.classroomId,
        "อีเมลครู (TeacherEmail)": teacher?.email || "",
        "จำนวนคาบต่อสัปดาห์ (PeriodsPerWeek)": w.hours
      };
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: "text/csv;charset=utf-8;" }); // BOM for Excel Thai support
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `workloads_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedData = results.data as any[];
        
        // Map columns
        const inputs = parsedData.map((row) => {
          const subjectCode = row["รหัสวิชา (SubjectCode)"] || row["SubjectCode"] || "";
          const classroomName = row["ชื่อชั้นเรียน (ClassroomName)"] || row["ClassroomName"] || "";
          const teacherEmail = row["อีเมลครู (TeacherEmail)"] || row["TeacherEmail"] || "";
          const hoursStr = row["จำนวนคาบต่อสัปดาห์ (PeriodsPerWeek)"] || row["PeriodsPerWeek"] || "1";
          
          return {
            subjectCode: subjectCode.trim(),
            classroomName: classroomName.trim(),
            teacherEmail: teacherEmail.trim(),
            hours: Number(hoursStr) || 1
          };
        }).filter(item => item.subjectCode && item.classroomName);

        if (inputs.length === 0) {
          alert("ไม่พบข้อมูลภาระงานที่ถูกต้องในไฟล์ CSV");
          return;
        }

        const confirmImport = confirm(`ต้องการนำเข้าข้อมูลภาระงานสอนจำนวน ${inputs.length} รายการจากไฟล์ CSV ใช่หรือไม่? (ระบบจะแทนที่ภาระงานในห้องเรียนที่มีข้อมูลในไฟล์นี้)`);
        if (!confirmImport) return;

        setLoading(true);
        const { bulkImportWorkloads } = await import("@/app/actions/timetable_registry");
        const res = await bulkImportWorkloads(inputs);
        if (res.success) {
          alert(res.message);
          await loadData();
        } else {
          alert(res.error || "เกิดข้อผิดพลาดในการนำเข้า");
        }
        setLoading(false);
      },
      error: (error) => {
        alert("เกิดข้อผิดพลาดในการอ่านไฟล์ CSV: " + error.message);
      }
    });
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold">กำลังโหลดภาระงานสอนครู...</span>
      </div>
    );
  }

  // Workload calculations
  const totalWorkloads = registry.workloads.length;
  const assignedWorkloads = registry.workloads.filter((w) => w.userId).length;
  const percentAssigned = totalWorkloads > 0 ? Math.round((assignedWorkloads / totalWorkloads) * 100) : 0;

  // Filter workloads based on selection
  const filteredWorkloads = registry.workloads.filter((w) => {
    const classroom = dbClassrooms.find((c) => c.id === w.classroomId);
    const sub = dbSubjects.find((s) => s.id === w.subjectId || s.code === w.subjectId);
    const subjectCode = sub?.code || "";
    const workloadDept = getSubjectGroupFromCode(subjectCode);

    const matchesClassroom = !filterClassroom || w.classroomId === filterClassroom;
    const matchesDept = !filterDept || workloadDept === filterDept;
    
    let matchesStatus = true;
    if (filterStatus === "assigned") matchesStatus = !!w.userId;
    if (filterStatus === "unassigned") matchesStatus = !w.userId;

    return matchesClassroom && matchesDept && matchesStatus;
  });

  // Unique list of departments present in workloads
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/80 pb-3 gap-3">
        <div className="flex items-center gap-2.5">
          <Users className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              ทะเบียนภาระงานสอนครู (Teacher Workload Allocation)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              มอบหมายครูผู้สอนและห้องแล็บปฏิบัติการสำหรับรายวิชาของแต่ละห้องเรียน
            </p>
          </div>
        </div>
        {/* CSV Import/Export Controls */}
        {hasAdminAccess && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg shadow-sm border border-border transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              ส่งออก CSV
            </button>
            <label className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              นำเข้า CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Progress & Stat Header */}
      <div className="p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2 text-xs font-bold">
          <div>
            <span className="text-foreground">ความคืบหน้าการลงทะเบียนสอน: </span>
            <span className="text-primary text-sm font-extrabold">{assignedWorkloads}</span>
            <span className="text-muted-foreground"> / {totalWorkloads} รายการ</span>
          </div>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-black",
            percentAssigned === 100 
              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
              : "bg-primary/10 text-primary border border-primary/20"
          )}>
            {percentAssigned}% เสร็จสิ้น
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-500" 
            style={{ width: `${percentAssigned}%` }}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Filters (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-foreground flex items-center gap-1.5 tracking-wider">
              <Filter className="w-4 h-4 text-primary" />
              ตัวกรองข้อมูล
            </h3>
            
            <div className="space-y-3.5 text-xs text-muted-foreground font-semibold">
              {/* Classroom filter */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold">ชั้นเรียน / ห้องเรียน</label>
                <select
                  value={filterClassroom}
                  onChange={(e) => setFilterClassroom(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value="">ทั้งหมด</option>
                  {dbClassrooms.map(c => (
                    <option key={c.id} value={c.id}>ชั้นเรียน {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Department filter */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold">หมวดวิชา (กลุ่มสาระฯ)</label>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value="">ทั้งหมด</option>
                  {deptList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold">สถานะมอบหมายครู</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="assigned">ระบุครูแล้ว</option>
                  <option value="unassigned">ยังไม่ได้ระบุครู</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Legend / Info */}
          <div className="p-4 bg-muted/40 border border-border/80 rounded-xl space-y-3.5 text-[11px] font-semibold text-slate-500">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-primary" />
              ข้อกำหนดสิทธิ์การมอบหมาย
            </h4>
            <ul className="list-disc pl-4 space-y-2 leading-relaxed">
              <li><span className="text-primary font-bold">แอดมิน:</span> มอบหมายหรือสลับสิทธิ์ครูและห้องปฏิบัติการได้ทุกวิชาของทุกห้อง</li>
              <li><span className="text-indigo-600 font-bold">หัวหน้าหมวด:</span> มอบหมายงานวิชาเรียนในกลุ่มสาระของตนเองให้แก่คุณครูในหมวด</li>
              <li><span className="text-emerald-600 font-bold">คุณครูทั่วไป:</span> มอบหมายงานสอนให้ตนเองได้ (เฉพาะวิชาในหมวดที่ตรงกัน และระบบเปิดให้ทำได้)</li>
            </ul>
          </div>
        </div>

        {/* Right Panel: Workload list table (9 cols) */}
        <div className="lg:col-span-9 p-5 bg-card border border-border/80 rounded-xl shadow-sm space-y-4">
          <h3 className="text-xs uppercase font-extrabold text-foreground tracking-wider">
            รายการภาระงานที่พบบนเงื่อนไข ({filteredWorkloads.length})
          </h3>

          <div className="overflow-x-auto border border-border/80 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="py-2.5 px-3">ชั้นเรียน</th>
                  <th className="py-2.5 px-3">วิชา / คาบต่อสัปดาห์</th>
                  <th className="py-2.5 px-3">หมวดวิชา</th>
                  <th className="py-2.5 px-3">ครูผู้สอน</th>
                  <th className="py-2.5 px-3">ห้องแล็บ/ห้องเรียน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-semibold text-slate-700 dark:text-slate-300">
                {filteredWorkloads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground font-medium">
                      ไม่พบรายการภาระงานสอนที่สอดคล้องกับตัวกรอง
                    </td>
                  </tr>
                ) : (
                  filteredWorkloads.map((w) => {
                    const classroom = dbClassrooms.find((c) => c.id === w.classroomId);
                    const sub = dbSubjects.find((s) => s.id === w.subjectId || s.code === w.subjectId);
                    const subjectCode = sub?.code || "";
                    const subjectGroupOfWl = getSubjectGroupFromCode(subjectCode);
                    const isUpdating = updatingId === w.id;

                    // Compute permissions for this workload
                    let canAssign = false;
                    let teacherListForDropdown = dbTeachers;

                    if (hasAdminAccess) {
                      canAssign = true;
                    } else if (isDeptHead && currentUserHeadDepts.includes(subjectGroupOfWl)) {
                      canAssign = true;
                      // Restrict dropdown list to teachers of same department
                      teacherListForDropdown = dbTeachers.filter(
                        (t) => t.subjectGroup === subjectGroupOfWl
                      );
                    } else if (allowTeacherSelfAssign) {
                      // Regular teacher can assign themselves if the department matches
                      const matchesTeacherGroup = (session?.user as any)?.subjectGroup === subjectGroupOfWl;
                      if (matchesTeacherGroup && (!w.userId || w.userId === currentUserId)) {
                        canAssign = true;
                      }
                    }

                    return (
                      <tr key={w.id} className="hover:bg-muted/10 transition-all">
                        {/* Classroom */}
                        <td className="py-2.5 px-3 text-foreground font-black">
                          {classroom?.name || w.classroomId}
                        </td>
                        
                        {/* Subject info */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono font-bold text-primary">{subjectCode}</span>
                            <span className="text-foreground/90 font-medium text-[11px]">{sub?.name || w.subjectId}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {w.hours} คาบ/สัปดาห์ • {w.consReq === 1 ? "คาบเดี่ยว" : `${w.consReq} คาบติด`}
                              {w.timingPref && ` • ${w.timingPref === "M" ? "☀️ เช้า" : "🌤️ บ่าย"}`}
                            </span>
                          </div>
                        </td>

                        {/* Department group */}
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-muted/60 text-slate-500 font-bold">
                            {subjectGroupOfWl}
                          </span>
                        </td>

                        {/* Teacher Assignee */}
                        <td className="py-2.5 px-3">
                          {isUpdating ? (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>กำลังอัปเดต...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {canAssign ? (
                                // Show select dropdown if admin or dept head
                                hasAdminAccess || isDeptHead ? (
                                  <select
                                    value={w.userId}
                                    onChange={(e) => handleAssignTeacher(w.id, e.target.value)}
                                    className="bg-background border border-border rounded-md p-1.5 text-xs text-foreground focus:outline-none"
                                  >
                                    <option value="">-- ยังไม่ระบุครู --</option>
                                    {teacherListForDropdown.map((t) => (
                                      <option key={t.id} value={t.id}>{t.fullName}</option>
                                    ))}
                                  </select>
                                ) : (
                                  // Teacher Self-Assign workflow
                                  w.userId === currentUserId ? (
                                    <button
                                      onClick={() => handleUnassignTeacher(w.id)}
                                      className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 rounded-md font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1"
                                    >
                                      <X className="w-3 h-3" />
                                      ยกเลิกการลงทะเบียน
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAssignTeacher(w.id, currentUserId)}
                                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[10px] shadow-sm transition-all cursor-pointer flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      รับสอนวิชานี้
                                    </button>
                                  )
                                )
                              ) : (
                                // No permission: Display current state static text
                                <span className="text-[11px] text-muted-foreground font-semibold">
                                  {dbTeachers.find(t => t.id === w.userId)?.fullName || w.userId || "ยังไม่ได้ระบุครู"}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Room Assignee */}
                        <td className="py-2.5 px-3">
                          {isUpdating ? (
                            <span className="text-[10px] text-slate-400">...</span>
                          ) : (
                            hasAdminAccess || (isDeptHead && currentUserHeadDepts.includes(subjectGroupOfWl)) ? (
                              <select
                                value={w.roomId || ""}
                                onChange={(e) => handleAssignRoom(w.id, e.target.value)}
                                className="bg-background border border-border rounded-md p-1.5 text-xs text-foreground focus:outline-none"
                              >
                                <option value="">-- ห้องเรียนปกติ --</option>
                                {dbRooms.map((r) => (
                                  <option key={r.id} value={r.id}>{r.name} ({r.building || "-"})</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {dbRooms.find(r => r.id === w.roomId)?.name || "ห้องเรียนปกติ"}
                              </span>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
