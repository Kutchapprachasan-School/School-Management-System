"use client";

import React, { useState } from "react";
import { ChevronDown, Briefcase, FileCheck, FileText, Wrench, CalendarDays, ShieldAlert, Award, Library } from "lucide-react";
import DocumentWorkflow from "./operations/DocumentWorkflow";
import MaintenanceRequests from "./operations/MaintenanceRequests";
import ApprovalsPage from "@/app/eleave/approvals/page";
import ResourceBooking from "./operations/ResourceBooking";
import DutyScheduler from "./operations/DutyScheduler";
import ClubsManager from "./operations/ClubsManager";
import LibraryLogs from "./operations/LibraryLogs";

interface OperationsViewProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  triggerToast: (title: string, message: string) => void;
  addAuditLog: (action: string, details: string) => void;
}

export default function OperationsView({
  activeSubTab,
  setActiveSubTab,
  triggerToast,
  addAuditLog
}: OperationsViewProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Normalize default subtab from "requests" to "approvals"
  const currentTab = activeSubTab === "requests" ? "approvals" : activeSubTab;

  const tabs = [
    { key: "approvals", label: "ศูนย์อนุมัติของระบบ (Approvals)", icon: FileCheck },
    { key: "documents", label: "ระบบรับส่งหนังสือราชการ (Memo)", icon: FileText },
    { key: "maintenance", label: "แจ้งซ่อม & อุปกรณ์ ICT", icon: Wrench },
    { key: "booking", label: "จองห้องประชุม & รถ (Booking)", icon: CalendarDays },
    { key: "duty", label: "เวรปฏิบัติหน้าที่ (Duty Guard)", icon: ShieldAlert },
    { key: "clubs", label: "ตั้ง/เลือกชุมนุม (Clubs)", icon: Award },
    { key: "library", label: "สถิติห้องสมุด (Library Logs)", icon: Library }
  ];

  const activeTabObj = tabs.find(t => t.key === currentTab) || tabs[0];
  const ActiveIcon = activeTabObj.icon;

  return (
    <div className="space-y-4">
      {/* Sub-Tabs Navigation Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-border/85 pb-2 gap-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm md:text-base text-foreground">
            ระบบดำเนินงาน & ฝ่ายบริหาร (Operations)
          </h3>
        </div>

        {/* Desktop Pills Navigation */}
        <div className="hidden lg:flex flex-wrap gap-1 bg-muted/60 p-1 rounded-xl border border-border/80">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = currentTab === tab.key;
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
        <div className="relative w-full lg:hidden z-30">
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
                  const isActive = currentTab === tab.key;
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

      {currentTab === "approvals" && (
        <div className="space-y-6">
          <ApprovalsPage />
          
          <div className="border-t border-border/60 pt-6">
            <h3 className="text-sm font-bold text-foreground mb-4">หนังสือราชการที่รออนุมัติลงนาม</h3>
            <DocumentWorkflow triggerToast={triggerToast} filterOnlyPending={true} />
          </div>
        </div>
      )}

      {currentTab === "documents" && (
        <DocumentWorkflow triggerToast={triggerToast} />
      )}

      {currentTab === "maintenance" && (
        <MaintenanceRequests triggerToast={triggerToast} addAuditLog={addAuditLog} />
      )}

      {currentTab === "booking" && (
        <ResourceBooking />
      )}

      {currentTab === "duty" && (
        <DutyScheduler />
      )}

      {currentTab === "clubs" && (
        <ClubsManager />
      )}

      {currentTab === "library" && (
        <LibraryLogs />
      )}
    </div>
  );
}
