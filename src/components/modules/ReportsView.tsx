"use client";

import React, { useState } from "react";
import { ChevronDown, BarChart3, TrendingDown, Cpu, FileText, Printer } from "lucide-react";
import RiskAnalysis from "./reports/RiskAnalysis";
import KpiCharts from "./reports/KpiCharts";
import ReportsPage from "@/app/eleave/reports/page";
import NotebookLmHub from "./reports/NotebookLmHub";
import PrintReportCenter from "./reports/PrintReportCenter";
import { Student, Teacher, LeaveRequest } from "@/types/school-os";

interface ReportsViewProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  role: string;
  students: Student[];
  teachers: Teacher[];
  classroomsList: any[];
  subjectsList: any[];
  leaveRequests: LeaveRequest[];
  setSelectedStudent: (student: Student | null) => void;
  setTimelineOpen: (isOpen: boolean) => void;
  triggerToast: (title: string, message: string) => void;
  addAuditLog: (action: string, details: string) => void;
}

export default function ReportsView({
  activeSubTab,
  setActiveSubTab,
  role,
  students,
  teachers,
  classroomsList,
  subjectsList,
  leaveRequests,
  setSelectedStudent,
  setTimelineOpen,
  triggerToast,
  addAuditLog
}: ReportsViewProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tabs = [
    { key: "risk", label: "วิเคราะห์ความเสี่ยงเด็กค้างเรียน (AI)", icon: TrendingDown },
    { key: "kpi", label: "ผลคะแนนเฉลี่ยภาพรวม (KPI)", icon: BarChart3 },
    { key: "notebooklm", label: "เชื่อมต่อ NotebookLM Hub", icon: Cpu },
    { key: "print", label: "ศูนย์พิมพ์รายงาน (Print Center)", icon: Printer },
    ...(role === "admin" ? [
      { key: "eleave_reports", label: "รายงานระบบลา (e-Leave)", icon: FileText }
    ] : [])
  ];

  const activeTabObj = tabs.find(t => t.key === activeSubTab) || tabs[0];
  const ActiveIcon = activeTabObj.icon;

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/85 pb-2 gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm md:text-base text-foreground">
            รายงาน & สรุปผลทางสถิติ (Reports & AI)
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

      {activeSubTab === "risk" && (
        <RiskAnalysis
          students={students}
          setSelectedStudent={setSelectedStudent}
          setTimelineOpen={setTimelineOpen}
          triggerToast={triggerToast}
          addAuditLog={addAuditLog}
        />
      )}

      {activeSubTab === "kpi" && (
        <KpiCharts />
      )}

      {activeSubTab === "notebooklm" && (
        <NotebookLmHub
          triggerToast={triggerToast}
          addAuditLog={addAuditLog}
        />
      )}

      {activeSubTab === "print" && (
        <PrintReportCenter
          students={students}
          teachers={teachers}
          classroomsList={classroomsList}
          subjectsList={subjectsList}
          leaveRequests={leaveRequests}
        />
      )}

      {activeSubTab === "eleave_reports" && (
        <div className="p-1 rounded-xl border border-border/60 bg-card overflow-hidden animate-in fade-in duration-200">
          <ReportsPage />
        </div>
      )}
    </div>
  );
}
