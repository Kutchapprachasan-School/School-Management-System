"use client";

import React, { useState } from "react";
import { Search, Plus, Edit3, Key, Trash2, ShieldAlert, UserCheck, UserX, X, ChevronDown, Users, UserSquare2, Heart, CreditCard, Calendar } from "lucide-react";
import { Student, Teacher, HealthVisit } from "@/types/school-os";
import HealthCenter from "./people/HealthCenter";
import PayrollSsrManager from "./people/PayrollSsrManager";

import { 
  createUserByAdmin, 
  updateUserProfile, 
  suspendUser, 
  approveUser, 
  deleteUser, 
  resetUserPasswordByAdmin 
} from "@/app/actions/admin";
import {
  createStudent,
  updateStudent,
  deleteStudent
} from "@/app/actions/student";

interface PeopleViewProps {
  lang: "th" | "en";
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  teachers: Teacher[];
  refreshDbData: () => Promise<void>;
  setSelectedStudent: (student: Student) => void;
  setTimelineOpen: (isOpen: boolean) => void;
  addAuditLog: (action: string, details: string) => void;
  healthVisits: HealthVisit[];
  setHealthVisits: React.Dispatch<React.SetStateAction<HealthVisit[]>>;
  triggerToast: (title: string, desc: string) => void;
  triggerLineNotification: (target: string, msg: string, studentName: string) => void;
  role: string;
  userName: string;
}

export default function PeopleView({
  lang,
  activeSubTab,
  setActiveSubTab,
  students,
  setStudents,
  teachers,
  refreshDbData,
  setSelectedStudent,
  setTimelineOpen,
  addAuditLog,
  healthVisits,
  setHealthVisits,
  triggerToast,
  triggerLineNotification,
  role,
  userName
}: PeopleViewProps) {
  const [studentRoomFilter, setStudentRoomFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  // --- Modals State ---
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isEditTeacherOpen, setIsEditTeacherOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);

  // --- Form States (Teachers) ---
  const [teacherId, setTeacherId] = useState("");
  const [teacherNameForm, setTeacherNameForm] = useState("");
  const [teacherEmailForm, setTeacherEmailForm] = useState("");
  const [teacherPasswordForm, setTeacherPasswordForm] = useState("");
  const [teacherPositionForm, setTeacherPositionForm] = useState("ครูผู้สอน");
  const [teacherSubjectGroupForm, setTeacherSubjectGroupForm] = useState("ทั่วไป");
  const [teacherEmpCodeForm, setTeacherEmpCodeForm] = useState("");
  const [teacherPhoneForm, setTeacherPhoneForm] = useState("");
  const [teacherDutyDayForm, setTeacherDutyDayForm] = useState("วันจันทร์");
  const [teacherAdvisoryForm, setTeacherAdvisoryForm] = useState("");
  const [newPasswordForm, setNewPasswordForm] = useState("");

  // --- Form States (Students) ---
  const [studentId, setStudentId] = useState("");
  const [studentCodeForm, setStudentCodeForm] = useState("");
  const [studentNameForm, setStudentNameForm] = useState("");
  const [studentNicknameForm, setStudentNicknameForm] = useState("");
  const [studentClassroomForm, setStudentClassroomForm] = useState("ม.6/1");
  const [studentStatusForm, setStudentStatusForm] = useState<"ปกติ" | "เสี่ยง" | "ช่วยเหลือเร่งด่วน">("ปกติ");
  const [studentParentNameForm, setStudentParentNameForm] = useState("");
  const [studentParentPhoneForm, setStudentParentPhoneForm] = useState("");
  const [studentHomeVisitedForm, setStudentHomeVisitedForm] = useState(false);

  // --- Teacher CRUD Handlers ---
  const openEditTeacher = (t: any) => {
    setTeacherId(t.id);
    setTeacherNameForm(t.fullName || "");
    setTeacherEmailForm(t.email || "");
    setTeacherPositionForm(t.position || "ครูผู้สอน");
    setTeacherSubjectGroupForm(t.department || t.subjectGroup || "ทั่วไป");
    setTeacherEmpCodeForm(t.employeeCode || "");
    setTeacherPhoneForm(t.phone || "");
    setTeacherDutyDayForm(t.dutyDay || "วันจันทร์");
    setTeacherAdvisoryForm(t.advisoryClass || "");
    setIsEditTeacherOpen(true);
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createUserByAdmin({
        name: teacherNameForm,
        email: teacherEmailForm,
        password: teacherPasswordForm || "123456",
        position: teacherPositionForm,
        subjectGroup: teacherSubjectGroupForm,
        employeeCode: teacherEmpCodeForm,
        phone: teacherPhoneForm,
        dutyDay: teacherDutyDayForm,
        advisoryClass: teacherAdvisoryForm
      });
      if (res.success) {
        triggerToast("🎉 เพิ่มบุคลากรสำเร็จ", `ครู ${teacherNameForm} ได้ถูกบันทึกลงในระบบเรียบร้อย`);
        addAuditLog("CREATE_USER", `เพิ่มผู้ใช้งานใหม่โดยแอดมิน: ${teacherNameForm} (${teacherEmailForm})`);
        setIsAddTeacherOpen(false);
        // Reset form
        setTeacherNameForm("");
        setTeacherEmailForm("");
        setTeacherPasswordForm("");
        setTeacherEmpCodeForm("");
        setTeacherPhoneForm("");
        setTeacherAdvisoryForm("");
        await refreshDbData();
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + (err.message || err));
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateUserProfile(teacherId, {
        name: teacherNameForm,
        email: teacherEmailForm,
        position: teacherPositionForm,
        subjectGroup: teacherSubjectGroupForm,
        employeeCode: teacherEmpCodeForm,
        phone: teacherPhoneForm,
        dutyDay: teacherDutyDayForm,
        advisoryClass: teacherAdvisoryForm
      });
      if (res.success) {
        triggerToast("📝 อัปเดตข้อมูลบุคลากรสำเร็จ", `อัปเดตข้อมูลของครู ${teacherNameForm} เรียบร้อย`);
        addAuditLog("UPDATE_USER", `แก้ไขข้อมูลผู้ใช้โดยแอดมิน: ${teacherNameForm} (ID: ${teacherId})`);
        setIsEditTeacherOpen(false);
        await refreshDbData();
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + (err.message || err));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordForm || newPasswordForm.length < 6) {
      alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    try {
      const res = await resetUserPasswordByAdmin(teacherId, newPasswordForm);
      if (res.success) {
        triggerToast("🔑 รีเซ็ตรหัสผ่านสำเร็จ", `รีเซ็ตรหัสผ่านของครูสำเร็จแล้ว`);
        addAuditLog("RESET_PASSWORD", `รีเซ็ตรหัสผ่านของผู้ใช้ (ID: ${teacherId}) โดยแอดมิน`);
        setIsResetPasswordOpen(false);
        setNewPasswordForm("");
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + (err.message || err));
    }
  };

  const handleToggleSuspend = async (t: any) => {
    try {
      const name = t.fullName || t.email;
      if (t.isApproved) {
        const confirmText = confirm(`คุณต้องการระงับการเข้าใช้งานบัญชีของ ${name} ใช่หรือไม่?`);
        if (!confirmText) return;
        await suspendUser(t.id);
        triggerToast("🔒 ระงับบัญชีผู้ใช้งาน", `ระงับบัญชีของ ${name} สำเร็จ`);
        addAuditLog("SUSPEND_USER", `ระงับบัญชีผู้ใช้: ${name} (ID: ${t.id})`);
      } else {
        await approveUser(t.id);
        triggerToast("🔓 อนุมัติการเข้าใช้งาน", `อนุมัติบัญชีของ ${name} สำเร็จ`);
        addAuditLog("APPROVE_USER", `อนุมัติบัญชีผู้ใช้: ${name} (ID: ${t.id})`);
      }
      await refreshDbData();
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + (err.message || err));
    }
  };

  const handleDeleteTeacher = async (t: any) => {
    const name = t.fullName || t.email;
    const confirmText = confirm(`⚠️ คำเตือนร้ายแรง: คุณแน่ใจหรือไม่ว่าต้องการลบ ${name} ออกจากระบบถาวร?\nประวัติข้อมูลทั้งหมดในระบบลาและข้อมูลอื่น ๆ จะถูกลบออกด้วย!`);
    if (!confirmText) return;
    try {
      const res = await deleteUser(t.id);
      if (res.success) {
        triggerToast("🗑️ ลบข้อมูลบุคลากรสำเร็จ", `ลบข้อมูล ${name} ออกจากระบบเรียบร้อย`);
        addAuditLog("DELETE_USER", `ลบผู้ใช้ถาวร: ${name} (ID: ${t.id})`);
        await refreshDbData();
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + (err.message || err));
    }
  };

  // --- Student CRUD Handlers ---
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const gender = studentNameForm.startsWith("เด็กหญิง") || studentNameForm.startsWith("นางสาว") ? "หญิง" : "ชาย";
      const res = await createStudent({
        studentCode: studentCodeForm,
        fullName: studentNameForm,
        nickname: studentNicknameForm || undefined,
        classroom: studentClassroomForm,
        gender,
        status: studentStatusForm,
        parentName: studentParentNameForm || undefined,
        parentPhone: studentParentPhoneForm || undefined,
        homeVisited: studentHomeVisitedForm
      });

      if (res.success) {
        triggerToast("🎉 เพิ่มข้อมูลนักเรียนสำเร็จ", `บันทึกข้อมูล ${studentNameForm} สำเร็จ`);
        addAuditLog("CREATE_STUDENT", `เพิ่มนักเรียนใหม่ลงฐานข้อมูล: ${studentNameForm} (${studentCodeForm})`);
        setIsAddStudentOpen(false);

        // Reset Form
        setStudentCodeForm("");
        setStudentNameForm("");
        setStudentNicknameForm("");
        setStudentParentNameForm("");
        setStudentParentPhoneForm("");
        setStudentHomeVisitedForm(false);
        await refreshDbData();
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + (err.message || err));
    }
  };

  const openEditStudent = (s: Student, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering row timeline click
    setStudentId(s.id);
    setStudentCodeForm(s.studentCode);
    setStudentNameForm(s.fullName);
    setStudentNicknameForm(s.nickname || "");
    setStudentClassroomForm(s.classroom);
    setStudentStatusForm(s.status);
    setStudentParentNameForm(s.parentName || "");
    setStudentParentPhoneForm(s.parentPhone || "");
    setStudentHomeVisitedForm(s.homeVisited);
    setIsEditStudentOpen(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateStudent(studentId, {
        studentCode: studentCodeForm,
        fullName: studentNameForm,
        nickname: studentNicknameForm || undefined,
        classroom: studentClassroomForm,
        status: studentStatusForm,
        parentName: studentParentNameForm || undefined,
        parentPhone: studentParentPhoneForm || undefined,
        homeVisited: studentHomeVisitedForm
      });

      if (res.success) {
        triggerToast("📝 อัปเดตข้อมูลนักเรียนสำเร็จ", `แก้ไขข้อมูลของ ${studentNameForm} สำเร็จ`);
        addAuditLog("UPDATE_STUDENT", `แก้ไขข้อมูลนักเรียน: ${studentNameForm} (ID: ${studentId})`);
        setIsEditStudentOpen(false);
        await refreshDbData();
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + (err.message || err));
    }
  };

  const handleDeleteStudent = async (s: Student, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering timeline click
    if (!confirm(`คุณแน่ใจว่าต้องการลบนักเรียน ${s.fullName} ใช่หรือไม่?`)) return;
    try {
      const res = await deleteStudent(s.id);
      if (res.success) {
        triggerToast("🗑️ ลบข้อมูลนักเรียนแล้ว", `ลบข้อมูล ${s.fullName} สำเร็จ`);
        addAuditLog("DELETE_STUDENT", `ลบข้อมูลนักเรียน: ${s.fullName} (ID: ${s.id})`);
        await refreshDbData();
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + (err.message || err));
    }
  };

  // --- Filtering lists ---
  const filteredStudents = students.filter(s => {
    const matchesRoom = studentRoomFilter === "all" || s.classroom === studentRoomFilter;
    const matchesSearch = !studentSearch || 
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) || 
      s.studentCode.includes(studentSearch) || 
      (s.nickname && s.nickname.toLowerCase().includes(studentSearch.toLowerCase()));
    return matchesRoom && matchesSearch;
  });

  const filteredTeachers = teachers.filter(t => {
    const name = t.fullName || "";
    const email = (t as any).email || "";
    const department = t.department || (t as any).subjectGroup || "";
    const empCode = t.employeeCode || "";
    const query = teacherSearch.toLowerCase();
    return !teacherSearch || 
      name.toLowerCase().includes(query) || 
      email.toLowerCase().includes(query) || 
      department.toLowerCase().includes(query) || 
      empCode.toLowerCase().includes(query);
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tabs = [
    { key: "students", label: lang === "th" ? "ฐานข้อมูลนักเรียน" : "Students Database", icon: Users },
    ...(role !== "student" ? [
      { key: "teachers", label: lang === "th" ? "รายชื่อครูและบุคลากร" : "Teachers Directory", icon: UserSquare2 },
      { key: "health", label: lang === "th" ? "ห้องพยาบาลโรงเรียน" : "Health Center", icon: Heart },
      { key: "payroll-ssr", label: lang === "th" ? "การเงิน & ประเมินตนเอง" : "Payroll & SSR", icon: CreditCard }
    ] : [])
  ];

  const activeTabObj = tabs.find(t => t.key === activeSubTab) || tabs[0];
  const ActiveIcon = activeTabObj.icon;

  return (
    <div className="space-y-4">
      {/* Sub-Tabs Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/85 pb-2 gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm md:text-base text-foreground">
            {lang === "th" ? "ระบบจัดการข้อมูลบุคลากร & นักเรียน" : "People Directory"}
          </h3>
        </div>

        {/* Desktop Pills Navigation */}
        <div className="hidden md:flex flex-wrap gap-1 bg-muted/60 p-1 rounded-xl border border-border/80">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                  isActive 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Dropdown Navigation */}
        <div className="relative w-full md:hidden z-30">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-card hover:bg-muted/40 border border-border/85 rounded-xl text-xs font-bold text-foreground transition-all shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ActiveIcon className="w-4 h-4 text-primary" />
              <span>{activeTabObj.label}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute left-0 right-0 mt-1.5 z-50 bg-card border border-border/85 rounded-xl shadow-lg p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeSubTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveSubTab(tab.key);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                        isActive 
                          ? "bg-primary/10 text-primary font-bold" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <TabIcon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* SubTab 1: Students Grid */}
      {activeSubTab === "students" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">{lang === "th" ? "รายชื่อนักเรียน" : "Students Database"}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{lang === "th" ? "คลิกแถวเพื่อดูประวัตินักเรียน หรือกดปุ่มเพิ่มเพื่อเพิ่มนักเรียนใหม่" : "Click row to view timeline, or add new students."}</p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {role === "admin" && (
                <button
                  onClick={() => setIsAddStudentOpen(true)}
                  className="h-10 px-4 rounded-xl bg-primary hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
                >
                  <Plus className="w-4 h-4" />
                  {lang === "th" ? "เพิ่มนักเรียนใหม่" : "Add Student"}
                </button>
              )}
              <select
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none text-xs font-bold text-slate-600 dark:text-muted-foreground px-3 h-10 rounded-xl cursor-pointer"
                value={studentRoomFilter}
                onChange={(e) => setStudentRoomFilter(e.target.value)}
              >
                <option value="all">ทุกห้องเรียน</option>
                <option value="ม.1/1">ม.1/1</option>
                <option value="ม.1/2">ม.1/2</option>
                <option value="ม.4/1">ม.4/1</option>
                <option value="ม.6/1">ม.6/1</option>
              </select>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={lang === "th" ? "ค้นหานักเรียน..." : "Search students..."} 
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-48 pl-9 pr-3 h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border/60 text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  <th className="px-4 py-3">{lang === "th" ? "เลขประจำตัว" : "ID"}</th>
                  <th className="px-4 py-3">{lang === "th" ? "ชื่อ-สกุล" : "Name"}</th>
                  <th className="px-4 py-3">{lang === "th" ? "ห้อง" : "Room"}</th>
                  <th className="px-4 py-3 text-center">{lang === "th" ? "ผู้ปกครอง" : "Parent"}</th>
                  <th className="px-4 py-3 text-center">{lang === "th" ? "ความประพฤติ" : "Behavior"}</th>
                  <th className="px-4 py-3 text-center">{lang === "th" ? "เยี่ยมบ้าน" : "Home Visit"}</th>
                  <th className="px-4 py-3 text-center">{lang === "th" ? "สถานะ" : "Status"}</th>
                  {role === "admin" && <th className="px-4 py-3 text-right">{lang === "th" ? "จัดการ" : "Actions"}</th>}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr 
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setTimelineOpen(true);
                      addAuditLog("VIEW_STUDENT_TIMELINE", `เรียกดูข้อมูล Timeline Engine ของ ${student.fullName}`);
                    }}
                    className="border-b border-border/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors font-semibold text-foreground group"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{student.studentCode}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                          {student.nickname || student.fullName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{student.fullName}</span>
                          {student.nickname && <span className="text-[10px] text-slate-400 font-medium">ชื่อเล่น: {student.nickname}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-650 dark:text-slate-450">{student.classroom}</td>
                    <td className="px-4 py-3.5 text-center text-xs">
                      <div className="flex flex-col items-center">
                        <span className="text-slate-650 dark:text-slate-450">{student.parentName || "-"}</span>
                        {student.parentPhone && <span className="text-[10px] text-slate-400 font-mono font-medium">{student.parentPhone}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs font-bold text-primary dark:text-indigo-400">{student.behaviorPoints}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        student.homeVisited 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                      }`}>
                        {student.homeVisited ? "เยี่ยมแล้ว" : "ยังไม่เยี่ยม"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        student.status === "ปกติ" 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : student.status === "เสี่ยง" 
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                          : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    {role === "admin" && (
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => openEditStudent(student, e)}
                            className="p-1.5 text-slate-650 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="แก้ไขข้อมูลนักเรียน"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteStudent(student, e)}
                            className="p-1.5 text-rose-600 bg-rose-50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-lg hover:bg-rose-100 transition-colors"
                            title="ลบนักเรียนถาวร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 2: Teachers Directory with Database CRUD */}
      {activeSubTab === "teachers" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Monthly Birthdays Summary */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-foreground">🎂 สรุปบุคลากรครูที่เกิดในเดือนนี้ (พฤษภาคม)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">ครูอัญชลี รัตนโกสินทร์ (เกิด 12 พ.ค.) • ครูสมเกียรติ กีฬาดี (เกิด 28 พ.ค.)</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-bold shadow-sm shadow-indigo-650/20 shrink-0">
              สุขสันต์วันเกิด 🎉
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">{lang === "th" ? "ทะเบียนครูและบุคลากรทางการศึกษา" : "Teachers & Staff Database"}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{lang === "th" ? "จัดการบัญชีบุคลากร อนุมัติการเข้าใช้งาน รีเซ็ตรหัสผ่าน และควบคุมความปลอดภัย" : "Manage roles, status, and reset passwords."}</p>
            </div>
            
            <div className="flex items-center gap-2">
              {role === "admin" && (
                <button
                  onClick={() => setIsAddTeacherOpen(true)}
                  className="h-10 px-4 rounded-xl bg-primary hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
                >
                  <Plus className="w-4 h-4" />
                  {lang === "th" ? "เพิ่มบุคลากรใหม่" : "Add Staff"}
                </button>
              )}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={lang === "th" ? "ค้นหาบุคลากร..." : "Search staff..."} 
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-48 pl-9 pr-3 h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border/60 text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  <th className="px-4 py-3">{lang === "th" ? "รหัสบุคลากร" : "Emp Code"}</th>
                  <th className="px-4 py-3">{lang === "th" ? "ชื่อ-นามสกุล" : "Name"}</th>
                  <th className="px-4 py-3">{lang === "th" ? "ตำแหน่ง" : "Position"}</th>
                  <th className="px-4 py-3">{lang === "th" ? "กลุ่มสาระ" : "Department"}</th>
                  <th className="px-4 py-3">{lang === "th" ? "วันเวรประจำสัปดาห์" : "Duty Day"}</th>
                  <th className="px-4 py-3 text-center">{lang === "th" ? "สถานะการใช้งาน" : "Status"}</th>
                  {role === "admin" && <th className="px-4 py-3 text-right">{lang === "th" ? "จัดการ" : "Actions"}</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t: any) => {
                  const dept = t.department || t.subjectGroup || "ทั่วไป";
                  return (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors font-semibold text-foreground">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{t.employeeCode || "-"}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">{t.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">{t.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-650 dark:text-slate-450">{t.position || "ครู"}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-650 dark:text-slate-455">{dept}</td>
                      <td className="px-4 py-3.5 text-xs text-primary dark:text-indigo-400">{t.dutyDay || "-"}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          t.isApproved 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse"
                        }`}>
                          {t.isApproved ? "อนุมัติแล้ว" : "ระงับสิทธิ์"}
                        </span>
                      </td>
                      {role === "admin" && (
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle suspend */}
                            <button
                              onClick={() => handleToggleSuspend(t)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                t.isApproved 
                                  ? "text-amber-600 bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30 hover:bg-amber-100" 
                                  : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100"
                              }`}
                              title={t.isApproved ? "ระงับการใช้งาน" : "เปิดใช้งานบัญชี"}
                            >
                              {t.isApproved ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                            {/* Reset Password */}
                            <button
                              onClick={() => {
                                setTeacherId(t.id);
                                setIsResetPasswordOpen(true);
                              }}
                              className="p-1.5 text-blue-600 bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900/30 rounded-lg hover:bg-blue-100 transition-colors"
                              title="รีเซ็ตรหัสผ่าน"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            {/* Edit Profile */}
                            <button
                              onClick={() => openEditTeacher(t)}
                              className="p-1.5 text-slate-600 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="แก้ไขรายละเอียด"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {/* Delete Teacher */}
                            <button
                              onClick={() => handleDeleteTeacher(t)}
                              className="p-1.5 text-rose-600 bg-rose-50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-lg hover:bg-rose-100 transition-colors"
                              title="ลบบุคลากรถาวร"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 3: Health Center Dashboard */}
      {activeSubTab === "health" && (
        <HealthCenter 
          students={students}
          healthVisits={healthVisits}
          setHealthVisits={setHealthVisits}
          addAuditLog={addAuditLog}
          triggerToast={triggerToast}
          triggerLineNotification={triggerLineNotification}
          refreshDbData={refreshDbData}
        />
      )}

      {/* SubTab 4: Payroll & Self-Evaluation */}
      {activeSubTab === "payroll-ssr" && (
        <PayrollSsrManager role={role} userName={userName} />
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODALS SECTION */}
      {/* ========================================================================= */}

      {/* 1. Add Teacher Modal */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAddTeacherOpen(false)} className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full text-slate-450"><X className="w-4 h-4" /></button>
            <h3 className="font-bold text-sm text-foreground mb-4">เพิ่มบัญชีครูและบุคลากรใหม่</h3>
            <form onSubmit={handleAddTeacher} className="space-y-4 text-xs font-semibold text-slate-650">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">ชื่อ-นามสกุล *</label>
                  <input required type="text" placeholder="เช่น ครูสมหมาย ใจดี" value={teacherNameForm} onChange={(e) => setTeacherNameForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">รหัสผ่านเริ่มต้น</label>
                  <input type="password" placeholder="เริ่มต้น 123456" value={teacherPasswordForm} onChange={(e) => setTeacherPasswordForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">อีเมลสำหรับเข้าระบบ *</label>
                  <input required type="email" placeholder="เช่น sommai@school.ac.th" value={teacherEmailForm} onChange={(e) => setTeacherEmailForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">รหัสบุคลากร</label>
                  <input type="text" placeholder="เช่น T2004" value={teacherEmpCodeForm} onChange={(e) => setTeacherEmpCodeForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">ตำแหน่ง</label>
                  <select value={teacherPositionForm} onChange={(e) => setTeacherPositionForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs cursor-pointer">
                    <option value="ครูผู้สอน">ครูผู้สอน</option>
                    <option value="หัวหน้างานบุคคล">หัวหน้างานบุคคล</option>
                    <option value="ผู้บริหาร">ผู้บริหาร</option>
                    <option value="แอดมิน">แอดมิน</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">กลุ่มสาระการเรียนรู้</label>
                  <select value={teacherSubjectGroupForm} onChange={(e) => setTeacherSubjectGroupForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs cursor-pointer">
                    <option value="ภาษาไทย">ภาษาไทย</option>
                    <option value="คณิตศาสตร์">คณิตศาสตร์</option>
                    <option value="วิทยาศาสตร์และเทคโนโลยี">วิทยาศาสตร์และเทคโนโลยี</option>
                    <option value="สังคมศึกษา ศาสนา และวัฒนธรรม">สังคมศึกษาฯ</option>
                    <option value="ภาษาต่างประเทศ">ภาษาต่างประเทศ</option>
                    <option value="สุขศึกษาและพลศึกษา">สุขศึกษาและพลศึกษา</option>
                    <option value="ศิลปะ">ศิลปะ</option>
                    <option value="การงานอาชีพ">การงานอาชีพ</option>
                    <option value="ทั่วไป">กลุ่มงานสนับสนุน/ทั่วไป</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">เบอร์โทรศัพท์</label>
                  <input type="text" placeholder="เช่น 0812345678" value={teacherPhoneForm} onChange={(e) => setTeacherPhoneForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">วันเวรประจำสัปดาห์</label>
                  <select value={teacherDutyDayForm} onChange={(e) => setTeacherDutyDayForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs cursor-pointer">
                    <option value="วันจันทร์">วันจันทร์</option>
                    <option value="วันอังคาร">วันอังคาร</option>
                    <option value="วันพุธ">วันพุธ</option>
                    <option value="วันพฤหัสบดี">วันพฤหัสบดี</option>
                    <option value="วันศุกร์">วันศุกร์</option>
                    <option value="ไม่มี">ไม่มีเวรประจำวัน</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground block">ครูประจำชั้น (ห้องเรียน)</label>
                <input type="text" placeholder="ระบุ เช่น ม.6/1 (หรือว่างไว้ถ้าไม่ได้เป็นครูประจำชั้น)" value={teacherAdvisoryForm} onChange={(e) => setTeacherAdvisoryForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs" />
              </div>

              <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md mt-2">
                บันทึกบัญชีบุคลากรใหม่
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Teacher Modal */}
      {isEditTeacherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsEditTeacherOpen(false)} className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full text-slate-450"><X className="w-4 h-4" /></button>
            <h3 className="font-bold text-sm text-foreground mb-4">แก้ไขข้อมูลรายละเอียดบุคลากร</h3>
            <form onSubmit={handleEditTeacher} className="space-y-4 text-xs font-semibold text-slate-655">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground block">ชื่อ-นามสกุล *</label>
                <input required type="text" value={teacherNameForm} onChange={(e) => setTeacherNameForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">อีเมล *</label>
                  <input required type="email" value={teacherEmailForm} onChange={(e) => setTeacherEmailForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">รหัสบุคลากร</label>
                  <input type="text" value={teacherEmpCodeForm} onChange={(e) => setTeacherEmpCodeForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">ตำแหน่ง</label>
                  <select value={teacherPositionForm} onChange={(e) => setTeacherPositionForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs cursor-pointer">
                    <option value="ครูผู้สอน">ครูผู้สอน</option>
                    <option value="หัวหน้างานบุคคล">หัวหน้างานบุคคล</option>
                    <option value="ผู้บริหาร">ผู้บริหาร</option>
                    <option value="แอดมิน">แอดมิน</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">กลุ่มสาระการเรียนรู้</label>
                  <select value={teacherSubjectGroupForm} onChange={(e) => setTeacherSubjectGroupForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs cursor-pointer">
                    <option value="ภาษาไทย">ภาษาไทย</option>
                    <option value="คณิตศาสตร์">คณิตศาสตร์</option>
                    <option value="วิทยาศาสตร์และเทคโนโลยี">วิทยาศาสตร์และเทคโนโลยี</option>
                    <option value="สังคมศึกษา ศาสนา และวัฒนธรรม">สังคมศึกษาฯ</option>
                    <option value="ภาษาต่างประเทศ">ภาษาต่างประเทศ</option>
                    <option value="สุขศึกษาและพลศึกษา">สุขศึกษาและพลศึกษา</option>
                    <option value="ศิลปะ">ศิลปะ</option>
                    <option value="การงานอาชีพ">การงานอาชีพ</option>
                    <option value="ทั่วไป">กลุ่มงานสนับสนุน/ทั่วไป</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">เบอร์โทรศัพท์</label>
                  <input type="text" value={teacherPhoneForm} onChange={(e) => setTeacherPhoneForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">วันเวรประจำสัปดาห์</label>
                  <select value={teacherDutyDayForm} onChange={(e) => setTeacherDutyDayForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs cursor-pointer">
                    <option value="วันจันทร์">วันจันทร์</option>
                    <option value="วันอังคาร">วันอังคาร</option>
                    <option value="วันพุธ">วันพุธ</option>
                    <option value="วันพฤหัสบดี">วันพฤหัสบดี</option>
                    <option value="วันศุกร์">วันศุกร์</option>
                    <option value="ไม่มี">ไม่มีเวรประจำวัน</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground block">ครูประจำชั้น (ห้องเรียน)</label>
                <input type="text" value={teacherAdvisoryForm} onChange={(e) => setTeacherAdvisoryForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs" />
              </div>

              <button type="submit" className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md mt-2">
                บันทึกการแก้ไขข้อมูล
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Reset Password Modal */}
      {isResetPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setIsResetPasswordOpen(false)} className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full text-slate-450"><X className="w-4 h-4" /></button>
            <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-1.5">
              <Key className="w-4.5 h-4.5 text-indigo-500" />
              รีเซ็ตรหัสผ่านบุคลากร
            </h3>
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs font-semibold text-slate-655">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground block">กรอกรหัสผ่านใหม่ *</label>
                <input required type="password" placeholder="รหัสผ่านใหม่ อย่างน้อย 6 ตัวอักษร" value={newPasswordForm} onChange={(e) => setNewPasswordForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono" />
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md">
                ยืนยันการตั้งรหัสผ่านใหม่
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAddStudentOpen(false)} className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full text-slate-450"><X className="w-4 h-4" /></button>
            <h3 className="font-bold text-sm text-foreground mb-4">ลงทะเบียนข้อมูลนักเรียนใหม่</h3>
            <form onSubmit={handleAddStudent} className="space-y-4 text-xs font-semibold text-slate-655">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">เลขประจำตัวนักเรียน *</label>
                  <input required type="text" placeholder="เช่น 10008" value={studentCodeForm} onChange={(e) => setStudentCodeForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">ชื่อเล่น</label>
                  <input type="text" placeholder="เช่น นนท์" value={studentNicknameForm} onChange={(e) => setStudentNicknameForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground block">ชื่อ-นามสกุลนักเรียน *</label>
                <input required type="text" placeholder="เช่น นายปฏิวัติ ใจเพชร" value={studentNameForm} onChange={(e) => setStudentNameForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">ห้องเรียน</label>
                  <select value={studentClassroomForm} onChange={(e) => setStudentClassroomForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs cursor-pointer">
                    <option value="ม.1/1">ม.1/1</option>
                    <option value="ม.1/2">ม.1/2</option>
                    <option value="ม.4/1">ม.4/1</option>
                    <option value="ม.6/1">ม.6/1</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">สถานะการดูแล</label>
                  <select value={studentStatusForm} onChange={(e) => setStudentStatusForm(e.target.value as any)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs cursor-pointer">
                    <option value="ปกติ">ปกติ (Normal)</option>
                    <option value="เสี่ยง">เสี่ยง (At Risk)</option>
                    <option value="ช่วยเหลือเร่งด่วน">ช่วยเหลือเร่งด่วน (Critical)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">ชื่อ-สกุล ผู้ปกครอง *</label>
                  <input required type="text" placeholder="เช่น นายประดิษฐ์ ใจเพชร" value={studentParentNameForm} onChange={(e) => setStudentParentNameForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">เบอร์ติดต่อผู้ปกครอง *</label>
                  <input required type="text" placeholder="เช่น 0891234567" value={studentParentPhoneForm} onChange={(e) => setStudentParentPhoneForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono" />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input type="checkbox" id="visitedAdd" checked={studentHomeVisitedForm} onChange={(e) => setStudentHomeVisitedForm(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                <label htmlFor="visitedAdd" className="text-slate-600 cursor-pointer">ได้รับการเยี่ยมบ้าน (Home Visited) แล้ว</label>
              </div>

              <button type="submit" className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md mt-2">
                ลงทะเบียนนักเรียนใหม่
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Student Modal */}
      {isEditStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsEditStudentOpen(false)} className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full text-slate-450"><X className="w-4 h-4" /></button>
            <h3 className="font-bold text-sm text-foreground mb-4">แก้ไขข้อมูลประวัตินักเรียน</h3>
            <form onSubmit={handleEditStudent} className="space-y-4 text-xs font-semibold text-slate-655">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">เลขประจำตัวนักเรียน *</label>
                  <input required type="text" value={studentCodeForm} onChange={(e) => setStudentCodeForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">ชื่อเล่น</label>
                  <input type="text" value={studentNicknameForm} onChange={(e) => setStudentNicknameForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground block">ชื่อ-นามสกุลนักเรียน *</label>
                <input required type="text" value={studentNameForm} onChange={(e) => setStudentNameForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">ห้องเรียน</label>
                  <select value={studentClassroomForm} onChange={(e) => setStudentClassroomForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs cursor-pointer">
                    <option value="ม.1/1">ม.1/1</option>
                    <option value="ม.1/2">ม.1/2</option>
                    <option value="ม.4/1">ม.4/1</option>
                    <option value="ม.6/1">ม.6/1</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">สถานะการดูแล</label>
                  <select value={studentStatusForm} onChange={(e) => setStudentStatusForm(e.target.value as any)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs cursor-pointer">
                    <option value="ปกติ">ปกติ (Normal)</option>
                    <option value="เสี่ยง">เสี่ยง (At Risk)</option>
                    <option value="ช่วยเหลือเร่งด่วน">ช่วยเหลือเร่งด่วน (Critical)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">ชื่อผู้ปกครอง *</label>
                  <input required type="text" value={studentParentNameForm} onChange={(e) => setStudentParentNameForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground block">เบอร์ติดต่อผู้ปกครอง *</label>
                  <input required type="text" value={studentParentPhoneForm} onChange={(e) => setStudentParentPhoneForm(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono" />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input type="checkbox" id="visitedEdit" checked={studentHomeVisitedForm} onChange={(e) => setStudentHomeVisitedForm(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                <label htmlFor="visitedEdit" className="text-slate-655 cursor-pointer">ได้รับการเยี่ยมบ้าน (Home Visited) แล้ว</label>
              </div>

              <button type="submit" className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md mt-2">
                บันทึกการแก้ไขประวัตินักเรียน
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
