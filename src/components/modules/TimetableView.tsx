"use client";

import React from "react";
import { Calendar } from "lucide-react";

// Import integrated timetable sub-pages
import TimetableDashboard from "@/app/timetables/dashboard/page";
import SchedulePage from "@/app/timetables/schedule/page";
import TeachersPage from "@/app/timetables/teachers/page";
import ClassroomsPage from "@/app/timetables/classrooms/page";
import RoomsPage from "@/app/timetables/rooms/page";
import SubstitutesPage from "@/app/timetables/substitutes/page";
import PeriodsPage from "@/app/timetables/periods/page";
import BackupsPage from "@/app/timetables/backups/page";
import ActivitiesPage from "@/app/timetables/activities/page";
import CurriculumsPage from "@/app/timetables/curriculums/page";
import WorkloadsPage from "@/app/timetables/workloads/page";
import TimetableSettingsPage from "@/app/timetables/settings/page";

interface TimetableViewProps {
  role: string;
  lang: "th" | "en";
  subTab: string;
  setSubTab: (tab: any) => void;
}

export default function TimetableView({ role, lang, subTab, setSubTab }: TimetableViewProps) {
  const isAdmin = role === "admin" || role === "director";

  const tabs = [
    { key: "dashboard", label: lang === "th" ? "ภาพรวม" : "Dashboard" },
    { key: "schedule", label: lang === "th" ? "จัดตารางสอน" : "Scheduler" },
    { key: "curriculums", label: lang === "th" ? "หลักสูตร" : "Curriculums" },
    { key: "workloads", label: lang === "th" ? "ภาระงานสอน" : "Workloads" },
    { key: "activities", label: lang === "th" ? "กิจกรรม/บล็อกคาบ" : "Activities" },
    { key: "teachers", label: lang === "th" ? "ครูผู้สอน" : "Teachers" },
    { key: "classrooms", label: lang === "th" ? "ชั้นเรียน" : "Classrooms" },
    { key: "rooms", label: lang === "th" ? "ห้องเรียน" : "Rooms" },
    { key: "substitutes", label: lang === "th" ? "สอนแทน" : "Substitutes" },
    { key: "periods", label: lang === "th" ? "คาบเรียน" : "Periods" },
    ...(isAdmin ? [
      { key: "settings", label: lang === "th" ? "ตั้งค่าสิทธิ์" : "Settings" },
      { key: "backups", label: lang === "th" ? "สำรองข้อมูล" : "Backups" }
    ] : [])
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/80 pb-2 gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm md:text-base text-foreground">
            {lang === "th" ? "ระบบจัดตารางสอนและบริการวิชาการ" : "Timetable & Academic Scheduler"}
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

      <div className="p-5 md:p-6 rounded-2xl border border-border/60 bg-card overflow-hidden">
        {subTab === "dashboard" && <TimetableDashboard />}
        {subTab === "schedule" && <SchedulePage />}
        {subTab === "teachers" && <TeachersPage />}
        {subTab === "classrooms" && <ClassroomsPage />}
        {subTab === "rooms" && <RoomsPage />}
        {subTab === "substitutes" && <SubstitutesPage />}
        {subTab === "periods" && <PeriodsPage />}
        {subTab === "backups" && <BackupsPage />}
        {subTab === "activities" && <ActivitiesPage />}
        {subTab === "curriculums" && <CurriculumsPage />}
        {subTab === "workloads" && <WorkloadsPage />}
        {subTab === "settings" && <TimetableSettingsPage />}
      </div>
    </div>
  );
}
