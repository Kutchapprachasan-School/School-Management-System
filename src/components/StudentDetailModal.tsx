"use client";

import React, { useState } from "react";
import { 
  X, User, Users, Home, Award, Calendar, HeartPulse, MapPin, Phone, 
  Briefcase, GraduationCap, ShieldAlert, FileText, Heart, CheckCircle2,
  Clock, Star, ExternalLink, Activity, Sparkles, Map
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StudentDetailModalProps {
  student: any;
  isOpen: boolean;
  onClose: () => void;
  lang?: "th" | "en";
}

export default function StudentDetailModal({
  student,
  isOpen,
  onClose,
  lang = "th"
}: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "family" | "homevisit" | "behavior">("general");

  if (!isOpen || !student) return null;

  // Extract father, mother, guardian records
  const familyMembers = student.profile?.familyMembers || [];
  const father = familyMembers.find((m: any) => m.relation === "บิดา");
  const mother = familyMembers.find((m: any) => m.relation === "มารดา");
  const guardian = familyMembers.find((m: any) => m.relation === "ผู้ปกครอง");

  // Get other members
  const siblingsAndOthers = familyMembers.filter(
    (m: any) => m.relation !== "บิดา" && m.relation !== "มารดา" && m.relation !== "ผู้ปกครอง"
  );

  const getBmiColor = (bmi: number) => {
    if (bmi < 18.5) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    if (bmi >= 18.5 && bmi < 23) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (bmi >= 23 && bmi < 25) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  const getSdqRiskColor = (risk: string) => {
    switch (risk) {
      case "ปกติ":
      case "NORMAL":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "เสี่ยง":
      case "BORDERLINE":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ปกติ":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "เสี่ยง":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl h-[90vh] md:h-[80vh] overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-950/95 border border-slate-200/60 dark:border-slate-800/80 shadow-2xl flex flex-col z-10 text-slate-800 dark:text-slate-100"
      >
        {/* Header background glow */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-150/60 dark:border-slate-850/60 shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            {/* Student Photo */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105">
              {student.profileImage || student.profile?.profileImage ? (
                <img 
                  src={student.profileImage || student.profile?.profileImage} 
                  alt={student.fullName} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-650 flex items-center justify-center text-white font-black text-xl">
                  {student.nickname || student.fullName.slice(3, 5)}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-lg leading-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  {student.fullName}
                </h2>
                {student.nickname && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    ({student.nickname})
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(student.status || "ปกติ")}`}>
                  {student.status || "ปกติ"}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span>
                  {lang === "th" 
                    ? `ชั้น ${student.classroom} • เลขประจำตัว ${student.studentCode} • เลขที่ ${student.seatNumber || "-"}` 
                    : `Class ${student.classroom} • Student ID ${student.studentCode} • No. ${student.seatNumber || "-"}`
                  }
                </span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-150/60 dark:border-slate-850/60 px-6 shrink-0 bg-slate-50/40 dark:bg-slate-900/10 gap-2 overflow-x-auto scrollbar-none">
          {[
            { key: "general", label: lang === "th" ? "ข้อมูลทั่วไป" : "General Info", icon: User },
            { key: "family", label: lang === "th" ? "ข้อมูลครอบครัว" : "Family Profile", icon: Users },
            { key: "homevisit", label: lang === "th" ? "บันทึกเยี่ยมบ้าน" : "Home Visit", icon: Home },
            { key: "behavior", label: lang === "th" ? "พฤติกรรม & SDQ" : "Behavior & SDQ", icon: Award }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 -mb-[2px] ${
                  isActive 
                    ? "border-primary text-primary" 
                    : "border-transparent text-slate-450 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            {/* Tab 1: General Info */}
            {activeTab === "general" && (
              <motion.div 
                key="general"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Visual Grid Cards (similar to behavior timeline overview) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{lang === "th" ? "คะแนนพฤติกรรม" : "Conduct Points"}</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-primary">{student.behaviorPoints || 100}</span>
                      <span className="text-[10px] text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{lang === "th" ? "ดัชนีมวลกาย BMI" : "BMI"}</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-2xl font-black">{student.bmi || "-"}</span>
                      {student.bmiStatus && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getBmiColor(student.bmi || 20)}`}>
                          {student.bmiStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{lang === "th" ? "ส่วนสูง / น้ำหนัก" : "Height / Weight"}</span>
                    <span className="text-sm font-bold mt-3.5 text-slate-700 dark:text-slate-300">
                      {student.height ? `${student.height} cm` : "-"} / {student.weight ? `${student.weight} kg` : "-"}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{lang === "th" ? "ความเสี่ยงคัดกรอง SDQ" : "SDQ Screening"}</span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border w-fit mt-3 ${getSdqRiskColor(student.sdqRisk || "ปกติ")}`}>
                      {student.sdqRisk || "ปกติ"}
                    </span>
                  </div>
                </div>

                {/* Profile Grid Detail */}
                <div className="rounded-2xl border border-slate-150/60 dark:border-slate-850/60 p-5 space-y-4 shadow-sm bg-card/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" />
                    {lang === "th" ? "ประวัตินักเรียนและทะเบียนข้อมูลทั่วไป" : "Student Registry & Personal Information"}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60">
                      <span className="text-slate-400">{lang === "th" ? "เลขประจำตัวประชาชน / G-Code:" : "National ID / G-Code:"}</span>
                      <span className="text-slate-800 dark:text-white font-mono font-bold">{student.nationalId || student.profile?.nationalId || "-"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60">
                      <span className="text-slate-400">{lang === "th" ? "วันเดือนปีเกิด:" : "Date of Birth:"}</span>
                      <span className="text-slate-800 dark:text-white font-bold">{student.birthDate || student.profile?.birthDate ? new Date(student.birthDate || student.profile.birthDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "-"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60">
                      <span className="text-slate-400">{lang === "th" ? "สัญชาติ / เชื้อชาติ / ศาสนา:" : "Nationality / Race / Religion:"}</span>
                      <span className="text-slate-800 dark:text-white font-bold">
                        {student.nationality || student.profile?.nationality || "ไทย"} • {student.race || student.profile?.race || "ไทย"} • {student.religion || student.profile?.religion || "พุทธ"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60">
                      <span className="text-slate-400">{lang === "th" ? "สถานที่เกิด (ตำบล/อำเภอ/จังหวัด):" : "Place of Birth:"}</span>
                      <span className="text-slate-800 dark:text-white font-bold">
                        {student.birthProvince || student.profile?.birthProvince 
                          ? `${student.birthTambon || student.profile?.birthTambon || ""} -> ${student.birthAmphoe || student.profile?.birthAmphoe || ""} -> ${student.birthProvince || student.profile?.birthProvince}`
                          : "-"
                        }
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60">
                      <span className="text-slate-400">{lang === "th" ? "โรงเรียนเดิมที่เคยศึกษา:" : "Previous School:"}</span>
                      <span className="text-slate-800 dark:text-white font-bold">{student.previousSchool || student.profile?.previousSchool || "-"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60">
                      <span className="text-slate-400">{lang === "th" ? "เหตุผลการย้ายเข้าเรียน:" : "Move In Reason:"}</span>
                      <span className="text-slate-800 dark:text-white font-bold">{student.moveInReason || student.profile?.moveInReason || "-"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60 md:col-span-2">
                      <span className="text-slate-400">{lang === "th" ? "กลุ่มด้อยโอกาส / ประเภทความพิการ:" : "Disadvantaged & Disability Status:"}</span>
                      <span className="text-slate-850 dark:text-white font-bold">
                        {student.disadvantageType || student.profile?.disadvantageType || "ไม่ด้อยโอกาส"} / {student.disabilityType || student.profile?.disabilityType || "ไม่พิการ"}
                      </span>
                    </div>
                    {student.profile?.congenitalDisease && (
                      <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60 md:col-span-2">
                        <span className="text-slate-400">{lang === "th" ? "โรคประจำตัวที่ระบุ:" : "Congenital Disease:"}</span>
                        <span className="text-rose-500 font-extrabold">{student.profile.congenitalDisease}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 2: Family Profile */}
            {activeTab === "family" && (
              <motion.div 
                key="family"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Family status summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{lang === "th" ? "สถานภาพทางครอบครัว" : "Family Relation Status"}</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {student.familyStatus || student.profile?.familyStatus || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{lang === "th" ? "ปัจจุบันอาศัยอยู่กับ" : "Currently Living With"}</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {student.livingWith || student.profile?.livingWith || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parent Profile Lists */}
                <div className="space-y-4">
                  {[
                    { relation: "บิดา", title: lang === "th" ? "ประวัติบิดา (Father)" : "Father Profile", data: father },
                    { relation: "มารดา", title: lang === "th" ? "ประวัติมารดา (Mother)" : "Mother Profile", data: mother },
                    { relation: "ผู้ปกครอง", title: lang === "th" ? "ประวัติผู้ปกครอง (Guardian)" : "Guardian Profile", data: guardian }
                  ].map((p, idx) => {
                    if (!p.data) return null;
                    const isDeceased = p.data.status === "เสียชีวิต";
                    return (
                      <div key={idx} className="rounded-2xl border border-slate-150/60 dark:border-slate-850/60 p-5 space-y-4 shadow-sm bg-card/5 relative overflow-hidden">
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-850">
                          <h4 className="font-extrabold text-xs text-primary uppercase tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {p.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isDeceased 
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          }`}>{p.data.status || "มีชีวิตอยู่"}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs font-semibold text-slate-600 dark:text-slate-350">
                          <div className="flex justify-between border-b border-slate-50/50 dark:border-slate-900/50 py-1">
                            <span className="text-slate-400">{lang === "th" ? "ชื่อ-นามสกุล:" : "Name:"}</span>
                            <span className="text-slate-800 dark:text-white font-bold">{p.data.prefix ? p.data.prefix : ""}{p.data.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50/50 dark:border-slate-900/50 py-1">
                            <span className="text-slate-400">{lang === "th" ? "เลขประจำตัวประชาชน:" : "National ID:"}</span>
                            <span className="text-slate-800 dark:text-white font-mono font-bold">{p.data.nationalId || "-"}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50/50 dark:border-slate-900/50 py-1">
                            <span className="text-slate-400">{lang === "th" ? "เบอร์โทรศัพท์ติดต่อ:" : "Phone Number:"}</span>
                            <span className="text-slate-800 dark:text-white font-mono font-bold flex items-center gap-1">
                              {p.data.phone && <Phone className="w-3.5 h-3.5 text-slate-400" />}
                              {p.data.phone || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50/50 dark:border-slate-900/50 py-1">
                            <span className="text-slate-400">{lang === "th" ? "อายุ / สุขภาพ:" : "Age / Health:"}</span>
                            <span className="text-slate-800 dark:text-white font-bold">
                              {p.data.age ? `${p.data.age} ปี` : "-"} • {p.data.health || "แข็งแรง"}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50/50 dark:border-slate-900/50 py-1">
                            <span className="text-slate-400">{lang === "th" ? "อาชีพ:" : "Occupation:"}</span>
                            <span className="text-slate-800 dark:text-white font-bold flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                              {p.data.job || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50/50 dark:border-slate-900/50 py-1">
                            <span className="text-slate-400">{lang === "th" ? "รายได้เฉลี่ยต่อเดือน:" : "Monthly Income:"}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                              {p.data.totalMonthlyIncome ? `${p.data.totalMonthlyIncome.toLocaleString()} บาท` : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sibling Lists */}
                {siblingsAndOthers.length > 0 && (
                  <div className="rounded-2xl border border-slate-150/60 dark:border-slate-850/60 p-5 space-y-3 shadow-sm bg-card/5">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      {lang === "th" ? "พี่น้องร่วมครอบครัว" : "Siblings & Household Members"}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                            <th className="py-2.5">{lang === "th" ? "ความสัมพันธ์" : "Relation"}</th>
                            <th className="py-2.5">{lang === "th" ? "ชื่อ-นามสกุล" : "Name"}</th>
                            <th className="py-2.5 text-center">{lang === "th" ? "อายุ (ปี)" : "Age"}</th>
                            <th className="py-2.5 text-center">{lang === "th" ? "อาชีพ" : "Occupation"}</th>
                            <th className="py-2.5 text-right">{lang === "th" ? "รายได้ต่อเดือน" : "Monthly Income"}</th>
                          </tr>
                        </thead>
                        <tbody className="font-bold text-slate-700 dark:text-slate-200 divide-y divide-slate-100/50 dark:divide-slate-850/50">
                          {siblingsAndOthers.map((m: any, i: number) => (
                            <tr key={i} className="hover:bg-muted/10">
                              <td className="py-2 text-primary">{m.relation}</td>
                              <td className="py-2">{m.prefix ? m.prefix : ""}{m.name}</td>
                              <td className="py-2 text-center font-mono">{m.age || "-"}</td>
                              <td className="py-2 text-center">{m.job || "-"}</td>
                              <td className="py-2 text-right text-emerald-600 dark:text-emerald-450 font-extrabold">
                                {m.totalMonthlyIncome ? `${m.totalMonthlyIncome.toLocaleString()} บาท` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 3: Home Visit Details */}
            {activeTab === "homevisit" && (
              <motion.div 
                key="homevisit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* GPS mapping and directions */}
                <div className="p-4 rounded-2xl border border-indigo-500/10 dark:border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Map className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">{lang === "th" ? "พิกัดแผนที่บ้านนักเรียน" : "Home Location Coordinates"}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold mt-0.5">
                        {student.latitude || student.homeVisit?.latitude 
                          ? `Lat: ${student.latitude || student.homeVisit.latitude} • Lng: ${student.longitude || student.homeVisit.longitude}`
                          : lang === "th" ? "ไม่มีพิกัดแผนที่บันทึกไว้" : "No GPS data coordinates available"
                        }
                      </p>
                    </div>
                  </div>

                  {(student.latitude || student.homeVisit?.latitude) && (
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${student.latitude || student.homeVisit.latitude},${student.longitude || student.homeVisit.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {lang === "th" ? "เปิด Google Maps นำทาง" : "Open Google Maps"}
                    </a>
                  )}
                </div>

                {/* Gallery House Photos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{lang === "th" ? "ภาพที่พักอาศัยภายนอกบ้าน" : "House Photo (Outside View)"}</span>
                    <div className="h-52 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-hidden relative flex items-center justify-center group shadow-inner">
                      {student.imgHouseOutside || student.homeVisit?.imgHouseOutside ? (
                        <img 
                          src={student.imgHouseOutside || student.homeVisit.imgHouseOutside} 
                          alt="House Outside" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Home className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                          <span className="text-[10px] text-slate-450 font-bold block mt-2">{lang === "th" ? "ยังไม่มีการอัปโหลดรูปภายนอกบ้าน" : "No photo uploaded yet"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{lang === "th" ? "ภาพที่พักอาศัยภายในบ้าน" : "House Photo (Inside View)"}</span>
                    <div className="h-52 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-hidden relative flex items-center justify-center group shadow-inner">
                      {student.imgHouseInside || student.homeVisit?.imgHouseInside ? (
                        <img 
                          src={student.imgHouseInside || student.homeVisit.imgHouseInside} 
                          alt="House Inside" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Home className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                          <span className="text-[10px] text-slate-450 font-bold block mt-2">{lang === "th" ? "ยังไม่มีการอัปโหลดรูปภายในบ้าน" : "No photo uploaded yet"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Housing conditions details grid */}
                <div className="rounded-2xl border border-slate-150/60 dark:border-slate-850/60 p-5 space-y-4 shadow-sm bg-card/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-primary" />
                    {lang === "th" ? "รายละเอียดสภาพบ้านและการเดินทาง" : "Housing Condition & Commute Details"}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs font-semibold text-slate-650 dark:text-slate-350">
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60">
                      <span className="text-slate-400">{lang === "th" ? "สถานะการครอบครองที่อยู่:" : "Living Arrangement:"}</span>
                      <span className="text-slate-800 dark:text-white font-bold">{student.livingArrangements || student.homeVisit?.livingArrangements || "-"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60">
                      <span className="text-slate-400">{lang === "th" ? "วิธีการเดินทางไปโรงเรียน:" : "Travel Method:"}</span>
                      <span className="text-slate-800 dark:text-white font-bold">{student.travelMethod || student.homeVisit?.travelMethod || "-"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60">
                      <span className="text-slate-400">{lang === "th" ? "ระยะทางไปกลับบ้าน-โรงเรียน:" : "Commute Distance:"}</span>
                      <span className="text-slate-800 dark:text-white font-bold">{student.distanceToSchool || student.homeVisit?.distanceToSchool || 0} กม.</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60">
                      <span className="text-slate-400">{lang === "th" ? "เวลาที่ใช้เดินทางโดยเฉลี่ย:" : "Commute Time:"}</span>
                      <span className="text-slate-800 dark:text-white font-bold">{student.travelTimeMins || student.homeVisit?.travelTimeMins || 0} นาที</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60">
                      <span className="text-slate-400">{lang === "th" ? "ค่าเดินทางไปกลับ (บาท/เดือน):" : "Monthly Travel Cost:"}</span>
                      <span className="text-emerald-600 dark:text-emerald-450 font-extrabold">{student.travelCost || student.homeVisit?.travelCost || 0} บาท</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/60 dark:border-slate-850/60">
                      <span className="text-slate-400">{lang === "th" ? "ได้รับบัตรสวัสดิการแห่งรัฐ:" : "State Welfare Support:"}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        student.homeVisit?.welfareStatus === "ได้รับ" || student.homeVisit?.welfareStatus === "yes" 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : "bg-slate-100 text-slate-500 dark:bg-slate-850 border-transparent"
                      }`}>{student.homeVisit?.welfareStatus || "ไม่ได้รับ"}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 4: Behavior History & SDQ scores */}
            {activeTab === "behavior" && (
              <motion.div 
                key="behavior"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Visual conduct summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-150/60 dark:border-slate-850/60 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === "th" ? "คะแนนพฤติกรรมสะสม (Conduct)" : "Conduct Points Balance"}</span>
                    <div className="flex items-baseline gap-1 mt-2.5">
                      <span className="text-3xl font-black text-primary">{student.behaviorPoints || 100}</span>
                      <span className="text-xs text-slate-400">/ 100 คะแนน</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-150/60 dark:border-slate-850/60 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === "th" ? "สรุปประเมินสุขภาพจิต SDQ" : "SDQ Mental Health Screening"}</span>
                    <div className="flex items-baseline justify-between mt-2.5">
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${getSdqRiskColor(student.sdqRisk || "ปกติ")}`}>
                        {student.sdqRisk || "ปกติ"}
                      </span>
                      <span className="text-xs text-slate-450 font-bold font-mono">{lang === "th" ? "คะแนนรวม:" : "Total score:"} {student.sdqScore || 10}</span>
                    </div>
                  </div>
                </div>

                {/* Vertical Timeline Engine Logs (Replicating TimelineEngine's premium look) */}
                <div className="rounded-2xl border border-slate-150/60 dark:border-slate-850/60 p-5 space-y-4 shadow-sm bg-card/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2.5">
                    <Activity className="w-4 h-4 text-primary" />
                    {lang === "th" ? "ประวัติบันทึกพฤติกรรมนักเรียนรายบุคคล" : "Individual Behavior Timeline Logs"}
                  </h3>

                  {student.behaviorLogs && student.behaviorLogs.length > 0 ? (
                    <div className="relative border-l border-slate-200 dark:border-slate-800 pl-5 ml-3 space-y-5">
                      {student.behaviorLogs.map((log: any, i: number) => {
                        const isMerit = log.type === "MERIT";
                        return (
                          <div key={i} className="relative group">
                            {/* Dot indicator pin */}
                            <span className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-950 shadow-sm ${
                              isMerit ? "bg-emerald-500" : "bg-rose-500"
                            }`} />
                            
                            {/* Bubble content card */}
                            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/10 hover:bg-slate-50/70 dark:hover:bg-slate-900/25 transition-all shadow-sm">
                              <div className="flex justify-between items-start text-xs">
                                <span className="font-extrabold text-slate-800 dark:text-white text-[12px]">{log.description}</span>
                                <span className={`font-black text-[13px] ${isMerit ? "text-emerald-500" : "text-rose-500"}`}>
                                  {isMerit ? `+${log.points}` : `-${log.points}`}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(log.createdAt).toLocaleString("th-TH")}</span>
                                <span>•</span>
                                <span>{lang === "th" ? `โดย: ${log.loggedBy}` : `By: ${log.loggedBy}`}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400 font-bold flex flex-col items-center justify-center gap-2">
                      <Star className="w-6 h-6 text-slate-300" />
                      <span>{lang === "th" ? "ไม่มีรายการบันทึกพฤติกรรมในฐานข้อมูล" : "No behavior history records found"}</span>
                    </div>
                  )}
                </div>

                {/* SDQ assessments history list */}
                {student.sdqAssessments && student.sdqAssessments.length > 0 && (
                  <div className="rounded-2xl border border-slate-150/60 dark:border-slate-850/60 p-5 space-y-3 shadow-sm bg-card/5">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                      <HeartPulse className="w-4 h-4 text-rose-500" />
                      {lang === "th" ? "ประวัติการคัดกรองสุขภาพจิต SDQ" : "Mental Health SDQ History"}
                    </h4>
                    <div className="space-y-3">
                      {student.sdqAssessments.map((sdq: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950/20 text-xs flex justify-between items-center shadow-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-white">
                                {lang === "th" 
                                  ? `ผู้คัดกรอง: ${sdq.assessorType === "TEACHER" ? "คุณครูประจำชั้น" : sdq.assessorType === "PARENT" ? "ผู้ปกครอง" : "นักเรียนตนเอง"}` 
                                  : `Assessor: ${sdq.assessorType}`
                                }
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getSdqRiskColor(sdq.riskStatus)}`}>
                                {sdq.riskStatus === "RISK" || sdq.riskStatus === "เสี่ยง" ? (lang === "th" ? "กลุ่มเสี่ยง" : "At Risk") : (lang === "th" ? "ปกติ" : "Normal")}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold">{new Date(sdq.createdAt).toLocaleDateString("th-TH")}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-slate-850 dark:text-white text-[13px]">{sdq.totalScore} คะแนน</p>
                            <p className="text-[9px] text-slate-450 font-bold mt-0.5">
                              {lang === "th" ? `ด้านความดี: ${sdq.prosocialScore}` : `Prosocial: ${sdq.prosocialScore}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
