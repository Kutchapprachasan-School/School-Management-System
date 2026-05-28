"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const DAYS = [
  { id: 1, name: "จันทร์", color: "bg-yellow-400/20 border-yellow-500/30 text-yellow-800 dark:text-yellow-400" },
  { id: 2, name: "อังคาร", color: "bg-pink-400/20 border-pink-500/30 text-pink-800 dark:text-pink-400" },
  { id: 3, name: "พุธ", color: "bg-green-400/20 border-green-500/30 text-green-800 dark:text-green-400" },
  { id: 4, name: "พฤหัสบดี", color: "bg-orange-400/20 border-orange-500/30 text-orange-800 dark:text-orange-400" },
  { id: 5, name: "ศุกร์", color: "bg-blue-400/20 border-blue-500/30 text-blue-800 dark:text-blue-400" },
];

const PERIODS = [
  { id: 1, name: "คาบ 1", time: "08:30 - 09:20" },
  { id: 2, name: "คาบ 2", time: "09:20 - 10:10" },
  { id: 3, name: "คาบ 3", time: "10:10 - 11:00" },
  { id: 4, name: "คาบ 4", time: "11:00 - 11:50" },
  { id: 5, name: "พักกลางวัน", time: "11:50 - 12:50", isBreak: true },
  { id: 6, name: "คาบ 5", time: "12:50 - 13:40" },
  { id: 7, name: "คาบ 6", time: "13:40 - 14:30" },
  { id: 8, name: "คาบ 7", time: "14:30 - 15:20" },
  { id: 9, name: "คาบ 8", time: "15:20 - 16:10" },
];

const initialSchedule: Record<string, any> = {
  "1-1": { subject: "ว31101", room: "ม.1/1", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  "1-2": { subject: "ว31101", room: "ม.1/1", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  "2-3": { subject: "ว31201", room: "ม.4/1", color: "bg-purple-500/10 text-purple-700 border-purple-500/30" },
  "3-6": { subject: "กิจกรรม", room: "หอประชุม", color: "bg-orange-500/10 text-orange-700 border-orange-500/30" },
};

export function ScheduleGrid() {
  const [schedule, setSchedule] = useState(initialSchedule);

  return (
    <div className="min-w-[800px]">
      <div className="grid grid-cols-[100px_repeat(9,1fr)] gap-2">
        {/* Header Row */}
        <div className="h-16 flex items-center justify-center font-bold text-muted-foreground border border-border rounded-xl bg-muted/30">
          วัน/เวลา
        </div>
        {PERIODS.map((period) => (
          <div
            key={period.id}
            className={cn(
              "h-16 flex flex-col items-center justify-center border border-border rounded-xl text-sm transition-colors",
              period.isBreak ? "bg-secondary/50 text-muted-foreground border-dashed" : "bg-muted/30 font-medium"
            )}
          >
            <span>{period.name}</span>
            <span className="text-xs text-muted-foreground mt-1">{period.time}</span>
          </div>
        ))}

        {/* Days Rows */}
        {DAYS.map((day) => (
          <div key={day.id} className="contents">
            {/* Day Header */}
            <div className={cn("h-24 flex items-center justify-center font-bold border rounded-xl shadow-sm", day.color)}>
              {day.name}
            </div>
            
            {/* Periods for that day */}
            {PERIODS.map((period) => {
              const cellId = `${day.id}-${period.id}`;
              const cellData = schedule[cellId];

              if (period.isBreak) {
                return (
                  <div key={cellId} className="h-24 flex items-center justify-center border border-dashed border-border/50 rounded-xl bg-secondary/20">
                    <span className="text-muted-foreground/50 text-sm rotate-[-45deg] font-medium">พัก</span>
                  </div>
                );
              }

              return (
                <div
                  key={cellId}
                  className={cn(
                    "h-24 border rounded-xl relative transition-all duration-200",
                    cellData 
                      ? cn("border-solid shadow-sm p-2 flex flex-col items-center justify-center cursor-pointer hover:shadow-md", cellData.color)
                      : "border-dashed border-border hover:bg-muted/50 hover:border-primary/50 cursor-pointer flex items-center justify-center group"
                  )}
                >
                  {cellData ? (
                    <>
                      <span className="font-bold text-sm text-center">{cellData.subject}</span>
                      <span className="text-xs mt-1 font-medium opacity-80">{cellData.room}</span>
                      <button className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-xs shadow-sm">
                        ×
                      </button>
                    </>
                  ) : (
                    <span className="text-muted-foreground/30 text-xs font-medium group-hover:text-primary/50 transition-colors">+ จัดลง</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
