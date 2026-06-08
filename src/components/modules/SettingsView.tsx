"use client";

import React, { useState, useEffect } from "react";
import { AuditLogItem } from "@/types/school-os";
import { Search, FileText, Activity, AlertTriangle, ShieldAlert, Sparkles, Trash2, Database, ChevronLeft, ChevronRight, Save, Image as ImageIcon, Link, Users, DownloadCloud, UploadCloud, Code } from "lucide-react";

// Import e-Leave admin sub-pages
import SettingsPage from "@/app/eleave/settings/page";
import { getSystemLogs, pruneSystemLogs, adminClearAllLeaveData } from "@/app/actions/leave";
import { getSystemSettings, updateSystemSettings, updateFooter, generateBackup } from "@/app/actions/settings";
import { uploadLogo } from "@/app/actions/upload";
import { importBackupFromJson } from "@/app/actions/archive";

interface SettingsViewProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  role: string;
  auditLogs: AuditLogItem[];
  triggerToast: (title: string, message: string) => void;
  addAuditLog: (action: string, details: string) => void;
  ruleAbsenceEnabled: boolean;
  setRuleAbsenceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  ruleSdqEnabled: boolean;
  setRuleSdqEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SettingsView({
  activeSubTab,
  setActiveSubTab,
  role,
  auditLogs,
  triggerToast,
  addAuditLog,
  ruleAbsenceEnabled,
  setRuleAbsenceEnabled,
  ruleSdqEnabled,
  setRuleSdqEnabled,
}: SettingsViewProps) {
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Unified system settings states
  const [schoolName, setSchoolName] = useState("");
  const [subheader, setSubheader] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [lineGroupCode, setLineGroupCode] = useState("");
  const [lineGroupInviteUrl, setLineGroupInviteUrl] = useState("");
  const [lineChannelAccessToken, setLineChannelAccessToken] = useState("");
  const [lineTargetGroupId, setLineTargetGroupId] = useState("");
  const [footerText, setFooterText] = useState("");
  const [developerSecret, setDeveloperSecret] = useState("");
  
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingFooter, setIsSavingFooter] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const currentTab = activeSubTab === "rules" ? "general" : activeSubTab;

  // Load system settings
  useEffect(() => {
    getSystemSettings().then((data: any) => {
      if (data) {
        setSchoolName(data.schoolName || "");
        setSubheader(data.subheader || "");
        setLogoUrl(data.logoUrl || "");
        setLineGroupCode(data.lineGroupCode || "");
        setLineGroupInviteUrl(data.lineGroupInviteUrl || "");
        setLineChannelAccessToken(data.lineChannelAccessToken || "");
        setLineTargetGroupId(data.lineTargetGroupId || "");
        setFooterText(data.footerText || "");
      }
    });
  }, []);

  useEffect(() => {
    if (currentTab === "logs") {
      setLoadingLogs(true);
      getSystemLogs()
        .then((logs) => {
          setDbLogs(logs || []);
        })
        .catch((err) => {
          console.error("Failed to load database audit logs:", err);
        })
        .finally(() => {
          setLoadingLogs(false);
        });
    }
  }, [currentTab]);

  // Combine mock logs and database logs
  const mappedMockLogs = auditLogs.map((log) => {
    let dateObj;
    try {
      dateObj = new Date(log.timestamp.replace(" ", "T"));
    } catch {
      dateObj = new Date();
    }
    return {
      id: log.id,
      action: log.action,
      details: log.details,
      timestamp: dateObj,
      module: log.module,
      actor: log.actor,
      isDb: false,
    };
  });

  const mappedDbLogs = dbLogs.map((log) => {
    return {
      id: log.id,
      action: log.actionType,
      details: log.description,
      timestamp: new Date(log.createdAt),
      module: "e-Leave System",
      actor: log.userId ? `User (ID: ${log.userId.slice(0, 8)}...)` : "ระบบ / ไม่ระบุผู้กระทำ",
      isDb: true,
    };
  });

  const allLogs = [...mappedMockLogs, ...mappedDbLogs].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  // Filters
  const filteredLogs = allLogs.filter((log) => {
    const matchSearch =
      !searchTerm ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = !filterAction || log.action === filterAction;
    return matchSearch && matchAction;
  });

  const uniqueActions = Array.from(new Set(allLogs.map((log) => log.action))).filter(Boolean);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrune = async (days: number) => {
    const confirmKeyword = "PRUNE";
    const input = prompt(
      `⚠️ การแจ้งเตือนความปลอดภัย: คุณกำลังจะลบประวัติบันทึกระบบที่เก่ากว่า ${days} วัน แบบถาวร!\n` +
      `หากต้องการยืนยันการดำเนินการ กรุณาพิมพ์ "${confirmKeyword}":`
    );
    if (input !== confirmKeyword) {
      if (input !== null) {
        alert("คำค้นหายืนยันไม่ถูกต้อง ยกเลิกการล้างประวัติระบบ");
      }
      return;
    }
    try {
      await pruneSystemLogs(days);
      triggerToast("🗑️ ล้างประวัติระบบ", `ล้างประวัติที่เก่ากว่า ${days} วัน เรียบร้อยแล้ว`);
      addAuditLog("PRUNE_LOGS", `ล้างประวัติบันทึกระบบที่เก่ากว่า ${days} วัน`);
      // Reload logs
      setLoadingLogs(true);
      const updated = await getSystemLogs();
      setDbLogs(updated || []);
    } catch {
      alert("เกิดข้อผิดพลาดในการล้างประวัติ");
    }
  };

  const handleFooterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFooter(true);
    try {
      const res = await updateFooter({ footerText, developerSecret });
      if (res && (res as any).success === false) {
        triggerToast("❌ ล้มเหลว", (res as any).error || "รหัสลับนักพัฒนาไม่ถูกต้อง!");
      } else {
        triggerToast("💾 บันทึกสำเร็จ", "อัปเดต Footer เรียบร้อยแล้ว");
        addAuditLog("UPDATE_FOOTER", "อัปเดตข้อความ Footer ของระบบ");
        setDeveloperSecret("");
      }
    } catch (error: any) {
      triggerToast("❌ ข้อผิดพลาด", error.message === "Invalid Developer Secret" ? "รหัสลับนักพัฒนาไม่ถูกต้อง!" : "เกิดข้อผิดพลาด");
    } finally {
      setIsSavingFooter(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const backupString = await generateBackup();
      const blob = new Blob([backupString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sura-leave-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast("📥 สำรองข้อมูลสำเร็จ", "ดาวน์โหลดไฟล์สำรองข้อมูลเรียบร้อยแล้ว");
      addAuditLog("EXPORT_SYSTEM_BACKUP", "ส่งออกไฟล์สำรองข้อมูลระบบ");
    } catch (error) {
      triggerToast("❌ ข้อผิดพลาด", "เกิดข้อผิดพลาดในการสำรองข้อมูล");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("คำเตือน: การนำเข้าข้อมูลสำรองจะลบการตั้งค่าปัจจุบันและเขียนทับใหม่ทั้งหมด ต้องการดำเนินการต่อหรือไม่?")) {
      e.target.value = "";
      return;
    }

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonString = event.target?.result as string;
          await importBackupFromJson(jsonString);
          triggerToast("📥 นำเข้าข้อมูลสำเร็จ", "กู้คืนระบบเรียบร้อยแล้ว กำลังรีโหลด...");
          addAuditLog("IMPORT_SYSTEM_BACKUP", "นำเข้าและกู้คืนข้อมูลระบบจากไฟล์สำรอง");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (err: any) {
          triggerToast("❌ ข้อผิดพลาด", "เกิดข้อผิดพลาดในการนำเข้า: " + err.message);
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      triggerToast("❌ ข้อผิดพลาด", "เกิดข้อผิดพลาดในการอ่านไฟล์");
      setIsImporting(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm("⚠️ คำเตือนร้ายแรง: คุณกำลังจะลบ 'ข้อมูลประวัติการลาทั้งหมด' ออกจากระบบ!\nข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้ (ยกเว้นจะมี Backup)\n\nคุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?")) {
      return;
    }
    const confirmText = prompt("พิมพ์คำว่า 'CONFIRM' เพื่อยืนยันการลบข้อมูลการลาทั้งหมด:");
    if (confirmText !== 'CONFIRM') {
      triggerToast("❌ ยกเลิก", "ยกเลิกการลบข้อมูล (พิมพ์ไม่ถูกต้อง)");
      return;
    }

    setIsClearing(true);
    try {
      await adminClearAllLeaveData();
      triggerToast("🗑️ ล้างข้อมูลสำเร็จ", "ล้างข้อมูลการลาทั้งหมดเรียบร้อยแล้ว กำลังรีโหลด...");
      addAuditLog("CLEAR_ALL_LEAVE_DATA", "ลบประวัติการลาทั้งหมดในระบบ");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      triggerToast("❌ ข้อผิดพลาด", "เกิดข้อผิดพลาด: " + (error.message || "ไม่สามารถลบข้อมูลได้"));
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-tab Selection */}
      <div className="flex border-b border-border/80 overflow-x-auto pb-2 gap-1">
        <button 
          onClick={() => {
            setActiveSubTab("general");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all shrink-0 ${
            currentTab === "general" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          การตั้งค่าทั่วไป (General Settings)
        </button>
        <button 
          onClick={() => {
            setActiveSubTab("logs");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all shrink-0 ${
            currentTab === "logs" ? "border-indigo-600 text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          บันทึกประวัติและ Audit Log (System Audit Logs)
        </button>
      </div>

      {/* SubTab 1: General Settings */}
      {currentTab === "general" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* General System Settings Form */}
          <div className="p-6 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-500" />
                ตั้งค่าข้อมูลจำเพาะระบบโดยรวม (General School Configurations)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">ระบุรายละเอียดพื้นฐานประจำโรงเรียนและตราสัญลักษณ์ รวมเข้ากับกลุ่มแจ้งเตือนระบบไลน์</p>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSavingSettings(true);
                try {
                  const res = await updateSystemSettings({
                    schoolName,
                    subheader,
                    logoUrl,
                    lineGroupCode,
                    lineGroupInviteUrl,
                    lineChannelAccessToken,
                    lineTargetGroupId
                  });
                  if (res.success) {
                    triggerToast("💾 บันทึกสำเร็จ", "ระบบปรับปรุงการตั้งค่าโดยรวมแล้ว");
                    addAuditLog("UPDATE_SYSTEM_SETTINGS", `อัปเดตข้อมูลทั่วไป: ${schoolName}`);
                  } else {
                    triggerToast("❌ ล้มเหลว", (res as any).error || "ไม่สามารถอัปเดตข้อมูลได้");
                  }
                } catch (err: any) {
                  triggerToast("❌ ข้อผิดพลาด", err.message || "เกิดข้อผิดพลาด");
                } finally {
                  setIsSavingSettings(false);
                }
              }} 
              className="space-y-4 text-xs font-semibold text-muted-foreground"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* School Name */}
                <div className="space-y-1">
                  <label className="text-[10px] text-foreground block">ชื่อสถานศึกษา / โรงเรียน</label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="ใส่ชื่อโรงเรียน..."
                    className="w-full h-10 px-3.5 border border-border bg-background rounded-xl text-foreground text-xs"
                  />
                </div>

                {/* Subheader (Program Title) */}
                <div className="space-y-1">
                  <label className="text-[10px] text-foreground block">ชื่อโปรแกรม / ภาคเรียนประยุกต์</label>
                  <input
                    type="text"
                    required
                    value={subheader}
                    onChange={(e) => setSubheader(e.target.value)}
                    placeholder="เช่น ระบบจัดการบริหารหลักสูตร, แผนงานการลา"
                    className="w-full h-10 px-3.5 border border-border bg-background rounded-xl text-foreground text-xs"
                  />
                </div>

                {/* LINE Channel Access Token */}
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-foreground block">LINE Channel Access Token (สำหรับแจ้งเตือนการลา)</label>
                  <input
                    type="text"
                    value={lineChannelAccessToken}
                    onChange={(e) => setLineChannelAccessToken(e.target.value)}
                    placeholder="ใส่ Channel Access Token (Long-lived) สำหรับส่งการแจ้งเตือนการลา"
                    className="w-full h-10 px-3.5 border border-border bg-background rounded-xl text-foreground text-xs font-mono"
                  />
                </div>

                {/* LINE Target Group ID */}
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-foreground block">LINE Target Group ID (สำหรับแจ้งเตือนการลา)</label>
                  <input
                    type="text"
                    value={lineTargetGroupId}
                    onChange={(e) => setLineTargetGroupId(e.target.value)}
                    placeholder="ใส่ Group ID หรือ User ID ที่ต้องการให้รับข้อความบอทแจ้งการลา"
                    className="w-full h-10 px-3.5 border border-border bg-background rounded-xl text-foreground text-xs font-mono"
                  />
                </div>

                {/* LINE Group Code */}
                <div className="space-y-1">
                  <label className="text-[10px] text-foreground block">LINE Group Code (กลุ่มผู้ปกครองนักเรียน)</label>
                  <input
                    type="text"
                    value={lineGroupCode}
                    onChange={(e) => setLineGroupCode(e.target.value)}
                    placeholder="เช่น PARENT_ROOM_M11_CODE"
                    className="w-full h-10 px-3.5 border border-border bg-background rounded-xl text-foreground text-xs font-mono"
                  />
                </div>

                {/* LINE Invite URL */}
                <div className="space-y-1">
                  <label className="text-[10px] text-foreground block">LINE Group Invite Link (ลิงก์เข้าร่วมกลุ่ม)</label>
                  <input
                    type="text"
                    value={lineGroupInviteUrl}
                    onChange={(e) => setLineGroupInviteUrl(e.target.value)}
                    placeholder="เช่น https://line.me/ti/g/..."
                    className="w-full h-10 px-3.5 border border-border bg-background rounded-xl text-foreground text-xs font-mono"
                  />
                </div>
              </div>

              {/* School Logo */}
              <div className="p-4 rounded-xl border border-border bg-background/20 space-y-3">
                <label className="text-[10px] text-foreground block uppercase font-bold tracking-wider">ตราสัญลักษณ์โรงเรียน (School Logo)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="School Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <input
                      type="file"
                      id="school-logo-input"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingLogo(true);
                        const formData = new FormData();
                        formData.append("logo", file);
                        try {
                          const res = await uploadLogo(formData);
                          if (res.success) {
                            setLogoUrl(res.url);
                            triggerToast("🖼️ อัปโหลดโลโก้สำเร็จ", "ตราสัญลักษณ์โรงเรียนได้รับการบันทึกแล้ว");
                          } else {
                            triggerToast("❌ อัปโหลดล้มเหลว", "ไม่สามารถอัปโหลดตราสัญลักษณ์ได้");
                          }
                        } catch (err) {
                          triggerToast("❌ ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อคลาวด์อัปโหลด");
                        } finally {
                          setIsUploadingLogo(false);
                        }
                      }}
                      disabled={isUploadingLogo}
                    />
                    <label
                      htmlFor="school-logo-input"
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted/40 border border-border rounded-xl text-[10px] font-bold text-foreground transition-all shadow-sm"
                    >
                      {isUploadingLogo ? "กำลังอัปโหลด..." : "อัปโหลดภาพตราโรงเรียน"}
                    </label>
                    <p className="text-[9px] text-muted-foreground font-normal">รองรับสกุลไฟล์ PNG, JPG ขนาดไม่เกิน 2MB</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="h-10 px-5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  {isSavingSettings ? "กำลังบันทึก..." : "บันทึกรายละเอียดทั้งหมด"}
                </button>
              </div>
            </form>
          </div>

          {/* Rule Engine */}
          <div className="p-6 rounded-xl glass glass-card bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                ตั้งค่าการทำงานอัตโนมัติ (Rule Engine Builder)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">เปิด-ปิดเงื่อนไขการทำงานอัตโนมัติเมื่อเกิดกิจกรรมพฤติกรรมในโรงเรียน</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card/60 flex justify-between items-center gap-4">
                <div>
                  <h4 className="font-bold text-xs text-foreground">เงื่อนไข: เมื่อเด็กนักเรียนขาดเรียนสะสมเกิน 3 วัน</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5"><b>เหตุการณ์ตอบสนอง:</b> ยื่นหนังสือเตือนความประพฤติอัตโนมัติพร้อมส่งข้อความ SMS/LINE หาผู้ปกครอง</p>
                </div>
                <button 
                  onClick={() => {
                    setRuleAbsenceEnabled(prev => !prev);
                    triggerToast("⚙️ อัปเดตกติการะบบ", "แก้ไขสถานะกติกาอัตโนมัติสำเร็จ");
                    addAuditLog("UPDATE_RULE", "อัปเดตสถานะการเชื่อมโยง Rule Engine สำหรับสถิติการขาดเรียน");
                  }}
                  className={`w-12 h-6 rounded-full p-1 transition-all shrink-0 ${
                    ruleAbsenceEnabled ? "bg-primary flex justify-end" : "bg-slate-300 dark:bg-slate-700 flex justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card/60 flex justify-between items-center gap-4">
                <div>
                  <h4 className="font-bold text-xs text-foreground">เงื่อนไข: ผลตรวจสุขภาพจิต SDQ ผิดปกติ (กลุ่มมีปัญหา)</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5"><b>เหตุการณ์ตอบสนอง:</b> เพิ่มเคสเข้าระบบนัดหมายเยี่ยมบ้านของอาจารย์ประจำชั้นทันทีโดยไม่ต้องกรอกเพิ่ม</p>
                </div>
                <button 
                  onClick={() => {
                    setRuleSdqEnabled(prev => !prev);
                    triggerToast("⚙️ อัปเดตกติการะบบ", "แก้ไขสถานะกติกาอัตโนมัติสำเร็จ");
                    addAuditLog("UPDATE_RULE", "อัปเดตสถานะการเชื่อมโยง Rule Engine สำหรับเกณฑ์ SDQ");
                  }}
                  className={`w-12 h-6 rounded-full p-1 transition-all shrink-0 ${
                    ruleSdqEnabled ? "bg-primary flex justify-end" : "bg-slate-300 dark:bg-slate-700 flex justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>
            </div>
          </div>

          {/* Settings Page Panel */}
          {role === "admin" && (
            <div className="animate-in fade-in duration-200">
              <SettingsPage />
            </div>
          )}

          {/* Footer Settings */}
          <div className="p-6 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card space-y-4 relative overflow-hidden">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
                ตั้งค่าส่วนท้ายเว็บไซต์ (Footer Settings)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                แก้ไขข้อความลิขสิทธิ์ / ข้อมูลติดต่อส่วนล่างของเว็บไซต์ (ต้องการรหัสลับนักพัฒนาในการยืนยัน)
              </p>
            </div>

            <form onSubmit={handleFooterSubmit} className="space-y-4 text-xs font-semibold text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-foreground block">ข้อความ Footer</label>
                  <input
                    type="text"
                    required
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full h-10 px-3.5 border border-border bg-background rounded-xl text-foreground text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-foreground block flex items-center gap-1">
                    <Code className="w-3.5 h-3.5" /> Developer Secret
                  </label>
                  <input
                    type="password"
                    required
                    value={developerSecret}
                    onChange={(e) => setDeveloperSecret(e.target.value)}
                    placeholder="ระบุรหัสลับนักพัฒนา..."
                    className="w-full h-10 px-3.5 border border-border bg-background rounded-xl text-foreground text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingFooter}
                  className="h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-rose-500/10"
                >
                  <Save className="w-4 h-4" />
                  {isSavingFooter ? "กำลังตรวจสอบ..." : "ยืนยันการตั้งค่า Footer"}
                </button>
              </div>
            </form>
          </div>

          {/* Backup & Recovery and Danger Zone Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Backup & Recovery */}
            <div className="p-6 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/80 glass glass-card space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <DownloadCloud className="w-4.5 h-4.5 text-teal-500" />
                  ระบบสำรองและกู้คืนข้อมูล (System Backup & Recovery)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  สำรองข้อมูลการตั้งค่าระบบ รายชื่อ และข้อมูลทั้งหมดเป็นไฟล์ JSON หรือนำข้อมูลสำรองกลับเข้าสู่ระบบ
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50 font-bold text-xs transition-all disabled:opacity-50"
                >
                  <DownloadCloud className="w-4 h-4" />
                  {isBackingUp ? "กำลังสำรองข้อมูล..." : "ส่งออกข้อมูลระบบ (Backup)"}
                </button>

                <label className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed border-teal-200 dark:border-teal-900/50 text-teal-600 dark:text-teal-400 font-bold hover:bg-teal-50/50 dark:hover:bg-teal-950/20 cursor-pointer transition-all disabled:opacity-50 text-xs">
                  <UploadCloud className="w-4 h-4" />
                  {isImporting ? "กำลังนำเข้า..." : "นำเข้าไฟล์ข้อมูลสำรอง (Restore)"}
                  <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} disabled={isImporting} />
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-red-200 dark:border-red-900/30 glass glass-card space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-[100px] -z-10" />
              <div>
                <h3 className="text-sm font-bold text-red-655 dark:text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4.5 h-4.5" />
                  เขตอันตราย (Danger Zone)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ดำเนินการขั้นเด็ดขาดในการล้างข้อมูลประวัติระบบหรือข้อมูลสำคัญ
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearData}
                  disabled={isClearing}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all disabled:opacity-50 shadow-md shadow-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  {isClearing ? "กำลังล้างข้อมูล..." : "ลบข้อมูลประวัติการลาทั้งหมด"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Consolidated Logs */}
      {currentTab === "logs" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">สมุดบันทึกประวัติความปลอดภัยและการลา (Unified System Audit Logs)</h3>
              <p className="text-xs text-muted-foreground">บันทึกเหตุการณ์การทำงานทั่วไป และเหตุการณ์การจัดการระบบลาอย่างละเอียดตามลำดับเวลา</p>
            </div>

            {/* Pruning tool */}
            {role === "admin" && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handlePrune(Number(e.target.value));
                    e.target.value = "";
                  }
                }}
                className="h-9 px-3 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 text-xs font-bold text-red-655 dark:text-red-400 cursor-pointer outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <option value="">🧹 ล้างประวัติ (Prune Logs)</option>
                <option value="30">เก่ากว่า 30 วัน</option>
                <option value="60">เก่ากว่า 60 วัน</option>
                <option value="90">เก่ากว่า 90 วัน</option>
              </select>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาในบันทึก (รายละเอียด, ผู้กระทำ, โมดูล)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-white dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-4 rounded-xl border border-border bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-muted-foreground cursor-pointer min-w-[150px] outline-none"
            >
              <option value="">การทำงานทั้งหมด</option>
              {uniqueActions.map((act, idx) => (
                <option key={`${act}-${idx}`} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Logs List */}
          <div className="border border-border/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-xl overflow-hidden shadow-sm">
            {loadingLogs ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <Activity className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs font-semibold">กำลังดึงข้อมูลบันทึกประวัติระบบ...</span>
              </div>
            ) : paginatedLogs.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-450 text-xs font-semibold gap-2">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-650" />
                <p>ไม่พบรายการประวัติระบบที่ตรงกับเงื่อนไข</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-border/40">
                  {paginatedLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                            log.isDb 
                              ? "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" 
                              : "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550">
                            • {log.module}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-550">
                            • โดย: <b>{log.actor}</b>
                          </span>
                        </div>
                        <p className="text-foreground font-semibold leading-normal">{log.details}</p>
                      </div>
                      <div className="text-[10px] text-slate-400 shrink-0 self-end sm:self-center font-bold">
                        {log.timestamp.toLocaleString("th-TH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-border/40 bg-muted/10">
                    <div className="text-[11px] font-bold text-slate-400">
                      แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} จาก {filteredLogs.length} รายการ
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-border hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        if (totalPages > 5 && Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                          if (pageNum === 2 || pageNum === totalPages - 1) {
                            return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                              currentPage === pageNum
                                ? "bg-primary text-white shadow-sm"
                                : "border border-border hover:bg-slate-50 dark:hover:bg-slate-850"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-border hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
