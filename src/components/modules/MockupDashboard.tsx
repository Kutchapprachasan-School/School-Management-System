"use client";

import React, { useState, useEffect } from "react";
import { 
  Mail, MessageSquare, Calendar, CheckSquare, Star, Search, Moon, Sun, 
  ShoppingCart, Bell, ChevronDown, TrendingUp, TrendingDown, Plus, Award,
  Monitor, Maximize2, Minimize2, Check, ExternalLink, RefreshCw
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

// Mock Data for the Charts
const revenueData = [
  { name: "Jan", Earning: 150, Expense: -80 },
  { name: "Feb", Earning: 90, Expense: -100 },
  { name: "Mar", Earning: 230, Expense: -60 },
  { name: "Apr", Earning: 300, Expense: -120 },
  { name: "May", Earning: 110, Expense: -80 },
  { name: "Jun", Earning: 160, Expense: -50 },
  { name: "Jul", Earning: 210, Expense: -90 },
  { name: "Aug", Earning: 90, Expense: -110 },
  { name: "Sep", Earning: 140, Expense: -70 }
];

const ordersData = [
  { name: "Mon", val: 30 },
  { name: "Tue", val: 50 },
  { name: "Wed", val: 20 },
  { name: "Thu", val: 40 },
  { name: "Fri", val: 80 },
  { name: "Sat", val: 45 },
  { name: "Sun", val: 60 }
];

const profitData = [
  { name: "1", val: 40 },
  { name: "2", val: 30 },
  { name: "3", val: 65 },
  { name: "4", val: 45 },
  { name: "5", val: 78 },
  { name: "6", val: 55 },
  { name: "7", val: 85 }
];

const budgetSparklineData = [
  { name: "1", val: 40 },
  { name: "2", val: 42 },
  { name: "3", val: 38 },
  { name: "4", val: 45 },
  { name: "5", val: 52 },
  { name: "6", val: 48 },
  { name: "7", val: 55 },
  { name: "8", val: 50 }
];

const earningsPieData = [
  { name: "App", value: 53 },
  { name: "Other", value: 47 }
];

interface MockupDashboardProps {
  onBackToMain?: () => void;
  lang?: "th" | "en";
}

export default function MockupDashboard({ onBackToMain, lang = "th" }: MockupDashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [isStrict169, setIsStrict169] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [budgetVal, setBudgetVal] = useState(25852);
  const [salesVal, setSalesVal] = useState(230);
  const [customersVal, setCustomersVal] = useState(8.549);
  const [viewsCount, setViewsCount] = useState({ dixons: 23.4, motels: 78 });
  const [toast, setToast] = useState<string | null>(null);

  // Mount logic for SSR safety with Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleIncreaseBudget = () => {
    setBudgetVal(prev => prev + 1250);
    triggerToast(lang === "th" ? "💰 เพิ่มงบประมาณสำเร็จ!" : "Budget successfully increased!");
  };

  const handleRefreshStats = () => {
    setSalesVal(prev => Math.floor(prev + Math.random() * 10 - 5));
    setCustomersVal(prev => +(prev + Math.random() * 0.5 - 0.25).toFixed(3));
    setViewsCount(prev => ({
      dixons: +(prev.dixons + Math.random() * 2).toFixed(1),
      motels: +(prev.motels + Math.random() * 4).toFixed(1)
    }));
    triggerToast(lang === "th" ? "⚡ อัปเดตข้อมูลสดจำลองสำเร็จ" : "Simulation statistics refreshed!");
  };

  if (!mounted) return null;

  return (
    <div className={`w-full min-h-screen transition-all duration-300 font-sans flex flex-col justify-start items-center p-4 lg:p-6 ${
      darkMode ? "bg-slate-950 text-white dark" : "bg-slate-100 text-slate-900"
    }`}>
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-650 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg border border-indigo-500 animate-bounce flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Control bar for strict mode selection */}
      <div className="w-full max-w-7xl mb-4 flex flex-wrap gap-3 justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          {onBackToMain && (
            <button
              onClick={onBackToMain}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{lang === "th" ? "← กลับหน้าหลัก" : "← Back to System"}</span>
            </button>
          )}
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-slate-500 uppercase">
              {lang === "th" ? "การปรับปรุงโครงหน้าจออัจฉริยะ (16:9 Mockup Layout)" : "Responsive Design & 16:9 Aspect Ratio Mockup"}
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              {lang === "th" ? "จำลองหน้าจอ Dashboard คอนเซ็ปต์พรีเมียม สเกลหน้าจอ 16:9" : "Interactive sandbox simulating the premium grid layout"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Simulation */}
          <button
            onClick={handleRefreshStats}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            title="สุ่มรีเฟรชข้อมูลตัวเลข"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Toggle Strict aspect ratio */}
          <button
            onClick={() => setIsStrict169(prev => !prev)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              isStrict169 
                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>{isStrict169 ? (lang === "th" ? "สเกลฟิกซ์ 16:9" : "Strict 16:9") : (lang === "th" ? "สเกลยืดอิสระ" : "Fluid Responsive")}</span>
          </button>

          {/* Dark Mode switcher */}
          <button
            onClick={() => setDarkMode(prev => !prev)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Wrapper box containing the mockup frame */}
      <div className={`w-full max-w-7xl transition-all duration-300 ${
        isStrict169 
          ? "aspect-[16/9] bg-slate-900/10 dark:bg-slate-950/40 rounded-3xl p-4 border border-slate-300/30 shadow-2xl relative flex items-center justify-center overflow-hidden" 
          : "min-h-0 flex-1 flex flex-col justify-start"
      }`}>
        
        {/* Core Layout Canvas */}
        <div className={`w-full h-full flex transition-all duration-300 ${
          isStrict169 ? "absolute inset-4 overflow-hidden rounded-2xl" : "relative flex-1"
        } ${
          darkMode ? "bg-[#1f212d] text-white" : "bg-[#f4f5fa] text-slate-800"
        }`}>
          
          {/* 1. LEFT SIDEBAR */}
          <aside className="w-18 shrink-0 flex flex-col items-center py-5 justify-between border-r transition-colors duration-300" style={{
            borderColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            backgroundColor: darkMode ? "#1a1b26" : "#ffffff"
          }}>
            
            {/* Logo V at the Top */}
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400 font-extrabold text-2xl tracking-tighter cursor-pointer hover:scale-105 transition-all">
                V
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#e8ebfd] dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-850">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>

            {/* Middle Nav Items */}
            <div className="flex flex-col gap-2.5 items-center w-full my-auto">
              {[
                { d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", active: false },
                { d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", active: false },
                { d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", active: false },
                { d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", active: false },
                { d: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z", active: false },
                { d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", active: false },
                { d: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z", active: false },
                { d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", active: false }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-all duration-200"
                >
                  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.d} />
                  </svg>
                </div>
              ))}
            </div>

            {/* Bottom Extra Tools */}
            <div className="flex flex-col gap-1 items-center w-full pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-350 tracking-widest uppercase mb-1">...</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">T</div>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              </div>
            </div>

          </aside>

          {/* 2. MAIN LAYOUT */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar p-5 space-y-4">
            
            {/* TOP BAR */}
            <header className="rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] px-5 py-2.5 flex justify-between items-center transition-colors duration-300" style={{
              backgroundColor: darkMode ? "#1a1b26" : "#ffffff"
            }}>
              
              {/* Left Side icons */}
              <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
                <Mail className="w-4.5 h-4.5 cursor-pointer hover:text-indigo-600 transition-colors" />
                <MessageSquare className="w-4.5 h-4.5 cursor-pointer hover:text-indigo-600 transition-colors" />
                <Calendar className="w-4.5 h-4.5 cursor-pointer hover:text-indigo-600 transition-colors" />
                <CheckSquare className="w-4.5 h-4.5 cursor-pointer hover:text-indigo-600 transition-colors" />
                <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400 cursor-pointer" />
              </div>

              {/* Right Side profile and picker */}
              <div className="flex items-center gap-3">
                {/* Language Picker */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg cursor-pointer hover:bg-slate-100/50">
                  <span className="w-4.5 h-3 bg-blue-900 flex flex-col gap-0.5 rounded-xs relative overflow-hidden border border-slate-200">
                    <span className="h-0.5 bg-red-600 w-full" />
                    <span className="h-0.5 bg-white w-full" />
                    <span className="h-1 bg-blue-800 w-full" />
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">English</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Quick search/theme */}
                <div className="flex items-center gap-1 text-slate-400">
                  <div className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
                    <Search className="w-4 h-4" />
                  </div>
                  <div className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer relative">
                    <ShoppingCart className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-slate-800" />
                  </div>
                  <div className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer relative">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border border-white dark:border-slate-800" />
                  </div>
                </div>

                {/* Profile John Doe */}
                <div className="flex items-center gap-2.5 border-l border-slate-100 dark:border-slate-800 pl-3">
                  <div className="text-right">
                    <p className="text-[11px] font-extrabold text-slate-800 dark:text-white leading-tight">John Doe</p>
                    <p className="text-[9px] text-slate-400 font-bold tracking-wider leading-tight mt-0.5">Admin</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-300 relative overflow-hidden border border-slate-200 dark:border-slate-700">
                    {/* Simulated avatar */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-[10px]">
                      JD
                    </div>
                  </div>
                </div>

              </div>

            </header>

            {/* DASHBOARD GRID CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">

              {/* LEFT & MID PANEL (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Row 1: Congratulations & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Congratulations Card */}
                  <div className="md:col-span-1 rounded-2xl p-5 border relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between" style={{
                    borderColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    backgroundColor: darkMode ? "#1a1b26" : "#ffffff"
                  }}>
                    {/* Ribbon medal vector bg */}
                    <div className="absolute top-2 right-4 w-18 h-18 text-yellow-500 animate-pulse">
                      <Award className="w-full h-full stroke-[1.25]" />
                    </div>

                    <div className="space-y-1 relative z-10">
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight">
                        Congratulations 🎉 John!
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        You have won gold medal
                      </p>
                    </div>

                    <div className="mt-8 relative z-10">
                      <p className="text-2xl font-black text-indigo-650 dark:text-indigo-400 tracking-tight">
                        $48.9k
                      </p>
                      <button 
                        onClick={() => triggerToast(lang === "th" ? "💸 เปิดรายงานการขายสำเร็จ" : "Opening Sales Report")}
                        className="mt-3 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        View Sales
                      </button>
                    </div>
                  </div>

                  {/* Statistics Panel Card */}
                  <div className="md:col-span-2 rounded-2xl p-5 border flex flex-col justify-between transition-all hover:shadow-md" style={{
                    borderColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    backgroundColor: darkMode ? "#1a1b26" : "#ffffff"
                  }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Statistics</h3>
                        <p className="text-[9px] text-slate-400 font-bold tracking-wider mt-0.5">Updated 1 month ago</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                      {[
                        { label: "Sales", val: `${salesVal}k`, color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
                        { label: "Customers", val: `${customersVal}k`, color: "bg-teal-500/10 text-teal-600 dark:text-teal-400", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
                        { label: "Products", val: "1.423k", color: "bg-rose-500/10 text-rose-600 dark:text-rose-450", d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
                        { label: "Revenue", val: "$9,745", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450", d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1" }
                      ].map((stat, idx) => (
                        <div key={idx} className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${stat.color}`}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={stat.d} />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">{stat.label}</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white mt-1.5 leading-none">{stat.val}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Row 2: Charts Grid (Orders, Profit, Revenue Report) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Left Column (Orders + Profit stacked) */}
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                    
                    {/* Orders Card */}
                    <div className="rounded-2xl p-4.5 border flex flex-col justify-between transition-all hover:shadow-md h-32" style={{
                      borderColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      backgroundColor: darkMode ? "#1a1b26" : "#ffffff"
                    }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Orders</p>
                          <p className="text-lg font-black text-slate-850 dark:text-white mt-1">2,76k</p>
                        </div>
                      </div>
                      <div className="h-10 w-full overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ordersData}>
                            <Bar dataKey="val" fill="#ff9f43" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Profit Card */}
                    <div className="rounded-2xl p-4.5 border flex flex-col justify-between transition-all hover:shadow-md h-32" style={{
                      borderColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      backgroundColor: darkMode ? "#1a1b26" : "#ffffff"
                    }}>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Profit</p>
                        <p className="text-lg font-black text-slate-850 dark:text-white mt-1">6,24k</p>
                      </div>
                      <div className="h-10 w-full overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={profitData}>
                            <Line type="monotone" dataKey="val" stroke="#00cfe8" strokeWidth={2.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                  {/* Right 2 cols: Revenue Report Card */}
                  <div className="md:col-span-2 rounded-2xl p-5 border flex flex-col justify-between transition-all hover:shadow-md h-68" style={{
                    borderColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    backgroundColor: darkMode ? "#1a1b26" : "#ffffff"
                  }}>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-850">
                      <h4 className="font-extrabold text-xs text-slate-850 dark:text-white">Revenue Report</h4>
                      <div className="flex items-center gap-3 text-[10px] font-bold">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />Earning</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" />Expense</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch flex-1 mt-4">
                      
                      {/* Interactive Bar Chart (2 cols) */}
                      <div className="md:col-span-2 h-full min-h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueData} barGap={3}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                            <Bar dataKey="Earning" fill="#7367f0" radius={[3, 3, 0, 0]} barSize={5} />
                            <Bar dataKey="Expense" fill="#ff9f43" radius={[0, 0, 3, 3]} barSize={5} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Right mini dashboard details (1 col) */}
                      <div className="border-l border-slate-100 dark:border-slate-800/80 pl-4 flex flex-col justify-between">
                        
                        {/* Year Selector */}
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Budget</span>
                          <div className="flex items-center gap-0.5 text-[9px] font-bold text-slate-650 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2 py-0.5 rounded cursor-pointer">
                            <span>2020</span>
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="mt-3">
                          <p className="text-xl font-black text-slate-850 dark:text-white tracking-tight">${budgetVal.toLocaleString()}</p>
                          <span className="text-[9px] text-slate-400 font-bold mt-1 block">Budget: 56,800</span>
                        </div>

                        {/* Sparkline chart */}
                        <div className="h-6 w-full mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={budgetSparklineData}>
                              <defs>
                                <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#7367f0" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#7367f0" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="val" stroke="#7367f0" strokeWidth={1.5} fillOpacity={1} fill="url(#colorBudget)" dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Button Action */}
                        <button
                          onClick={handleIncreaseBudget}
                          className="mt-4 w-full py-2 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          Increase Budget
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

                {/* Row 3: Company Table List */}
                <div className="rounded-2xl p-5 border transition-all hover:shadow-md" style={{
                  borderColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  backgroundColor: darkMode ? "#1a1b26" : "#ffffff"
                }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-850">
                          <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Company</th>
                          <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                          <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Views</th>
                          <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Revenue</th>
                          <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Sales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-850/60 text-xs font-semibold text-slate-650 dark:text-slate-350">
                        <tr>
                          <td className="py-3 flex items-center gap-2.5">
                            <span className="w-7 h-7 bg-red-100 dark:bg-red-950/20 text-red-600 rounded-lg flex items-center justify-center font-bold text-[10px]">D</span>
                            <div>
                              <p className="font-extrabold text-slate-800 dark:text-white leading-tight">Dixons</p>
                              <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">megur@ruj.io</p>
                            </div>
                          </td>
                          <td className="py-3 text-[11px]">Technology</td>
                          <td className="py-3 text-[11px] font-extrabold text-slate-800 dark:text-white">{viewsCount.dixons}k <span className="text-[9px] text-slate-400 font-bold">in 24 hours</span></td>
                          <td className="py-3 text-[11px] font-extrabold text-slate-800 dark:text-white">$891.2</td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-extrabold text-slate-800 dark:text-white">68%</span>
                              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 flex items-center gap-2.5">
                            <span className="w-7 h-7 bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-[10px]">M</span>
                            <div>
                              <p className="font-extrabold text-slate-800 dark:text-white leading-tight">Motels</p>
                              <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">vecav@hotzi.co.uk</p>
                            </div>
                          </td>
                          <td className="py-3 text-[11px]">Grocery</td>
                          <td className="py-3 text-[11px] font-extrabold text-slate-800 dark:text-white">{viewsCount.motels}k <span className="text-[9px] text-slate-400 font-bold">in 2 days</span></td>
                          <td className="py-3 text-[11px] font-extrabold text-slate-800 dark:text-white">$668.51</td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-extrabold text-slate-800 dark:text-white">97%</span>
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* RIGHT PANEL (1 col) */}
              <div className="space-y-4">
                
                {/* Earnings Donut Card */}
                <div className="rounded-2xl p-5 border flex flex-col justify-between transition-all hover:shadow-md h-60" style={{
                  borderColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  backgroundColor: darkMode ? "#1a1b26" : "#ffffff"
                }}>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Earnings</h3>
                    <p className="text-[9px] text-slate-400 font-bold tracking-wider mt-0.5">This Month</p>
                    <p className="text-xl font-black text-slate-850 dark:text-white mt-1.5 tracking-tight">$4,055.56</p>
                    <p className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold mt-1">68.2% more earnings than last month.</p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={earningsPieData} 
                            innerRadius={26} 
                            outerRadius={36} 
                            paddingAngle={2}
                            dataKey="value"
                          >
                            <Cell fill="#28c76f" />
                            <Cell fill={darkMode ? "#2e303f" : "#f1f3f7"} />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black text-slate-800 dark:text-white">53%</span>
                        <span className="text-[7px] font-bold text-slate-400 uppercase">App</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold">App Store</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold">Services</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Worker Illustration Card */}
                <div className="rounded-2xl border p-5 transition-all hover:shadow-md h-80 flex flex-col justify-between overflow-hidden relative" style={{
                  borderColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  backgroundColor: darkMode ? "rgba(115,103,240,0.05)" : "rgba(115,103,240,0.04)"
                }}>
                  {/* Clean SVG/CSS Illustration */}
                  <div className="space-y-2 relative z-10">
                    <h3 className="font-extrabold text-sm text-indigo-650 dark:text-indigo-400">Ready to Grow?</h3>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold leading-relaxed">
                      Upgrade your plan to unlock full dashboard analytics features, export tools, and automatic messaging synchronization.
                    </p>
                  </div>

                  <div className="flex-1 flex items-center justify-center relative select-none mt-2">
                    {/* Simplified cute illustration */}
                    <div className="relative w-40 h-32 flex items-end justify-center">
                      
                      {/* Laptop */}
                      <div className="absolute bottom-1 w-20 h-1.5 bg-slate-450 dark:bg-slate-700 rounded-sm z-20 flex items-center justify-center">
                        <div className="w-3 h-0.5 bg-slate-200" />
                      </div>
                      <div className="absolute bottom-2.5 w-16 h-10 bg-slate-800 dark:bg-slate-900 border border-slate-700 rounded-md z-20 flex items-center justify-center overflow-hidden">
                        <div className="w-8 h-4 bg-indigo-500/25 rounded-xs animate-pulse" />
                      </div>

                      {/* Plant */}
                      <div className="absolute right-2 bottom-0 w-8 h-12 flex flex-col items-center justify-end">
                        <div className="w-5 h-5 bg-indigo-600/10 dark:bg-indigo-500/20 rounded-t-lg relative">
                          <span className="absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="absolute top-2.5 left-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <div className="w-4 h-4 bg-orange-400/80 rounded-b-lg" />
                      </div>

                      {/* Desk */}
                      <div className="absolute bottom-0 w-36 h-1 bg-indigo-650/40 rounded-full" />

                      {/* User Sitting */}
                      <div className="absolute left-4 bottom-0 w-16 h-20 flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-orange-200 border-2 border-indigo-600/20 flex items-center justify-center relative">
                          {/* Hair */}
                          <span className="absolute top-0 w-full h-2 bg-indigo-950 rounded-t-full" />
                        </div>
                        <div className="w-10 h-12 bg-indigo-600 rounded-t-xl mt-0.5 relative">
                          {/* Arm */}
                          <span className="absolute top-2 -right-1 w-4 h-2 bg-indigo-500 rounded-full rotate-12" />
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 relative z-10 flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-bold">Premium Subscription</span>
                    <button 
                      onClick={() => triggerToast(lang === "th" ? "🌟 สมัครสมาชิกเสร็จสมบูรณ์!" : "Premium plan activated successfully!")}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold text-[9px] rounded-lg shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                    >
                      Unlock Now
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </main>

        </div>

      </div>

    </div>
  );
}
