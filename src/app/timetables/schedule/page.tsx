import { CalendarDays, Save } from "lucide-react";
import { ScheduleGrid } from "@/components/timetable/ScheduleGrid";

export default function SchedulePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            จัดตารางสอน
          </h2>
          <p className="text-muted-foreground mt-1">
            ลากและวาง (Drag & Drop) รายวิชาลงในช่องตารางสอน
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors border border-border">
            เลือกครูผู้สอน
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
            <Save className="mr-2 h-4 w-4" />
            บันทึกตารางสอน
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h3 className="font-semibold text-lg">ตารางสอน: นายสมชาย ใจดี (วิทยฐานะ ชำนาญการ)</h3>
          <div className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full font-medium border border-primary/20">
            คาบสอนทั้งหมด: 18 คาบ/สัปดาห์
          </div>
        </div>
        <div className="p-6 overflow-x-auto">
          <ScheduleGrid />
        </div>
      </div>
      
      {/* Subjects Palette (for drag and drop source) */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">รายวิชาที่สอนได้ (ลากลงตาราง)</h3>
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-2 bg-blue-500/10 text-blue-700 border border-blue-500/20 rounded-lg cursor-grab hover:bg-blue-500/20 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            ว31101 วิทยาศาสตร์ (ม.1/1)
          </div>
          <div className="px-4 py-2 bg-green-500/10 text-green-700 border border-green-500/20 rounded-lg cursor-grab hover:bg-green-500/20 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            ว31101 วิทยาศาสตร์ (ม.1/2)
          </div>
          <div className="px-4 py-2 bg-purple-500/10 text-purple-700 border border-purple-500/20 rounded-lg cursor-grab hover:bg-purple-500/20 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            ว31201 ดาราศาสตร์ (ม.4/1)
          </div>
        </div>
      </div>
    </div>
  );
}
