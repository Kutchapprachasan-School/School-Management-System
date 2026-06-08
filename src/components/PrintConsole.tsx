"use client";

import React, { useState, useEffect } from "react";
import { X, Settings2, Printer, Type, AlignLeft, Layout, ArrowDownToLine, ZoomIn, ZoomOut } from "lucide-react";

interface PrintConsoleProps {
  title?: string;
  htmlContent: string; // The HTML layout to render inside A4 page preview
  onClose: () => void;
}

export default function PrintConsole({
  title = "รายงานระบบทะเบียนโรงเรียน",
  htmlContent,
  onClose
}: PrintConsoleProps) {
  // Styling States
  const [selectedFont, setSelectedFont] = useState("Sarabun"); // Sarabun, Noto Sans Thai, Prompt, Inter, Kanit
  const [fontSize, setFontSize] = useState("14px");
  const [lineHeight, setLineHeight] = useState("1.6");
  const [marginSize, setMarginSize] = useState("20mm");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [zoom, setZoom] = useState(100);

  // Dynamically load Google Font families
  useEffect(() => {
    const fontId = `google-font-${selectedFont}`;
    if (!document.getElementById(fontId)) {
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      
      let fontParam = "";
      if (selectedFont === "Sarabun") fontParam = "Sarabun:wght@300;400;600;700";
      else if (selectedFont === "Noto Sans Thai") fontParam = "Noto+Sans+Thai:wght@300;400;600;700";
      else if (selectedFont === "Prompt") fontParam = "Prompt:wght@300;400;600;700";
      else if (selectedFont === "Kanit") fontParam = "Kanit:wght@300;400;600";
      else if (selectedFont === "Inter") fontParam = "Inter:wght@400;600;700";

      if (fontParam) {
        link.href = `https://fonts.googleapis.com/css2?family=${fontParam}&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [selectedFont]);

  const handlePrint = () => {
    // Generate isolated print stylesheet and run window.print
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const fontDeclaration = selectedFont === "Inter"
      ? "font-family: 'Inter', sans-serif;"
      : `font-family: '${selectedFont}', sans-serif;`;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun&family=Noto+Sans+Thai&family=Prompt&family=Kanit&family=Inter&display=swap">
          <style>
            @page {
              size: A4 ${orientation};
              margin: ${marginSize};
            }
            body {
              margin: 0;
              padding: 0;
              ${fontDeclaration}
              font-size: ${fontSize};
              line-height: ${lineHeight};
              color: #000;
              background: #fff;
            }
            @media print {
              html, body {
                width: 210mm;
                height: 297mm;        
              }
            }
          </style>
        </head>
        <body onload="window.print();window.close()">
          <div>${htmlContent}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getFontFamilyStyle = () => {
    return { fontFamily: `'${selectedFont}', sans-serif` };
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex flex-col h-screen select-none font-sans">
      
      {/* Top Header Bar */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Printer className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-xs font-bold text-slate-850 dark:text-white">{title}</h2>
            <p className="text-[10px] text-slate-500">พิมพ์เอกสารและรายงานสารบรรณด้วยระบบ HTML Preview Pipeline</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 mr-2">
            <button
              onClick={() => setZoom(z => Math.max(50, z - 10))}
              className="p-1 rounded text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold px-2 font-mono text-slate-600 dark:text-slate-400">{zoom}%</span>
            <button
              onClick={() => setZoom(z => Math.min(150, z + 10))}
              className="p-1 rounded text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="h-9 px-4.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            พิมพ์ไฟล์ / บันทึก PDF
          </button>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace split panel */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side styling controls panel */}
        <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 overflow-y-auto space-y-5 flex-col flex shrink-0">
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-white border-b pb-3 border-slate-150 dark:border-slate-800">
            <Settings2 className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-xs">ตั้งค่าสไตล์การพิมพ์ (Typography & Layout)</h3>
          </div>

          {/* Font Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Type className="w-3 h-3 text-slate-400" /> รูปแบบฟอนต์ (Font Family)
            </label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs px-2 font-semibold"
            >
              <option value="Sarabun">Sarabun (ทางการไทย)</option>
              <option value="Noto Sans Thai">Noto Sans Thai (ทันสมัย)</option>
              <option value="Prompt">Prompt (โมเดิร์นไร้หัว)</option>
              <option value="Kanit">Kanit (ยอดนิยม)</option>
              <option value="Inter">Inter (ภาษาอังกฤษ)</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <AlignLeft className="w-3 h-3 text-slate-400" /> ขนาดอักษร (Font Size)
            </label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs px-2 font-semibold"
            >
              <option value="12px">12px (เล็ก - บันทึกแนบ)</option>
              <option value="14px">14px (ปกติ - มาตรฐานราชการ)</option>
              <option value="16px">16px (เด่น - ประกาศทั่วไป)</option>
              <option value="18px">18px (ใหญ่ - หัวเรื่องหลัก)</option>
            </select>
          </div>

          {/* Line Height */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <AlignLeft className="w-3 h-3 text-slate-400" /> ระยะห่างบรรทัด (Line Height)
            </label>
            <select
              value={lineHeight}
              onChange={(e) => setLineHeight(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs px-2 font-semibold"
            >
              <option value="1.2">1.2 (แน่น - มีตารางข้อมูลเยอะ)</option>
              <option value="1.4">1.4 (พอดี - อ่านง่ายสบายตา)</option>
              <option value="1.6">1.6 (มาตรฐานหนังสือทั่วไป)</option>
              <option value="1.8">1.8 (ห่าง - เอกสารเขียนตอบ)</option>
            </select>
          </div>

          {/* Margins */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Layout className="w-3 h-3 text-slate-400" /> ระยะขอบกระดาษ (Margins)
            </label>
            <select
              value={marginSize}
              onChange={(e) => setMarginSize(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-955 text-xs px-2 font-semibold"
            >
              <option value="10mm">10mm (ขอบแคบสุด)</option>
              <option value="15mm">15mm (ขอบแคบมาตรฐาน)</option>
              <option value="20mm">20mm (มาตรฐานการพิมพ์)</option>
              <option value="25mm">25mm (ขอบกว้างทางการ)</option>
            </select>
          </div>

          {/* Page orientation */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Layout className="w-3 h-3 text-slate-400" /> แนวตั้ง / แนวนอน (Orientation)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrientation("portrait")}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                  orientation === "portrait"
                    ? "bg-primary text-white border-primary"
                    : "bg-card border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                แนวตั้ง (Portrait)
              </button>
              <button
                type="button"
                onClick={() => setOrientation("landscape")}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                  orientation === "landscape"
                    ? "bg-primary text-white border-primary"
                    : "bg-card border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                แนวนอน (Landscape)
              </button>
            </div>
          </div>
        </aside>

        {/* Right side live rendering panel */}
        <main className="flex-1 bg-slate-100 dark:bg-slate-950 p-6 overflow-auto flex items-start justify-center">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all text-slate-900 dark:text-slate-100 relative print-sheet text-left"
            style={{
              width: orientation === "portrait" ? "210mm" : "297mm",
              minHeight: orientation === "portrait" ? "297mm" : "210mm",
              padding: marginSize,
              fontSize: fontSize,
              lineHeight: lineHeight,
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              ...getFontFamilyStyle()
            }}
          >
            {/* Real HTML Content injection */}
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        </main>
      </div>
    </div>
  );
}
