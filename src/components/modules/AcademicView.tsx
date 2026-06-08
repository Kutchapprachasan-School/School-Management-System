"use client";

import React, { useState } from "react";
import { BookOpen, Users, UserCheck, Trash2, Plus, Calendar, ChevronDown, Eye, Notebook } from "lucide-react";
import { Student, Teacher, LeaveRequest } from "@/types/school-os";
import { ScheduleGrid } from "@/components/timetable/ScheduleGrid";
import SubstitutionTab from "@/components/timetable/SubstitutionTab";
import SubjectAttendance from "./academic/SubjectAttendance";
import AssessmentGrading from "./academic/AssessmentGrading";
import LessonPlanManager from "./academic/LessonPlanManager";
import SupervisionSchedule from "./academic/SupervisionSchedule";

interface AcademicViewProps {
  lang: "th" | "en";
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  timetableSubTab: "scheduler" | "classrooms" | "subjects" | "substitutes";
  setTimetableSubTab: (tab: "scheduler" | "classrooms" | "subjects" | "substitutes") => void;
  subjectsList: any[];
  classroomsList: any[];
  teachers: Teacher[];
  students: Student[];
  leaveRequests: LeaveRequest[];
  addAuditLog: (action: string, details: string) => void;
  triggerToast: (title: string, desc: string) => void;
  triggerLineNotification: (parentName: string, msg: string, studentName: string) => void;
  handleAttendanceChange: (studentId: string, status: Student["attendanceToday"]) => void;
  handleAddSubject: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleDeleteSubject: (id: string, code: string) => Promise<void>;
  handleAddClassroom: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleDeleteClassroom: (id: string, name: string) => Promise<void>;
  role: string;
}

export default function AcademicView({
  lang,
  activeSubTab,
  setActiveSubTab,
  timetableSubTab,
  setTimetableSubTab,
  subjectsList,
  classroomsList,
  teachers,
  students,
  leaveRequests,
  addAuditLog,
  triggerToast,
  triggerLineNotification,
  handleAttendanceChange,
  handleAddSubject,
  handleDeleteSubject,
  handleAddClassroom,
  handleDeleteClassroom,
  role
}: AcademicViewProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tabs = [
    { key: "attendance", label: lang === "th" ? "บันทึกเช็คชื่อ (Attendance)" : "Attendance Tracker", icon: UserCheck },
    { key: "assessment", label: lang === "th" ? "ลงคะแนน ปพ.5 & SGS" : "Assessment & Grading", icon: BookOpen },
    { key: "lesson-plans", label: lang === "th" ? "แผนการสอน & วิจัย" : "Plans & Research", icon: Notebook },
    { key: "supervision", label: lang === "th" ? "นิเทศการสอน" : "Instruction Supervision", icon: Eye }
  ];

  const activeTabObj = tabs.find(t => t.key === activeSubTab) || tabs[0];
  const ActiveIcon = activeTabObj.icon;

  return (
    <div className="space-y-4">
      {/* Sub-Tabs Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/85 pb-2 gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm md:text-base text-foreground">
            {lang === "th" ? "วิชาการ & การประเมินผล" : "Academic Management"}
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

      {/* SubTab 1: Interactive Attendance check in */}
      {activeSubTab === "attendance" && (
        <SubjectAttendance 
          students={students}
          subjectsList={subjectsList}
          classroomsList={classroomsList}
          handleAttendanceChange={handleAttendanceChange}
          triggerToast={triggerToast}
          triggerLineNotification={triggerLineNotification}
          addAuditLog={addAuditLog}
        />
      )}


      {/* SubTab 3: Grade entries & SGS Sync */}
      {activeSubTab === "assessment" && (
        <AssessmentGrading 
          students={students}
          triggerToast={triggerToast}
          addAuditLog={addAuditLog}
        />
      )}

      {/* SubTab 4: Lesson Plan & Action Research */}
      {activeSubTab === "lesson-plans" && (
        <LessonPlanManager />
      )}

      {/* SubTab 5: Instruction Supervision */}
      {activeSubTab === "supervision" && (
        <SupervisionSchedule />
      )}
    </div>
  );
}
