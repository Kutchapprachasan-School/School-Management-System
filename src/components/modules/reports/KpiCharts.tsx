"use client";

import React from "react";

export default function KpiCharts() {
  return (
    <div className="p-6 rounded-xl glass glass-card space-y-4 animate-in fade-in duration-200">
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
  );
}
