"use client";

import React, { useState, useEffect } from "react";
import { 
  Home, Users, BookOpen, Heart, Settings, MessageSquare, BarChart3, ShieldAlert,
  Search, Moon, Sun, Bell, AlertTriangle, Plus, CheckCircle2, X, Trash2, 
  Send, Hammer, HelpCircle, FileText, Calendar, Clock, Star, Edit3, ArrowRight,
  UserCheck, Sparkles, LogOut, CheckSquare, Award, Play, ChevronRight, FileCode, GraduationCap,
  Menu, LayoutDashboard, History, FileSpreadsheet, Activity, UserCircle, ChevronDown,
  Mail, ShoppingCart
} from "lucide-react";

import { Student, Teacher, LeaveRequest, HealthVisit, TimelineEvent, NotificationItem, AuditLogItem, UserRole } from "@/types/school-os";
import { initialStudents, initialTeachers, initialLeaveRequests, initialHealthVisits, initialTimelineEvents, initialNotifications, initialAuditLogs } from "@/lib/mock-data";
import CommandPalette from "@/components/CommandPalette";
import TimelineEngine from "@/components/TimelineEngine";
import SmartDashboard from "@/components/SmartDashboard";
import StudentDetailModal from "@/components/StudentDetailModal";

import { useSession, signOut } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";

// Import integrated eLeave sub-pages
import ProfilePage from "./eleave/profile/page";
import LeaveView from "@/components/modules/LeaveView";
import TimetableView from "@/components/modules/TimetableView";
import { ScheduleGrid } from "@/components/timetable/ScheduleGrid";
import SubstitutionTab from "@/components/timetable/SubstitutionTab";
import StudentCareView from "@/components/modules/StudentCareView";
import ReportsView from "@/components/modules/ReportsView";
import EngagementView from "@/components/modules/EngagementView";
import AcademicCalendar from "@/components/modules/academic/AcademicCalendar";
import SubsystemsView from "@/components/modules/operations/SubsystemsView";

// Import real database actions
import { getSystemInitialData } from "@/app/actions/init";
import { createSubject, deleteSubject } from "@/app/actions/subject";
import { createClassroom, deleteClassroom } from "@/app/actions/classroom";
import { getSubjectAttendance, saveSubjectAttendance, getClassroomSchedulesForDay } from "@/app/actions/attendance";
import { getRooms } from "@/app/actions/room";

// Import global settings & backup actions
import { getSystemSettings, updateSystemSettings, updateFooter, generateBackup } from "@/app/actions/settings";
import { uploadLogo } from "@/app/actions/upload";
import { importBackupFromJson } from "@/app/actions/archive";
import { UploadCloud, DownloadCloud, Image as ImageIcon } from "lucide-react";

interface WorkspaceProps {
  initialSettings: {
    schoolName: string;
    subheader: string;
    logoUrl: string | null;
    footerText: string;
    lineChannelAccessToken?: string;
    lineTargetGroupId?: string;
    leaveRules?: string;
  };
}

export default function Workspace({ initialSettings }: WorkspaceProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { lang, setLang, t } = useI18n();

  // Theme & Layout States
  const [darkMode, setDarkMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [activeSubTab, setActiveSubTab] = useState("dashboard");
  const [role, setRole] = useState<UserRole>("teacher");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeFloatingMenu, setActiveFloatingMenu] = useState<string | null>(null);
  const [eleaveSubTab, setEleaveSubTab] = useState<"dashboard" | "form" | "history" | "approvals" | "reports" | "settings" | "users" | "logs">("dashboard");
  const [timetableViewSubTab, setTimetableViewSubTab] = useState<string>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [eleaveExpanded, setEleaveExpanded] = useState(false);

  // Dynamic branding from SystemSettings
  const [schoolName, setSchoolName] = useState(initialSettings.schoolName || "School OS");
  const [logoUrl, setLogoUrl] = useState<string | null>(initialSettings.logoUrl);
  const [subheader, setSubheader] = useState(initialSettings.subheader || "Management");
  const [footerText, setFooterText] = useState(initialSettings.footerText || "© 2006 Panchapon Getrat KP-school");
  const [lineChannelAccessToken, setLineChannelAccessToken] = useState(initialSettings.lineChannelAccessToken || "");
  const [lineTargetGroupId, setLineTargetGroupId] = useState(initialSettings.lineTargetGroupId || "");
  const [leaveRules, setLeaveRules] = useState(initialSettings.leaveRules || "");

  const [developerSecret, setDeveloperSecret] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingFooter, setIsSavingFooter] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    getSystemSettings().then((s) => {
      setSchoolName(s.schoolName || "School OS");
      setLogoUrl(s.logoUrl || null);
      setSubheader(s.subheader || "Management");
      setFooterText(s.footerText || "© 2006 Panchapon Getrat KP-school");
      setLineChannelAccessToken(s.lineChannelAccessToken || "");
      setLineTargetGroupId(s.lineTargetGroupId || "");
      setLeaveRules(s.leaveRules || "");
    }).catch(() => { });
  }, []);

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGeneral(true);
    try {
      await updateSystemSettings({ 
        schoolName, 
        subheader, 
        logoUrl: logoUrl || "", 
        lineChannelAccessToken, 
        lineTargetGroupId, 
        leaveRules 
      });
      triggerToast("💾 บันทึกสำเร็จ", "บันทึกการตั้งค่าเอกลักษณ์โรงเรียนเรียบร้อยแล้ว");
      addAuditLog("UPDATE_SYSTEM_SETTINGS", `แก้ไขเอกลักษณ์โรงเรียน: ${schoolName}`);
    } catch (error: any) {
      triggerToast("❌ เกิดข้อผิดพลาด", error?.message || "ไม่สามารถบันทึกได้");
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleFooterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFooter(true);
    try {
      await updateFooter({ footerText, developerSecret });
      triggerToast("💾 อัปเดตสำเร็จ", "อัปเดต Footer สำเร็จ");
      addAuditLog("UPDATE_FOOTER", "แก้ไขข้อความส่วนท้าย (Footer)");
      setDeveloperSecret(""); // Clear secret after success
    } catch (error: any) {
      triggerToast("❌ ข้อผิดพลาด", error.message === "Invalid Developer Secret" ? "รหัสลับนักพัฒนาไม่ถูกต้อง!" : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSavingFooter(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("logo", e.target.files[0]);

    try {
      const res = await uploadLogo(formData);
      if (res.success && res.url) {
        setLogoUrl(res.url);
        triggerToast("🖼️ อัปโหลดโลโก้สำเร็จ", "โปรดกดปุ่มบันทึกเพื่อบันทึกการตั้งค่าทั้งหมด");
      }
    } catch (error) {
      triggerToast("❌ อัปโหลดล้มเหลว", "ไม่สามารถอัปโหลดโลโก้ได้");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const backupString = await generateBackup();
      const blob = new Blob([backupString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `school-os-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast("📥 สำรองข้อมูลสำเร็จ", "ดาวน์โหลดไฟล์สำรองข้อมูลเรียบร้อยแล้ว");
      addAuditLog("EXPORT_BACKUP", "ดาวน์โหลดไฟล์สำรองระบบทั้งหมด");
    } catch (error) {
      triggerToast("❌ สำรองข้อมูลล้มเหลว", "เกิดข้อผิดพลาดขณะสร้างไฟล์สำรองข้อมูล");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("คำเตือน: การนำเข้าข้อมูลสำรองจะลบการตั้งค่าปัจจุบันและเขียนทับใหม่ทั้งหมด ต้องการดำเนินการต่อหรือไม่?")) {
      e.target.value = "";
      return;
    }

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonString = event.target?.result as string;
          const res = await importBackupFromJson(jsonString);
          if (res.success) {
            triggerToast("📤 นำเข้าข้อมูลสำเร็จ", "กู้คืนระบบจากการตั้งค่าจากไฟล์สำรองข้อมูลเรียบร้อยแล้ว");
            addAuditLog("IMPORT_BACKUP", "กู้คืนระบบจากไฟล์สำรองข้อมูล");
            window.location.reload();
          }
        } catch (err: any) {
          triggerToast("❌ นำเข้าข้อมูลล้มเหลว", err.message || "รูปแบบไฟล์ไม่ถูกต้อง");
        }
      };
      reader.readAsText(file);
    } catch (error) {
      triggerToast("❌ นำเข้าข้อมูลล้มเหลว", "เกิดข้อผิดพลาดในการอ่านไฟล์");
    } finally {
      setIsImporting(false);
    }
  };

  // Click tracking tracker
  useEffect(() => {
    if (typeof window !== "undefined" && activeMenu) {
      const key = `${activeMenu}-${activeSubTab || "dashboard"}`;
      const validKeys = [
        "Home-dashboard", "People-students", "People-teachers", "People-health",
        "Academic-attendance", "Academic-teaching", "Academic-assessment",
        "StudentCare-dashboard", "eleave-dashboard", "eleave-approvals",
        "eleave-form", "Admin-rules", "Analytics-risk"
      ];
      if (validKeys.includes(key)) {
        const clickCounts = JSON.parse(localStorage.getItem("shortcut_click_counts") || "{}");
        clickCounts[key] = (clickCounts[key] || 0) + 1;
        localStorage.setItem("shortcut_click_counts", JSON.stringify(clickCounts));
      }
    }
  }, [activeMenu, activeSubTab]);

  // Redirect to login if session is null
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Sync active view from URL search query on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const menu = params.get("menu");
      const tab = params.get("tab");
      if (menu) {
        setActiveMenu(menu);
        if (menu === "eleave" && tab) {
          setEleaveSubTab(tab as any);
          setEleaveExpanded(true);
        } else if (menu === "timetables" && tab) {
          setTimetableViewSubTab(tab);
        }
      }
    }
  }, []);

  // Core Data States
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [healthVisits, setHealthVisits] = useState<HealthVisit[]>(initialHealthVisits);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(initialAuditLogs);

  const [timetableSubTab, setTimetableSubTab] = useState<"scheduler" | "classrooms" | "subjects" | "substitutes">("scheduler");
  const [subjectsList, setSubjectsList] = useState([
    { id: "1", code: "ว31101", name: "วิทยาศาสตร์พื้นฐาน", credits: 1.5, hours: 3, color: "#3b82f6" },
    { id: "2", code: "ท31101", name: "ภาษาไทยพื้นฐาน", credits: 1.0, hours: 2, color: "#ef4444" },
    { id: "3", code: "ค31101", name: "คณิตศาสตร์พื้นฐาน", credits: 1.5, hours: 3, color: "#10b981" },
    { id: "4", code: "อ31101", name: "ภาษาอังกฤษพื้นฐาน", credits: 1.0, hours: 2, color: "#f59e0b" },
    { id: "5", code: "ส31101", name: "สังคมศึกษา", credits: 1.0, hours: 2, color: "#8b5cf6" },
  ]);
  const [classroomsList, setClassroomsList] = useState([
    { id: "1", name: "ม.1/1", grade: "ม.1", room: "1" },
    { id: "2", name: "ม.1/2", grade: "ม.1", room: "2" },
    { id: "3", name: "ม.4/1", grade: "ม.4", room: "1" },
    { id: "4", name: "ม.6/1", grade: "ม.6", room: "1" },
  ]);

  const [loadingDb, setLoadingDb] = useState(true);

  // Timetable Scheduler States
  const [viewMode, setViewMode] = useState<"classroom" | "teacher" | "room">("classroom");
  const [viewId, setViewId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [paletteTab, setPaletteTab] = useState<"workloads" | "subjects">("workloads");
  const [rooms, setRooms] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [workloads, setWorkloads] = useState<any[]>([]);

  // Attendance Mode State (homeroom vs subject)
  const [attendanceMode, setAttendanceMode] = useState<"homeroom" | "subject">("homeroom");

  // Subject Attendance States
  const [attDate, setAttDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [attClassroom, setAttClassroom] = useState<string>("");
  const [attSchedules, setAttSchedules] = useState<any[]>([]);
  const [attSelectedScheduleId, setAttSelectedScheduleId] = useState<string>("");
  const [attLoadingSchedules, setAttLoadingSchedules] = useState<boolean>(false);
  const [attSaving, setAttSaving] = useState<boolean>(false);
  const [attRecords, setAttRecords] = useState<Record<string, string>>({});

  // Fetch schedules when classroom or date changes
  useEffect(() => {
    async function loadSchedules() {
      if (!attClassroom || !attDate) {
        setAttSchedules([]);
        setAttSelectedScheduleId("");
        setAttRecords({});
        return;
      }

      setAttLoadingSchedules(true);
      setAttSelectedScheduleId("");
      setAttRecords({});

      try {
        const dateVal = new Date(attDate);
        const dayOfWeek = dateVal.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          setAttSchedules([]);
          setAttLoadingSchedules(false);
          return;
        }

        const res = await getClassroomSchedulesForDay(attClassroom, dayOfWeek);
        if (res.success && res.data) {
          setAttSchedules(res.data);
        } else {
          setAttSchedules([]);
          triggerToast("❌ ดึงข้อมูลตารางเรียนล้มเหลว", res.error || "เกิดข้อผิดพลาด");
        }
      } catch (err: any) {
        console.error(err);
        triggerToast("❌ ข้อผิดพลาด", err.message || "เกิดข้อผิดพลาด");
      } finally {
        setAttLoadingSchedules(false);
      }
    }

    loadSchedules();
  }, [attClassroom, attDate]);

  // Load attendance records when schedule is selected
  useEffect(() => {
    async function loadAttendance() {
      if (!attSelectedScheduleId || !attClassroom || !attDate) {
        return;
      }

      const schedule = attSchedules.find(s => s.id === attSelectedScheduleId);
      if (!schedule) return;

      try {
        const classroom = classroomsList.find(c => c.name === attClassroom);
        if (!classroom) return;

        const res = await getSubjectAttendance(
          classroom.id,
          schedule.subjectId,
          schedule.periodId,
          attDate
        );

        const classroomStudents = students.filter(s => s.classroom === attClassroom);
        const defaultRecords: Record<string, string> = {};
        classroomStudents.forEach(s => {
          defaultRecords[s.id] = "present";
        });

        if (res.success && res.data && res.data.records) {
          setAttRecords({
            ...defaultRecords,
            ...res.data.records
          });
        } else {
          setAttRecords(defaultRecords);
        }
      } catch (err: any) {
        console.error(err);
        triggerToast("❌ โหลดบันทึกเข้าเรียนล้มเหลว", err.message || "เกิดข้อผิดพลาด");
      }
    }

    loadAttendance();
  }, [attSelectedScheduleId, attClassroom, attDate, attSchedules, classroomsList, students]);

  const handleSaveSubjectAttendance = async () => {
    if (!attSelectedScheduleId || !attClassroom || !attDate) {
      triggerToast("⚠️ คำเตือน", "กรุณาเลือกข้อมูลให้ครบถ้วน");
      return;
    }

    const schedule = attSchedules.find(s => s.id === attSelectedScheduleId);
    if (!schedule) return;

    const classroom = classroomsList.find(c => c.name === attClassroom);
    if (!classroom) return;

    setAttSaving(true);
    try {
      const res = await saveSubjectAttendance(
        classroom.id,
        schedule.subjectId,
        schedule.periodId,
        attDate,
        attRecords
      );

      if (res.success) {
        triggerToast("💾 บันทึกเวลาเรียนสำเร็จ", `บันทึกข้อมูลวิชา ${schedule.subject.name} เรียบร้อยแล้ว`);
        addAuditLog("UPDATE_SUBJECT_ATTENDANCE", `บันทึกเวลาเรียน ห้อง ${attClassroom} คาบ ${schedule.period.name}`);
      } else {
        triggerToast("❌ บันทึกเวลาเรียนล้มเหลว", res.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast("❌ ข้อผิดพลาด", err.message || "เกิดข้อผิดพลาด");
    } finally {
      setAttSaving(false);
    }
  };

  const refreshDbData = async () => {
    try {
      const res = await getSystemInitialData();
      if (res.success && res.data) {
        if (res.data.teachers.length > 0) {
          setTeachers(res.data.teachers as any);
        }
        if (res.data.leaveRequests.length > 0) {
          setLeaveRequests(res.data.leaveRequests as any);
        }
        if (res.data.subjects.length > 0) {
          setSubjectsList(res.data.subjects);
        }
        if (res.data.classrooms.length > 0) {
          setClassroomsList(res.data.classrooms);
        }
        if ((res.data as any).students && (res.data as any).students.length > 0) {
          setStudents((res.data as any).students as any);
        }
        if (res.data.logs.length > 0) {
          setAuditLogs(res.data.logs as any);
        }
        if (res.data.periods && res.data.periods.length > 0) {
          setPeriods(res.data.periods);
        }
      }
    } catch (err) {
      console.error("Failed to load real DB data:", err);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoadingDb(true);
      await refreshDbData();
      try {
        const roomsRes = await getRooms();
        if (roomsRes.success && roomsRes.data) {
          setRooms(roomsRes.data);
        }
      } catch (err) {
        console.error("Failed to load rooms:", err);
      }
      setLoadingDb(false);
    }
    loadData();
  }, []);

  // Sync timetable viewId when viewMode changes
  useEffect(() => {
    if (viewMode === "classroom" && classroomsList.length > 0) {
      setViewId(classroomsList[0].id);
      setSelectedClassroomId(classroomsList[0].id);
    } else if (viewMode === "teacher" && teachers.length > 0) {
      setViewId(teachers[0].id);
      setSelectedTeacherId(teachers[0].id);
    } else if (viewMode === "room" && rooms.length > 0) {
      setViewId(rooms[0].id);
      setSelectedRoomId(rooms[0].id);
    } else {
      setViewId("");
    }
  }, [viewMode, classroomsList, teachers, rooms]);

  const handleDragStart = (e: React.DragEvent, sub: any) => {
    const isAdmin = role === "admin" || activeSession?.user?.email === "admin@school.os";
    if (!isAdmin) return;
    e.dataTransfer.setData("application/json", JSON.stringify({
      type: "subject",
      subjectId: sub.id,
      subjectCode: sub.code,
      roomId: selectedRoomId
    }));
  };

  const handleDragStartWorkload = (e: React.DragEvent, wl: any) => {
    const isAdmin = role === "admin" || activeSession?.user?.email === "admin@school.os";
    if (!isAdmin) return;
    e.dataTransfer.setData("application/json", JSON.stringify({
      type: "subject",
      subjectId: wl.subjectId,
      subjectCode: wl.subjectCode,
      roomId: wl.roomId || selectedRoomId,
      userId: wl.userId
    }));
  };

  const handleAddSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = fd.get("code") as string;
    const name = fd.get("name") as string;
    
    if (!code || !name) return;
    
    const res = await createSubject(fd);
    if (res.success) {
      addAuditLog("CREATE_SUBJECT", `เพิ่มรายวิชา: ${code} - ${name}`);
      triggerToast("📚 เพิ่มรายวิชาเรียบร้อย", `วิชา ${code} ${name} ได้รับการบันทึกลงฐานข้อมูลแล้ว`);
      e.currentTarget.reset();
      await refreshDbData();
    } else {
      triggerToast("⚠️ เกิดข้อผิดพลาด", res.error || "ไม่สามารถเพิ่มรายวิชาได้");
    }
  };

  const handleDeleteSubject = async (id: string, code: string) => {
    const res = await deleteSubject(id);
    if (res.success) {
      addAuditLog("DELETE_SUBJECT", `ลบรายวิชา ID ${id} (${code})`);
      triggerToast("🗑️ ลบรายวิชาสำเร็จ", `ถอนข้อมูลรายวิชาเรียบร้อยแล้ว`);
      await refreshDbData();
    } else {
      triggerToast("⚠️ เกิดข้อผิดพลาด", res.error || "ไม่สามารถลบรายวิชาได้");
    }
  };

  const handleAddClassroom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    
    if (!name) return;
    
    const res = await createClassroom(fd);
    if (res.success) {
      addAuditLog("CREATE_CLASSROOM", `เพิ่มชั้นเรียน: ${name}`);
      triggerToast("🏫 เพิ่มห้องเรียนเรียบร้อย", `ชั้นเรียน ${name} ได้รับการบันทึกลงฐานข้อมูลแล้ว`);
      e.currentTarget.reset();
      await refreshDbData();
    } else {
      triggerToast("⚠️ เกิดข้อผิดพลาด", res.error || "ไม่สามารถเพิ่มชั้นเรียนได้");
    }
  };

  const handleDeleteClassroom = async (id: string, name: string) => {
    const res = await deleteClassroom(id);
    if (res.success) {
      addAuditLog("DELETE_CLASSROOM", `ลบชั้นเรียน ID ${id} (${name})`);
      triggerToast("🗑️ ลบห้องเรียนสำเร็จ", `ถอนข้อมูลชั้นเรียนเรียบร้อยแล้ว`);
      await refreshDbData();
    } else {
      triggerToast("⚠️ เกิดข้อผิดพลาด", res.error || "ไม่สามารถลบชั้นเรียนได้");
    }
  };

  const mockSession = {
    user: {
      name: "ครูอัญชลี รัตนฯ",
      email: "anchalee@school.os",
      role: "TEACHER",
      position: "ครู",
      subjectGroup: "วิทยาศาสตร์และเทคโนโลยี"
    }
  };
  const activeSession = (session || mockSession) as any;

  // Sync role and route permissions from live Better Auth session or fallback
  useEffect(() => {
    if (activeSession?.user) {
      const u = activeSession.user as any;
      if (u.role === "ADMIN" || u.position === "แอดมิน") {
        setRole("admin");
      } else if (u.position === "ผู้บริหาร") {
        setRole("director");
      } else {
        setRole("teacher");
      }
    }
  }, [(activeSession?.user as any)?.id, (activeSession?.user as any)?.role, (activeSession?.user as any)?.position]);

  // Forms / Operations States
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastTitle, setToastTitle] = useState("");
  const [showLineAlert, setShowLineAlert] = useState(false);
  const [lineAlertData, setLineAlertData] = useState({ parent: "", message: "", student: "" });

  // Academic / Assessment states
  const [editScores, setEditScores] = useState<Record<string, number>>({
    "std-1": 85, "std-2": 72, "std-3": 45, "std-4": 90, "std-5": 65, "std-6": 88, "std-7": 82
  });
  const [sgsSyncProgress, setSgsSyncProgress] = useState<number | null>(null);

  // Request Form States
  const [leaveFormType, setLeaveFormType] = useState("ลากิจส่วนตัว");
  const [leaveFormReason, setLeaveFormReason] = useState("");
  const [leaveFormStart, setLeaveFormStart] = useState("");
  const [leaveFormEnd, setLeaveFormEnd] = useState("");
  const [isSyncingAttendance, setIsSyncingAttendance] = useState(false);

  // Health Center Form States
  const [healthName, setHealthName] = useState("นายธนพล รักเรียน");
  const [healthSymptoms, setHealthSymptoms] = useState("");
  const [healthMedicine, setHealthMedicine] = useState("");
  const [healthAction, setHealthAction] = useState("");

  // LINE Notification Form
  const [selectedLineStudentId, setSelectedLineStudentId] = useState("std-1");
  const [lineMsgContent, setLineMsgContent] = useState("เรียนผู้ปกครอง วันนี้นักเรียนตั้งใจเรียนในคาบภาษาไทยและช่วยเหลือเพื่อนๆ ดีมากครับ");

  // Rule Engine States
  const [ruleAbsenceEnabled, setRuleAbsenceEnabled] = useState(true);
  const [ruleSdqEnabled, setRuleSdqEnabled] = useState(true);

  // Toggle Dark Mode Class on Root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // System Helpers
  const triggerToast = (title: string, message: string) => {
    setToastTitle(title);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      actor: role === "teacher" ? "ครูอัญชลี รัตนโกสินทร์" : role === "director" ? "ผู้อำนวยการโรงเรียน" : role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "นักเรียน ม.6/1",
      action,
      module: activeMenu,
      details,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // 1. Attendance Change Logic
  const handleAttendanceChange = (studentId: string, status: Student["attendanceToday"]) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        // Trigger Automation Rule engine if absent
        if (status === "absent" && ruleAbsenceEnabled) {
          // Simulate absence count increase
          triggerToast("🚨 Rule Engine Triggered!", `ตรวจพบนักเรียนขาดเรียนสะสมเกิน 3 วัน -> กำลังส่งข้อความ LINE หาผู้ปกครอง`);
          triggerLineNotification(s.parentName, `แจ้งเตือนการขาดเรียน: ${s.fullName} ขาดเรียนติดต่อกันเกินกำหนด โปรดตรวจสอบหรือยื่นใบลาด้วยค่ะ`, s.fullName);
        }
        return { ...s, attendanceToday: status };
      }
      return s;
    }));
    const std = students.find(s => s.id === studentId);
    addAuditLog("UPDATE_ATTENDANCE", `บันทึกเช็คชื่อ ${std?.fullName} เป็น: ${status === "present" ? "มาเรียน" : status === "absent" ? "ขาดเรียน" : status === "late" ? "สาย" : status === "leave" ? "ลา" : "ป่วย"}`);
  };

  // 1.5 Sync Bulk Attendance to API Route Handler
  const syncBulkAttendance = async () => {
    setIsSyncingAttendance(true);
    addAuditLog("BULK_ATTENDANCE_SYNC", "เริ่มซิงค์ข้อมูลเช็คชื่อ ม.6/1 ผ่านระบบ API Gateway");
    
    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: s.attendanceToday,
        remarks: s.attendanceToday === "absent" ? "ขาดเรียนโฮมรูม" : ""
      }));

      const res = await fetch("/api/v1/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroom: "ม.6/1",
          date: new Date().toISOString().substring(0, 10),
          records
        })
      });

      const json = await res.json();
      if (json.success) {
        triggerToast("☁️ ซิงค์ Cloud API สำเร็จ!", `ส่งข้อมูล ${json.data.totalChecked} รายการเรียบร้อย (พบขาดเรียน ${json.data.absentCount} คน)`);
        
        // Push actual line notifications to parents of absent students
        const absents = students.filter(s => s.attendanceToday === "absent");
        absents.forEach(s => {
          triggerLineNotification(
            s.parentName, 
            `แจ้งเตือนความปลอดภัย: ลูกหลานของท่าน (${s.fullName}) ขาดการเข้าแถวโฮมรูมเช้านี้ โปรดติดต่อกลับครูประจำชั้นหากเป็นเหตุสุดวิสัยค่ะ`, 
            s.fullName
          );
        });
      } else {
        triggerToast("❌ ซิงค์ข้อมูลล้มเหลว", json.error?.message || "ไม่สามารถติดต่อ API Gateway ได้");
      }
    } catch (e: any) {
      triggerToast("📡 โหมด Offline: คิวงานรอซิงค์", "ระบบตรวจไม่พบการเชื่อมโยงสัญญาณเซิร์ฟเวอร์ -> บันทึกเข้าเครื่องแบบ Local Queue สำเร็จแล้ว");
    } finally {
      setIsSyncingAttendance(false);
    }
  };

  // 2. Submit Leave Request (Workflow Engine)
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveFormReason.trim() || !leaveFormStart) return;

    const newReq: LeaveRequest = {
      id: `req-${Date.now()}`,
      requesterName: role === "teacher" ? "ครูอัญชลี รัตนโกสินทร์" : "นายธนพล รักเรียน",
      requesterRole: role === "teacher" ? "ครูผู้สอน" : "นักเรียน",
      leaveType: leaveFormType,
      reason: leaveFormReason,
      startDate: leaveFormStart,
      endDate: leaveFormEnd || leaveFormStart,
      status: "PENDING",
      workflowSteps: [
        { step: 1, approver: "หัวหน้าฝ่าย / หัวหน้ากลุ่มสาระ", role: "Supervisor", decision: "APPROVED", decidedAt: new Date().toISOString().replace("T", " ").substring(0, 16) },
        { step: 2, approver: "รองผู้อำนวยการโรงเรียน", role: "Deputy Director", decision: "PENDING" },
        { step: 3, approver: "ผู้อำนวยการโรงเรียน", role: "Director", decision: "PENDING" }
      ]
    };

    setLeaveRequests(prev => [newReq, ...prev]);
    addAuditLog("CREATE_LEAVE_REQUEST", `ยื่นคำขออนุมัติใบลา: ${leaveFormType} ด้วยเหตุผล "${leaveFormReason}"`);
    triggerToast("📂 ยื่นใบลาสำเร็จ", `ส่งคำขอเข้าระบบ Workflow Engine อนุมัติแบบ 3 ขั้นเรียบร้อยแล้ว`);
    
    // Reset form
    setLeaveFormReason("");
    setLeaveFormStart("");
    setLeaveFormEnd("");
  };

  // 3. Workflow Engine Step Approvals
  const handleWorkflowApprove = (requestId: string, decision: "APPROVED" | "REJECTED") => {
    setLeaveRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const nextSteps = req.workflowSteps.map(step => {
          if (step.decision === "PENDING") {
            return { ...step, decision, decidedAt: new Date().toISOString().replace("T", " ").substring(0, 16) };
          }
          return step;
        });

        // Check if fully approved
        const allApproved = nextSteps.every(s => s.decision === "APPROVED");
        const anyRejected = nextSteps.some(s => s.decision === "REJECTED");
        
        let finalStatus: LeaveRequest["status"] = "PENDING";
        if (allApproved) finalStatus = "APPROVED";
        if (anyRejected) finalStatus = "REJECTED";

        if (allApproved) {
          triggerToast("✅ ใบลาอนุมัติสำเร็จ!", `เอกสารใบลาได้รับการลงนาม E-Signature ดิจิทัลเรียบร้อยแล้ว`);
        }

        return { ...req, status: finalStatus, workflowSteps: nextSteps };
      }
      return req;
    }));

    const targetReq = leaveRequests.find(r => r.id === requestId);
    addAuditLog("APPROVE_WORKFLOW", `ลงประชามติอนุมัติเอกสารใบลาของ ${targetReq?.requesterName}: ${decision}`);
  };

  // 4. Submit Health Center Visit Log
  const handleHealthVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthSymptoms.trim()) return;

    const newVisit: HealthVisit = {
      id: `h-${Date.now()}`,
      studentName: healthName,
      classroom: "ม.6/1",
      symptoms: healthSymptoms,
      medicineUsed: healthMedicine || "ไม่มี",
      actionTaken: healthAction || "ให้นอนพักห้องพยาบาล",
      visitTime: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    setHealthVisits(prev => [newVisit, ...prev]);
    addAuditLog("CREATE_HEALTH_LOG", `ลงทะเบียนดูแลอาการเจ็บป่วยของ ${healthName} อาการ: "${healthSymptoms}"`);
    triggerToast("🏥 บันทึกเรียบร้อย", `บันทึกประวัติการใช้ยาและการรักษาเข้าห้องพยาบาลสำเร็จ`);

    // Automation notification to parent
    const targetStudent = students.find(s => s.fullName === healthName);
    if (targetStudent) {
      triggerLineNotification(
        targetStudent.parentName, 
        `แจ้งข่าวสุขภาพจากห้องพยาบาล: บุตรหลานของท่าน (${targetStudent.fullName}) มาตรวจอาการด้วยอาการ ${healthSymptoms}. ได้รับการปฐมพยาบาล: ${newVisit.actionTaken}`, 
        targetStudent.fullName
      );
    }

    setHealthSymptoms("");
    setHealthMedicine("");
    setHealthAction("");
  };

  // 5. LINE API Integration Simulator
  const triggerLineNotification = (parentName: string, message: string, studentName: string) => {
    setLineAlertData({ parent: parentName, message, student: studentName });
    setShowLineAlert(true);

    // Also add to global notifications list
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `ส่ง LINE สำเร็จ: ${parentName}`,
      message,
      channel: "line",
      isRead: false,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16)
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleSendCustomLine = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === selectedLineStudentId);
    if (!student) return;

    triggerLineNotification(student.parentName, lineMsgContent, student.fullName);
    addAuditLog("SEND_LINE_API", `ส่งข้อความ LINE แจ้งเตือนตรงหาผู้ปกครองของ ${student.fullName}`);
    triggerToast("💬 LINE Messaging Sent", `ข้อความ API ส่งตรงถึง LINE ผู้ปกครองเรียบร้อยแล้ว`);
  };

  // 6. Assessment scoring sync
  const handleScoreChange = (studentId: string, score: number) => {
    setEditScores(prev => ({ ...prev, [studentId]: score }));
  };

  const syncScoresToSgs = () => {
    setSgsSyncProgress(0);
    addAuditLog("SYNC_SGS_API", `เริ่มกระบวนการซิงค์เกรด ปพ.5 เข้าสู่ระบบ SGS กระทรวงศึกษาธิการ`);
    
    const interval = setInterval(() => {
      setSgsSyncProgress(prev => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          triggerToast("⚡ SGS Sync Completed!", `ข้อมูลผลคะแนนดิบและตัดเกรด ปพ.5 ซิงค์เข้า Server SGS ปลายทางสำเร็จ 100%`);
          addAuditLog("SYNC_SGS_API_SUCCESS", `ซิงค์เกรดสำเร็จ ดึงเลขลงทะเบียนเอกสาร ปพ.5 ดิจิทัลเรียบร้อย`);
          return null;
        }
        return prev + 20;
      });
    }, 400);
  };

  // 7. Dynamic navigation from other panels
  const navigateTo = (menu: string, tab: string = "dashboard") => {
    setActiveMenu(menu);
    setActiveSubTab(tab);
    addAuditLog("NAVIGATE", `เปิดหน้า: ${menu} -> ${tab}`);
  };

  // Calculate stats for Analytics view
  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  const sidebarMainItems = [
    { name: "Home", icon: Home, label: lang === "th" ? "แดชบอร์ด" : "Dashboard" },
    { name: "People", icon: Users, label: lang === "th" ? "ฐานข้อมูลคน" : "People" },
    { name: "Academic", icon: BookOpen, label: lang === "th" ? "วิชาการ" : "Academics" },
    { name: "timetables", icon: Calendar, label: lang === "th" ? "จัดตารางสอน" : "Timetables" },
    { name: "StudentCare", icon: Heart, label: lang === "th" ? "เยี่ยมบ้าน นร.01" : "Home Visit" },
    { name: "Operations", icon: Settings, label: lang === "th" ? "ดำเนินงาน" : "Operations" },
    { name: "Engagement", icon: MessageSquare, label: lang === "th" ? "สื่อสาร" : "Engagement" },
    { name: "Reports", icon: FileText, label: lang === "th" ? "รายงาน" : "Reports" },
    { name: "eleave", icon: FileText, label: lang === "th" ? "ระบบการลา (e-Leave)" : "e-Leave System", isExpandable: true },
    { name: "Profile", icon: UserCircle, label: lang === "th" ? "โปรไฟล์ของฉัน" : "My Profile" },
  ];
  const sidebarAdminItems = [
    { name: "Analytics", icon: BarChart3, label: lang === "th" ? "วิเคราะห์ & AI" : "AI Analytics" },
    { name: "Admin", icon: ShieldAlert, label: lang === "th" ? "ตั้งค่าระบบ" : "Settings" },
  ];
  const isApprover = role === "admin" || role === "director";

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FB] dark:bg-slate-900 relative overflow-hidden p-4">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes loadingProgress {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0); }
            100% { transform: translateX(100%); }
          }
          .animate-loading-bar {
            animation: loadingProgress 1.5s ease-in-out infinite;
          }
        `}} />
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/40 dark:bg-purple-800/20 blur-[80px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/40 dark:bg-indigo-800/20 blur-[80px]" />
        </div>

        <div className="flex flex-col items-center max-w-sm w-full text-center space-y-6 relative z-10 animate-in fade-in zoom-in duration-500">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-24 h-24 rounded-3xl object-cover shadow-2xl border border-white/20 mb-2" />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-2">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          )}
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{schoolName || "School OS"}</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{subheader || "Management System"}</p>
          </div>

          <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 rounded-full w-full animate-loading-bar absolute left-0 top-0 origin-left" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={`flex-1 flex overflow-hidden min-h-screen bg-background relative text-foreground ${lang === 'th' ? 'font-th' : 'font-en'}`}>
      
      {/* 🚀 COLLAPSIBLE DESKTOP SIDEBAR — Dark Gradient */}
      <aside 
        className={`hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto sidebar-dark border-r border-white/[0.06] transition-all duration-300 z-20 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.15)] justify-between py-5 ${
          sidebarOpen ? "w-[238px]" : "w-16 px-1"
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-4 w-full shrink-0 md:justify-start justify-center">
          {logoUrl ? (
            <img 
              onClick={() => {
                setActiveMenu("Home");
                setActiveSubTab("dashboard");
              }}
              src={logoUrl} 
              alt="Logo" 
              className="w-10 h-10 rounded-2xl object-cover hover:scale-105 transition-all cursor-pointer shadow-lg shrink-0" 
            />
          ) : (
            <div 
              onClick={() => {
                setActiveMenu("Home");
                setActiveSubTab("dashboard");
              }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl hover:scale-105 transition-all cursor-pointer shadow-lg shadow-indigo-500/20 shrink-0"
              title="SchoolOS Portal"
            >
              {schoolName ? schoolName.charAt(0) : "S"}
            </div>
          )}
          {sidebarOpen && (
            <div className="flex flex-col animate-in fade-in duration-200 min-w-0">
              <span className="font-extrabold text-sm text-white/95 leading-none truncate">{schoolName || "School OS"}</span>
              <span className="text-[9px] text-white/40 font-bold uppercase mt-1 tracking-wider truncate">{subheader || "Management"}</span>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 flex flex-col gap-1 items-stretch w-full mt-6 overflow-y-auto custom-scrollbar px-2">
          {(() => {
            const getSubTabs = (menuName: string) => {
              switch (menuName) {
                case "People":
                  return [
                    { key: "students", label: lang === "th" ? "ฐานข้อมูลนักเรียน" : "Students Database" },
                    { key: "teachers", label: lang === "th" ? "รายชื่อครูอาจารย์" : "Teachers List" },
                    { key: "health", label: lang === "th" ? "ห้องพยาบาล" : "Health Center" }
                  ];
                case "Academic":
                  return [
                    { key: "attendance", label: lang === "th" ? "เช็คชื่อเข้าแถว/คาบ" : "Attendance Tracker" },
                    { key: "teaching", label: lang === "th" ? "ตารางจัดการสอน" : "Teaching Scheduler" },
                    { key: "assessment", label: lang === "th" ? "ลงคะแนน ปพ.5" : "Assessment Sheet" }
                  ];
                case "eleave":
                  return [
                    { key: "dashboard", label: lang === "th" ? "ภาพรวมการลา" : "e-Leave Dashboard" },
                    { key: "form", label: lang === "th" ? "เขียนใบลา" : "Request Leave" },
                    { key: "history", label: lang === "th" ? "ประวัติการลา" : "Leave History" },
                    ...(isApprover ? [{ key: "approvals", label: lang === "th" ? "พิจารณาอนุมัติใบลา" : "Leave Approvals" }] : []),
                    ...(role === "admin" ? [
                      { key: "logs", label: lang === "th" ? "ประวัติระบบ" : "System Logs" },
                      { key: "reports", label: lang === "th" ? "รายงานการลา" : "Leave Reports" },
                      { key: "settings", label: lang === "th" ? "ตั้งค่าระบบการลา" : "Leave Settings" }
                    ] : [])
                  ];
                case "timetables":
                  return [
                    { key: "dashboard", label: lang === "th" ? "ภาพรวมตารางสอน" : "Timetable Dashboard" },
                    { key: "schedule", label: lang === "th" ? "จัดตารางสอน" : "Scheduler Grid" },
                    { key: "curriculums", label: lang === "th" ? "หลักสูตร" : "Curriculums" },
                    { key: "workloads", label: lang === "th" ? "ภาระงานสอน" : "Workloads" },
                    { key: "activities", label: lang === "th" ? "กิจกรรม/บล็อกคาบ" : "Activities" },
                    { key: "teachers", label: lang === "th" ? "ครูผู้สอน" : "Teachers" },
                    { key: "classrooms", label: lang === "th" ? "ชั้นเรียน" : "Classrooms" },
                    { key: "rooms", label: lang === "th" ? "ห้องเรียน" : "Rooms" },
                    { key: "substitutes", label: lang === "th" ? "สอนแทน" : "Substitutes" },
                    { key: "periods", label: lang === "th" ? "คาบเรียน" : "Periods" },
                    ...(role === "admin" ? [
                      { key: "settings", label: lang === "th" ? "ตั้งค่าสิทธิ์" : "Timetable Settings" },
                      { key: "backups", label: lang === "th" ? "สำรองข้อมูล" : "Backups" }
                    ] : [])
                  ];
                case "Operations":
                  return [
                    { key: "documents", label: lang === "th" ? "รับส่งหนังสือราชการ" : "E-Signature Memo" },
                    { key: "maintenance", label: lang === "th" ? "แจ้งซ่อม & ICT" : "Maintenance / ICT" }
                  ];
                case "Admin":
                  return [
                    { key: "rules", label: lang === "th" ? "กติกาอัตโนมัติ" : "Rule Engine" },
                    { key: "logs", label: lang === "th" ? "ประวัติ Audit Log" : "Audit Logs" },
                    { key: "system", label: lang === "th" ? "ตั้งค่าระบบใหญ่" : "Global Settings" }
                  ];
                default:
                  return [];
              }
            };

            const renderNavItem = (item: any) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.name || (item.name === "eleave" && activeMenu === "eleave");
              const subtabs = getSubTabs(item.name);
              const hasSubtabs = subtabs.length > 0;
              const isFloatingOpen = activeFloatingMenu === item.name;

              return (
                <div key={item.name} className="relative w-full group">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.name === "eleave") {
                        setActiveMenu(item.name);
                        setEleaveSubTab("dashboard");
                        addAuditLog("SIDEBAR_CLICK", `คลิกเมนูหลัก: ${item.label}`);
                        return;
                      }
                      if (item.name === "timetables") {
                        setActiveMenu(item.name);
                        setTimetableViewSubTab("dashboard");
                        addAuditLog("SIDEBAR_CLICK", `คลิกเมนูหลัก: ${item.label}`);
                        return;
                      }
                      if (!sidebarOpen && hasSubtabs) {
                        setActiveFloatingMenu(isFloatingOpen ? null : item.name);
                      } else {
                        setActiveMenu(item.name);
                        if (item.name === "Home") setActiveSubTab("dashboard");
                        else if (item.name === "People") setActiveSubTab("students");
                        else if (item.name === "Academic") setActiveSubTab("attendance");
                        else if (item.name === "StudentCare") setActiveSubTab("dashboard");
                        else if (item.name === "Engagement") setActiveSubTab("line");
                        else if (item.name === "Reports") setActiveSubTab("default");
                        else if (item.name === "Operations") setActiveSubTab("documents");
                        addAuditLog("SIDEBAR_CLICK", `คลิกเมนูหลัก: ${item.label}`);
                      }
                    }}
                    className={`w-full flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 ease-out cursor-pointer ${
                      sidebarOpen ? "px-4 justify-start" : "justify-center h-11 w-11 mx-auto"
                    } ${
                      isActive
                        ? "glow-active text-white font-bold"
                        : "text-white/50 hover:text-white/90 hover:bg-white/[0.05]"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {sidebarOpen && <span className="text-xs font-extrabold animate-in fade-in duration-200">{item.label}</span>}
                  </button>

                  {/* Collapsed Tooltip */}
                  {!sidebarOpen && !isFloatingOpen && (
                    <span className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap shadow-md z-50">
                      {item.label}
                    </span>
                  )}

                  {/* Expanded Accordion List */}
                  {sidebarOpen && isActive && hasSubtabs && (
                    <div className="pl-9 pr-2 flex flex-col gap-1 mt-1.5 border-l border-white/10 ml-6 animate-in fade-in duration-200">
                      {subtabs.map(sub => {
                        const isSubActive = activeSubTab === sub.key || (item.name === "eleave" && eleaveSubTab === sub.key) || (item.name === "timetables" && timetableViewSubTab === sub.key);
                        return (
                          <button
                            key={sub.key}
                            onClick={() => {
                              setActiveMenu(item.name);
                              if (item.name === "eleave") {
                                setEleaveSubTab(sub.key as any);
                              } else if (item.name === "timetables") {
                                setTimetableViewSubTab(sub.key);
                              } else {
                                setActiveSubTab(sub.key);
                              }
                            }}
                            className={`text-left text-[11px] py-1 px-2 rounded-lg font-bold transition-all duration-200 ease-out cursor-pointer ${
                              isSubActive 
                                ? "text-indigo-300 bg-indigo-500/10" 
                                : "text-white/35 hover:text-white/70"
                            }`}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Collapsed Floating Popover Submenu */}
                  {!sidebarOpen && isFloatingOpen && hasSubtabs && (
                    <div className="absolute left-14 top-0 ml-2 z-50 w-52 bg-[#1A2333] border border-white/10 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1.5 animate-in fade-in slide-in-from-left-2 duration-150">
                      <div className="flex justify-between items-center pb-1 border-b border-white/10 px-1">
                        <span className="text-[10px] text-white/40 font-extrabold uppercase">
                          {item.label}
                        </span>
                        <X 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFloatingMenu(null);
                          }}
                          className="w-3.5 h-3.5 text-white/40 hover:text-white cursor-pointer"
                        />
                      </div>
                      {subtabs.map(sub => (
                        <button
                          key={sub.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(item.name);
                            if (item.name === "eleave") {
                              setEleaveSubTab(sub.key as any);
                            } else if (item.name === "timetables") {
                              setTimetableViewSubTab(sub.key);
                            } else {
                              setActiveSubTab(sub.key);
                            }
                            setActiveFloatingMenu(null);
                          }}
                          className="text-left text-xs py-1.5 px-2.5 rounded-lg font-bold text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-200 ease-out cursor-pointer"
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <>
                {sidebarMainItems.map(renderNavItem)}
                <div className="w-8 h-px bg-white/10 my-2 shrink-0 mx-auto" />
                {sidebarAdminItems.map(renderNavItem)}
              </>
            );
          })()}
        </nav>

        {/* Footer Area with Logout */}
        <div className="pt-4 border-t border-white/[0.06] shrink-0 w-full flex flex-col items-center gap-3">
          <div className="relative group flex justify-center w-full">
            <button
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              className={`rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white flex items-center justify-center transition-all duration-200 ease-out cursor-pointer ${
                sidebarOpen ? "w-[85%] py-2.5 gap-2 px-4" : "w-11 h-11"
              }`}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="text-xs font-bold">{lang === "th" ? "ออกจากระบบ" : "Sign Out"}</span>}
            </button>
            {!sidebarOpen && (
              <span className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-rose-600 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap shadow-md z-50">
                {lang === "th" ? "ออกจากระบบ" : "Sign Out"}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* top header bar */}
        <header className="z-10 shrink-0 mt-4 mx-6 relative">
          <div className="rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.015)] border border-slate-200/40 dark:border-slate-800/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-5 py-2.5 flex justify-between items-center transition-colors duration-300">
            
            {/* Left Side: Sidebar Toggle + Greeting / Mockup Icons */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setMobileSidebarOpen(prev => !prev);
                  } else {
                    setSidebarOpen(prev => !prev);
                  }
                }}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 hover:text-foreground transition-all cursor-pointer flex items-center justify-center"
                title="เปิด/ปิดเมนูด้านข้าง"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Mockup Quick Icons on desktop */}
              <div className="hidden md:flex items-center gap-3.5 text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-800 pl-4">
                <Mail className="w-4.5 h-4.5 cursor-pointer hover:text-indigo-600 transition-colors" />
                <MessageSquare className="w-4.5 h-4.5 cursor-pointer hover:text-indigo-600 transition-colors" />
                <Calendar className="w-4.5 h-4.5 cursor-pointer hover:text-indigo-600 transition-colors" />
                <CheckSquare className="w-4.5 h-4.5 cursor-pointer hover:text-indigo-600 transition-colors" />
                <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400 cursor-pointer" />
              </div>
            </div>

            {/* Right Side: Language Switcher, Search, Theme, Notifications & Profile */}
            <div className="flex items-center gap-3">
              
              {/* Language Switcher Pill */}
              <button 
                onClick={() => {
                  const newLang = lang === "th" ? "en" : "th";
                  setLang(newLang);
                  addAuditLog("SWITCH_LANGUAGE", `เปลี่ยนภาษาอินเตอร์เฟสเป็น: ${newLang === "th" ? "ภาษาไทย" : "English"}`);
                  triggerToast(
                    newLang === "th" ? "🇹🇭 เปลี่ยนเป็นภาษาไทย" : "🇬🇧 Switched to English",
                    newLang === "th" ? "เปลี่ยนการแสดงผลเป็นภาษาไทยเรียบร้อยแล้ว" : "Application language is now English."
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-lg cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/50 text-[11px] font-bold text-slate-650 dark:text-slate-350 transition-all"
              >
                <span>{lang === "th" ? "🇹🇭 TH" : "🇬🇧 EN"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Theme Toggle & Search Icons */}
              <div className="flex items-center gap-1 text-slate-400">
                <button 
                  onClick={() => setDarkMode(prev => !prev)}
                  className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
                </button>
                <button 
                  onClick={() => setSearchOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  <Search className="w-4 h-4" />
                </button>
                <div className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer relative">
                  <Bell className="w-4.5 h-4.5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full border border-white dark:border-slate-900" />
                  )}
                </div>
              </div>

              {/* Role swapper dropdown */}
              <div className="hidden sm:flex items-center">
                <select
                  className="h-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 outline-none text-[10px] font-bold text-slate-650 dark:text-muted-foreground px-2 py-1 rounded-lg cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/50"
                  value={role}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    setRole(newRole);
                    addAuditLog("SWITCH_ROLE", `สลับบทบาทการใช้งานของท่านไปเป็น: ${newRole}`);
                    triggerToast("🔄 สลับบทบาทเรียบร้อย", `ขณะนี้คุณกำลังใช้งานระบบในบทบาท: ${newRole === "teacher" ? "ครูผู้สอน" : newRole === "director" ? "ผู้อำนวยการ" : newRole === "admin" ? "ผู้ดูแลระบบ" : "นักเรียน"}`);
                  }}
                >
                  <option value="teacher">{lang === "th" ? "ครูผู้สอน" : "Teacher"}</option>
                  <option value="director">{lang === "th" ? "ผอ. โรงเรียน" : "Director"}</option>
                  <option value="student">{lang === "th" ? "นักเรียน / ผู้ปกครอง" : "Student"}</option>
                  <option value="admin">{lang === "th" ? "ผู้ดูแลระบบ (Admin)" : "System Admin"}</option>
                </select>
              </div>

              {/* User Profile dropdown */}
              {activeSession?.user && (
                <div className="flex items-center gap-2.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                  <div className="text-right hidden md:block">
                    <p className="text-[11px] font-extrabold text-slate-800 dark:text-white leading-tight">
                      {activeSession.user.name}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold tracking-wider leading-tight mt-0.5 uppercase">
                      {role === "admin" ? (lang === "th" ? "แอดมิน" : "Admin") : role === "director" ? (lang === "th" ? "ผู้บริหาร" : "Director") : (lang === "th" ? "อาจารย์" : "Teacher")}
                    </p>
                  </div>
                  <div 
                    onClick={() => {
                      setActiveMenu("Profile");
                      addAuditLog("HEADER_CLICK", "คลิกโปรไฟล์จากปุ่มรูปภาพ");
                    }}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-[10px] cursor-pointer shadow-sm hover:scale-105 transition-all overflow-hidden"
                  >
                    {activeSession.user.image ? (
                      <img src={activeSession.user.image} alt={activeSession.user.name || "User"} className="w-full h-full object-cover" />
                    ) : (
                      activeSession.user.name ? activeSession.user.name.charAt(0).toUpperCase() : "U"
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>
        </header>

        
        {/* 💻 SECONDARY SUB-MENU TABS & VIEWS */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          
          {/* ==================== 1. HOME VIEW ==================== */}
          {activeMenu === "Home" && (
            <div className="space-y-4">
              {/* Compact Welcome Hero with gradient mesh */}
              <div className="glass-card p-4 relative overflow-hidden">
                {/* Subtle gradient mesh background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{background: 'radial-gradient(ellipse at 20% 50%, #6366F1 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #38BDF8 0%, transparent 50%)'}} />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                      <Sparkles className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground leading-tight">
                        {lang === "th" ? "สวัสดีครับ, ยินดีต้อนรับกลับ" : "Welcome back"}
                      </h2>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {lang === "th" ? "ข้อมูลล่าสุด" : "Last updated"}: <span className="font-semibold" suppressHydrationWarning>{new Date().toLocaleTimeString()}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                    {/* Live status badge */}
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-status-pulse" />
                      {lang === "th" ? "ระบบทำงานปกติ" : "All systems operational"}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/15 capitalize">
                      {role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Renders dynamic role based dashboards */}
              <SmartDashboard 
                role={role}
                lang={lang}
                students={students}
                leaveRequests={leaveRequests}
                onNavigate={navigateTo}
                onSelectStudent={(s) => {
                  setSelectedStudent(s);
                  setTimelineOpen(true);
                }}
                onApproveRequest={handleWorkflowApprove}
                notificationsCount={unreadNotifCount}
                userName={activeSession?.user?.name}
              />
            </div>
          )}

          {/* ==================== 2. PEOPLE VIEW ==================== */}
          {activeMenu === "People" && (
            <div className="space-y-4">
              {/* Secondary Navigation SubTabs */}
              <div className="flex border-b border-border/80">
                <button 
                  onClick={() => setActiveSubTab("students")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "students" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  ฐานข้อมูลนักเรียน (Students)
                </button>
                <button 
                  onClick={() => setActiveSubTab("teachers")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "teachers" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  รายชื่อครูและบุคลากร (Teachers)
                </button>
                <button 
                  onClick={() => setActiveSubTab("health")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "health" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  ห้องพยาบาลโรงเรียน (Health Center)
                </button>
              </div>

              {/* SubTab 1: Students Grid */}
              {activeSubTab === "students" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <h3 className="text-sm font-bold text-foreground">รายชื่อนักเรียนในปกครองของท่าน (ชั้น ม.6/1)</h3>
                    <span className="text-xs text-muted-foreground">คลิกรายชื่อเพื่อเปิดใช้งาน <b>Timeline Engine</b> ดึงประวัตินักเรียนย้อนหลัง</span>
                  </div>

                  <div className="p-6 rounded-2xl glass glass-card overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border/80 text-muted-foreground uppercase font-bold">
                            <th className="py-3 px-4 text-center">{lang === "th" ? "เลขที่" : "No."}</th>
                            <th className="py-3 px-4">{lang === "th" ? "รูปถ่าย" : "Photo"}</th>
                            <th className="py-3 px-4">{lang === "th" ? "ชื่อ-นามสกุล" : "Student Name"}</th>
                            <th className="py-3 px-4">{lang === "th" ? "เลขประจำตัว" : "Student ID"}</th>
                            <th className="py-3 px-4 text-center">{lang === "th" ? "คะแนนพฤติกรรม" : "Conduct Points"}</th>
                            <th className="py-3 px-4 text-center">{lang === "th" ? "คัดกรอง SDQ" : "SDQ Screening"}</th>
                            <th className="py-3 px-4 text-center">{lang === "th" ? "เยี่ยมบ้าน" : "Home Visit"}</th>
                            <th className="py-3 px-4 text-right">{lang === "th" ? "การจัดการ" : "Action"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-semibold text-foreground">
                          {students.map((student) => {
                            const isVisited = student.homeVisited;
                            return (
                              <tr 
                                key={student.id} 
                                className="hover:bg-muted/30 transition-all cursor-pointer"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setIsDetailModalOpen(true);
                                  addAuditLog("VIEW_STUDENT_DETAILS", `เปิดดูข้อมูลเชิงลึกของ ${student.fullName}`);
                                }}
                              >
                                <td className="py-3 px-4 text-center text-muted-foreground font-mono">{student.seatNumber || "-"}</td>
                                <td className="py-3 px-4">
                                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                                    {student.profileImage || student.profile?.profileImage ? (
                                      <img 
                                        src={student.profileImage || student.profile?.profileImage} 
                                        alt={student.fullName} 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-650 flex items-center justify-center text-white font-extrabold text-[9px] select-none">
                                        {student.nickname || student.fullName.slice(3, 5)}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-850 dark:text-white">{student.fullName}</span>
                                    {student.nickname && (
                                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                        {student.nickname}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{student.studentCode}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    student.behaviorPoints >= 80 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                                  }`}>
                                    {student.behaviorPoints} / 100
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                    student.sdqRisk === "ปกติ" 
                                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                      : student.sdqRisk === "เสี่ยง" 
                                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                                      : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                  }`}>
                                    {student.sdqRisk || "ยังไม่ประเมิน"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                    isVisited 
                                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  }`}>
                                    {isVisited ? (lang === "th" ? "เยี่ยมแล้ว" : "Visited") : (lang === "th" ? "ยังไม่ได้เยี่ยม" : "Pending")}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      setSelectedStudent(student);
                                      setTimelineOpen(true);
                                      addAuditLog("VIEW_STUDENT_TIMELINE", `เปิดดูพฤติกรรม Timeline ของ ${student.fullName}`);
                                    }}
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-550 dark:text-slate-350 text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    {lang === "th" ? "พฤติกรรม" : "Timeline"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedStudent(student);
                                      setIsDetailModalOpen(true);
                                      addAuditLog("VIEW_STUDENT_DETAILS", `เปิดดูข้อมูลเชิงลึกของ ${student.fullName}`);
                                    }}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                                  >
                                    {lang === "th" ? "ดูข้อมูลเชิงลึก" : "Profile"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SubTab 2: Teachers List */}
              {activeSubTab === "teachers" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-6 rounded-2xl glass glass-card space-y-4">
                    <h3 className="text-sm font-bold text-foreground">ทะเบียนข้อมูลบุคลากรครู</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border/80 text-muted-foreground uppercase font-bold">
                            <th className="py-2.5">รหัสบุคลากร</th>
                            <th className="py-2.5">ชื่อ-นามสกุล</th>
                            <th className="py-2.5">ตำแหน่ง</th>
                            <th className="py-2.5">กลุ่มสาระการเรียนรู้</th>
                            <th className="py-2.5">เลขที่ใบอนุญาต</th>
                            <th className="py-2.5">วันเวรประจำสัปดาห์</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-semibold text-foreground">
                          {teachers.map((t) => (
                            <tr key={t.id} className="hover:bg-muted/30">
                              <td className="py-3 font-mono">{t.employeeCode}</td>
                              <td className="py-3">{t.fullName}</td>
                              <td className="py-3">{t.position}</td>
                              <td className="py-3">{t.department}</td>
                              <td className="py-3 font-mono">{t.licenseNumber}</td>
                              <td className="py-3 text-primary dark:text-indigo-400">{t.dutyDay}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SubTab 3: Health Center Dashboard */}
              {activeSubTab === "health" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  {/* Log new visit form */}
                  <div className="p-6 rounded-2xl glass glass-card space-y-4 h-fit">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-emerald-500" />
                      บันทึกการเข้ารับการรักษาพยาบาล
                    </h3>
                    <form onSubmit={handleHealthVisitSubmit} className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">เลือกนักเรียนที่มารักษา</label>
                        <select 
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold"
                          value={healthName}
                          onChange={(e) => setHealthName(e.target.value)}
                        >
                          {students.map(s => (
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
                  <div className="lg:col-span-2 p-6 rounded-2xl glass glass-card space-y-4">
                    <h3 className="text-sm font-bold text-foreground">สมุดบันทึกประวัติห้องพยาบาลประจำวันนี้</h3>
                    <div className="space-y-3">
                      {healthVisits.map((visit) => (
                        <div key={visit.id} className="p-4 rounded-xl border border-border bg-card flex justify-between items-start gap-4">
                          <div className="space-y-1.5">
                            <span className="text-[9px] px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">{visit.visitTime}</span>
                            <h4 className="font-bold text-sm text-foreground">{visit.studentName} <span className="text-xs text-muted-foreground">({visit.classroom})</span></h4>
                            <p className="text-xs text-muted-foreground leading-normal">
                              <b>อาการ:</b> {visit.symptoms} • <b>ยาที่รับ:</b> {visit.medicineUsed}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <b>การแก้ไข:</b> {visit.actionTaken}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 3. ACADEMIC VIEW ==================== */}
          {activeMenu === "Academic" && (
            <div className="space-y-4">
              <div className="flex border-b border-border/80">
                <button 
                  onClick={() => setActiveSubTab("attendance")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "attendance" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  บันทึกเช็คชื่อ (Attendance Tracker)
                </button>
                <button 
                  onClick={() => setActiveSubTab("teaching")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "teaching" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  ตารางจัดการสอน (Teaching & AI Scheduler)
                </button>
                <button 
                  onClick={() => setActiveSubTab("assessment")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "assessment" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  ลงคะแนน ปพ.5 & ซิงค์ SGS (Assessment)
                </button>
                <button 
                  onClick={() => setActiveSubTab("calendar")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "calendar" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  ปฏิทินวิชาการ (Academic Calendar)
                </button>
              </div>

              {/* SubTab 1: Interactive Attendance check in */}
              {activeSubTab === "attendance" && (
                <div className="p-6 rounded-2xl glass glass-card space-y-6 animate-in fade-in duration-200">
                  {/* Mode Selector Toggle */}
                  <div className="flex justify-between items-center border-b border-border/80 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {attendanceMode === "homeroom" 
                          ? "เช็คชื่อโฮมรูมประจำวัน (Advisory Homeroom Daily Roll Call)" 
                          : "บันทึกเวลาเรียนรายวิชา (Subject Attendance Tracker)"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {attendanceMode === "homeroom" 
                          ? "ลงบันทึกเวลาเช็คชื่อเข้าแถวตอนเช้าของห้องเรียนที่ปรึกษา" 
                          : "เลือกห้องเรียน วันที่ และคาบวิชาเพื่อลงบันทึกเวลาเข้าเรียนตามตารางสอนจริง"}
                      </p>
                    </div>
                    <div className="flex bg-muted/65 p-1 rounded-xl border border-border/80">
                      <button
                        type="button"
                        onClick={() => {
                          setAttendanceMode("homeroom");
                          addAuditLog("SWITCH_ATTENDANCE_MODE", "สลับเป็นโหมดเช็คชื่อโฮมรูม");
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          attendanceMode === "homeroom"
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        โฮมรูม (Homeroom)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAttendanceMode("subject");
                          addAuditLog("SWITCH_ATTENDANCE_MODE", "สลับเป็นโหมดเช็คชื่อรายวิชา");
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          attendanceMode === "subject"
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        รายคาบวิชา (Subject)
                      </button>
                    </div>
                  </div>

                  {attendanceMode === "homeroom" ? (
                    /* HOMEROOM ROLL CALL MODE */
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 dark:text-muted-foreground block">เลือกวันที่บันทึก</label>
                          <input 
                            type="date"
                            value={attDate}
                            onChange={(e) => setAttDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 dark:text-muted-foreground block">ห้องที่ปรึกษา (Advisory Class)</label>
                          <div className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-250 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400">
                            {activeSession.user.advisoryClass || activeSession.user.classroom || "ม.6/1"}
                          </div>
                        </div>
                      </div>

                      {/* Warnings & Feedback */}
                      {(() => {
                        const jsDay = new Date(attDate).getDay();
                        if (jsDay === 0 || jsDay === 6) {
                          return (
                            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2">
                              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              ไม่สามารถลงเวลาเรียนในวันเสาร์-อาทิตย์ได้
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Homeroom Roll Call List */}
                      {(() => {
                        const advClass = activeSession.user.advisoryClass || activeSession.user.classroom || "ม.6/1";
                        const classStudents = students.filter(s => s.classroom === advClass);
                        
                        return (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-extrabold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">
                                รายชื่อนักเรียนห้อง {advClass} ({classStudents.length} คน)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated: Record<string, string> = {};
                                  classStudents.forEach(s => {
                                    updated[s.id] = "present";
                                  });
                                  setAttRecords(updated);
                                  triggerToast("👍 เช็คชื่อโฮมรูมมาเรียนทั้งหมด", "ตั้งค่าให้นักเรียนทั้งหมดมีสถานะ มาเรียน");
                                }}
                                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg hover:bg-indigo-100 transition-all cursor-pointer"
                              >
                                โฮมรูมครบทุกคน
                              </button>
                            </div>

                            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                              {classStudents.length === 0 ? (
                                <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
                                  ไม่พบข้อมูลนักเรียนในห้องเรียนที่ปรึกษานี้
                                </div>
                              ) : (
                                classStudents.map((student) => {
                                  const currentStatus = attRecords[student.id] || "present";
                                  const safeAvatar = student.nickname || student.fullName.trim().charAt(0);
                                  return (
                                    <div 
                                      key={student.id} 
                                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card hover:border-indigo-200 dark:hover:border-indigo-950 transition-all gap-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-mono font-bold text-slate-450 dark:text-muted-foreground w-6 text-center">{student.seatNumber || "-"}</span>
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center text-xs shrink-0 select-none">
                                          {safeAvatar}
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-xs text-slate-850 dark:text-white leading-tight">{student.fullName}</h4>
                                          <p className="text-[10px] text-slate-450 dark:text-muted-foreground mt-0.5">เลขประจำตัว {student.studentCode}</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                        {[
                                          { code: "present", label: "มา", activeClass: "bg-emerald-500 text-white shadow-sm dark:bg-emerald-600", inactiveClass: "text-emerald-500 hover:bg-emerald-50/40 dark:text-emerald-400 dark:hover:bg-emerald-950/10" },
                                          { code: "late", label: "สาย", activeClass: "bg-amber-500 text-white shadow-sm dark:bg-amber-600", inactiveClass: "text-amber-500 hover:bg-amber-50/40 dark:text-amber-400 dark:hover:bg-amber-950/10" },
                                          { code: "absent", label: "ขาด", activeClass: "bg-rose-500 text-white shadow-sm dark:bg-rose-600", inactiveClass: "text-rose-500 hover:bg-rose-50/40 dark:text-rose-400 dark:hover:bg-rose-950/10" },
                                          { code: "sick", label: "ป่วย", activeClass: "bg-teal-500 text-white shadow-sm dark:bg-teal-600", inactiveClass: "text-teal-500 hover:bg-teal-50/40 dark:text-teal-400 dark:hover:bg-teal-950/10" },
                                          { code: "leave", label: "ลา", activeClass: "bg-sky-500 text-white shadow-sm dark:bg-sky-600", inactiveClass: "text-sky-500 hover:bg-sky-50/40 dark:text-sky-400 dark:hover:bg-sky-950/10" }
                                        ].map((opt) => {
                                          const isActive = currentStatus === opt.code;
                                          return (
                                            <button
                                              key={opt.code}
                                              type="button"
                                              onClick={() => {
                                                setAttRecords(prev => ({
                                                  ...prev,
                                                  [student.id]: opt.code
                                                }));
                                              }}
                                              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                                isActive ? opt.activeClass : `${opt.inactiveClass} bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40`
                                              }`}
                                            >
                                              {opt.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Homeroom Save controls */}
                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={async () => {
                                  setAttSaving(true);
                                  // Simulated bulk Homeroom API call
                                  setTimeout(() => {
                                    setAttSaving(false);
                                    triggerToast("💾 บันทึกโฮมรูมสำเร็จ", `บันทึกข้อมูลโฮมรูมเรียบร้อยแล้วและส่ง LINE ถึงผู้ปกครองนักเรียนที่ขาดเรียน`);
                                    addAuditLog("SAVE_HOMEROOM_ATTENDANCE", `บันทึกรายชื่อเข้าแถวโฮมรูม ห้อง ${advClass}`);
                                    
                                    // Trigger LINE notifications for absent students
                                    classStudents.forEach(s => {
                                      const status = attRecords[s.id] || "present";
                                      if (status === "absent") {
                                        triggerLineNotification(
                                          s.parentName || `ผู้ปกครองของ ${s.fullName}`,
                                          `เรียนผู้ปกครอง วันนี้นักเรียน ${s.fullName} ขาดการเช็คชื่อเข้าแถว/โฮมรูมตอนเช้า กรุณาติดต่อครูประจำชั้นหากต้องการแจ้งสาเหตุครับ`,
                                          s.fullName
                                        );
                                      }
                                    });
                                  }, 1000);
                                }}
                                disabled={attSaving}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {attSaving ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    กำลังบันทึก...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    บันทึกและแจ้งเตือนผู้ปกครอง (Bulk Sync)
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* SUBJECT ATTENDANCE TRACKER MODE (PRE-EXISTING) */
                    <div className="space-y-6">
                      {/* Form Selection Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 dark:text-muted-foreground block">เลือกวันที่</label>
                          <input 
                            type="date"
                            value={attDate}
                            onChange={(e) => setAttDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 dark:text-muted-foreground block">เลือกห้องเรียน</label>
                          <select 
                            value={attClassroom}
                            onChange={(e) => setAttClassroom(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-slate-800 dark:text-slate-100"
                          >
                            <option value="">เลือกห้องเรียน...</option>
                            {classroomsList.map((cls) => (
                              <option key={cls.id} value={cls.name}>{cls.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 dark:text-muted-foreground block">เลือกคาบเรียน / วิชา</label>
                          <select 
                            value={attSelectedScheduleId}
                            onChange={(e) => setAttSelectedScheduleId(e.target.value)}
                            disabled={!attClassroom || attLoadingSchedules || attSchedules.length === 0}
                            className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-slate-800 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {attLoadingSchedules ? (
                              <option>กำลังโหลดตารางเรียน...</option>
                            ) : !attClassroom ? (
                              <option>กรุณาเลือกห้องเรียนก่อน...</option>
                            ) : attSchedules.length === 0 ? (
                              <option>ไม่มีคาบสอนในวันนี้</option>
                            ) : (
                              <>
                                <option value="">เลือกคาบเรียน...</option>
                                {attSchedules.map((sch) => (
                                  <option key={sch.id} value={sch.id}>
                                    คาบ {sch.period.name} ({sch.period.startTime} - {sch.period.endTime}): {sch.subject.code} {sch.subject.name} (ครู{sch.user.name})
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Warnings & Feedback */}
                      {(() => {
                        const jsDay = new Date(attDate).getDay();
                        if (jsDay === 0 || jsDay === 6) {
                          return (
                            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2">
                              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              ไม่สามารถลงเวลาเรียนในวันเสาร์-อาทิตย์ได้
                            </div>
                          );
                        }
                        if (attClassroom && !attLoadingSchedules && attSchedules.length === 0) {
                          return (
                            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              ไม่พบตารางสอนในวันนี้สำหรับห้องเรียน {attClassroom}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Student Attendance List */}
                      {attSelectedScheduleId && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-extrabold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">
                              รายชื่อนักเรียน ({students.filter(s => s.classroom === attClassroom).length} คน)
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                const classroomStudents = students.filter(s => s.classroom === attClassroom);
                                const updated: Record<string, string> = {};
                                classroomStudents.forEach(s => {
                                  updated[s.id] = "present";
                                });
                                setAttRecords(updated);
                                triggerToast("👍 เช็คชื่อมาเรียนทั้งหมด", "ตั้งค่าให้นักเรียนทั้งหมดมีสถานะ มาเรียน");
                              }}
                              className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg hover:bg-indigo-100 transition-all cursor-pointer"
                            >
                              เช็คมาเรียนทั้งหมด
                            </button>
                          </div>

                          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                            {(() => {
                              const classroomStudents = students.filter(s => s.classroom === attClassroom);
                              if (classroomStudents.length === 0) {
                                return (
                                  <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
                                    ไม่พบข้อมูลนักเรียนในห้องเรียนนี้
                                  </div>
                                );
                              }

                              return classroomStudents.map((student) => {
                                const currentStatus = attRecords[student.id] || "present";
                                const safeAvatar = student.nickname || student.fullName.trim().charAt(0);

                                return (
                                  <div 
                                    key={student.id} 
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card hover:border-indigo-200 dark:hover:border-indigo-950 transition-all gap-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs font-mono font-bold text-slate-450 dark:text-muted-foreground w-6 text-center">{student.seatNumber || "-"}</span>
                                      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center text-xs shrink-0 select-none">
                                        {safeAvatar}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-xs text-slate-850 dark:text-white leading-tight">{student.fullName}</h4>
                                        <p className="text-[10px] text-slate-450 dark:text-muted-foreground mt-0.5">เลขประจำตัว {student.studentCode}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                      {[
                                        { code: "present", label: "มา", activeClass: "bg-emerald-500 text-white shadow-sm dark:bg-emerald-600", inactiveClass: "text-emerald-500 hover:bg-emerald-50/40 dark:text-emerald-400 dark:hover:bg-emerald-950/10" },
                                        { code: "late", label: "สาย", activeClass: "bg-amber-500 text-white shadow-sm dark:bg-amber-600", inactiveClass: "text-amber-500 hover:bg-amber-50/40 dark:text-amber-400 dark:hover:bg-amber-950/10" },
                                        { code: "absent", label: "ขาด", activeClass: "bg-rose-500 text-white shadow-sm dark:bg-rose-600", inactiveClass: "text-rose-500 hover:bg-rose-50/40 dark:text-rose-400 dark:hover:bg-rose-950/10" },
                                        { code: "sick", label: "ป่วย", activeClass: "bg-teal-500 text-white shadow-sm dark:bg-teal-600", inactiveClass: "text-teal-500 hover:bg-teal-50/40 dark:text-teal-400 dark:hover:bg-teal-950/10" },
                                        { code: "leave", label: "ลา", activeClass: "bg-sky-500 text-white shadow-sm dark:bg-sky-600", inactiveClass: "text-sky-500 hover:bg-sky-50/40 dark:text-sky-400 dark:hover:bg-sky-950/10" }
                                      ].map((opt) => {
                                        const isActive = currentStatus === opt.code;
                                        return (
                                          <button
                                            key={opt.code}
                                            type="button"
                                            onClick={() => {
                                              setAttRecords(prev => ({
                                                ...prev,
                                                [student.id]: opt.code
                                              }));
                                            }}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                              isActive ? opt.activeClass : `${opt.inactiveClass} bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40`
                                            }`}
                                          >
                                            {opt.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          {/* Save Controls */}
                          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={handleSaveSubjectAttendance}
                              disabled={attSaving}
                              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {attSaving ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                  กำลังบันทึก...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                  </svg>
                                  บันทึกรายวิชา
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SubTab 2: Teaching, Timetable list and Post lesson notes */}
              {activeSubTab === "teaching" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* AI Timetable & Substitution Portal Header */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-background border border-blue-500/20 p-6 rounded-2xl shadow-lg flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
                    
                    <div className="flex items-center gap-3.5 z-10">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20 shrink-0">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm md:text-base text-foreground bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                            {lang === "th" ? "ระบบจัดตารางสอน AI และจัดสอนแทน (AI Timetable & Substitution Portal)" : "AI Timetable & Substitution Portal"}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20 uppercase tracking-widest animate-pulse">
                            {lang === "th" ? "คลาวด์อัจฉริยะ" : "AI Powered"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 max-w-xl font-medium">
                          {lang === "th" 
                            ? "จัดตารางสอนอัจฉริยะด้วยระบบคอมพิวเตอร์ ทำความสะอาดการจัดชนคาบเรียน และสลับจัดครูสอนแทนที่เชื่อมโยงกับใบลาอัตโนมัติ"
                            : "Manage scheduling, resolve conflicts dynamically with AI engine, and assign substitution teaching mapped directly with leaves."
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Switcher Navigation */}
                    <div className="flex flex-wrap gap-1 bg-muted/60 p-1.5 rounded-2xl border border-border/80 z-10 shrink-0 shadow-inner">
                      {[
                        { key: "scheduler", label: lang === "th" ? "จัดตารางสอน" : "AI Scheduler", icon: Calendar },
                        { key: "subjects", label: lang === "th" ? "จัดการรายวิชา" : "Subjects", icon: BookOpen },
                        { key: "classrooms", label: lang === "th" ? "จัดการชั้นเรียน" : "Classrooms", icon: Users },
                        { key: "substitutes", label: lang === "th" ? "จัดสอนแทน" : "Substitutes", icon: UserCheck }
                      ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => {
                              setTimetableSubTab(tab.key as any);
                              addAuditLog("TIMETABLE_TAB_CLICK", `สลับแท็บตารางสอนเป็น: ${tab.key}`);
                            }}
                            className={`px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                              timetableSubTab === tab.key 
                                ? "bg-primary text-white shadow-md shadow-indigo-500/25 scale-[1.03]" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 1. Scheduler View */}
                  {timetableSubTab === "scheduler" && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      
                      {/* Left Sidebar: Settings / Subjects Palette */}
                      <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 rounded-2xl glass glass-card space-y-4">
                          <h3 className="text-sm font-bold text-foreground">
                            {lang === "th" ? "โหมดแสดงผลตารางสอน" : "Timetable View Mode"}
                          </h3>
                          <div className="flex bg-muted/65 p-1 rounded-xl border border-border/80">
                            <button
                              type="button"
                              onClick={() => {
                                setViewMode("classroom");
                                addAuditLog("SWITCH_SCHEDULER_MODE", "สลับมุมมองตารางสอนเป็นชั้นเรียน");
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                viewMode === "classroom"
                                  ? "bg-primary text-white shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              ชั้นเรียน
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setViewMode("teacher");
                                addAuditLog("SWITCH_SCHEDULER_MODE", "สลับมุมมองตารางสอนเป็นคุณครู");
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                viewMode === "teacher"
                                  ? "bg-primary text-white shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              ครูผู้สอน
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setViewMode("room");
                                addAuditLog("SWITCH_SCHEDULER_MODE", "สลับมุมมองตารางสอนเป็นห้องเรียน");
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                viewMode === "room"
                                  ? "bg-primary text-white shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              ห้องปฏิบัติการ
                            </button>
                          </div>

                          {/* Dynamic Dropdown Select */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-bold">
                              {viewMode === "classroom" ? "เลือกชั้นเรียน" : viewMode === "teacher" ? "เลือกครูผู้สอน" : "เลือกห้องเรียน"}
                            </label>
                            {viewMode === "classroom" && (
                              <select 
                                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-semibold text-foreground outline-none cursor-pointer"
                                value={selectedClassroomId}
                                onChange={(e) => {
                                  setSelectedClassroomId(e.target.value);
                                  setViewId(e.target.value);
                                }}
                              >
                                {classroomsList.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            )}
                            {viewMode === "teacher" && (
                              <select 
                                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-semibold text-foreground outline-none cursor-pointer"
                                value={selectedTeacherId}
                                onChange={(e) => {
                                  setSelectedTeacherId(e.target.value);
                                  setViewId(e.target.value);
                                }}
                              >
                                {teachers.map(t => (
                                  <option key={t.id} value={t.id}>{t.fullName}</option>
                                ))}
                              </select>
                            )}
                            {viewMode === "room" && (
                              <select 
                                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-semibold text-foreground outline-none cursor-pointer"
                                value={selectedRoomId}
                                onChange={(e) => {
                                  setSelectedRoomId(e.target.value);
                                  setViewId(e.target.value);
                                }}
                              >
                                {rooms.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>

                        <div className="p-6 rounded-2xl glass glass-card space-y-4">
                          <div>
                            <h3 className="text-sm font-bold text-foreground">
                              {lang === "th" ? "วิชาที่สอนได้ (ลากลงตาราง)" : "Available Subjects"}
                            </h3>
                            <p className="text-[10px] text-muted-foreground mt-1">คลิกหรือลากรายวิชาเหล่านี้ลงในช่องตารางสอน</p>
                          </div>
                          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                            {subjectsList.map((sub) => (
                              <div
                                key={sub.id}
                                className="p-3 bg-indigo-500/5 hover:bg-primary/10 border border-primary/10 rounded-xl cursor-grab hover:scale-102 hover:shadow-sm transition-all flex items-center justify-between font-bold text-xs"
                                draggable
                                onDragStart={(e) => handleDragStart(e, sub)}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: sub.color }}></div>
                                  <span className="text-foreground">{sub.code} - {sub.name}</span>
                                </div>
                                <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-md">
                                  {sub.hours} คาบ
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Section: Interactive Schedule Grid Editor */}
                      <div className="lg:col-span-3 p-6 rounded-2xl glass glass-card space-y-4 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-sm font-bold text-foreground">
                              {lang === "th" ? "เครื่องมือลากและวางตารางสอน" : "Interactive Scheduling Editor"}
                            </h3>
                            <p className="text-[10px] text-muted-foreground mt-0.5">ลากรายวิชาลงตาราง หรือกดแก้ไขเพื่อย้ายคาบ</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => triggerToast("💾 บันทึกเสร็จสมบูรณ์", "ตารางสอนได้รับการอัปเดตลงเซิร์ฟเวอร์เรียบร้อยแล้ว")}
                              className="px-3.5 py-1.5 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                            >
                              บันทึกตารางสอน
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto pb-4">
                          <ScheduleGrid 
                            viewMode={viewMode}
                            viewId={viewId}
                            selectedTeacherId={selectedTeacherId}
                            selectedClassroomId={selectedClassroomId}
                            selectedRoomId={selectedRoomId}
                            dbPeriods={periods}
                            isAdmin={role === "admin" || activeSession?.user?.email === "admin@school.os"}
                            onScheduleUpdated={refreshDbData}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Subjects Database View */}
                  {timetableSubTab === "subjects" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Add Subject form */}
                      <div className="lg:col-span-1 p-6 rounded-2xl glass glass-card h-fit space-y-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          {lang === "th" ? "เพิ่มรายวิชาใหม่" : "Add New Subject"}
                        </h3>
                        <form onSubmit={handleAddSubject} className="space-y-3.5 text-xs text-muted-foreground font-semibold">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-muted-foreground">รหัสวิชา</label>
                            <input
                              type="text"
                              name="code"
                              placeholder="เช่น ว31101"
                              required
                              className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-muted-foreground">ชื่อวิชา</label>
                            <input
                              type="text"
                              name="name"
                              placeholder="เช่น วิทยาศาสตร์พื้นฐาน"
                              required
                              className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">หน่วยกิต</label>
                              <input
                                type="number"
                                step="0.5"
                                name="credits"
                                defaultValue="1.5"
                                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">คาบ/สัปดาห์</label>
                              <input
                                type="number"
                                name="hours"
                                defaultValue="3"
                                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-muted-foreground">สีประจำวิชา</label>
                            <input
                              type="color"
                              name="color"
                              defaultValue="#3b82f6"
                              className="w-full h-10 p-1 bg-background border border-border rounded-xl cursor-pointer"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            {lang === "th" ? "บันทึกรายวิชา" : "Add Subject"}
                          </button>
                        </form>
                      </div>

                      {/* Subjects table list */}
                      <div className="lg:col-span-2 p-6 rounded-2xl glass glass-card overflow-hidden space-y-4">
                        <h3 className="text-sm font-bold text-foreground">
                          {lang === "th" ? "ฐานข้อมูลรายวิชาสะสม" : "School Subjects Database"}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                <th className="pb-3 px-3">รหัสวิชา</th>
                                <th className="pb-3 px-3">ชื่อวิชา</th>
                                <th className="pb-3 px-3 text-center">หน่วยกิต</th>
                                <th className="pb-3 px-3 text-center">คาบ/สัปดาห์</th>
                                <th className="pb-3 px-3 text-center">สี</th>
                                <th className="pb-3 px-3 text-right">ลบ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 font-semibold text-slate-700 dark:text-slate-300">
                              {subjectsList.map((subject) => (
                                <tr key={subject.id} className="hover:bg-muted/30 transition-all">
                                  <td className="py-3.5 px-3 font-bold text-primary dark:text-indigo-400">{subject.code}</td>
                                  <td className="py-3.5 px-3 text-foreground">{subject.name}</td>
                                  <td className="py-3.5 px-3 text-center">{subject.credits}</td>
                                  <td className="py-3.5 px-3 text-center">{subject.hours}</td>
                                  <td className="py-3.5 px-3 text-center">
                                    <div className="w-5 h-5 rounded-full mx-auto shadow-sm border border-black/10" style={{ backgroundColor: subject.color }} />
                                  </td>
                                  <td className="py-3.5 px-3 text-right">
                                    <button
                                      onClick={() => handleDeleteSubject(subject.id, subject.code)}
                                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                                      title="ลบรายวิชา"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Classrooms Database View */}
                  {timetableSubTab === "classrooms" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Add Classroom Form */}
                      <div className="lg:col-span-1 p-6 rounded-2xl glass glass-card h-fit space-y-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          {lang === "th" ? "เพิ่มชั้นเรียนใหม่" : "Add New Class"}
                        </h3>
                        <form onSubmit={handleAddClassroom} className="space-y-3.5 text-xs text-muted-foreground font-semibold">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-muted-foreground">ชื่อชั้นเรียน</label>
                            <input
                              type="text"
                              name="name"
                              placeholder="เช่น ม.1/1"
                              required
                              className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">ระดับชั้น</label>
                              <input
                                type="text"
                                name="grade"
                                placeholder="เช่น ม.1"
                                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">ห้อง</label>
                              <input
                                type="text"
                                name="room"
                                placeholder="เช่น 1"
                                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-primary"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            {lang === "th" ? "บันทึกชั้นเรียน" : "Add Class"}
                          </button>
                        </form>
                      </div>

                      {/* Classrooms table list */}
                      <div className="lg:col-span-2 p-6 rounded-2xl glass glass-card overflow-hidden space-y-4">
                        <h3 className="text-sm font-bold text-foreground">
                          {lang === "th" ? "ฐานข้อมูลห้องเรียน / ชั้นเรียน" : "Classrooms Database"}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                <th className="pb-3 px-3">ชื่อชั้นเรียน</th>
                                <th className="pb-3 px-3 text-center">ระดับชั้น</th>
                                <th className="pb-3 px-3 text-center">ห้อง</th>
                                <th className="pb-3 px-3 text-right">ลบ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 font-semibold text-slate-700 dark:text-slate-300">
                              {classroomsList.map((cls) => (
                                <tr key={cls.id} className="hover:bg-muted/30 transition-all">
                                  <td className="py-3.5 px-3 font-bold text-foreground">{cls.name}</td>
                                  <td className="py-3.5 px-3 text-center">{cls.grade || "-"}</td>
                                  <td className="py-3.5 px-3 text-center">{cls.room || "-"}</td>
                                  <td className="py-3.5 px-3 text-right">
                                    <button
                                      onClick={() => handleDeleteClassroom(cls.id, cls.name)}
                                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                                      title="ลบชั้นเรียน"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Substitutes View */}
                  {timetableSubTab === "substitutes" && (
                    <SubstitutionTab 
                      teachers={teachers} 
                      leaveRequests={leaveRequests} 
                      lang={lang} 
                    />
                  )}
                </div>
              )}

              {/* SubTab 3: Grade entries & SGS Sync */}
              {activeSubTab === "assessment" && (
                <div className="p-6 rounded-2xl glass glass-card space-y-5 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">สมุดคะแนนสอบปลายภาคและสรุปเกรดเฉลี่ย (ปพ.5)</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">กรอกคะแนนดิบสะสมเพื่อคำนวณเกรดเฉลี่ยของนักเรียนตามหลักสูตรอัตโนมัติ</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={syncScoresToSgs}
                        className="px-4 py-2 bg-primary text-primary-foreground hover:scale-105 transition-all font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                        ซิงค์ข้อมูลเข้าสู่ระบบ SGS
                      </button>
                    </div>
                  </div>

                  {/* SGS Sync progress indicator */}
                  {sgsSyncProgress !== null && (
                    <div className="p-4 rounded-xl border border-primary/20 bg-indigo-500/5 space-y-2 animate-pulse">
                      <div className="flex justify-between items-center text-xs font-bold text-primary">
                        <span>กำลังอัปโหลดเกรดเฉลี่ย ปพ.5 เข้าสู่อีเมล/เซิร์ฟเวอร์ SGS กระทรวงศึกษาธิการ...</span>
                        <span>{sgsSyncProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${sgsSyncProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Score sheet list */}
                  <div className="space-y-2">
                    {students.map((student) => {
                      const score = editScores[student.id] || 0;
                      let grade = "F";
                      if (score >= 80) grade = "4.0";
                      else if (score >= 70) grade = "3.0";
                      else if (score >= 60) grade = "2.0";
                      else if (score >= 50) grade = "1.0";
                      return (
                        <div key={student.id} className="flex justify-between items-center p-3 rounded-xl border border-border bg-card">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-muted-foreground w-12">#{student.studentCode}</span>
                            <h4 className="font-bold text-xs text-foreground">{student.fullName}</h4>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">กรอกคะแนน:</span>
                              <input 
                                type="number" 
                                className="w-16 bg-background border border-border rounded-lg text-center px-1 py-1 text-xs font-bold text-foreground outline-none focus:border-primary"
                                value={score}
                                onChange={(e) => handleScoreChange(student.id, Number(e.target.value))}
                                min={0}
                                max={100}
                              />
                            </div>
                            <span className={`w-12 text-center text-xs font-bold px-2.5 py-1 rounded-lg border ${
                              grade === "4.0" 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                : grade === "3.0" || grade === "2.0" 
                                ? "bg-primary/10 text-primary border-primary/20" 
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            }`}>
                              เกรด {grade}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SubTab 4: Academic Calendar */}
              {activeSubTab === "calendar" && (
                <div className="p-6 rounded-2xl glass glass-card space-y-4 animate-in fade-in duration-200">
                  <AcademicCalendar />
                </div>
              )}
            </div>
          )}

          {/* ==================== 4. OPERATIONS VIEW ==================== */}
          {activeMenu === "Operations" && (
            <div className="space-y-4">
              <div className="flex border-b border-border/80">
                <button 
                  onClick={() => setActiveSubTab("documents")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "documents" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  ระบบรับส่งหนังสือราชการ (E-Signature Memo)
                </button>
                <button 
                  onClick={() => setActiveSubTab("maintenance")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "maintenance" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  แจ้งซ่อม & อุปกรณ์ ICT (Maintenance)
                </button>
                <button 
                  onClick={() => setActiveSubTab("subsystems")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "subsystems" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  ระบบย่อยเพิ่มเติม (10 ระบบ)
                </button>
              </div>

              {/* SubTab 2: E-Signature Memo / Documents */}
              {activeSubTab === "documents" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  
                  {/* Documents List */}
                  <div className="lg:col-span-2 p-6 rounded-2xl glass glass-card space-y-4">
                    <h3 className="text-sm font-bold text-foreground">ทะเบียนหนังสือสารบรรณและบันทึกข้อความภายใน</h3>
                    <div className="space-y-3">
                      {[
                        { title: "หนังสือขอความอนุเคราะห์สนับสนุนอุปกรณ์กีฬาชุมชน (ศธ 04101/2569)", id: "doc-1", status: "signed" },
                        { title: "บันทึกข้อความชี้แจงมาตรการดูแลเฝ้าระวังภัยฤดูร้อนในสถานศึกษา", id: "doc-2", status: "pending" },
                        { title: "ระเบียบวาระการประชุมคณะกรรมการบริหารสถานศึกษา ครั้งที่ 2/2569", id: "doc-3", status: "signed" },
                      ].map((doc) => (
                        <div key={doc.id} className="p-3.5 rounded-xl border border-border bg-card flex justify-between items-center hover:border-primary/20 transition-all">
                          <div className="flex gap-3 items-center">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <h4 className="font-bold text-xs text-foreground">{doc.title}</h4>
                              <p className="text-[9px] text-muted-foreground">รหัสจัดเก็บดิจิทัล: {doc.id.toUpperCase()}-SECURE</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            doc.status === "signed" 
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                          }`}>
                            {doc.status === "signed" ? "ลงนาม E-Signature แล้ว" : "รอผู้บริหารลงนาม"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* E-Signature Simulator pad */}
                  <div className="p-6 rounded-2xl glass glass-card space-y-4 h-fit">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-primary" />
                      ลงนามดิจิทัล (E-Signature Pad)
                    </h3>
                    <div className="space-y-3 text-xs text-muted-foreground font-semibold">
                      <p className="text-[10px] leading-relaxed">
                        เซ็นชื่อของท่านลงบนช่องกรอบสี่เหลี่ยมนี้เพื่อจำลองระบบเข้ารหัสลับประมวลผลลายมือชื่อผู้บริหาร
                      </p>
                      
                      {/* Fake signature canvas pad box */}
                      <div className="h-28 rounded-xl border border-dashed border-primary/30 bg-muted/20 relative flex items-center justify-center group overflow-hidden">
                        <span className="text-[9px] text-muted-foreground font-bold group-hover:scale-105 transition-transform">
                          ✍ คลิกค้างลากเพื่อจำลองเซ็นลายมือชื่อ
                        </span>
                        {/* Interactive fake sign visualization */}
                        <div className="absolute inset-0 bg-transparent flex items-center justify-center font-serif text-2xl font-bold tracking-widest text-primary/30 pointer-events-none uppercase">
                          Anchalee.R
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            triggerToast("✍ ลงนามดิจิทัลสำเร็จ", "ลายมือชื่อ E-Signature ถูกบันทึกลงฐานข้อมูล Supabase Storage แล้ว");
                            addAuditLog("SIGN_DOCUMENT", "ลงลายมือชื่อ E-Signature ในบันทึกข้อความเฝ้าระวังภัยฤดูร้อน");
                          }}
                          className="flex-1 py-2 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                        >
                          บันทึกลายเซ็นลงเอกสาร
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SubTab 3: Maintenance ICT */}
              {activeSubTab === "maintenance" && (
                <div className="p-6 rounded-2xl glass glass-card space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Hammer className="w-4 h-4 text-amber-500" />
                    แจ้งซ่อมบำรุงและครุภัณฑ์คอมพิวเตอร์ / ICT
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">กรอกแจ้งซ่อมเครื่องใหม่</h4>
                      <div className="space-y-2 text-xs text-muted-foreground font-semibold">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold">ชื่อครุภัณฑ์ที่เสียหาย</label>
                          <input type="text" placeholder="เช่น โปรเจคเตอร์ห้อง ม.6/1 ดับ เปิดไม่ติด" className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold">อาการเสีย / รายละเอียด</label>
                          <textarea rows={2} placeholder="พัดลมหมุนเสียงดัง แต่ไฟหลอดภาพไม่สว่าง มีควันชื้นเล็กน้อย" className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground outline-none resize-none" />
                        </div>
                        <button 
                          onClick={() => {
                            triggerToast("🛠️ ส่งแจ้งซ่อมเรียบร้อย", "เจ้าหน้าที่ฝ่ายเทคนิคคอมพิวเตอร์ได้รับตั๋วงานเรียบร้อยแล้ว");
                            addAuditLog("CREATE_MAINTENANCE_TICKET", "แจ้งซ่อมโปรเจคเตอร์ห้องเรียน ม.6/1 ดับเสียหาย");
                          }}
                          className="w-full py-2 bg-primary hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-all"
                        >
                          ส่งข้อมูลไปฝ่ายอาคารและ ICT
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">ประวัติการซ่อมบำรุงในโรงเรียน</h4>
                      <div className="space-y-2">
                        {[
                          { title: "คอมพิวเตอร์ห้องทะเบียนหน้าบอร์ดดับ", date: "20 พ.ค.", status: "กำลังดำเนินการ" },
                          { title: "สาย LAN ขาดที่ห้องสมุดกลาง", date: "18 พ.ค.", status: "เสร็จสิ้น" },
                        ].map((ticket, i) => (
                          <div key={i} className="flex justify-between items-center p-2 rounded-lg border border-border/60 text-xs">
                            <div>
                              <h5 className="font-bold text-foreground">{ticket.title}</h5>
                              <p className="text-[9px] text-muted-foreground">แจ้งเมื่อ: {ticket.date}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                              ticket.status === "เสร็จสิ้น" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            }`}>{ticket.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === "subsystems" && (
                <SubsystemsView
                  students={students}
                  teachers={teachers}
                  triggerToast={triggerToast}
                  addAuditLog={addAuditLog}
                />
              )}
            </div>
          )}

          {/* ==================== 5. ENGAGEMENT VIEW ==================== */}
          {activeMenu === "Engagement" && (
            <EngagementView
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              students={students}
              triggerLineNotification={triggerLineNotification}
              addAuditLog={addAuditLog}
              triggerToast={triggerToast}
              currentUser={activeSession?.user?.name || undefined}
            />
          )}

          {/* ==================== 6. ANALYTICS VIEW ==================== */}
          {activeMenu === "Analytics" && (
            <ReportsView
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              role={role}
              students={students}
              teachers={teachers}
              classroomsList={classroomsList}
              subjectsList={subjectsList}
              leaveRequests={leaveRequests}
              setSelectedStudent={setSelectedStudent}
              setTimelineOpen={setTimelineOpen}
              triggerToast={triggerToast}
              addAuditLog={addAuditLog}
            />
          )}

          {/* ==================== 7. ADMIN VIEW ==================== */}
          {activeMenu === "Admin" && (
            <div className="space-y-6">
              
              <div className="flex border-b border-border/80 flex-wrap">
                <button 
                  onClick={() => setActiveSubTab("rules")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "rules" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  กติกาอัตโนมัติ (Rule Engine)
                </button>
                <button 
                  onClick={() => setActiveSubTab("logs")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "logs" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  ประวัติระบบและ Audit Log
                </button>
                <button 
                  onClick={() => setActiveSubTab("system")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "system" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  ตั้งค่าระบบใหญ่ (Global Settings)
                </button>
              </div>

              {/* SubTab 1: Rule Engine setting */}
              {activeSubTab === "rules" && (
                <div className="p-6 rounded-2xl glass glass-card space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">ตั้งค่าการทำงานอัตโนมัติ (Rule Engine Node Builder)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">เปิด-ปิดเงื่อนไขการทำงานอัตโนมัติเมื่อเกิดกิจกรรมพฤติกรรมในโรงเรียน</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-border bg-card flex justify-between items-center gap-4">
                      <div>
                        <h4 className="font-bold text-xs text-foreground">เงื่อนไข: เมื่อเด็กนักเรียนขาดเรียนสะสมเกิน 3 วัน</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5"><b>เหตุการณ์ตอบสนอง:</b> ยื่นหนังสือเตือนความประพฤติอัตโนมัติพร้อมส่งข้อความ SMS/LINE หาผู้ปกครอง</p>
                      </div>
                      <button 
                        onClick={() => {
                          setRuleAbsenceEnabled(prev => !prev);
                          triggerToast("⚙️ อัปเดตกติการะบบ", "แก้ไขสถานะกติกาอัตโนมัติสำเร็จ");
                          addAuditLog("UPDATE_RULE", "อัปเดตสถานะการเชื่อมโยง Rule Engine สำหรับสถิติการขาดเรียน");
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-all ${
                          ruleAbsenceEnabled ? "bg-primary flex justify-end" : "bg-slate-300 dark:bg-slate-700 flex justify-start"
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow" />
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card flex justify-between items-center gap-4">
                      <div>
                        <h4 className="font-bold text-xs text-foreground">เงื่อนไข: ผลตรวจสุขภาพจิต SDQ ผิดปกติ (กลุ่มมีปัญหา)</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5"><b>เหตุการณ์ตอบสนอง:</b> เพิ่มเคสเข้าระบบนัดหมายเยี่ยมบ้านของอาจารย์ประจำชั้นทันทีโดยไม่ต้องกรอกเพิ่ม</p>
                      </div>
                      <button 
                        onClick={() => {
                          setRuleSdqEnabled(prev => !prev);
                          triggerToast("⚙️ อัปเดตกติการะบบ", "แก้ไขสถานะกติกาอัตโนมัติสำเร็จ");
                          addAuditLog("UPDATE_RULE", "อัปเดตสถานะการเชื่อมโยง Rule Engine สำหรับเกณฑ์ SDQ");
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-all ${
                          ruleSdqEnabled ? "bg-primary flex justify-end" : "bg-slate-300 dark:bg-slate-700 flex justify-start"
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SubTab 2: Logs list */}
              {activeSubTab === "logs" && (
                <div className="p-6 rounded-2xl glass glass-card space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-sm font-bold text-foreground">สมุดบันทึกประวัติความปลอดภัยและการจัดการฐานข้อมูล (Audit Log Core)</h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs font-mono space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-primary dark:text-indigo-400">[{log.action}]</span>
                          <span className="text-[9px] text-muted-foreground">{log.timestamp}</span>
                        </div>
                        <p className="text-foreground leading-normal">{log.details}</p>
                        <div className="text-[9px] text-muted-foreground">
                          <b>โมดูล:</b> {log.module} • <b>ผู้กระทำ:</b> {log.actor}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SubTab 3: Global System Settings */}
              {activeSubTab === "system" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  {/* Left Column: Branding Settings */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-2xl glass glass-card space-y-5">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">ข้อมูลระบุเอกลักษณ์โรงเรียนและระบบ (School & System Branding)</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">จัดการโลโก้ ชื่อโรงเรียน และชื่อระบบแสดงผลบนหน้าต่าง ๆ ของแอปพลิเคชัน</p>
                      </div>

                      <form onSubmit={handleGeneralSubmit} className="space-y-4">
                        {/* Logo Upload */}
                        <div>
                          <label className="block text-xs font-bold text-foreground/80 mb-2">โลโก้โรงเรียน (School Logo)</label>
                          <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                              {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                              <label 
                                htmlFor="logo-upload" 
                                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                              >
                                <UploadCloud className="w-4 h-4 text-indigo-500" />
                                {isUploading ? "กำลังอัปโหลด..." : "อัปโหลดรูปภาพใหม่"}
                              </label>
                              <p className="text-[10px] text-slate-400 mt-2">รองรับไฟล์ PNG, JPG ขนาดไม่เกิน 2MB (ไฟล์จะถูกแปลงเป็น Base64 และบันทึกตรงในเซิร์ฟเวอร์)</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-foreground/80 mb-1">ชื่อโรงเรียน (School Name)</label>
                            <input
                              type="text"
                              required
                              value={schoolName}
                              onChange={(e) => setSchoolName(e.target.value)}
                              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-background/50 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-foreground"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-foreground/80 mb-1">ชื่อโปรแกรม / หัวเรื่องย่อย (System Subheader)</label>
                            <input
                              type="text"
                              required
                              value={subheader}
                              onChange={(e) => setSubheader(e.target.value)}
                              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-background/50 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-foreground"
                            />
                          </div>
                        </div>

                        <div className="border-t border-border/80 pt-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-foreground">การแจ้งเตือนทาง LINE (LINE Notifications)</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">กำหนดค่าสำหรับส่งข้อความแจ้งเตือนความปลอดภัยหาผู้ปกครอง</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-355 mb-1">Channel Access Token</label>
                              <input
                                type="text"
                                value={lineChannelAccessToken}
                                onChange={(e) => setLineChannelAccessToken(e.target.value)}
                                placeholder="ใส่ Channel Access Token จาก LINE Developers"
                                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-background/50 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-foreground"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-355 mb-1">Target Group ID / User ID</label>
                              <input
                                type="text"
                                value={lineTargetGroupId}
                                onChange={(e) => setLineTargetGroupId(e.target.value)}
                                placeholder="ใส่ Group ID หรือ User ID ปลายทาง"
                                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-background/50 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-foreground"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={isSavingGeneral}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                          >
                            <span>{isSavingGeneral ? "กำลังบันทึก..." : "บันทึกการตั้งค่าเอกลักษณ์"}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Footer Settings & Backup */}
                  <div className="space-y-6">
                    {/* Footer Settings */}
                    <div className="p-6 rounded-2xl glass glass-card space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-bl-[100px] -z-10" />
                      <div>
                        <h3 className="text-sm font-bold text-rose-650 dark:text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                          ตั้งค่าส่วนท้ายโปรแกรม (Footer Settings)
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          แก้ไขลิขสิทธิ์และข้อความด้านล่างของหน้าล็อกอิน (ต้องการรหัสลับนักพัฒนา)
                        </p>
                      </div>

                      <form onSubmit={handleFooterSubmit} className="space-y-3.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-355 mb-1">ข้อความแสดงผล (Footer Text)</label>
                          <input
                            type="text"
                            required
                            value={footerText}
                            onChange={(e) => setFooterText(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-background/50 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-bold text-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-355 mb-1 flex items-center gap-1">
                            Developer Secret Key
                          </label>
                          <input
                            type="password"
                            required
                            value={developerSecret}
                            onChange={(e) => setDeveloperSecret(e.target.value)}
                            placeholder="รหัสผ่านนักพัฒนา"
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-background/50 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono text-foreground"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSavingFooter}
                          className="w-full flex items-center justify-center h-9 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 focus:ring-4 focus:ring-rose-500/20 transition-all text-xs disabled:opacity-50"
                        >
                          {isSavingFooter ? "กำลังบันทึก..." : "ยืนยันการเปลี่ยนข้อความ"}
                        </button>
                      </form>
                    </div>

                    {/* System Backup & Restore */}
                    <div className="p-6 rounded-2xl glass glass-card space-y-4 relative overflow-hidden">
                      <div>
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <DownloadCloud className="w-4 h-4 text-emerald-500" />
                          การสำรองและกู้คืนระบบ (System Backup)
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          ดาวน์โหลดไฟล์สำรองข้อมูลหรือนำเข้าไฟล์สำรองเพื่อกู้คืนฐานข้อมูลการตั้งค่าทั้งหมด
                        </p>
                      </div>

                      <div className="space-y-3 pt-1">
                        <button
                          onClick={handleBackup}
                          disabled={isBackingUp}
                          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 font-bold text-xs transition-all disabled:opacity-50"
                        >
                          <DownloadCloud className="w-4 h-4" />
                          {isBackingUp ? "กำลังสำรองข้อมูล..." : "ดาวน์โหลดข้อมูลสำรอง (JSON)"}
                        </button>

                        <label className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all disabled:opacity-50 text-xs">
                          <UploadCloud className="w-4 h-4 text-indigo-500" />
                          {isImporting ? "กำลังนำเข้าข้อมูล..." : "กู้คืนระบบจากไฟล์ JSON"}
                          <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} disabled={isImporting} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================== 9. E-LEAVE PORTAL ==================== */}
          {activeMenu === "eleave" && (
            <LeaveView role={role} lang={lang} subTab={eleaveSubTab} setSubTab={setEleaveSubTab} />
          )}

          {/* ==================== TIMETABLE PORTAL ==================== */}
          {activeMenu === "timetables" && (
            <TimetableView role={role} lang={lang} subTab={timetableViewSubTab} setSubTab={setTimetableViewSubTab} />
          )}

          {/* ==================== STUDENT CARE / HOME VISIT ==================== */}
          {activeMenu === "StudentCare" && (
            <StudentCareView role={role} lang={lang} />
          )}

          {/* ==================== 10. MY PROFILE ==================== */}
          {activeMenu === "Profile" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 border-b border-border/80 pb-2">
                <UserCircle className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm md:text-base text-foreground">
                  {lang === "th" ? "โปรไฟล์ของฉัน" : "My Profile"}
                </h3>
              </div>
              <div className="p-1 rounded-2xl border border-border/60 bg-card overflow-hidden">
                <ProfilePage />
              </div>
            </div>
          )}

        </main>

      </div>

      {/* ==================== SPOTLIGHT SEARCH & DRAWERS ==================== */}
      
      {/* Ctrl+K Command Palette overlay */}
      <CommandPalette 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        students={students}
        onSelectStudent={(student) => {
          setSelectedStudent(student);
          setTimelineOpen(true);
          addAuditLog("SEARCH_SELECT_STUDENT", `ค้นพบและแสดงข้อมูลประวัติของ ${student.fullName}`);
        }}
        onNavigate={navigateTo}
        onSwitchRole={(newRole) => {
          setRole(newRole);
          triggerToast("🔄 สลับบทบาทเรียบร้อย", `ขณะนี้คุณกำลังใช้งานระบบในบทบาท: ${newRole}`);
        }}
      />

      {/* 📱 MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          {/* Background backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" 
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer menu panel — Dark Gradient */}
          <div className="relative flex flex-col w-64 max-w-xs sidebar-dark h-full border-r border-white/[0.06] shadow-2xl p-5 space-y-6 animate-in slide-in-from-left duration-250 z-10">
            {/* Close button & Brand */}
            <div className="flex justify-between items-center pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <GraduationCap className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-bold text-xs text-white/90 leading-none">School OS</span>
              </div>
              <button 
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white/40 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 space-y-1 overflow-y-auto">
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2.5">{lang === "th" ? "เมนูหลัก" : "Main Menu"}</p>
              {sidebarMainItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      if (item.name === "eleave") {
                        setActiveMenu(item.name);
                        setEleaveSubTab("dashboard");
                        setMobileSidebarOpen(false);
                        return;
                      }
                      if (item.name === "timetables") {
                        setActiveMenu(item.name);
                        setTimetableViewSubTab("dashboard");
                        setMobileSidebarOpen(false);
                        return;
                      }
                      setActiveMenu(item.name);
                      if (item.name === "Home") setActiveSubTab("dashboard");
                      else if (item.name === "People") setActiveSubTab("students");
                      else if (item.name === "Academic") setActiveSubTab("attendance");
                      else if (item.name === "StudentCare") setActiveSubTab("dashboard");
                      else if (item.name === "Operations") setActiveSubTab("requests");
                      else if (item.name === "Engagement") setActiveSubTab("line");
                      setMobileSidebarOpen(false);
                      addAuditLog("MOBILE_SIDEBAR_CLICK", `คลิกเมนูหลัก: ${item.name}`);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ease-out cursor-pointer ${
                      isActive 
                        ? "glow-active text-white font-semibold" 
                        : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-indigo-300" : "text-white/40"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Admin modules block */}
              <div className="pt-4 mt-4 border-t border-white/[0.06]">
                <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2.5">{lang === "th" ? "โมดูลผู้ดูแลระบบ" : "Admin Modules"}</p>
                {sidebarAdminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setActiveMenu(item.name);
                        if (item.name === "Analytics") setActiveSubTab("intelligence");
                        else if (item.name === "Admin") setActiveSubTab("rules");
                        setMobileSidebarOpen(false);
                        addAuditLog("MOBILE_SIDEBAR_CLICK", `คลิกโมดูลแอดมิน: ${item.name}`);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ease-out cursor-pointer ${
                        isActive 
                          ? "glow-active text-white font-semibold" 
                          : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-indigo-300" : "text-white/40"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudent}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        lang={lang}
      />

      {/* Timeline Drawer overlay */}
      <TimelineEngine 
        student={selectedStudent}
        isOpen={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        onAddAuditLog={addAuditLog}
      />

      {/* LINE Simulator Notification Toast popup */}
      {showLineAlert && (
        <div className="fixed bottom-6 right-6 z-50 w-80 p-4 rounded-2xl glass shadow-2xl border border-emerald-500/30 animate-in fade-in slide-in-from-bottom duration-300 bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-50">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="font-bold text-xs text-emerald-700 dark:text-emerald-400">LINE API Messaging Service</h4>
            </div>
            <button onClick={() => setShowLineAlert(false)} className="p-0.5 hover:bg-emerald-500/10 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">ส่งตรงถึงผู้ปกครอง: <b>{lineAlertData.parent}</b></p>
          <div className="mt-2.5 p-2 rounded-xl bg-white/50 dark:bg-slate-900/50 text-[11px] leading-relaxed font-semibold italic border border-emerald-500/10">
            "{lineAlertData.message}"
          </div>
        </div>
      )}

      {/* 📱 PERSISTENT MOBILE BOTTOM NAVBAR */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-premium flex items-center justify-around z-40 shadow-premium md:hidden px-2">
        {(() => {
          const isApprover = role === "admin" || role === "director";
          
          if (activeMenu === "eleave") {
            // e-Leave Portal dynamic tabs
            const leaveTabs = [
              { key: "dashboard", label: lang === "th" ? "ภาพรวม" : "Dashboard", icon: LayoutDashboard },
              { key: "form", label: lang === "th" ? "เขียนใบลา" : "Request", icon: FileText },
              { key: "history", label: lang === "th" ? "ประวัติ" : "History", icon: History },
              ...(isApprover ? [{ key: "approvals", label: lang === "th" ? "รออนุมัติ" : "Approvals", icon: CheckSquare }] : [])
            ];
            
            return (
              <>
                {leaveTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = eleaveSubTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setEleaveSubTab(tab.key as any);
                        addAuditLog("MOBILE_NAVBAR_CLICK", `คลิกเมนูระบบการลา: ${tab.key}`);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 w-14 h-full transition-all relative ${
                        isActive 
                          ? "text-slate-900 dark:text-white" 
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
                      {isActive && (
                        <span className="absolute top-0 w-8 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                      )}
                    </button>
                  );
                })}
                {/* Back to School OS Portal home */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu("Home");
                    setActiveSubTab("dashboard");
                    addAuditLog("MOBILE_NAVBAR_CLICK", "คลิกปุ่มย้อนกลับไปหน้าหลัก School OS");
                  }}
                  className="flex flex-col items-center justify-center gap-1 w-14 h-full transition-all relative text-indigo-650 dark:text-indigo-400 hover:text-indigo-800"
                >
                  <Home className="w-5 h-5" />
                  <span className="text-[9px] font-bold tracking-wide">{lang === "th" ? "หน้าหลัก" : "Home"}</span>
                </button>
              </>
            );
          }
          
          if (activeMenu === "timetables") {
            // Timetable Portal dynamic tabs
            const timetableTabs = [
              { key: "dashboard", label: lang === "th" ? "ภาพรวม" : "Dashboard", icon: LayoutDashboard },
              { key: "schedule", label: lang === "th" ? "ตารางสอน" : "Scheduler", icon: Calendar },
              { key: "substitutes", label: lang === "th" ? "สอนแทน" : "Substitutes", icon: Users }
            ];
            
            return (
              <>
                {timetableTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = timetableViewSubTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setTimetableViewSubTab(tab.key as any);
                        addAuditLog("MOBILE_NAVBAR_CLICK", `คลิกเมนูจัดตารางสอน: ${tab.key}`);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 w-14 h-full transition-all relative ${
                        isActive 
                          ? "text-slate-900 dark:text-white" 
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
                      {isActive && (
                        <span className="absolute top-0 w-8 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                      )}
                    </button>
                  );
                })}
                {/* Back to School OS Portal home */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu("Home");
                    setActiveSubTab("dashboard");
                    addAuditLog("MOBILE_NAVBAR_CLICK", "คลิกปุ่มย้อนกลับไปหน้าหลัก School OS");
                  }}
                  className="flex flex-col items-center justify-center gap-1 w-14 h-full transition-all relative text-indigo-650 dark:text-indigo-400 hover:text-indigo-800"
                >
                  <Home className="w-5 h-5" />
                  <span className="text-[9px] font-bold tracking-wide">{lang === "th" ? "หน้าหลัก" : "Home"}</span>
                </button>
              </>
            );
          }
          
          // Global Portal dynamic tabs
          const globalMobileItems = sidebarMainItems.filter(item => 
            ["Home", "Academic", "StudentCare", "eleave"].includes(item.name)
          );
          
          return (
            <>
              {globalMobileItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      if (item.name === "eleave") {
                        setActiveMenu(item.name);
                        setEleaveSubTab("dashboard");
                        return;
                      }
                      setActiveMenu(item.name);
                      if (item.name === "Home") setActiveSubTab("dashboard");
                      else if (item.name === "Academic") setActiveSubTab("attendance");
                      else if (item.name === "StudentCare") setActiveSubTab("dashboard");
                      addAuditLog("MOBILE_NAVBAR_CLICK", `คลิกเมนูด้านล่าง: ${item.name}`);
                    }}
                    className={`flex flex-col items-center justify-center gap-1 w-14 h-full transition-all relative ${
                      isActive 
                        ? "text-slate-900 dark:text-white" 
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[9px] font-bold tracking-wide">{item.label}</span>
                    {isActive && (
                      <span className="absolute top-0 w-8 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
              {/* Sidebar Drawer trigger button */}
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(prev => !prev)}
                className={`flex flex-col items-center justify-center gap-1 w-14 h-full transition-all relative ${
                  mobileSidebarOpen 
                    ? "text-slate-900 dark:text-white" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                }`}
              >
                <Menu className="w-5 h-5" />
                <span className="text-[9px] font-bold tracking-wide">{lang === "th" ? "เมนูอื่น ๆ" : "More"}</span>
                {mobileSidebarOpen && (
                  <span className="absolute top-0 w-8 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                )}
              </button>
            </>
          );
        })()}
      </nav>

      {/* Standard Action success Toast notification */}
      {showToast && (
        <div className="fixed bottom-6 left-6 z-50 p-4 rounded-xl border border-primary/25 bg-indigo-900/90 text-white w-80 shadow-xl flex gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="p-1 rounded bg-indigo-500/20 text-indigo-200">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="font-bold text-xs">{toastTitle}</h4>
            <p className="text-[10px] text-indigo-200/90 mt-0.5 leading-normal">{toastMessage}</p>
          </div>
        </div>
      )}

    </div>
  );
}
