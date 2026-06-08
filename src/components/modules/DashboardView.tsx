"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import SmartDashboard from "@/components/SmartDashboard";
import { Teacher, LeaveRequest, UserRole } from "@/types/school-os";

interface DashboardViewProps {
  role: UserRole;
  lang: "th" | "en";
  students: any[];
  leaveRequests: LeaveRequest[];
  navigateTo: (menu: string, subTab?: string) => void;
  setSelectedStudent: (student: any) => void;
  setTimelineOpen: (isOpen: boolean) => void;
  handleWorkflowApprove: (requestId: string, decision: "APPROVED" | "REJECTED") => void;
  unreadNotifCount: number;
}

export default function DashboardView({
  role,
  lang,
  students,
  leaveRequests,
  navigateTo,
  setSelectedStudent,
  setTimelineOpen,
  handleWorkflowApprove,
  unreadNotifCount
}: DashboardViewProps) {
  return (
    <div className="space-y-4">
      <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative z-10">
          <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-primary" />
            {lang === "th" ? "สวัสดีครับ, ยินดีต้อนรับกลับสู่ระบบ School OS" : "Hello, Welcome back to School OS"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === "th" ? "ระบบวิเคราะห์อัจฉริยะประมวลผลข้อมูลล่าสุดเมื่อ:" : "Smart system last processed at:"}{" "}
            <span className="font-semibold" suppressHydrationWarning>{new Date().toLocaleTimeString()}</span>{" "}
            {lang === "th" ? "ของวันนี้" : "today"}
          </p>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 capitalize">
            Role: {role}
          </span>
        </div>
      </div>

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
      />
    </div>
  );
}
