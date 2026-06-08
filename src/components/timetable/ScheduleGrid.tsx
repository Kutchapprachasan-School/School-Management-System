"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Printer, FileSpreadsheet, FileText, Sparkles, AlertTriangle, CheckCircle2, Loader2, X, ArrowLeftRight } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { 
  getTimetableData, 
  resolveScheduleConflicts, 
  assignSubjectToSlot, 
  removeSubjectFromSlot, 
  moveScheduleSlot, 
  optimizeTimetableWithAI, 
  swapScheduleSlots,
  findChainMovePath,
  executeChainMove
} from "@/app/actions/timetable";
import { getLunchConfig } from "@/app/actions/timetable_registry";

const DAYS = [
  { id: 1, name: "จันทร์", color: "bg-yellow-400/10 border-yellow-500/20 text-yellow-800 dark:text-yellow-400", label: "Monday" },
  { id: 2, name: "อังคาร", color: "bg-pink-400/10 border-pink-500/20 text-pink-800 dark:text-pink-400", label: "Tuesday" },
  { id: 3, name: "พุธ", color: "bg-green-400/10 border-green-500/20 text-green-800 dark:text-green-400", label: "Wednesday" },
  { id: 4, name: "พฤหัสบดี", color: "bg-orange-400/10 border-orange-500/20 text-orange-800 dark:text-orange-400", label: "Thursday" },
  { id: 5, name: "ศุกร์", color: "bg-blue-400/10 border-blue-500/20 text-blue-800 dark:text-blue-400", label: "Friday" },
];

function getDbPeriodOrder(gridPeriodId: number, lunchOrder: number): number {
  if (gridPeriodId < lunchOrder) return gridPeriodId;
  if (gridPeriodId === lunchOrder) return -1; // Lunch break slot
  return gridPeriodId - 1;
}

interface ScheduleGridProps {
  viewMode?: "classroom" | "teacher" | "room";
  viewId?: string;
  selectedTeacherId?: string;
  selectedClassroomId?: string;
  selectedRoomId?: string;
  dbPeriods?: any[];
  onScheduleUpdated?: () => void;
  onDataLoaded?: (workloads: any[]) => void;
  isAdmin?: boolean;
  selectedSubjectForAssign?: {
    workloadId: string;
    subjectId: string;
    subjectCode: string;
    userId: string;
    classroomId: string;
    roomId?: string;
    len?: number;
  } | null;
  onClearSelectedSubject?: () => void;
}

export function ScheduleGrid({
  viewMode = "classroom",
  viewId = "",
  selectedTeacherId = "",
  selectedClassroomId = "",
  selectedRoomId = "",
  dbPeriods = [],
  onScheduleUpdated,
  onDataLoaded,
  isAdmin = false,
  selectedSubjectForAssign = null,
  onClearSelectedSubject
}: ScheduleGridProps) {
  const [schedule, setSchedule] = useState<Record<string, any>>({});
  const [isSolving, setIsSolving] = useState(false);
  const [keepExisting, setKeepExisting] = useState(true);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Toast & Drawer & Highlight States
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastDetails, setToastDetails] = useState<string[]>([]);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showOverConstrainedDrawer, setShowOverConstrainedDrawer] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<any | null>(null);
  const [chainLimit, setChainLimit] = useState<number>(3); // Default to 3, options: 1, 3, 4, 5

  // Micro-interaction cell states
  const [wigglingCell, setWigglingCell] = useState<string | null>(null);
  const [successGlowCell, setSuccessGlowCell] = useState<string | null>(null);
  const [selectedSourceSlot, setSelectedSourceSlot] = useState<any | null>(null);

  // Lunch Break config state
  const [lunchConfig, setLunchConfig] = useState<any>({
    classroomLunch: {},
    teacherLunch: {},
    globalLunch: 5
  });

  const loadData = async () => {
    if (!viewId) {
      setSchedule({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const [res, lunchRes] = await Promise.all([
      getTimetableData(viewMode, viewId),
      getLunchConfig()
    ]);
    if (res.success && res.data) {
      setSchedule(res.data);
      setConflicts(res.conflicts || []);
      if (onDataLoaded) onDataLoaded(res.workloads || []);
    }
    if (lunchRes.success && lunchRes.data) {
      setLunchConfig(lunchRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    setSelectedSourceSlot(null);
  }, [viewMode, viewId]);

  // Determine which column index represents lunch for current view
  const activeLunchOrder = 
    viewMode === "classroom"
      ? (lunchConfig.classroomLunch?.[viewId] ?? lunchConfig.globalLunch ?? 5)
      : viewMode === "teacher"
        ? (lunchConfig.teacherLunch?.[viewId] ?? lunchConfig.globalLunch ?? 5)
        : (lunchConfig.globalLunch ?? 5);

  const periodsCount = dbPeriods.length || 8;
  const gridPeriods = Array.from({ length: periodsCount + 1 }, (_, i) => i + 1);

  // AI Auto Scheduling with optimizeTimetableWithAI
  const handleAISolve = async () => {
    setIsSolving(true);
    setToastMsg(null);
    setToastDetails([]);
    setSuggestions([]);
    setShowOverConstrainedDrawer(false);

    try {
      const res = await optimizeTimetableWithAI();
      if (res.success) {
        setToastMsg(res.message || "จัดตารางสอนโดย AI สำเร็จเรียบร้อยแล้ว!");
        await loadData();
        if (onScheduleUpdated) onScheduleUpdated();
      } else {
        if (res.error === "over_constrained") {
          setSuggestions(res.suggestions || []);
          setConflicts(res.conflicts || []);
          setShowOverConstrainedDrawer(true);
        } else {
          setToastMsg("เกิดข้อผิดพลาดในการจัดตาราง");
          setToastDetails([res.error || "ไม่ทราบสาเหตุ"]);
        }
      }
    } catch (e: any) {
      setToastMsg("เกิดข้อผิดพลาดภายในระบบ");
      setToastDetails([e.message]);
    } finally {
      setIsSolving(false);
    }
  };

  // Find chain move path when conflict occurs
  const handleChainMoveSearch = async (sourceScheduleId: string, day: number, periodId: string) => {
    if (chainLimit === 1) {
      setToastMsg("เกิดการชนคาบเรียน!");
      setToastDetails(["ไม่สามารถย้ายได้ เนื่องจากติดข้อจำกัดของห้องเรียน/ครูผู้สอน (ระบบถูกตั้งค่าแบบ 1-1 Swap)"]);
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const res = await findChainMovePath(sourceScheduleId, day, periodId, chainLimit);
    if (res.success && res.chain && res.chain.length > 0) {
      const chain = res.chain;
      const dayNames = ["", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์"];
      const desc = chain.map((step: any, idx: number) => {
        return `${idx + 1}. ย้าย ${step.subjectCode} (${step.classroomName}) ไปวัน${dayNames[step.toDay]} คาบ ${step.toPeriodOrder}`;
      }).join("\n → ");

      setSuggestions([
        {
          id: `chain-${Date.now()}`,
          score: 95 - chain.length * 2,
          descriptionTh: `ขยับแบบลูกโซ่ (${chain.length} ขั้น):\n${desc}`,
          isChainMove: true,
          chainDetails: chain
        }
      ]);
      setToastMsg("⚠️ เกิดการชนคาบเรียน! แต่ AI พบแนวทางขยับแบบลูกโซ่เพื่อเคลียร์ช่องนี้");
      setToastDetails(["ตรวจสอบตัวเลือกทางด้านขวาเพื่อดำเนินการขยับตารางในคลิกเดียว"]);
    } else {
      setToastMsg("ไม่สามารถย้ายได้");
      setToastDetails([res.error || "ชนข้อจำกัดเวลาและไม่พบทางออกแบบลูกโซ่"]);
      setSuggestions([]);
    }
    setLoading(false);
  };

  // Export HTML Print
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let htmlContent = `
      <html>
        <head>
          <title>ตารางสอน - SchoolOS</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; padding: 20px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: center; font-size: 13px; }
            th { background-color: #f4f6f9; font-weight: bold; }
            .day-header { font-weight: bold; background-color: #fafafa; }
            .break { background-color: #fef08a; color: #854d0e; font-style: italic; font-weight: bold; }
            .subject { font-weight: bold; color: #2d3748; }
            .room { font-size: 11px; color: #718096; margin-top: 4px; }
            .teacher { font-size: 10px; color: #4a5568; }
          </style>
        </head>
        <body>
          <h2>ตารางเรียน/ตารางสอน (${viewMode === "classroom" ? "ชั้นเรียน" : viewMode === "teacher" ? "ครูผู้สอน" : "ห้องปฏิบัติการ"})</h2>
          <p>ปีการศึกษา 2569 • ภาคเรียนที่ 1</p>
          <table>
            <thead>
              <tr>
                <th>วัน / คาบ</th>
                ${gridPeriods.map(p => {
                  if (p === activeLunchOrder) {
                    return `<th>พักกลางวัน</th>`;
                  }
                  const dbOrder = getDbPeriodOrder(p, activeLunchOrder);
                  const period = dbPeriods.find(bp => bp.order === dbOrder);
                  return `<th>คาบที่ ${dbOrder}<br><small>${period?.startTime || ""} - ${period?.endTime || ""}</small></th>`;
                }).join("")}
              </tr>
            </thead>
            <tbody>
              ${DAYS.map(day => `
                <tr>
                  <td class="day-header">${day.name}</td>
                  ${gridPeriods.map(p => {
                    if (p === activeLunchOrder) return `<td class="break">พักกลางวัน</td>`;
                    const dbOrder = getDbPeriodOrder(p, activeLunchOrder);
                    const cellData = schedule[`${day.id}-${dbOrder}`];
                    return cellData 
                      ? `<td>
                          <div class="subject">${cellData.subjectCode}</div>
                          <div class="teacher">อ.${cellData.teacherName}</div>
                          <div class="room">⊕ ${cellData.room}</div>
                         </td>`
                      : `<td>-</td>`;
                  }).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Export PDF via jsPDF
  const handleExportPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");
    doc.text(`School Timetable Report (${viewMode})`, 14, 15);
    doc.text("Semester 1/2569", 14, 22);

    const headers = [["Day / Period", ...gridPeriods.map(p => {
      if (p === activeLunchOrder) return "LUNCH";
      const dbOrder = getDbPeriodOrder(p, activeLunchOrder);
      const period = dbPeriods.find(bp => bp.order === dbOrder);
      return `คาบ ${dbOrder}\n(${period?.startTime || ""} - ${period?.endTime || ""})`;
    })]];

    const body = DAYS.map(day => {
      return [
        day.label,
        ...gridPeriods.map(p => {
          if (p === activeLunchOrder) return "LUNCH";
          const dbOrder = getDbPeriodOrder(p, activeLunchOrder);
          const cell = schedule[`${day.id}-${dbOrder}`];
          return cell ? `${cell.subjectCode}\n(อ.${cell.teacherName})\n${cell.room}` : "-";
        })
      ];
    });

    (doc as any).autoTable({
      head: headers,
      body: body,
      startY: 30,
      theme: "grid",
      styles: { fontSize: 7, halign: "center", valign: "middle" },
      columnStyles: { 0: { fontStyle: "bold" } }
    });

    doc.save(`School_Timetable_${viewMode}.pdf`);
  };

  // Export Excel via SheetJS
  const handleExportExcel = () => {
    const matrix = [
      ["วัน / คาบ", ...gridPeriods.map(p => {
        if (p === activeLunchOrder) return "พักกลางวัน";
        const dbOrder = getDbPeriodOrder(p, activeLunchOrder);
        const period = dbPeriods.find(bp => bp.order === dbOrder);
        return `คาบ ${dbOrder} (${period?.startTime || ""} - ${period?.endTime || ""})`;
      })],
      ...DAYS.map(day => [
        day.name,
        ...gridPeriods.map(p => {
          if (p === activeLunchOrder) return "พักกลางวัน";
          const dbOrder = getDbPeriodOrder(p, activeLunchOrder);
          const cell = schedule[`${day.id}-${dbOrder}`];
          return cell ? `${cell.subjectCode} (อ.${cell.teacherName}) - ${cell.room}` : "-";
        })
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(matrix);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");
    XLSX.writeFile(wb, `School_Timetable_${viewMode}.xlsx`);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, cellDataId: string) => {
    if (!isAdmin) return;
    e.dataTransfer.setData("application/json", JSON.stringify({
      type: "move",
      id: cellDataId
    }));
  };

  const handleDrop = async (e: React.DragEvent, dayId: number, gridPeriodId: number) => {
    e.preventDefault();
    setHoveredCell(null);
    if (!isAdmin) return;

    if (gridPeriodId === activeLunchOrder) {
      alert("ไม่สามารถจัดวิชาในเวลาพักกลางวันได้");
      return;
    }

    const dbOrder = getDbPeriodOrder(gridPeriodId, activeLunchOrder);
    const dbPeriod = dbPeriods.find(p => p.order === dbOrder);

    if (!dbPeriod) {
      alert("ไม่พบรหัสคาบเรียนในระบบ");
      return;
    }

    const cellId = `${dayId}-${dbOrder}`;

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;

      const dragData = JSON.parse(dataStr);
      setToastMsg(null);
      setToastDetails([]);

      if (dragData.type === "subject") {
        let userId = dragData.userId || "";
        let classroomId = dragData.classroomId || "";
        let roomId = dragData.roomId || "";

        if (viewMode === "classroom") {
          classroomId = viewId;
          if (!userId) userId = selectedTeacherId;
          if (!roomId) roomId = selectedRoomId;
        } else if (viewMode === "teacher") {
          userId = viewId;
          if (!classroomId) classroomId = selectedClassroomId;
          if (!roomId) roomId = selectedRoomId;
        } else if (viewMode === "room") {
          roomId = viewId;
          if (!userId) userId = selectedTeacherId;
          if (!classroomId) classroomId = selectedClassroomId;
        }

        if (!userId || !classroomId) {
          setToastMsg("ข้อมูลไม่ครบถ้วน");
          setToastDetails(["กรุณาเลือกครูผู้สอนและชั้นเรียนเพื่อเชื่อมโยงรายวิชาก่อนลากจัดตาราง"]);
          return;
        }

        setLoading(true);
        const res = await assignSubjectToSlot({
          dayOfWeek: dayId,
          userId,
          subjectId: dragData.subjectId,
          classroomId,
          roomId: roomId || undefined,
          periodId: dbPeriod.id
        });

        if (res.success) {
          setSuccessGlowCell(cellId);
          setTimeout(() => setSuccessGlowCell(null), 1000);
          await loadData();
          if (onScheduleUpdated) onScheduleUpdated();
        } else {
          setWigglingCell(cellId);
          setTimeout(() => setWigglingCell(null), 1200);
          setToastMsg("ไม่สามารถลงตารางเรียนได้");
          setToastDetails([res.error || "ไม่ทราบสาเหตุ"]);
        }
        setLoading(false);
      } else if (dragData.type === "move") {
        setLoading(true);
        const res = await moveScheduleSlot(dragData.id, dayId, dbPeriod.id);
        if (res.success) {
          setSuccessGlowCell(cellId);
          setTimeout(() => setSuccessGlowCell(null), 1000);
          await loadData();
          if (onScheduleUpdated) onScheduleUpdated();
        } else {
          if (chainLimit === 1) {
            // Direct 1-1 Swap on Drag & Drop conflict
            const targetCellData = schedule[cellId];
            if (targetCellData) {
              const swapRes = await swapScheduleSlots(dragData.id, targetCellData.id);
              if (swapRes.success) {
                setToastMsg("สลับคาบเรียนสำเร็จ (1-1 Swap)");
                setSuccessGlowCell(cellId);
                setTimeout(() => setSuccessGlowCell(null), 1000);
                await loadData();
                if (onScheduleUpdated) onScheduleUpdated();
              } else {
                setToastMsg("ไม่สามารถสลับคาบเรียนได้");
                setToastDetails([(swapRes as any).error || "ชนข้อจำกัดเวลาของครู/ห้องเรียน"]);
              }
            } else {
              setToastMsg("ไม่สามารถย้ายได้");
              setToastDetails([res.error || "ไม่ทราบสาเหตุ"]);
            }
          } else {
            await handleChainMoveSearch(dragData.id, dayId, dbPeriod.id);
          }
        }
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      alert("เกิดข้อผิดพลาด: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Pause & Alert Drawer for Over-constrained scenarios */}
      {showOverConstrainedDrawer && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-800 dark:text-rose-300 space-y-2.5 animate-in slide-in-from-top duration-300 shadow-md">
          <div className="flex items-center justify-between font-bold text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
              <span>[AI Pause & Alert] ตรวจพบสภาวะข้อจำกัดเกินกำหนด (Over-Constrained)! ไม่สามารถจัดคาบวิชาต่อได้โดยสมบูรณ์</span>
            </div>
            <button 
              onClick={() => setShowOverConstrainedDrawer(false)}
              className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-600 hover:text-rose-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs font-semibold pl-7 space-y-1.5 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10 max-h-[140px] overflow-y-auto custom-scrollbar">
            {conflicts.map((conf, idx) => (
              <p key={idx} dangerouslySetInnerHTML={{ __html: conf }}></p>
            ))}
          </div>
        </div>
      )}

      {/* 2. Success/Error Toast Notification */}
      {toastMsg && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-800 dark:text-indigo-300 space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg(null)} className="ml-auto text-indigo-650 hover:text-indigo-800 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          {toastDetails.length > 0 && (
            <div className="text-xs font-semibold font-mono space-y-1 pl-7 opacity-90">
              {toastDetails.map((det, idx) => (
                <p key={idx}>{det}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Database Conflict Warning Board (Standard warning) */}
      {conflicts.length > 0 && !showOverConstrainedDrawer && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-800 dark:text-rose-300 space-y-2 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span>ตรวจพบจุดขัดแย้งของคาบเรียน {conflicts.length} จุดในระบบตารางปัจจุบัน!</span>
          </div>
          <div className="text-xs font-semibold pl-7 space-y-1.5 leading-relaxed max-h-[140px] overflow-y-auto custom-scrollbar">
            {conflicts.map((conf, idx) => (
              <p key={idx} dangerouslySetInnerHTML={{ __html: conf }}></p>
            ))}
          </div>
        </div>
      )}

      {/* Main Table Layout */}
      <div className="space-y-4">
          
          {/* Control Buttons */}
          <div className="flex justify-between items-center bg-muted/20 border border-border/60 p-3.5 rounded-xl gap-2 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={handleAISolve}
                disabled={isSolving || loading || !isAdmin}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                <Sparkles className={cn("w-4 h-4", isSolving && "animate-spin")} />
                {isSolving ? "กำลังจัดตารางโดย AI..." : "ใช้ AI Auto Schedule"}
              </button>
              {isAdmin && (
                <>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keepExisting}
                      onChange={(e) => setKeepExisting(e.target.checked)}
                      className="rounded border-border text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                    />
                    จัดต่อจากตารางเดิม (Keep Existing)
                  </label>
                  
                  <div className="flex items-center gap-2 pl-3 border-l border-border/60">
                    <span className="text-xs font-bold text-slate-550 dark:text-slate-400">วิธีแก้ชนคาบ:</span>
                    <select
                      value={chainLimit}
                      onChange={(e) => setChainLimit(parseInt(e.target.value))}
                      className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-foreground cursor-pointer"
                    >
                      <option value={1}>สลับโดยตรง (1-1 Swap)</option>
                      <option value={3}>ขยับลูกโซ่ 3 ขั้น (Chain 3)</option>
                      <option value={4}>ขยับลูกโซ่ 4 ขั้น (Chain 4)</option>
                      <option value={5}>ขยับลูกโซ่ 5 ขั้น (Chain 5)</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                disabled={loading}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-border/80 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> พิมพ์ตาราง
              </button>
              <button
                onClick={handleExportPDF}
                disabled={loading}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-border/80 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-rose-500" /> PDF
              </button>
              <button
                onClick={handleExportExcel}
                disabled={loading}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-border/80 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Excel (XLSX)
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-border rounded-xl">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-xs font-bold">กำลังโหลดตารางสอนและตรวจสอบจุดขัดแย้ง...</span>
            </div>
          ) : (
            <div className="min-w-[800px] overflow-x-auto">
              <div className="grid grid-cols-[100px_repeat(9,1fr)] gap-2">
                {/* Header Row */}
                <div className="h-16 flex items-center justify-center font-bold text-muted-foreground border border-border rounded-xl bg-muted/30">
                  วัน/เวลา
                </div>
                {gridPeriods.map((p) => {
                  if (p === activeLunchOrder) {
                    return (
                      <div
                        key={`lunch-header`}
                        className="h-16 flex flex-col items-center justify-center border border-dashed border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 rounded-xl text-xs"
                      >
                        <span className="font-extrabold flex items-center gap-1">พักกลางวัน</span>
                        <span className="text-[10px] opacity-80 mt-1">12:00 - 13:00</span>
                      </div>
                    );
                  }

                  const dbOrder = getDbPeriodOrder(p, activeLunchOrder);
                  const period = dbPeriods.find(bp => bp.order === dbOrder);

                  return (
                    <div
                      key={`period-header-${p}`}
                      className="h-16 flex flex-col items-center justify-center border border-border rounded-xl text-xs bg-muted/30 font-medium"
                    >
                      <span className="font-bold">คาบที่ {dbOrder}</span>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {period?.startTime || "--:--"} - {period?.endTime || "--:--"}
                      </span>
                    </div>
                  );
                })}

                {/* Days Rows */}
                {DAYS.map((day) => (
                  <div key={day.id} className="contents">
                    {/* Day Header */}
                    <div className={cn("h-24 flex items-center justify-center font-bold border rounded-xl shadow-sm text-xs", day.color)}>
                      {day.name}
                    </div>
                    
                    {/* Periods for that day */}
                    {gridPeriods.map((p) => {
                      const cellId = `${day.id}-${p}`;
                      
                      if (p === activeLunchOrder) {
                        return (
                          <div 
                            key={`lunch-cell-${day.id}`} 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, day.id, p)}
                            className="h-24 flex items-center justify-center border border-dashed border-amber-500/20 rounded-xl bg-amber-500/[0.03] select-none"
                          >
                            <span className="text-amber-600/60 dark:text-amber-400/50 text-[11px] rotate-[-45deg] font-bold">พักกลางวัน</span>
                          </div>
                        );
                      }

                      const dbOrder = getDbPeriodOrder(p, activeLunchOrder);
                      const dbPeriod = dbPeriods.find(bp => bp.order === dbOrder);
                      const cellData = schedule[`${day.id}-${dbOrder}`];

                      if (!dbPeriod) return null;

                      // Check if hovered suggestion matches this cell's schedule id
                      const isHighlighted = hoveredSuggestion && cellData && 
                        (Array.isArray(hoveredSuggestion)
                          ? hoveredSuggestion.some((step: any) => step.id === cellData.id)
                          : (cellData.id === hoveredSuggestion.sourceSlotId || cellData.id === hoveredSuggestion.targetSlotId));

                      const isWiggling = wigglingCell === `${day.id}-${dbOrder}`;
                      const isSuccessGlow = successGlowCell === `${day.id}-${dbOrder}`;
                      const isSourceSelected = selectedSourceSlot && selectedSourceSlot.scheduleId === cellData?.id;
                      const isTargetHighlight = selectedSubjectForAssign !== null && !cellData;
                      const isMoveTargetHighlight = selectedSourceSlot && !cellData;

                      return (
                        <div
                          key={cellId}
                          draggable={isAdmin && !!cellData}
                          onDragStart={(e) => cellData && handleDragStart(e, cellData.id)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (isAdmin) setHoveredCell(cellId);
                          }}
                          onDragLeave={() => setHoveredCell(null)}
                          onDrop={(e) => handleDrop(e, day.id, p)}
                          onClick={async () => {
                            if (!isAdmin) return;

                            // 1. If in Tap-to-Place mode (subject selected from palette)
                            if (selectedSubjectForAssign) {
                              if (!cellData) {
                                setLoading(true);
                                const res = await assignSubjectToSlot({
                                  dayOfWeek: day.id,
                                  userId: selectedSubjectForAssign.userId,
                                  subjectId: selectedSubjectForAssign.subjectId,
                                  classroomId: selectedSubjectForAssign.classroomId,
                                  roomId: selectedSubjectForAssign.roomId || undefined,
                                  periodId: dbPeriod.id
                                });
                                if (res.success) {
                                  setSuccessGlowCell(`${day.id}-${dbOrder}`);
                                  setTimeout(() => setSuccessGlowCell(null), 1000);
                                  await loadData();
                                  if (onScheduleUpdated) onScheduleUpdated();
                                  onClearSelectedSubject?.();
                                } else {
                                  setWigglingCell(`${day.id}-${dbOrder}`);
                                  setTimeout(() => setWigglingCell(null), 1200);
                                  setToastMsg("ไม่สามารถลงตารางเรียนได้");
                                  setToastDetails([(res as any).error || "ไม่ทราบสาเหตุ"]);
                                }
                                setLoading(false);
                              } else {
                                // Target cell is occupied, offer to resolve via chain move
                                if (confirm(`ช่องนี้ไม่ว่าง! ต้องการให้ AI หาทางขยับแบบลูกโซ่เพื่อวางวิชาในคาบนี้แทนหรือไม่?`)) {
                                  await handleChainMoveSearch(cellData.id, day.id, dbPeriod.id);
                                }
                              }
                              return;
                            }

                            // 2. If not in Tap-to-Place mode (Manual Swap/Move)
                            if (cellData) {
                              if (selectedSourceSlot) {
                                if (selectedSourceSlot.id === cellData.id) {
                                  setSelectedSourceSlot(null);
                                } else {
                                  setLoading(true);
                                  const res = await swapScheduleSlots(selectedSourceSlot.scheduleId, cellData.id);
                                  if (res.success) {
                                    setToastMsg("สลับคาบเรียนสำเร็จ");
                                    setSelectedSourceSlot(null);
                                    await loadData();
                                    if (onScheduleUpdated) onScheduleUpdated();
                                  } else {
                                    alert("สลับคาบล้มเหลว: " + (res as any).error);
                                  }
                                  setLoading(false);
                                }
                              } else {
                                setSelectedSourceSlot({
                                  id: cellData.id,
                                  scheduleId: cellData.id,
                                  dayOfWeek: day.id,
                                  periodId: dbPeriod.id,
                                  subject: cellData.subject,
                                  classroomName: cellData.classroomName
                                });
                              }
                            } else {
                              if (selectedSourceSlot) {
                                setLoading(true);
                                const res = await moveScheduleSlot(selectedSourceSlot.scheduleId, day.id, dbPeriod.id);
                                if (res.success) {
                                  setSuccessGlowCell(`${day.id}-${dbOrder}`);
                                  setTimeout(() => setSuccessGlowCell(null), 1000);
                                  setSelectedSourceSlot(null);
                                  await loadData();
                                  if (onScheduleUpdated) onScheduleUpdated();
                                } else {
                                  await handleChainMoveSearch(selectedSourceSlot.scheduleId, day.id, dbPeriod.id);
                                }
                                setLoading(false);
                              }
                            }
                          }}
                          className={cn(
                            "h-24 border rounded-lg relative transition-all duration-250 select-none flex flex-col items-center justify-center overflow-hidden",
                            cellData 
                              ? cn("border-solid shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md", cellData.color)
                              : "border-dashed border-border hover:bg-muted/50 hover:border-primary/50 cursor-pointer group",
                            hoveredCell === cellId && !cellData && "animate-valid-pulse border-sky-400 bg-sky-500/10 scale-102 ring-2 ring-sky-350",
                            hoveredCell === cellId && cellData && "border-solid border-indigo-500 bg-indigo-500/10 scale-102 ring-2 ring-primary/20",
                            isHighlighted && "animate-gold-pulse border-amber-500 border-2 shadow-[0_0_15px_rgba(251,191,36,0.65)] ring-2 ring-amber-500/30 z-30",
                            isWiggling && "animate-collision-wiggle border-rose-500 border-2 bg-rose-500/10 text-rose-800 z-30",
                            isSuccessGlow && "animate-success-glow border-emerald-500 border-2 bg-emerald-500/10 z-30",
                            isSourceSelected && "border-indigo-500 border-2 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.6)] scale-102 ring-2 ring-indigo-500/30 z-30 animate-pulse",
                            isTargetHighlight && "border-dashed border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer border-2 shadow-[0_0_10px_rgba(16,185,129,0.2)] z-30 animate-pulse",
                            isMoveTargetHighlight && "border-dashed border-sky-500 bg-sky-500/5 hover:bg-sky-500/10 cursor-pointer border-2 shadow-[0_0_10px_rgba(14,165,233,0.2)] z-30"
                          )}
                        >
                          {cellData ? (
                            <>
                              {isAdmin && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm("ลบคาบเรียนนี้ใช่หรือไม่?")) {
                                      setLoading(true);
                                      const res = await removeSubjectFromSlot(cellData.id);
                                      if (res.success) {
                                        await loadData();
                                        if (onScheduleUpdated) onScheduleUpdated();
                                      } else {
                                        alert(res.error || "ลบล้มเหลว");
                                      }
                                      setLoading(false);
                                    }
                                  }}
                                  className="absolute top-1 right-1 p-0.5 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow z-20"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                              
                              <div className="p-2.5 text-left w-full h-full flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between gap-1 w-full">
                                    <span className={cn(
                                      "text-[9px] px-1.5 py-0.5 rounded font-black font-mono tracking-wider border",
                                      cellData.isActivity
                                        ? "bg-slate-500/10 text-slate-600 border-slate-500/20"
                                        : "bg-background/80 border-current"
                                    )}>
                                      {cellData.subjectCode}
                                    </span>
                                    {cellData.headcount !== undefined && cellData.headcount > 0 && (
                                      <span className="text-[9px] text-muted-foreground font-semibold flex items-center gap-0.5 bg-background/60 px-1 py-0.25 rounded border border-border/30">
                                        👥 {cellData.headcount}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-bold text-foreground leading-snug mt-1.5 line-clamp-1">
                                    {cellData.subject || "วิชา"}
                                  </p>
                                </div>
                                
                                <div className="mt-1">
                                  <p className="text-[10px] text-muted-foreground font-medium truncate">
                                    ครู: {cellData.teacherName}
                                  </p>
                                  <div className="flex justify-between items-center text-[9px] text-muted-foreground/90 font-semibold mt-0.5">
                                    <span className="truncate">{cellData.classroomName || "กิจกรรม"}</span>
                                    {cellData.room && cellData.room !== cellData.classroomName && (
                                      <span className="shrink-0 bg-background/50 px-1 rounded border border-border/20 text-[9px]">🚪 {cellData.room}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground/30 text-[10px] font-bold group-hover:text-primary/50 transition-colors">
                              {selectedSubjectForAssign ? "✓ วางคาบ" : selectedSourceSlot ? "✓ ย้ายที่นี่" : isAdmin ? "+ จัดคาบ" : "-"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      {/* 4. AI Optimal Swapping & Chain Move Panel - Floating bottom-right overlay */}
      {suggestions.length > 0 && (
        <div className="fixed right-6 bottom-6 z-50 shadow-2xl bg-card border border-border/85 rounded-2xl w-96 max-h-[80vh] overflow-y-auto p-5 space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="border-b border-border pb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <h3 className="text-xs font-black text-foreground">AI Optimal Solver Panel</h3>
            </div>
            <button 
              onClick={() => setSuggestions([])}
              className="p-1 hover:bg-muted rounded-lg text-slate-400 hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
            เงื่อนไขทับซ้อน! ลองเลือกทางออกแบบประหยัดแรงตารางเหล่านี้เพื่อแก้ปัญหาคาบชน:
          </p>

          <div className="space-y-3">
            {suggestions.map((rec) => (
              <div
                key={rec.id}
                onMouseEnter={() => setHoveredSuggestion(rec.isChainMove ? rec.chainDetails : rec.actionDetails)}
                onMouseLeave={() => setHoveredSuggestion(null)}
                onClick={async () => {
                  setLoading(true);
                  if (rec.isChainMove) {
                    const res = await executeChainMove(rec.chainDetails);
                    if (res.success) {
                      setToastMsg("🪄 AI ดำเนินการขยับคาบเรียนแบบลูกโซ่สำเร็จแล้ว!");
                      setSuggestions([]);
                      setHoveredSuggestion(null);
                      await loadData();
                      if (onScheduleUpdated) onScheduleUpdated();
                    } else {
                      alert("การขยับคาบล้มهلล: " + (res as any).error);
                    }
                  } else {
                    const res = await swapScheduleSlots(rec.actionDetails.sourceSlotId, rec.actionDetails.targetSlotId);
                    if (res.success) {
                      setToastMsg("🪄 AI ดำเนินการสลับคาบเรียนสำเร็จ!");
                      setSuggestions([]);
                      setHoveredSuggestion(null);
                      await loadData();
                      if (onScheduleUpdated) onScheduleUpdated();
                    } else {
                      alert("การสลับคาบล้มเหลว: " + (res as any).error);
                    }
                  }
                  setLoading(false);
                }}
                className="p-3 border border-border/80 rounded-xl bg-muted/20 hover:bg-amber-400/5 hover:border-amber-400/60 cursor-pointer transition-all duration-200 group text-xs text-foreground/90 font-semibold"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-500/20 flex items-center gap-1">
                    <ArrowLeftRight className="w-3 h-3" />
                    ความเหมาะสม {rec.score}%
                  </span>
                  <span className="text-[9px] text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    ดำเนินการ →
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors font-medium whitespace-pre-line">
                  {rec.descriptionTh}
                </p>
              </div>
            ))}
          </div>
          <div className="text-[9.5px] p-2.5 rounded-lg bg-amber-500/5 text-amber-700 dark:text-amber-300/80 border border-amber-500/10 font-medium">
            💡 นำเมาส์ไปชี้กล่องเพื่อดูไฮไลต์ขอบทองคาบทั้งหมดที่จะโดนสลับหรือเคลื่อนย้ายแบบลูกโซ่
          </div>
        </div>
      )}
    </div>
  );
}
