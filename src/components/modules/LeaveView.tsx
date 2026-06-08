"use client";

import React from "react";
import { FileText, LayoutDashboard, History, CheckSquare, FileSpreadsheet, Activity, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Import integrated eLeave sub-pages
import DashboardPage from "@/app/eleave/dashboard/page";
import RequestLeavePage from "@/app/eleave/request/page";
import HistoryPage from "@/app/eleave/history/page";
import ApprovalsPage from "@/app/eleave/approvals/page";
import ReportsPage from "@/app/eleave/reports/page";
import SettingsPage from "@/app/eleave/settings/page";
import LogsLeavePage from "@/app/eleave/logs/page";

interface LeaveViewProps {
  role: string;
  lang: "th" | "en";
  subTab: string;
  setSubTab: (tab: any) => void;
}

export default function LeaveView({ role, lang, subTab, setSubTab }: LeaveViewProps) {
  const { t } = useI18n();
  const isApprover = role === "admin" || role === "director";

  const tabs = [
    { key: "dashboard", label: lang === "th" ? "ภาพรวม" : "Dashboard" },
    { key: "form", label: lang === "th" ? "เขียนใบลา" : "Request" },
    { key: "history", label: lang === "th" ? "ประวัติ" : "History" },
    ...(isApprover ? [{ key: "approvals", label: lang === "th" ? "รออนุมัติ" : "Approvals" }] : []),
    ...(role === "admin" ? [
      { key: "logs", label: lang === "th" ? "ประวัติระบบ" : "Logs" },
      { key: "reports", label: lang === "th" ? "รายงาน" : "Reports" },
      { key: "settings", label: lang === "th" ? "ตั้งค่า" : "Settings" }
    ] : [])
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm md:text-base text-foreground">
            {lang === "th" ? "ระบบการลาออนไลน์ (e-Leave)" : "e-Leave Online System"}
          </h3>
        </div>
        {/* Switcher Navigation */}
        <div className="flex flex-wrap gap-1 bg-muted/60 p-1 rounded-xl border border-border/80">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                subTab === tab.key 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-1 rounded-2xl border border-border/60 bg-card overflow-hidden">
        {subTab === "dashboard" && <DashboardPage />}
        {subTab === "form" && <RequestLeavePage />}
        {subTab === "history" && <HistoryPage />}
        {subTab === "approvals" && <ApprovalsPage />}
        {subTab === "logs" && <LogsLeavePage />}
        {subTab === "reports" && <ReportsPage />}
        {subTab === "settings" && <SettingsPage />}
      </div>
    </div>
  );
}
