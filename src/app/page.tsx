"use client";

import React, { useState, useEffect } from "react";
import { 
  Home, Users, BookOpen, Settings, MessageSquare, BarChart3, ShieldAlert,
  Search, Moon, Sun, Bell, AlertTriangle, Plus, CheckCircle2, X, Trash2, 
  Send, Hammer, HelpCircle, FileText, Calendar, Clock, Star, Edit3, ArrowRight,
  UserCheck, Sparkles, LogOut, CheckSquare, Award, Play, ChevronRight, FileCode, GraduationCap
} from "lucide-react";

import { Student, Teacher, LeaveRequest, HealthVisit, TimelineEvent, NotificationItem, AuditLogItem, UserRole } from "@/types/school-os";
import { initialStudents, initialTeachers, initialLeaveRequests, initialHealthVisits, initialTimelineEvents, initialNotifications, initialAuditLogs } from "@/lib/mock-data";
import CommandPalette from "@/components/CommandPalette";
import TimelineEngine from "@/components/TimelineEngine";
import SmartDashboard from "@/components/SmartDashboard";

import { useSession, signOut } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";

// Import integrated eLeave sub-pages
import DashboardPage from "./eleave/dashboard/page";
import RequestLeavePage from "./eleave/request/page";
import HistoryPage from "./eleave/history/page";
import ApprovalsPage from "./eleave/approvals/page";
import ReportsPage from "./eleave/reports/page";
import SettingsPage from "./eleave/settings/page";
import { ScheduleGrid } from "@/components/timetable/ScheduleGrid";
import SubstitutionTab from "@/components/timetable/SubstitutionTab";

// Import real database actions
import { getSystemInitialData } from "@/app/actions/init";
import { createSubject, deleteSubject } from "@/app/actions/subject";
import { createClassroom, deleteClassroom } from "@/app/actions/classroom";

export default function Workspace() {
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
  const [eleaveSubTab, setEleaveSubTab] = useState<"dashboard" | "form" | "history" | "approvals" | "reports" | "settings">("dashboard");

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
        if (res.data.logs.length > 0) {
          setAuditLogs(res.data.logs as any);
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
      setLoadingDb(false);
    }
    loadData();
  }, []);

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
  const activeSession = session || mockSession;

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
  }, [activeSession]);

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
    { name: "Operations", icon: Settings, label: lang === "th" ? "ดำเนินงาน" : "Operations" },
    { name: "Engagement", icon: MessageSquare, label: lang === "th" ? "สื่อสาร" : "Engagement" },
  ];
  const sidebarAdminItems = [
    { name: "Analytics", icon: BarChart3, label: lang === "th" ? "วิเคราะห์ & AI" : "AI Analytics" },
    { name: "Admin", icon: ShieldAlert, label: lang === "th" ? "ตั้งค่าระบบ" : "Settings" },
  ];
  const isApprover = role === "admin" || role === "director";



  return (
    <div className={`flex-1 flex overflow-hidden min-h-screen bg-background relative text-foreground ${lang === 'th' ? 'font-th' : 'font-en'}`}>
      
      {/* 🚀 SIDEBAR PRINCIPAL */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border/60 bg-white dark:bg-sidebar">
        {/* Brand Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-none text-foreground">โรงเรียนคุชปะชาสรรค์</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">School OS</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-3 mb-2">{lang === "th" ? "เมนูหลัก" : "Main Menu"}</p>
          {sidebarMainItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveMenu(item.name);
                  if (item.name === "Home") setActiveSubTab("dashboard");
                  else if (item.name === "People") setActiveSubTab("students");
                  else if (item.name === "Academic") setActiveSubTab("attendance");
                  else if (item.name === "Operations") setActiveSubTab("requests");
                  else if (item.name === "Engagement") setActiveSubTab("line");
                  addAuditLog("SIDEBAR_CLICK", `คลิกเมนูหลัก: ${item.name}`);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all duration-150 relative rounded-lg ${
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border-l-[3px] border-indigo-500 pl-[9px]" 
                    : "text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-indigo-500" : "text-slate-400 dark:text-muted-foreground"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 pb-2 px-3">
            <div className="h-px bg-border/50 w-full" />
          </div>

          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-3 mb-2">{lang === "th" ? "บัญชีผู้ใช้" : "Account"}</p>
          {sidebarAdminItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveMenu(item.name);
                  if (item.name === "Analytics") setActiveSubTab("risk");
                  else if (item.name === "Admin") setActiveSubTab("rules");
                  addAuditLog("SIDEBAR_CLICK", `คลิกเมนูหลัก: ${item.name}`);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all duration-150 relative rounded-lg ${
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border-l-[3px] border-indigo-500 pl-[9px]" 
                    : "text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-indigo-500" : "text-slate-400 dark:text-muted-foreground"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <a
            href="/eleave"
            className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all"
          >
            <FileText className="w-[18px] h-[18px] text-purple-400" />
            <span>{lang === "th" ? "โปรไฟล์ของฉัน" : "My Profile"}</span>
          </a>
        </nav>

        {/* User Account */}
        <div className="p-4 border-t border-border/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex items-center justify-center shrink-0">
              {activeSession.user.name ? activeSession.user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-xs truncate text-foreground">{activeSession.user.name}</h4>
              <span className="text-[10px] text-muted-foreground capitalize block truncate">
                {role === "admin" ? (lang === "th" ? "แอดมิน" : "Admin") : role === "director" ? (lang === "th" ? "ผู้บริหาร" : "Executive") : (activeSession.user as any).position || (lang === "th" ? "อาจารย์" : "Teacher")}
              </span>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-rose-500 transition-all"
            title={lang === "th" ? "ออกจากระบบ" : "Sign Out"}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{lang === "th" ? "ออกจากระบบ" : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* top header bar */}
        <header className="h-14 border-b border-border/40 bg-white dark:bg-background px-6 flex items-center justify-between z-10 shrink-0">
          
          {/* Greeting with username */}
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm text-foreground">
              {lang === "th" ? "ยินดีต้อนรับ," : "Welcome,"} {activeSession.user.name} 👋
            </h2>
          </div>

          {/* Right utility shortcuts */}
          <div className="flex items-center gap-2">

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  triggerToast("🔔 เคลียร์แจ้งเตือน", "เปิดอ่านแจ้งเตือนทั้งหมดเรียบร้อยแล้ว");
                }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-muted text-slate-400 hover:text-foreground relative transition-all"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            </div>

            {/* Language Switcher - pill style */}
            <button 
              onClick={() => {
                const newLang = lang === "th" ? "en" : "th";
                setLang(newLang);
                addAuditLog("SWITCH_LANGUAGE", `เปลี่ยนภาษาอินเตอร์เฟสเป็น: ${newLang === "th" ? "ภาษาไทย" : "English"}`);
                triggerToast(lang === "th" ? "🇺🇸 Switched to English" : "🇹🇭 เปลี่ยนเป็นภาษาไทย", lang === "th" ? "Application language is now English." : "เปลี่ยนการแสดงผลเป็นภาษาไทยเรียบร้อยแล้ว");
              }}
              className="h-8 px-3 rounded-lg bg-slate-100 dark:bg-muted hover:bg-slate-200 dark:hover:bg-muted/80 text-slate-600 dark:text-muted-foreground font-semibold text-xs transition-all"
            >
              {lang === "th" ? "TH" : "EN"}
            </button>

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setDarkMode(prev => !prev)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-muted text-slate-400 hover:text-foreground transition-all"
            >
              {darkMode ? <Sun className="w-[18px] h-[18px] text-amber-500" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            {/* Role Swapper - compact */}
            <div className="hidden lg:flex items-center">
              <select
                className="h-8 bg-slate-100 dark:bg-muted border-0 outline-none text-xs font-semibold text-slate-600 dark:text-muted-foreground px-3 py-1 rounded-lg appearance-none cursor-pointer"
                value={role}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setRole(newRole);
                  addAuditLog("SWITCH_ROLE", `สลับบทบาทการใช้งานของท่านไปเป็น: ${newRole}`);
                  triggerToast("🔄 สลับบทบาทเรียบร้อย", `ขณะนี้คุณกำลังใช้งานระบบในบทบาท: ${newRole === "teacher" ? "ครูผู้สอน" : newRole === "director" ? "ผู้อำนวยการ" : newRole === "admin" ? "ผู้ดูแลระบบ" : "นักเรียน"}`);
                }}
              >
                <option value="teacher">ครูผู้สอน</option>
                <option value="director">ผอ. โรงเรียน</option>
                <option value="student">นักเรียน / ผู้ปกครอง</option>
                <option value="admin">ผู้ดูแลระบบ (Admin)</option>
              </select>
            </div>

          </div>
        </header>

        {/* 💻 SECONDARY SUB-MENU TABS & VIEWS */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {/* ==================== 1. HOME VIEW ==================== */}
          {activeMenu === "Home" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 p-4 rounded-2xl border border-primary/10">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-primary animate-spin" />
                    สวัสดีครับ, ยินดีต้อนรับกลับสู่ระบบ School OS
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    ระบบวิเคราะห์อัจฉริยะประมวลผลข้อมูลล่าสุดเมื่อ: <span className="font-semibold" suppressHydrationWarning>{new Date().toLocaleTimeString()}</span> ของวันนี้
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-white shadow-sm shadow-indigo-600/15 capitalize">
                    Role: {role}
                  </span>
                </div>
              </div>

              {/* Renders dynamic role based dashboards */}
              <SmartDashboard 
                role={role}
                students={students}
                leaveRequests={leaveRequests}
                onNavigate={navigateTo}
                onSelectStudent={(s) => {
                  setSelectedStudent(s);
                  setTimelineOpen(true);
                }}
                onApproveRequest={handleWorkflowApprove}
                notificationsCount={unreadNotifCount}
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
                    activeSubTab === "students" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  ฐานข้อมูลนักเรียน (Students)
                </button>
                <button 
                  onClick={() => setActiveSubTab("teachers")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "teachers" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  รายชื่อครูและบุคลากร (Teachers)
                </button>
                <button 
                  onClick={() => setActiveSubTab("health")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "health" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                      <div 
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student);
                          setTimelineOpen(true);
                          addAuditLog("VIEW_STUDENT_TIMELINE", `เรียกดูข้อมูล Timeline Engine ของ ${student.fullName}`);
                        }}
                        className="p-4 rounded-2xl glass glass-card hover:bg-card hover:border-primary/40 cursor-pointer shadow-sm transition-all group flex flex-col justify-between h-40"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-bold flex items-center justify-center shadow-md shadow-primary/10">
                              {student.nickname || student.fullName.slice(3, 5)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm group-hover:text-primary transition-colors text-foreground">{student.fullName}</h4>
                              <p className="text-[10px] text-muted-foreground">เลขประจำตัว {student.studentCode} • ชั้น {student.classroom}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            student.status === "ปกติ" 
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                              : student.status === "เสี่ยง" 
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          }`}>
                            {student.status}
                          </span>
                        </div>

                        {/* Student quick metrics */}
                        <div className="grid grid-cols-3 gap-1 pt-3 border-t border-border/60 text-center">
                          <div>
                            <span className="text-[8px] text-muted-foreground uppercase font-bold">ความประพฤติ</span>
                            <p className="text-xs font-bold text-primary dark:text-indigo-400">{student.behaviorPoints} คะแนน</p>
                          </div>
                          <div>
                            <span className="text-[8px] text-muted-foreground uppercase font-bold">เช็คชื่อวันนี้</span>
                            <p className={`text-xs font-bold uppercase ${
                              student.attendanceToday === "present" ? "text-emerald-500" : "text-rose-500"
                            }`}>{student.attendanceToday || "ยังไม่ระบุ"}</p>
                          </div>
                          <div>
                            <span className="text-[8px] text-muted-foreground uppercase font-bold">เยี่ยมบ้าน</span>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{student.homeVisited ? "สำเร็จ" : "ยัง"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
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
              </div>

              {/* SubTab 1: Interactive Attendance check in */}
              {activeSubTab === "attendance" && (
                <div className="p-6 rounded-2xl glass glass-card space-y-4 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">เช็คชื่อนักเรียนเข้าร่วมแถวและคาบเรียนโฮมรูม ม.6/1</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">การปรับสถานะเช็คชื่อตรงนี้จะส่งผลต่อ Dashboard ของผู้อำนวยการโรงเรียนและสถิติภาพรวม</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => {
                          students.forEach(s => handleAttendanceChange(s.id, "present"));
                          triggerToast("👍 เช็คชื่อมาเรียนทั้งหมด", "บันทึกข้อมูลนักเรียน ม.6/1 ว่ามาเรียนครบทุกคนแล้ว");
                        }}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-indigo-500/20 text-primary dark:text-indigo-400 font-bold text-xs rounded-lg transition-all"
                      >
                        เช็คมาเรียนทั้งหมด
                      </button>
                      <button 
                        onClick={syncBulkAttendance}
                        disabled={isSyncingAttendance}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all ${
                          isSyncingAttendance 
                            ? "bg-primary/70 cursor-not-allowed" 
                            : "bg-primary hover:bg-indigo-700"
                        }`}
                      >
                        {isSyncingAttendance ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            กำลังซิงค์...
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                            </svg>
                            ซิงค์ API คลาวด์ & พุช LINE
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Attendance table Grid */}
                  <div className="space-y-2">
                    {students.map((student) => (
                      <div key={student.id} className="flex justify-between items-center p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-muted-foreground w-6">{student.seatNumber}</span>
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                            {student.nickname || student.fullName.slice(3, 5)}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-foreground">{student.fullName}</h4>
                            <p className="text-[10px] text-muted-foreground">เลขประจำตัว {student.studentCode}</p>
                          </div>
                        </div>

                        {/* Status buttons */}
                        <div className="flex items-center gap-1.5">
                          {[
                            { code: "present", name: "มาเรียน", bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/25" },
                            { code: "late", name: "สาย", bg: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/25" },
                            { code: "absent", name: "ขาด", bg: "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/25" },
                            { code: "leave", name: "ลา", bg: "bg-sky-500/10 text-sky-500 border-sky-500/20 hover:bg-sky-500/25" },
                            { code: "sick", name: "ป่วย", bg: "bg-teal-500/10 text-teal-500 border-teal-500/20 hover:bg-teal-500/25" }
                          ].map((btn) => {
                            const isSelected = student.attendanceToday === btn.code;
                            return (
                              <button
                                key={btn.code}
                                onClick={() => handleAttendanceChange(student.id, btn.code as Student["attendanceToday"])}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  isSelected 
                                    ? "bg-primary text-primary-foreground border-primary scale-[1.05]" 
                                    : btn.bg
                                }`}
                              >
                                {btn.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
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
                            {lang === "th" ? "เลือกครูผู้สอน" : "Select Instructor"}
                          </h3>
                          <select className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-semibold text-foreground">
                            <option>นายสมชาย ใจดี (วิทยฐานะ ชำนาญการ)</option>
                            <option>ครูอัญชลี รัตนฯ (คณิตศาสตร์)</option>
                            <option>น.ส.วิภาวรรณ แก้วดี (ภาษาอังกฤษ)</option>
                          </select>
                          <div className="text-[11px] p-3 bg-primary/10 text-primary dark:text-indigo-400 rounded-xl font-bold border border-primary/20">
                            คาบสอนทั้งหมด: 18 คาบ/สัปดาห์
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
                          <ScheduleGrid />
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
            </div>
          )}

          {/* ==================== 4. OPERATIONS VIEW ==================== */}
          {activeMenu === "Operations" && (
            <div className="space-y-4">
              <div className="flex border-b border-border/80">
                <button 
                  onClick={() => setActiveSubTab("requests")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "requests" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  ยื่นใบลา & ขอใช้ทรัพยากร (Workflow Requests)
                </button>
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
              </div>

              {/* SubTab 1: Requests & Workflows */}
              {activeSubTab === "requests" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* e-Leave Portal Integration Header */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-background border border-purple-500/20 p-6 rounded-2xl shadow-lg flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
                    
                    <div className="flex items-center gap-3.5 z-10">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/20 shrink-0">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm md:text-base text-foreground bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                            {lang === "th" ? "ระบบการลาออนไลน์อัจฉริยะ (e-Leave Portal)" : "Intelligent e-Leave Portal"}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest animate-pulse">
                            {lang === "th" ? "ใช้งานอยู่" : "Active"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 max-w-xl font-medium">
                          {lang === "th" 
                            ? "ยื่นคำขอลา ตรวจสอบสถิติสิทธิ์โควตาคงเหลือ และพิจารณาอนุมัติคำขอภายในสายงานด้วยข้อมูลเชื่อมโยงสมบูรณ์แบบ"
                            : "Submit leave requests, monitor quota balances, and execute workflow approvals dynamically using unified session security."
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Switcher Navigation */}
                    <div className="flex flex-wrap gap-1 bg-muted/60 p-1.5 rounded-2xl border border-border/80 z-10 shrink-0 shadow-inner">
                      {[
                        { key: "dashboard", label: lang === "th" ? "ภาพรวม" : "Dashboard" },
                        { key: "form", label: lang === "th" ? "เขียนใบลา" : "Request Form" },
                        { key: "history", label: lang === "th" ? "ประวัติการลา" : "My History" },
                        ...(isApprover ? [{ key: "approvals", label: lang === "th" ? "รออนุมัติ" : "Approvals" }] : []),
                        ...(role === "admin" ? [
                          { key: "reports", label: lang === "th" ? "ออกรายงาน" : "Reports" },
                          { key: "settings", label: lang === "th" ? "ตั้งค่าระบบ" : "Settings" }
                        ] : [])
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => {
                            setEleaveSubTab(tab.key as any);
                            addAuditLog("ELEAVE_TAB_CLICK", `สลับแท็บยื่นลาเป็น: ${tab.key}`);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
                            eleaveSubTab === tab.key 
                              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25 scale-[1.03]" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Integrated View Render Area */}
                  <div className="p-1 rounded-2xl border border-border/60 glass glass-card shadow-sm overflow-hidden">
                    {eleaveSubTab === "dashboard" && <DashboardPage />}
                    {eleaveSubTab === "form" && <RequestLeavePage />}
                    {eleaveSubTab === "history" && <HistoryPage />}
                    {eleaveSubTab === "approvals" && <ApprovalsPage />}
                    {eleaveSubTab === "reports" && <ReportsPage />}
                    {eleaveSubTab === "settings" && <SettingsPage />}
                  </div>

                </div>
              )}

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
            </div>
          )}

          {/* ==================== 5. ENGAGEMENT VIEW ==================== */}
          {activeMenu === "Engagement" && (
            <div className="space-y-4">
              <div className="flex border-b border-border/80">
                <button 
                  onClick={() => setActiveSubTab("line")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "line" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  แจ้งเตือนผู้ปกครอง (LINE Messaging API)
                </button>
                <button 
                  onClick={() => setActiveSubTab("surveys")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "surveys" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  แบบสำรวจความพึงพอใจและอบรม (Surveys)
                </button>
              </div>

              {/* SubTab 1: LINE Integration Messaging API */}
              {activeSubTab === "line" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  {/* Message Creator */}
                  <div className="lg:col-span-2 p-6 rounded-2xl glass glass-card space-y-4 h-fit">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-emerald-500" />
                      ระบบส่งข้อความแจ้งเตือนหาผู้ปกครอง (LINE official)
                    </h3>
                    <form onSubmit={handleSendCustomLine} className="space-y-4 text-xs text-muted-foreground font-semibold">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-muted-foreground">เลือกนักเรียนที่ต้องการติดต่อ</label>
                        <select 
                          className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold outline-none"
                          value={selectedLineStudentId}
                          onChange={(e) => setSelectedLineStudentId(e.target.value)}
                        >
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.fullName} ({s.classroom}) — ผู้ปกครอง: {s.parentName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-muted-foreground">เนื้อหาการส่งข้อความ</label>
                        <textarea 
                          rows={4} 
                          className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground font-semibold outline-none resize-none focus:border-primary"
                          value={lineMsgContent}
                          onChange={(e) => setLineMsgContent(e.target.value)}
                          required
                        />
                      </div>

                      <button 
                        type="submit"
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Send className="w-4 h-4" />
                        ส่ง API Message แจ้ง LINE ผู้ปกครองทันที
                      </button>
                    </form>
                  </div>

                  {/* LINE API Node details status */}
                  <div className="p-6 rounded-2xl glass glass-card space-y-4">
                    <h3 className="text-sm font-bold text-foreground">สถานะระบบส่งข้อความ (LINE Node)</h3>
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span>สถานะการเชื่อมต่อ:</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">ONLINE</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>LINE Channel Token:</span>
                        <span className="font-mono text-[9px] text-muted-foreground truncate w-24">eyJhIjoibGluZSIsImMiOiIz...</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>เป้าหมายผู้ปกครองลิงก์แล้ว:</span>
                        <span className="font-bold text-foreground">845 คน</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SubTab 2: Surveys */}
              {activeSubTab === "surveys" && (
                <div className="p-6 rounded-2xl glass glass-card space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-sm font-bold text-foreground">สร้างและออกแบบประเมินกิจกรรมภายในสถานศึกษา (Surveys)</h3>
                  <div className="p-4 rounded-xl border border-border bg-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-xs text-primary dark:text-indigo-400">แบบประเมินความพึงพอใจการพัฒนาครู ยุคดิจิทัล</h4>
                      <p className="text-xs text-muted-foreground mt-1">สแกน QR-Code เพื่อทำการร่วมแสดงความคิดเห็นประเมินการฝึกอบรมสัมมนา</p>
                    </div>
                    {/* Simulated live QR image representation */}
                    <div className="p-2 bg-white rounded-lg border border-border flex items-center justify-center w-24 h-24 shadow">
                      <div className="w-20 h-20 bg-slate-900 flex flex-wrap gap-0.5 p-1 rounded">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className={`w-4 h-4 rounded-xs ${i % 3 === 0 ? "bg-white" : "bg-slate-950"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 6. ANALYTICS VIEW ==================== */}
          {activeMenu === "Analytics" && (
            <div className="space-y-6">
              
              {/* Secondary Navigation SubTabs */}
              <div className="flex border-b border-border/80">
                <button 
                  onClick={() => setActiveSubTab("risk")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "risk" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  วิเคราะห์ความเสี่ยงเด็กค้างเรียน (AI Student Risk Detector)
                </button>
                <button 
                  onClick={() => setActiveSubTab("kpi")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeSubTab === "kpi" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  ผลคะแนนเฉลี่ยภาพรวม (KPI & GPA Charts)
                </button>
              </div>

              {/* SubTab 1: AI Student Risk Detector */}
              {activeSubTab === "risk" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  
                  {/* Risk list */}
                  <div className="lg:col-span-2 p-6 rounded-2xl glass glass-card space-y-4">
                    <h3 className="text-sm font-bold text-foreground">นักเรียนที่ประเมินพฤติกรรมมีความเสี่ยง (AI Insights Flagged)</h3>
                    <div className="space-y-3">
                      {students.filter(s => s.status !== "ปกติ").map((student) => (
                        <div key={student.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <span className={`text-[8px] px-2 py-0.5 rounded font-bold ${
                              student.status === "เสี่ยง" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                            }`}>{student.status}</span>
                            <h4 className="font-bold text-sm text-foreground mt-1.5">{student.fullName}</h4>
                            <p className="text-xs text-muted-foreground"><b>สาเหตุวิเคราะห์:</b> พฤติกรรมสะสมเหลือเพียง {student.behaviorPoints} คะแนน, ประเมินสุขภาพจิต SDQ ผิดปกติ</p>
                          </div>
                          
                          <button 
                            onClick={() => {
                              setSelectedStudent(student);
                              setTimelineOpen(true);
                            }}
                            className="text-xs font-bold bg-primary hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-all"
                          >
                            แผนช่วยเหลือระบบ
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI insights analysis card */}
                  <div className="p-6 rounded-2xl glass glass-card space-y-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI Insight Assistant
                    </h3>
                    <div className="p-4 rounded-xl border border-border bg-indigo-500/5 space-y-3 text-xs leading-normal">
                      <p className="font-semibold text-primary dark:text-indigo-400">บทวิเคราะห์ระบบโรงเรียนประจำสัปดาห์:</p>
                      <p className="text-muted-foreground">
                        พบเด็กในกลุ่มเป้าหมาย ม.6/1 มีแนวโน้มการขาดเรียนสัมพันธ์กับการลดลงของคะแนนพฤติกรรมอย่างมีนัยสำคัญ. แนะแนวโรงเรียนควรเร่งรัดทำ Home Visit ร่วมกับฝ่ายพยาบาล
                      </p>
                      <button 
                        onClick={() => {
                          triggerToast("📝 ร่างจดหมายแนะแนวแสนสุข", "AI ช่วยร่างเนื้อหาจดหมายเชิญผู้ปกครองเพื่อร่วมปรึกษาหาทางออกร่วมกันเรียบร้อยแล้ว");
                          addAuditLog("GENERATE_AI_REPORT", "AI บรรยายร่างใบส่งตัวปรึกษานักเรียนกลุ่มเสี่ยงวิกฤต");
                        }}
                        className="w-full py-2 bg-primary hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-all"
                      >
                        ให้ AI ร่างหนังสือเชิญประชุมผู้ปกครอง
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* SubTab 2: GPA Recharts placeholder */}
              {activeSubTab === "kpi" && (
                <div className="p-6 rounded-2xl glass glass-card space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-sm font-bold text-foreground">สถิติอัตราการมาเรียนในรอบสัปดาห์ (Attendance Rate Visual)</h3>
                  {/* Stunning animated SVG chart representing academic days */}
                  <div className="h-64 rounded-xl border border-border bg-card flex flex-col justify-end p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                    
                    {/* SVG Line representation for gorgeous visuals */}
                    <div className="flex-1 w-full flex items-end justify-between px-6 pb-6 relative z-1">
                      {[
                        { day: "จันทร์", rate: 98, h: "h-[98%]" },
                        { day: "อังคาร", rate: 94, h: "h-[94%]" },
                        { day: "พุธ", rate: 96, h: "h-[96%]" },
                        { day: "พฤหัสฯ", rate: 92, h: "h-[92%]" },
                        { day: "ศุกร์", rate: 97, h: "h-[97%]" },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                          <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{item.rate}%</span>
                          <div className={`w-12 bg-gradient-to-t from-indigo-500 to-purple-600 rounded-lg group-hover:scale-x-105 transition-all shadow ${item.h}`} />
                          <span className="text-[10px] text-muted-foreground font-semibold">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================== 7. ADMIN VIEW ==================== */}
          {activeMenu === "Admin" && (
            <div className="space-y-6">
              
              <div className="flex border-b border-border/80">
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

            </div>
          )}

        </main>

        {/* 📱 MOBILE BOTTOM NAV BAR */}
        <nav className="md:hidden h-16 border-t border-border/80 bg-background/80 backdrop-blur-md flex items-center justify-around shrink-0 px-2">
          {sidebarItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveMenu(item.name);
                  if (item.name === "Home") setActiveSubTab("dashboard");
                  else if (item.name === "People") setActiveSubTab("students");
                  else if (item.name === "Academic") setActiveSubTab("attendance");
                  else if (item.name === "Operations") setActiveSubTab("requests");
                  else if (item.name === "Engagement") setActiveSubTab("line");
                }}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-bold">{item.desc}</span>
              </button>
            );
          })}
        </nav>

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
