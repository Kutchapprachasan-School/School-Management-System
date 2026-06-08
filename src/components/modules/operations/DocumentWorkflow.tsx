"use client";

import React, { useState, useEffect } from "react";
import { Plus, FileText, CheckCircle2, Search, Building2, Calendar, ShieldAlert } from "lucide-react";
import { getDocumentWorkflows, createDocumentWorkflow, approveDocumentWorkflow } from "@/app/actions/documents";
import { getSystemSettings } from "@/app/actions/settings";
import { useSession } from "@/lib/auth-client";

interface DocumentWorkflowProps {
  triggerToast: (title: string, message: string) => void;
  filterOnlyPending?: boolean;
}

export default function DocumentWorkflow({ triggerToast, filterOnlyPending = false }: DocumentWorkflowProps) {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [docFilter, setDocFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog State
  const [openModal, setOpenModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Memo"); // Memo, Order, Outbound, Announcement
  const [newDept, setNewDept] = useState("ฝ่ายวิชาการ");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    const res = await getDocumentWorkflows();
    if (res.success && res.data) {
      setDocuments(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
    getSystemSettings().then(setSettings).catch(console.error);
  }, []);

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      triggerToast("⚠️ ข้อผิดพลาด", "กรุณากรอกชื่อเรื่องเอกสาร");
      return;
    }

    setIsSubmitting(true);
    const res = await createDocumentWorkflow({
      title: newTitle,
      type: newType,
      department: settings?.docDeptCategoryToggle ? newDept : undefined
    });

    if (res.success) {
      triggerToast("📄 ออกเลขที่หนังสือสำเร็จ", `รหัสหนังสือ: ${res.data?.documentNo}`);
      setNewTitle("");
      setOpenModal(false);
      fetchDocs();
    } else {
      triggerToast("❌ ล้มเหลว", res.error || "ไม่สามารถออกเลขหนังสือได้");
    }
    setIsSubmitting(false);
  };

  const handleApprove = async (id: string) => {
    const res = await approveDocumentWorkflow(id);
    if (res.success) {
      triggerToast("✍ ลงนามดิจิทัลสำเร็จ", "เอกสารได้รับการลงนามอนุมัติเรียบร้อย");
      fetchDocs();
    } else {
      triggerToast("❌ อนุมัติล้มเหลว", res.error || "เกิดข้อผิดพลาด");
    }
  };

  // Filters
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.documentNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterOnlyPending) {
      return doc.status === "PENDING" && matchesSearch;
    }
    
    const matchesStatus = docFilter === "all" || doc.status === docFilter;
    return matchesSearch && matchesStatus;
  });

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "Memo": return "บันทึกข้อความ";
      case "Order": return "คำสั่ง";
      case "Outbound": return "หนังสือส่งภายนอก";
      case "Announcement": return "ประกาศ";
      default: return type;
    }
  };

  const userPosition = (session?.user as any)?.position || "";
  const canSign = userPosition === "ผู้บริหาร" || userPosition === "ผู้อำนวยการ" || (session?.user as any)?.role === "ADMIN" || userPosition === "แอดมิน";

  return (
    <div className="animate-in fade-in duration-200 space-y-4">
      <div className={filterOnlyPending ? "space-y-3" : "p-6 rounded-2xl glass-card bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-slate-800/80 space-y-4"}>
        
        {!filterOnlyPending && (
          <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
            <div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-1.5">
                งานสารบรรณ (Correspondence & Document Registry)
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">ระบบออกเลขที่และทะเบียนประวัติเอกสารราชการโรงเรียน</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="ค้นหาตามชื่อเรื่อง/เลขที่..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
              />
              <select 
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="PENDING">รอลงนาม</option>
                <option value="APPROVED">อนุมัติแล้ว</option>
              </select>
              <button 
                onClick={() => setOpenModal(true)}
                className="h-9 px-4.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/10 hover:bg-indigo-700 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                ออกเลขสารบรรณใหม่
              </button>
            </div>
          </div>
        )}

        {/* Documents Grid */}
        <div className="space-y-3 mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-350" />
              <p className="text-xs font-bold">ไม่มีรายการเอกสารสารบรรณ</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card flex flex-col md:flex-row md:items-center justify-between hover:border-primary/20 hover:shadow-sm transition-all gap-4">
                <div className="flex gap-4 items-start md:items-center">
                  <div className={`p-3 rounded-xl ${doc.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-primary/10 text-primary">
                        {getDocTypeLabel(doc.type)}
                      </span>
                      {doc.department && (
                        <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {doc.department}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs md:text-sm text-slate-800 dark:text-white mt-1.5">{doc.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-450 font-bold">
                      <span className="font-mono text-slate-500">{doc.documentNo}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-sans">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span>•</span>
                      <span>โดย: {doc.creator?.name || "ระบบ"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    doc.status === "APPROVED" 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}>
                    {doc.status === "APPROVED" ? "อนุมัติ/ลงนามแล้ว" : "รอผู้บริหารลงนาม"}
                  </span>
                  
                  {doc.status === "PENDING" && canSign && (
                    <button 
                      onClick={() => handleApprove(doc.id)}
                      className="px-3 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950/30 transition-colors text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-750"
                    >
                      กดเพื่อลงนาม
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Issuing running number modal dialog */}
      {openModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Plus className="w-5 h-5 text-primary" />
              ออกเลขทะเบียนสารบรรณ (Issue Document Run-number)
            </h3>
            
            <form onSubmit={handleCreateDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ประเภทเอกสาร</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-250 dark:border-slate-750 bg-white dark:bg-slate-850 text-xs px-3 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="Memo">บันทึกข้อความภายใน</option>
                  <option value="Order">คำสั่งโรงเรียน</option>
                  <option value="Outbound">หนังสือส่งภายนอก</option>
                  <option value="Announcement">ประกาศโรงเรียน</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อเรื่องเอกสาร</label>
                <textarea
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  rows={3}
                  placeholder="เช่น ขออนุมัติงบประมาณโครงการพัฒนาทักษะชีวิตนักเรียน..."
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-750 bg-white dark:bg-slate-850 text-xs p-3 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                  required
                />
              </div>

              {settings?.docDeptCategoryToggle && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">หน่วยงาน / ฝ่ายที่รับผิดชอบ</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-250 dark:border-slate-750 bg-white dark:bg-slate-850 text-xs px-3 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="ฝ่ายวิชาการ">ฝ่ายวิชาการ</option>
                    <option value="ฝ่ายงบประมาณ">ฝ่ายงบประมาณ</option>
                    <option value="ฝ่ายบริหารทั่วไป">ฝ่ายบริหารทั่วไป</option>
                    <option value="ฝ่ายบุคคล">ฝ่ายบุคคล</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  ออกเลขเอกสาร
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
