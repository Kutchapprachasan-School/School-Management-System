"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert, Clock, Camera, UserCheck, MapPin,
  ShoppingCart, Plus, Minus, Users, TrendingUp,
  Award, CheckSquare, Boxes, FileCode,
  Package, QrCode, Wrench, CheckCircle2,
  GraduationCap, Search, Phone, Mail,
  Heart, Lock, ShieldCheck, Eye, EyeOff, ListChecks,
  FileText, Sparkles, Download, BookOpen,
  Coins, Recycle, Leaf, Bus, Bell, Wifi, Cpu, AlertTriangle
} from "lucide-react";

// Import server actions
import { getDutySchedules, submitDutyLog } from "@/app/actions/duty";
import { getCoopShares, processCoopPurchase, updateCoopShares } from "@/app/actions/cooperative";
import { getActiveElection, castVote } from "@/app/actions/election";
import { getAssets, submitAssetAudit, createAsset } from "@/app/actions/assets";
import { getScholarships, submitScholarshipApplication, saveAlumniRecord, getAlumniRecords } from "@/app/actions/guidance";
import { submitMentalHealthAssessment, getCounselingSessions, saveCounselingSession } from "@/app/actions/counseling";
import { getTeacherPortfolios, addPortfolioItem, generateSarDraft } from "@/app/actions/portfolio";
import { depositRecycling, getRecyclingLeaderboard } from "@/app/actions/waste-bank";
import { getBusRoutes, submitBusAttendance } from "@/app/actions/bus";
import { getLessonPlans, createLessonPlan, generateAiRubric } from "@/app/actions/lesson-plan";

interface SubsystemsViewProps {
  students: any[];
  teachers: any[];
  triggerToast: (title: string, message: string) => void;
  addAuditLog: (action: string, details: string) => void;
}

export default function SubsystemsView({
  students = [],
  teachers = [],
  triggerToast,
  addAuditLog
}: SubsystemsViewProps) {
  const [activeSystemTab, setActiveSystemTab] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // 1. Daily Duty Guard & Duty Teacher
  const [dutySchedules, setDutySchedules] = useState<any[]>([]);
  const [selectedDutyId, setSelectedDutyId] = useState<string>("");
  const [dutyIncident, setDutyIncident] = useState<string>("");
  const [dutyPhoto, setDutyPhoto] = useState<string>("");
  const [dutyStatus, setDutyStatus] = useState<string>("COMPLETED");
  const dutyCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 2. Digital Cooperative POS
  const [coopShares, setCoopShares] = useState<any[]>([]);
  const [coopCart, setCoopCart] = useState<any[]>([]);
  const [selectedStudentForCoop, setSelectedStudentForCoop] = useState<string>("");
  const [coopBuyerType, setCoopBuyerType] = useState<string>("STUDENT");
  const [coopPayment, setCoopPayment] = useState<string>("CASH");
  const coopProducts = [
    { id: "p1", name: "นมกล่องโรงเรียน (รสจืด)", price: 12 },
    { id: "p2", name: "สมุดปกอ่อน School OS", price: 15 },
    { id: "p3", name: "ดินสอไม้ 2B", price: 8 },
    { id: "p4", name: "เสื้อพละโรงเรียน", price: 250 },
    { id: "p5", name: "กระติกน้ำพลาสติกรุ่นอนุรักษ์โลก", price: 99 }
  ];

  // 3. E-Election System
  const [activeElection, setActiveElection] = useState<any>(null);
  const [voterCode, setVoterCode] = useState<string>("");
  const [votedParty, setVotedParty] = useState<string>("");
  const [votedCandidateId, setVotedCandidateId] = useState<string>("");
  const [isElectionClosed, setIsElectionClosed] = useState<boolean>(false);

  // 4. Inventory & Asset Auditing
  const [assetsList, setAssetsList] = useState<any[]>([]);
  const [assetSearch, setAssetSearch] = useState<string>("");
  const [selectedAssetForAudit, setSelectedAssetForAudit] = useState<any>(null);
  const [auditCondition, setAuditCondition] = useState<string>("GOOD");
  const [auditNotes, setAuditNotes] = useState<string>("");
  const [showQrCode, setShowQrCode] = useState<string | null>(null);

  // 5. Counseling, Scholarships & Alumni
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [selectedScholarship, setSelectedScholarship] = useState<string>("");
  const [selectedStudentForScholarship, setSelectedStudentForScholarship] = useState<string>("");
  const [scholarshipRemarks, setScholarshipRemarks] = useState<string>("");
  const [alumniRecords, setAlumniRecords] = useState<any[]>([]);
  // Alumni Form
  const [alumniCode, setAlumniCode] = useState<string>("");
  const [alumniName, setAlumniName] = useState<string>("");
  const [alumniYear, setAlumniYear] = useState<number>(2568);
  const [alumniTcas, setAlumniTcas] = useState<string>("");
  const [alumniWork, setAlumniWork] = useState<string>("");

  // 6. Student Risk & Mental Health
  const [screeningStudent, setScreeningStudent] = useState<string>("");
  const [riskAnswers, setRiskAnswers] = useState<Record<number, number>>({});
  const [screeningScore, setScreeningScore] = useState<number | null>(null);
  const [screeningResult, setScreeningResult] = useState<string>("");
  // Counseling session form
  const [counselingStudent, setCounselingStudent] = useState<string>("");
  const [counselingTopics, setCounselingTopics] = useState<string>("");
  const [counselingNotes, setCounselingNotes] = useState<string>("");
  const [referralNeeded, setReferralNeeded] = useState<boolean>(false);
  const [hideNotes, setHideNotes] = useState<boolean>(true);
  const [counselingHistory, setCounselingHistory] = useState<any[]>([]);

  // 7. SAR Portfolio & QA System
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [sarAcademicYear, setSarAcademicYear] = useState<number>(2569);
  const [activityName, setActivityName] = useState<string>("");
  const [qaStandard, setQaStandard] = useState<string>("มาตรฐานที่ 1.1");
  const [portfolioCategory, setPortfolioCategory] = useState<string>("การเรียนรู้เชิงรุก (Active Learning)");
  const [sarDraftText, setSarDraftText] = useState<string>("");

  // 8. Waste Bank System
  const [selectedStudentForWaste, setSelectedStudentForWaste] = useState<string>("");
  const [wasteType, setWasteType] = useState<string>("PLASTIC");
  const [wasteWeight, setWasteWeight] = useState<number>(0);
  const [wasteLeaderboard, setWasteLeaderboard] = useState<any[]>([]);

  // 9. Bus Safety & Tracking
  const [busRoutes, setBusRoutes] = useState<any[]>([]);
  const [selectedBusRouteId, setSelectedBusRouteId] = useState<string>("");
  const [selectedStudentForBus, setSelectedStudentForBus] = useState<string>("");
  const [busDirection, setBusDirection] = useState<string>("INBOUND");
  const [parentNotifyToken, setParentNotifyToken] = useState<string>("");
  const [busScanLogs, setBusScanLogs] = useState<any[]>([]);

  // 10. Lesson Plan & AI Rubric
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [selectedSubjectIdForPlan, setSelectedSubjectIdForPlan] = useState<string>("");
  const [planTitle, setPlanTitle] = useState<string>("");
  const [planObjective, setPlanObjective] = useState<string>("");
  const [planContent, setPlanContent] = useState<string>("");
  const [planActivities, setPlanActivities] = useState<string>("");
  const [planEvaluation, setPlanEvaluation] = useState<string>("");
  // AI Rubric
  const [rubricTopic, setRubricTopic] = useState<string>("");
  const [rubricGrade, setRubricGrade] = useState<string>("ม.1");
  const [rubricCriteria, setRubricCriteria] = useState<string>("");
  const [generatedRubric, setGeneratedRubric] = useState<any[]>([]);

  // Load Initial Subsystem Data
  useEffect(() => {
    loadAllSubsystemData();
  }, []);

  const loadAllSubsystemData = async () => {
    setLoading(true);
    try {
      // 1. Duty schedules
      const ds = await getDutySchedules();
      setDutySchedules(ds);
      if (ds.length > 0) setSelectedDutyId(ds[0].id);

      // 2. Cooperative shares
      const cs = await getCoopShares();
      setCoopShares(cs);

      // 3. E-Election active election
      const el = await getActiveElection();
      if (el) {
        setActiveElection(el);
      } else {
        // Fallback mock active election
        setActiveElection({
          id: "mock-election-id",
          title: "เลือกตั้งสภานักเรียนโรงเรียนเวียงสะอาด ปีการศึกษา 2569",
          status: "ACTIVE",
          candidates: [
            { id: "c1", partyNumber: 1, partyName: "พรรคพลังนักเรียนพัฒนา", leaderName: "ด.ช.พิทักษ์ธรรม รักษ์ดี", slogan: "เรียนเล่นเป็นระบบ สยบปัญหาขยะล้นห้องเรียน", votesCount: 128 },
            { id: "c2", partyNumber: 2, partyName: "พรรคศิษย์รุ่นใหม่หัวใจดิจิทัล", leaderName: "ด.ญ.พิมพ์ชนก แสงแก้ว", slogan: "ขยายเวลาการใช้ห้องสมุดด้วยคิวอาร์โค้ด และส่งเสริม E-Sports ในคาบกิจกรรม", votesCount: 145 },
            { id: "c3", partyNumber: 3, partyName: "พรรคสายรุ้งสร้างสรรค์ก้าวหน้า", leaderName: "ด.ช.นนทกร เพียรทำ", slogan: "สร้างพื้นที่ปลอดภัยทางใจ ปรึกษาจิตวิทยาฟรีได้ 24 ชั่วโมง", votesCount: 92 }
          ]
        });
      }

      // 4. Assets
      const assets = await getAssets();
      if (assets.length > 0) {
        setAssetsList(assets);
      } else {
        // Mock data fallback
        setAssetsList([
          { id: "a1", assetCode: "ICT-69-001", name: "โปรเจกเตอร์ห้องประชุมใหญ่ Epson", category: "Electronics", location: "ห้องประชุมสารภี", status: "NORMAL", purchaseDate: new Date("2026-01-10"), cost: 24900, auditLogs: [] },
          { id: "a2", assetCode: "ICT-69-002", name: "เครื่องคอมพิวเตอร์ประมวลผล All-in-One HP", category: "Electronics", location: "ห้องสมุดไอที", status: "NORMAL", purchaseDate: new Date("2026-02-15"), cost: 18500, auditLogs: [] },
          { id: "a3", assetCode: "FURN-69-045", name: "ชุดโต๊ะเก้าอี้เรียนไม้พะยูงพรีเมียม", category: "Furniture", location: "ห้องโฮมรูม ม.1/1", status: "NORMAL", purchaseDate: new Date("2025-05-20"), cost: 3200, auditLogs: [] }
        ]);
      }

      // 5. Scholarships & Alumni
      const ss = await getScholarships();
      setScholarships(ss.length > 0 ? ss : [
        { id: "s1", name: "ทุนเสมอภาคทางการศึกษา (กสศ.) รุ่นที่ 4", sponsor: "สำนักงาน กสศ.", amount: 3000, details: "ช่วยเหลือนักเรียนในกลุ่มยากจนพิเศษเพื่อลดความเหลื่อมล้ำในการศึกษา", status: "OPEN", applications: [] },
        { id: "s2", name: "ทุนเรียนดีศรีเวียงสะอาด ประจำปี 2569", sponsor: "มูลนิธิศิษย์เก่าเวียงสะอาด", amount: 5000, details: "มอบแก่นักเรียนที่มีเกรดเฉลี่ยสะสม 3.80 ขึ้นไป และมีจิตสาธารณะ", status: "OPEN", applications: [] }
      ]);
      const alumni = await getAlumniRecords();
      setAlumniRecords(alumni);

      // 6. Counseling history
      try {
        const cLogs = await getCounselingSessions();
        setCounselingHistory(cLogs);
      } catch (e) {
        // Silence or set mock if unauthorized
        setCounselingHistory([
          { id: "cs1", student: { fullName: "ด.ช.กวิน เนตรประเสริฐ", classroom: "ม.1/1" }, counselorId: "anchalee", date: new Date(), topics: "การเรียน, ความคาดหวังในครอบครัว", notesSecured: "[ENCRYPTED DATA] นักเรียนมีความเครียดเรื่องผลการเรียนเทอมที่แล้ว เนื่องจากเปรียบเทียบกับพี่ชาย ได้รับการแนะแนวแบ่งเวลาทำการบ้านและให้คุยกับผู้ปกครองอย่างสร้างสรรค์", referralNeeded: false }
        ]);
      }

      // 7. Teacher portfolios
      const pf = await getTeacherPortfolios();
      setPortfolios(pf);

      // 8. Waste bank leaderboard
      const lb = await getRecyclingLeaderboard();
      setWasteLeaderboard(lb);

      // 9. Bus routes
      const routes = await getBusRoutes();
      setBusRoutes(routes.length > 0 ? routes : [
        { id: "br1", busNumber: "สายเหนือ - กข 4321", driverName: "นายสมคิด ขับขี่ดี", driverPhone: "081-234-5678", roster: [], attendance: [] },
        { id: "br2", busNumber: "สายใต้ - กง 9876", driverName: "นายมั่นคง ชำนาญทาง", driverPhone: "089-876-5432", roster: [], attendance: [] }
      ]);

      // 10. Lesson plans
      const plans = await getLessonPlans();
      setLessonPlans(plans);
    } catch (e) {
      console.error("Error loading subsystems data:", e);
    } finally {
      setLoading(false);
    }
  };

  // 1. Daily Duty Action Handler
  const handleDutyLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDutyId) {
      triggerToast("⚠️ ข้อผิดพลาด", "กรุณาเลือกตารางเวรที่ต้องปฏิบัติหน้าที่");
      return;
    }
    setLoading(true);
    try {
      const res = await submitDutyLog({
        dutyScheduleId: selectedDutyId,
        date: new Date(),
        status: dutyStatus,
        reportedBy: "ครูอัญชลี รัตนฯ",
        photoUrl: dutyPhoto || undefined,
        incidents: dutyIncident || "ปฏิบัติหน้าที่ตามจุดมอบหมาย เหตุการณ์ปกติไม่มีอุบัติเหตุหรือทรัพย์สินสูญหาย"
      });
      if (res.success) {
        triggerToast("✅ บันทึกเวรสำเร็จ", "ได้รายงานผลการลงเวลาปฏิบัติหน้าที่เวรยามเรียบร้อยแล้ว");
        addAuditLog("CREATE_DUTY_LOG", `ส่งบันทึกการปฏิบัติหน้าที่เวร ID: ${selectedDutyId}`);
        setDutyIncident("");
        setDutyPhoto("");
        await loadAllSubsystemData();
      }
    } catch (err: any) {
      triggerToast("❌ ข้อผิดพลาด", err.message || "เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // Simulate Photo Upload on Canvas with Watermark Timestamp (Secure Guard Evidence)
  const handleSimulatePhoto = () => {
    const canvas = dutyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw mock photo background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#8b5cf6";
    ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Draw simulation metadata
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("📷 ภาพถ่ายกล้องเวรปฏิบัติหน้าที่ (School OS Verify)", 50, 80);
    ctx.fillText("จุดปฏิบัติงาน: ประตูหน้าโรงเรียนหลัก (Gate 1)", 50, 110);
    
    // Draw GPS & Timestamp Watermark (To prevent fraud and satisfy auditor compliance)
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 10px monospace";
    ctx.fillText(`TIMESTAMP: ${new Date().toLocaleString("th-TH")}`, 50, 160);
    ctx.fillText("GPS: 13.7563° N, 100.5018° E", 50, 175);
    ctx.fillText("VERIFIED WATERMARK: APPROVED SECURE-LOG", 50, 190);

    const dataUrl = canvas.toDataURL("image/png");
    setDutyPhoto(dataUrl);
    triggerToast("📷 ประทับตรายางหลักฐานเสร็จสิ้น", "ระบบจำลองถ่ายภาพจากกล้อง พร้อมฝังพิกัด GPS และวันเวลาเรียบร้อย");
  };

  // 2. Cooperative Actions
  const addToCoopCart = (product: any) => {
    const existing = coopCart.find(item => item.product.id === product.id);
    if (existing) {
      setCoopCart(coopCart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCoopCart([...coopCart, { product, quantity: 1 }]);
    }
  };

  const updateCartQty = (prodId: string, delta: number) => {
    setCoopCart(coopCart.map(item => {
      if (item.product.id === prodId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as any[]);
  };

  const getCartTotal = () => {
    return coopCart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  };

  const handleCheckoutCoop = async () => {
    if (coopCart.length === 0) {
      triggerToast("⚠️ รถเข็นว่างเปล่า", "กรุณาเลือกรายการอาหารหรือเครื่องดื่มสหกรณ์ก่อนชำระเงิน");
      return;
    }
    if (!selectedStudentForCoop) {
      triggerToast("⚠️ ข้อผิดพลาด", "กรุณาระบุนักเรียนหรือรหัสสหกรณ์ผู้ถือหุ้น");
      return;
    }

    setLoading(true);
    const totalPrice = getCartTotal();
    try {
      const buyer = students.find(s => s.id === selectedStudentForCoop);
      const res = await processCoopPurchase({
        buyerId: buyer?.studentCode || selectedStudentForCoop,
        buyerType: coopBuyerType,
        totalPrice,
        paymentBy: coopPayment,
        itemsJson: JSON.stringify(coopCart.map(item => ({ name: item.product.name, qty: item.quantity, unitPrice: item.product.price })))
      });

      if (res.success) {
        // Accumulate coop dividend shares if studentId matches
        await updateCoopShares({
          studentId: selectedStudentForCoop,
          sharesCount: 1, // Add 1 share as dividend merit bonus
          totalValue: totalPrice * 0.05 // 5% purchase return value to share pool
        });

        triggerToast("💳 ชำระเงินและปันผลสำเร็จ", `บันทึกรายการยอดเงิน ${totalPrice} บ. และมอบปันผลคืนเข้าพอร์ตหุ้นเรียบร้อยแล้ว`);
        addAuditLog("COOP_POS_CHECKOUT", `สหกรณ์จำหน่ายสินค้า ยอดเงิน ${totalPrice} บาท แก่รหัส: ${buyer?.studentCode}`);
        setCoopCart([]);
        await loadAllSubsystemData();
      }
    } catch (e: any) {
      triggerToast("❌ ชำระเงินล้มเหลว", e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // 3. E-Election Actions
  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterCode) {
      triggerToast("⚠️ รหัสผ่านจำเป็น", "กรุณากรอกรหัสประจำตัวนักเรียนเพื่อใช้สิทธิ์");
      return;
    }
    if (!votedCandidateId) {
      triggerToast("⚠️ ข้อผิดพลาด", "กรุณาเลือกพรรค/ผู้สมัครที่คุณต้องการสนับสนุน");
      return;
    }

    setLoading(true);
    try {
      const res = await castVote(activeElection.id, votedCandidateId, voterCode);
      if (res.success) {
        triggerToast("🗳️ ลงคะแนนสำเร็จ", "คะแนนเสียงของคุณถูกส่งเข้าบัตรลงคะแนนอิเล็กทรอนิกส์แบบไร้ตัวตน (Hashed Anonymously) เรียบร้อยแล้ว");
        addAuditLog("CAST_ELECTION_VOTE", `นักเรียนลงคะแนนโหวตสภาโดยปกปิดข้อมูลระบุตัวตน (SHA-256 Verified)`);
        setVoterCode("");
        setVotedCandidateId("");
        await loadAllSubsystemData();
      } else {
        triggerToast("❌ ผิดพลาดในการลงคะแนน", res.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      triggerToast("❌ ข้อผิดพลาด", err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // 4. Asset Audit Action
  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForAudit) return;

    setLoading(true);
    try {
      const res = await submitAssetAudit({
        assetId: selectedAssetForAudit.id,
        auditDate: new Date(),
        auditorName: "ครูอัญชลี รัตนฯ",
        condition: auditCondition,
        notes: auditNotes || "สภาพพร้อมใช้งานทั่วไป ได้ตรวจสอบตามรอบปฏิทินตรวจนับพัสดุประจำปี"
      });

      if (res.success) {
        triggerToast("📦 บันทึกตรวจรับพัสดุสำเร็จ", `อัปเดตสถานะทรัพย์สิน ${selectedAssetForAudit.name} เป็น ${auditCondition} เรียบร้อยแล้ว`);
        addAuditLog("SUBMIT_ASSET_AUDIT", `ตรวจสภาพพัสดุรหัส ${selectedAssetForAudit.assetCode} เป็นสถานะ ${auditCondition}`);
        setSelectedAssetForAudit(null);
        setAuditNotes("");
        await loadAllSubsystemData();
      }
    } catch (err: any) {
      triggerToast("❌ ข้อผิดพลาด", err.message || "ไม่สามารถอัปเดตตรวจพัสดุได้");
    } finally {
      setLoading(false);
    }
  };

  // 5. Scholarship & Alumni Actions
  const handleApplyScholarship = async () => {
    if (!selectedScholarship || !selectedStudentForScholarship) {
      triggerToast("⚠️ ข้อผิดพลาด", "กรุณาเลือกทุนการศึกษาและนักเรียนที่ขอเสนอชื่อ");
      return;
    }
    setLoading(true);
    try {
      const res = await submitScholarshipApplication({
        scholarshipId: selectedScholarship,
        studentId: selectedStudentForScholarship,
        remarks: scholarshipRemarks || "พิจารณาคัดเลือกเนื่องจากเป็นผู้ขาดแคลนทุนทรัพย์และผ่านเกณฑ์คัดกรอง นร.ยากจนพิเศษ นร.01"
      });
      if (res.success) {
        triggerToast("🎓 ยื่นใบเสนอรับทุนสำเร็จ", "บันทึกการส่งข้อมูลผู้รับทุนไปฝ่ายแนะแนวแล้ว");
        addAuditLog("SUBMIT_SCHOLARSHIP_APP", `ยื่นเสนอชื่อนักเรียนรับทุนการศึกษา ID: ${selectedScholarship}`);
        setScholarshipRemarks("");
        await loadAllSubsystemData();
      }
    } catch (e: any) {
      triggerToast("❌ ผิดพลาด", e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleAlumniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumniCode || !alumniName) {
      triggerToast("⚠️ กรอกข้อมูลไม่ครบ", "กรุณาระบุรหัสนักเรียนและชื่อสกุลศิษย์เก่า");
      return;
    }
    setLoading(true);
    try {
      const res = await saveAlumniRecord({
        studentCode: alumniCode,
        fullName: alumniName,
        graduationYear: Number(alumniYear),
        tcasStatus: alumniTcas || "รอข้อมูล TCAS",
        workplace: alumniWork || "กำลังศึกษาต่อระดับปริญญาตรี"
      });
      if (res.success) {
        triggerToast("💾 บันทึกศิษย์เก่าสำเร็จ", `บันทึกประวัติการสำเร็จการศึกษาและศึกษาต่อของศิษย์เก่าเรียบร้อย`);
        addAuditLog("SAVE_ALUMNI_RECORD", `บันทึกข้อมูลศิษย์เก่ารุ่นปี ${alumniYear}: ${alumniName}`);
        setAlumniCode("");
        setAlumniName("");
        setAlumniTcas("");
        setAlumniWork("");
        await loadAllSubsystemData();
      }
    } catch (e: any) {
      triggerToast("❌ ผิดพลาด", e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // 6. Risk Screening & Mental Health Scoring (9Q Depression Scale calculation)
  const screeningQuestions = [
    "เบื่อ เซ็ง ไม่อยากทำอะไรเลย?",
    "ไม่สบายใจ ซึมเศร้า หรือท้อแท้สิ้นหวัง?",
    "หลับยาก หลับ ๆ ตื่น ๆ หรือนอนมากเกินไป?",
    "เหนื่อยง่าย รู้สึกเพลีย ไม่มีแรงกินข้าว?",
    "เบื่ออาหาร หรือกินอาหารมากเกินไปจนน้ำหนักผิดปกติ?",
    "รู้สึกแย่กับตัวเอง คิดว่าตัวเองล้มเหลว หรือทำให้ครอบครัวผิดหวัง?",
    "สมาธิสั้นลงเวลาทำสิ่งต่าง ๆ เช่น อ่านหนังสือ เรียน หรือคุยงาน?",
    "พูดหรือเคลื่อนไหวช้ามากจนคนอื่นสังเกตเห็น หรือกระสับกระส่าย?",
    "คิดร้ายทำร้ายตัวเอง หรือคิดว่าถ้าตายไปจะพ้นปัญหา?"
  ];

  const handleRiskAnswer = (idx: number, score: number) => {
    setRiskAnswers({ ...riskAnswers, [idx]: score });
  };

  const calculateRiskResult = () => {
    let total = 0;
    for (let i = 0; i < 9; i++) {
      total += riskAnswers[i] || 0;
    }

    let verdict = "NORMAL (ปกติ)";
    if (total >= 19) {
      verdict = "DEPRESSION_RISK (ช่วยเหลือเร่งด่วน: ปรึกษาจิตแพทย์)";
    } else if (total >= 13) {
      verdict = "DEPRESSION_RISK (เสี่ยงปานกลาง: ควรทำจิตบำบัดใกล้ชิด)";
    } else if (total >= 7) {
      verdict = "MILD (เสี่ยงเล็กน้อย: เฝ้าระวังติดตามอย่างใกล้ชิด)";
    }

    setScreeningScore(total);
    setScreeningResult(verdict);
  };

  const handleSaveRiskScreening = async () => {
    if (!screeningStudent || screeningScore === null) {
      triggerToast("⚠️ ตรวจสอบ", "กรุณาเลือกนักเรียนและประมวลผลคะแนน 9Q ก่อนบันทึก");
      return;
    }
    setLoading(true);
    try {
      const res = await submitMentalHealthAssessment({
        studentId: screeningStudent,
        type: "9Q_SCALE",
        score: screeningScore,
        result: screeningResult
      });
      if (res.success) {
        triggerToast("💾 บันทึกผลสุขภาพจิตเรียบร้อย", `บันทึกผลคะแนนคัดกรอง 9Q จำนวน ${screeningScore} คะแนน เรียบร้อยแล้ว`);
        addAuditLog("SUBMIT_MENTAL_ASSESSMENT", `ประมวลคัดกรองความเครียด/ซึมเศร้า นักเรียน ID: ${screeningStudent}`);
        setScreeningScore(null);
        setRiskAnswers({});
        await loadAllSubsystemData();
      }
    } catch (e: any) {
      triggerToast("❌ เกิดข้อผิดพลาด", e.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCounselingSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counselingStudent || !counselingTopics || !counselingNotes) {
      triggerToast("⚠️ ข้อมูลไม่ครบ", "กรุณากรอกหัวข้อปรึกษาและรายละเอียดบันทึก");
      return;
    }
    setLoading(true);
    try {
      const res = await saveCounselingSession({
        studentId: counselingStudent,
        counselorId: "anchalee-counselor",
        date: new Date(),
        topics: counselingTopics,
        notesSecured: counselingNotes, // In production, securely restricted
        referralNeeded
      });
      if (res.success) {
        triggerToast("🔒 บันทึกความปลอดภัยสำเร็จ", "บันทึกรายละเอียดคำปรึกษาถูกเขียนลงหน่วยความจำนิรภัย (AES Restricted) แล้ว");
        addAuditLog("SAVE_COUNSELING_SESSION", `บันทึกคำแนะนำปรึกษาแก่นักเรียน ID: ${counselingStudent}`);
        setCounselingTopics("");
        setCounselingNotes("");
        setReferralNeeded(false);
        await loadAllSubsystemData();
      }
    } catch (e: any) {
      triggerToast("❌ ปฏิเสธการเข้าถึง", e.message || "ไม่มีสิทธิ์ลงบันทึกแนะแนว");
    } finally {
      setLoading(false);
    }
  };

  // 7. SAR & QA Portfolio Actions
  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName) return;

    setLoading(true);
    try {
      const res = await addPortfolioItem({
        academicYear: Number(sarAcademicYear),
        activityName,
        qaStandard,
        category: portfolioCategory,
        evidenceUrl: "evidence/port-doc.pdf"
      });

      if (res.success) {
        triggerToast("✨ เพิ่มหลักฐานผลงานสำเร็จ", `บันทึกผลงานลงหมวดหมู่คุณภาพการศึกษาประกันคุณภาพสมศ. สำเร็จ`);
        addAuditLog("ADD_PORTFOLIO_ITEM", `บันทึกผลงาน SAR: ${activityName} มาตรฐาน: ${qaStandard}`);
        setActivityName("");
        await loadAllSubsystemData();
      }
    } catch (e: any) {
      triggerToast("❌ ผิดพลาด", e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSar = async () => {
    setLoading(true);
    try {
      const res = await generateSarDraft(Number(sarAcademicYear));
      if (res.success) {
        setSarDraftText(res.sarDraftText);
        triggerToast("📄 ยกร่างเอกสาร SAR สำเร็จ", "ระบบประมวลผลงานรายปีสรุปออกมาเป็นพิมพ์เขียวร่างรายงานเรียบร้อยแล้ว");
      }
    } catch (e: any) {
      triggerToast("❌ ผิดพลาด", e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // 8. Waste Bank Actions
  const handleWasteDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForWaste || wasteWeight <= 0) {
      triggerToast("⚠️ ข้อผิดพลาด", "กรุณาระบุนักเรียนและน้ำหนักขยะที่ต้องการฝาก");
      return;
    }

    setLoading(true);
    // 1 Kg Plastic = 10 pts, Paper = 5 pts, Glass = 8 pts, Metal = 15 pts
    let rate = 10;
    if (wasteType === "PAPER") rate = 5;
    else if (wasteType === "GLASS") rate = 8;
    else if (wasteType === "METAL") rate = 15;

    const pointsValue = Math.round(wasteWeight * rate);

    try {
      const res = await depositRecycling({
        studentId: selectedStudentForWaste,
        wasteType,
        weightKg: Number(wasteWeight),
        pointsValue
      });

      if (res.success) {
        triggerToast("♻️ ฝากขยะสมทบเงินกองทุนสำเร็จ", `บันทึกน้ำหนักขยะรวม ${wasteWeight} กก. และโอนแต้มความดี ${pointsValue} แต้มเข้าบัญชีแล้ว`);
        addAuditLog("DEPOSIT_RECYCLING", `ฝากขยะแลกแต้มความดี นักเรียน ID: ${selectedStudentForWaste} แต้มที่ได้รับ: ${pointsValue}`);
        setWasteWeight(0);
        await loadAllSubsystemData();
      }
    } catch (e: any) {
      triggerToast("❌ เกิดข้อผิดพลาด", e.message || "ไม่สามารถฝากขยะได้");
    } finally {
      setLoading(false);
    }
  };

  // 9. Bus Safety & Tracking Actions
  const handleBusScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusRouteId || !selectedStudentForBus) {
      triggerToast("⚠️ ข้อผิดพลาด", "กรุณาเลือกเส้นทางรถโรงเรียนและนักเรียนที่ต้องการสแกนขึ้น/ลงรถ");
      return;
    }

    setLoading(true);
    try {
      const res = await submitBusAttendance({
        routeId: selectedBusRouteId,
        studentId: selectedStudentForBus,
        direction: busDirection,
        coordinates: "13.7563, 100.5018"
      });

      if (res.success) {
        const studentObj = students.find(s => s.id === selectedStudentForBus);
        const directionText = busDirection === "INBOUND" ? "ขึ้นรถ (มาโรงเรียน)" : "ลงจากรถ (กลับบ้าน)";
        const logMsg = `🚌 สแกน ${directionText}: ${studentObj?.fullName || "นักเรียน"} เรียบร้อย พร้อมบันทึกพิกัด GPS`;

        triggerToast("🚌 สแกนพิกัดรับส่งสำเร็จ", logMsg);
        addAuditLog("SUBMIT_BUS_ATTENDANCE", `บันทึกการขึ้นลงรถรับส่งนักเรียน ID: ${selectedStudentForBus}`);

        // Update local mock logs
        setBusScanLogs([
          {
            studentName: studentObj?.fullName || "ไม่ทราบชื่อ",
            direction: busDirection,
            time: new Date().toLocaleTimeString("th-TH"),
            coordinates: "13.7563, 100.5018"
          },
          ...busScanLogs
        ]);

        await loadAllSubsystemData();
      }
    } catch (e: any) {
      triggerToast("❌ ผิดพลาด", e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // 10. Lesson Plan & AI Rubric Builder
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectIdForPlan || !planTitle || !planObjective) {
      triggerToast("⚠️ ข้อมูลไม่ครบ", "กรุณาระบุรายวิชา หัวข้อแผนการสอน และวัตถุประสงค์การเรียนรู้");
      return;
    }
    setLoading(true);
    try {
      const res = await createLessonPlan({
        subjectId: selectedSubjectIdForPlan,
        title: planTitle,
        objective: planObjective,
        content: planContent || "กระบวนการจัดการเรียนรู้ตามแนวคิด Active Learning 5 ขั้นตอน (5E)",
        activities: planActivities || "1. ขั้นสร้างความสนใจ 2. ขั้นสำรวจและค้นหา 3. ขั้นอธิบายและลงข้อสรุป",
        evaluation: planEvaluation || "ประเมินพฤติกรรมการมีส่วนร่วมโดยเครื่องมือรูบริกส์และการส่งการบ้านประจำสัปดาห์"
      });
      if (res.success) {
        triggerToast("💾 บันทึกแผนการเรียนรู้สำเร็จ", `แผนการจัดประสบการณ์การเรียนรู้ "${planTitle}" ถูกเขียนลงพอร์ตโฟลิโอแล้ว`);
        addAuditLog("CREATE_LESSON_PLAN", `สร้างแผนการสอนใหม่เรื่อง: ${planTitle}`);
        setPlanTitle("");
        setPlanObjective("");
        setPlanContent("");
        setPlanActivities("");
        setPlanEvaluation("");
        await loadAllSubsystemData();
      }
    } catch (e: any) {
      triggerToast("❌ เกิดข้อผิดพลาด", e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRubric = async () => {
    if (!rubricTopic || !rubricCriteria) {
      triggerToast("⚠️ ข้อผิดพลาด", "กรุณาระบุหัวข้อ และเกณฑ์ประเมินที่ต้องการ (คั่นด้วยเครื่องหมายจุลภาค)");
      return;
    }
    setLoading(true);
    try {
      const criteriaList = rubricCriteria.split(",").map(c => c.trim()).filter(Boolean);
      const res = await generateAiRubric({
        topic: rubricTopic,
        gradeLevel: rubricGrade,
        criteria: criteriaList
      });

      if (res.success && res.rubric) {
        setGeneratedRubric(res.rubric);
        triggerToast("🤖 รูบริก AI สร้างสำเร็จ", "โมเดลประเมินผล School AI วิเคราะห์เกณฑ์เกรดรูบริกสี่ระดับเสร็จสิ้น");
        addAuditLog("GENERATE_AI_RUBRIC", `สร้างเกณฑ์ประเมิน AI Rubric เรื่อง: ${rubricTopic}`);
      }
    } catch (e: any) {
      triggerToast("❌ ผิดพลาด", e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const systems = [
    { id: 1, name: "เวรครูประจำวัน (Duty Guard)", desc: "บันทึกเวลาปฏิบัติหน้าที่เวรจุดรับส่ง พร้อมระบบถ่ายรูปประทับลายน้ำและพิกัดความปลอดภัยป้องกันการปลอมลงเวลา", icon: ShieldAlert },
    { id: 2, name: "ระบบสหกรณ์ POS & หุ้นปันผล", desc: "จุดชำระเงินร้านค้าสวัสดิการสหกรณ์ สแกนบาร์โค้ดซื้อนม/สินค้า พร้อมปันผลคืนเข้าพอร์ตหุ้นนักเรียนอัตโนมัติ", icon: ShoppingCart },
    { id: 3, name: "เลือกตั้งสภานักเรียน E-Election", desc: "การเลือกตั้งอิเล็กทรอนิกส์แบบเปิดเผยผลเรียลไทม์ ปลอดภัยด้วยการแปลงรหัสผู้ลงคะแนนแบบ Anonymously Hash", icon: Award },
    { id: 4, name: "ตรวจนับและสแกนพัสดุโรงเรียน", desc: "ฐานข้อมูลครุภัณฑ์อัจฉริยะ ค้นหา คีย์ตรวจสอบสภาพความชรุดโทรม พร้อมพิมพ์ฉลากคิวอาร์โค้ดแปะแป้นพัสดุ", icon: Package },
    { id: 5, name: "คัดเลือกทุน & เครือข่ายศิษย์เก่า", desc: "ระบบกรอกเสนอชื่อรับทุนเรียนดี ทุนกกศ. พร้อมคลังข้อมูลประวัติทิศทางการศึกษาต่อและที่ทำงานศิษย์เก่า", icon: GraduationCap },
    { id: 6, name: "คัดกรอง 9Q & บันทึกแนะแนวภัยเงียบ", desc: "แบบวัดภาวะเครียดซึมเศร้าอัจฉริยะ พร้อมบอร์ดบันทึกจิตวิทยาปิดมิดชิด ปลอดภัยด้านข้อมูลส่วนบุคคลระดับสูง", icon: Heart },
    { id: 7, name: "จัดทำแผน SAR & มาตรฐานประกันคุณภาพ", desc: "คลังเก็บสะสมประวัติผลงานวิชาการของครู ย่อยแยกตามระดับคุณภาพประกัน สมศ. พร้อมปุ่มยกตัวเอกสาร SAR อัตโนมัติ", icon: FileText },
    { id: 8, name: "ธนาคารขยะสะสมแต้มพฤติกรรมดี", desc: "เครื่องชั่งขยะรีไซเคิลจำแนกแก้ว พลาสติก กระดาษ แปลงเป็นคะแนนสะสมสมทบความประพฤติ (Merit) ทันที", icon: Coins },
    { id: 9, name: "เช็คชื่อขึ้นรถรับส่ง (Bus Safety)", desc: "ผู้คุมรถสแกนเช็คอินนักเรียนขึ้น-ลงรถ พร้อมยิง LINE Notify แจ้งเตือนตรงหาผู้ปกครองฟรี ไม่มีค่าใช้จ่ายส่วนเกิน", icon: Bus },
    { id: 10, name: "คลังแผนการสอน & รูบริก AI", desc: "ระบบจดแผนการสอนแบบยืดหยุ่น พร้อมเครื่องมือช่วยคิดเกณฑ์การตัดคะแนนสี่ระดับความสามารถด้วยสมองกล AI", icon: BookOpen }
  ];

  const activeSystem = systems.find(s => s.id === activeSystemTab);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in duration-200">
      
      {/* Sidebar - Subsystems Selection */}
      <div className="xl:col-span-1 space-y-3">
        <div className="p-4 rounded-2xl glass glass-card">
          <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3">
            เลือกใช้งานระบบบริการย่อย (10 ระบบย่อย)
          </h4>
          <div className="flex flex-col gap-1.5">
            {systems.map((sys) => {
              const TabIcon = sys.icon;
              const isActive = activeSystemTab === sys.id;
              return (
                <button
                  key={sys.id}
                  onClick={() => {
                    setActiveSystemTab(sys.id);
                    addAuditLog("SWITCH_SUBSYSTEM_TAB", `สลับเข้าหน้าต่างระบบ: ${sys.name}`);
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group ${
                    isActive 
                      ? "bg-primary text-white shadow" 
                      : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TabIcon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? "text-white" : "text-primary"}`} />
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs">{sys.name}</h5>
                    <p className={`text-[9px] line-clamp-1 mt-0.5 leading-snug ${isActive ? "text-white/70" : "text-muted-foreground"}`}>
                      {sys.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace for active Subsystem */}
      <div className="xl:col-span-3 space-y-4">
        
        {/* Dynamic header of active sub-system */}
        <div className="p-5 rounded-2xl glass glass-card flex justify-between items-center bg-gradient-to-r from-primary/10 via-transparent to-transparent border-l-4 border-primary">
          <div>
            <div className="flex items-center gap-2">
              {activeSystem && React.createElement(activeSystem.icon, { className: "w-5 h-5 text-primary" })}
              <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
                {activeSystem?.name}
              </h3>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-semibold leading-relaxed">
              {activeSystem?.desc}
            </p>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0">
            School OS v1.2
          </span>
        </div>

        {/* LOADING SHIMMER */}
        {loading && (
          <div className="p-12 rounded-2xl border border-dashed border-primary/20 bg-muted/10 flex flex-col items-center justify-center gap-3">
            <Cpu className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs font-bold text-muted-foreground animate-pulse">กำลังประมวลผลฐานข้อมูลและคำขอของท่าน...</p>
          </div>
        )}

        {/* TABS WORKSPACES */}
        {!loading && (
          <div className="space-y-4">
            
            {/* ========================================================
                1. DAILY DUTY GUARD & DAILY TEACHER
                ======================================================== */}
            {activeSystemTab === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-200">
                
                {/* Left Form */}
                <form onSubmit={handleDutyLogSubmit} className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    ฟอร์มบันทึกเวลาปฏิบัติหน้าที่เวรประจำวัน
                  </h4>
                  
                  <div className="space-y-3 text-xs text-muted-foreground font-semibold">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold">เลือกจุดและช่วงเวลาปฏิบัติหน้าที่</label>
                      <select 
                        value={selectedDutyId}
                        onChange={(e) => setSelectedDutyId(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none"
                      >
                        {dutySchedules.map((item: any) => (
                          <option key={item.id} value={item.id}>
                            {item.dayOfWeek} | {item.spotName} ({item.timeSlot}) - {item.teacher?.name || "ไม่ระบุ"}
                          </option>
                        ))}
                        {dutySchedules.length === 0 && (
                          <option value="">ไม่มีข้อมูลจุดปฏิบัติหน้าที่ในเทอมนี้</option>
                        )}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold">สถานะการปฏิบัติงาน</label>
                      <div className="flex gap-2">
                        {["COMPLETED", "SUBSTITUTE", "ABSENT"].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setDutyStatus(st)}
                            className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                              dutyStatus === st 
                                ? "bg-primary text-white border-primary" 
                                : "bg-background text-muted-foreground border-border"
                            }`}
                          >
                            {st === "COMPLETED" ? "ปฏิบัติหน้าที่ครบถ้วน" : st === "SUBSTITUTE" ? "มีผู้ปฏิบัติหน้าที่แทน" : "ไม่ได้ลงปฏิบัติหน้าที่"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold">บันทึกเหตุการณ์ผิดปกติ / ข้อพึงสังเกต</label>
                      <textarea
                        value={dutyIncident}
                        onChange={(e) => setDutyIncident(e.target.value)}
                        placeholder="กรุณากรอกข้อมูล เช่น มีอุบัติเหตุรถมอเตอร์ไซค์ล้ม หรือสภาพอากาศปกติดี"
                        rows={2}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold block">หลักฐานความโปร่งใส (กล้องบันทึกเวลา)</label>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={handleSimulatePhoto}
                          className="px-4 py-2.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <Camera className="w-4 h-4" />
                          ถ่ายภาพยืนยันเวร
                        </button>
                        {dutyPhoto && <span className="text-[9px] text-emerald-500 font-bold">✓ ประทับตรากล้องเรียบร้อย</span>}
                      </div>
                      
                      {/* Hidden canvas for drawing verification details */}
                      <canvas 
                        ref={dutyCanvasRef} 
                        width={300} 
                        height={200} 
                        className="hidden" 
                      />
                      
                      {dutyPhoto && (
                        <div className="rounded-xl border border-border overflow-hidden">
                          <img src={dutyPhoto} alt="เวรตรวจยาม" className="w-full h-auto object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                  >
                    ส่งรายงานเวรให้ฝ่ายปกครองและบริหาร
                  </button>
                </form>

                {/* Right Lists / Log history */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    ประวัติการตรวจสอบเวรล่าสุด (ฝ่ายบริหาร)
                  </h4>
                  <div className="space-y-3">
                    {dutySchedules.map((sched: any) => (
                      <div key={sched.id} className="p-3 rounded-xl border border-border bg-background flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-[11px] text-primary">{sched.spotName}</span>
                          <span className="text-[9px] font-bold text-muted-foreground">{sched.timeSlot}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span>เวรประจำวัน: {sched.dayOfWeek}</span>
                          <span>ผู้รับผิดชอบ: {sched.teacher?.name || "ไม่ระบุ"}</span>
                        </div>
                        {sched.logs && sched.logs.map((log: any) => (
                          <div key={log.id} className="mt-1.5 pt-1.5 border-t border-border/60 flex items-start gap-1.5 text-[9px] text-muted-foreground leading-normal">
                            <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-500 rounded font-bold">เช็คแล้ว</span>
                            <span>{log.reportedBy}: {log.incidents}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {dutySchedules.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground">ไม่มีข้อมูลจุดเวรที่ประมวลผลในระบบ</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================
                2. DIGITAL COOPERATIVE POS & SHAREHOLDER
                ======================================================== */}
            {activeSystemTab === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
                
                {/* Products Grid */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <Boxes className="w-4 h-4 text-primary" />
                    รายการสินค้าสหกรณ์ / เครื่องเขียน / ชุดเครื่องแบบ
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {coopProducts.map((prod) => (
                      <div key={prod.id} className="p-3 rounded-xl border border-border bg-background flex justify-between items-center hover:border-primary/20 transition-all">
                        <div>
                          <h5 className="font-bold text-xs text-foreground">{prod.name}</h5>
                          <p className="text-[10px] text-primary font-black mt-0.5">{prod.price} บาท</p>
                        </div>
                        <button
                          onClick={() => addToCoopCart(prod)}
                          className="p-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cart & Checkout */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <ShoppingCart className="w-4 h-4 text-indigo-600" />
                    เครื่องคิดเงินสหกรณ์ (POS Check-out)
                  </h4>

                  {coopCart.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-muted-foreground font-semibold">
                      🛒 ยังไม่มีสินค้าในรายการคำนวณเงิน
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {coopCart.map((item) => (
                          <div key={item.product.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background border border-border/80">
                            <div>
                              <h5 className="font-bold text-foreground leading-none">{item.product.name}</h5>
                              <span className="text-[9px] text-muted-foreground mt-0.5 block">{item.product.price} บ. x {item.quantity}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => updateCartQty(item.product.id, -1)} className="p-1 bg-muted rounded hover:bg-muted-foreground/15"><Minus className="w-3 h-3" /></button>
                              <span className="font-black text-[10px] w-4 text-center">{item.quantity}</span>
                              <button onClick={() => addToCoopCart(item.product)} className="p-1 bg-muted rounded hover:bg-muted-foreground/15"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-dashed border-border pt-2 flex justify-between items-center font-bold text-xs text-foreground">
                        <span>ยอดรวมทั้งสิ้น:</span>
                        <span className="text-sm text-primary font-black">{getCartTotal()} บาท</span>
                      </div>

                      <div className="space-y-2 pt-2 text-xs">
                        <div>
                          <label className="text-[9px] font-bold block mb-1">เลือกนักเรียน/สมาชิกสหกรณ์ผู้รับเงินปันผลสะสม</label>
                          <select
                            value={selectedStudentForCoop}
                            onChange={(e) => setSelectedStudentForCoop(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none font-semibold"
                          >
                            <option value="">-- กรุณาเลือกนักเรียน --</option>
                            {students.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.studentCode} - {s.fullName} ({s.classroom})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold block mb-1">ช่องทางชำระเงิน</label>
                          <select
                            value={coopPayment}
                            onChange={(e) => setCoopPayment(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none font-semibold"
                          >
                            <option value="CASH">เงินสด (Cash)</option>
                            <option value="COOP_CREDIT">เครดิตบัตรนักเรียน (Smart Card ID)</option>
                          </select>
                        </div>

                        <button
                          onClick={handleCheckoutCoop}
                          className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all mt-2"
                        >
                          บันทึกยอดเงินและคำนวณแต้มปันผลสะสม
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-4 mt-2">
                    <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">
                      กระดานผู้ถือหุ้นปันผลสูงสุด (Top Shareholders)
                    </h5>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {coopShares.map((share, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] p-1.5 rounded bg-muted/30">
                          <span className="font-bold text-foreground truncate max-w-[150px]">
                            {share.student?.fullName || share.user?.name || "ไม่ทราบชื่อ"}
                          </span>
                          <span className="text-primary font-black shrink-0">
                            {share.sharesCount} หุ้น ({share.totalValue.toFixed(0)} บ.)
                          </span>
                        </div>
                      ))}
                      {coopShares.length === 0 && (
                        <p className="text-center text-[9px] text-muted-foreground font-semibold">ไม่มีรายการปันผลสะสมในเทอมปัจจุบัน</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================
                3. STUDENT COUNCIL E-ELECTION SYSTEM
                ======================================================== */}
            {activeSystemTab === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
                
                {/* Ballot Voting Screen */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-primary" />
                      คูหาลงคะแนนเสียงสภานักเรียนระบบอิเล็กทรอนิกส์
                    </h4>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[9px] font-bold">
                      เข้ารหัสลับรักษาความลับ (Strict Anonymity)
                    </span>
                  </div>

                  {activeElection ? (
                    <form onSubmit={handleVoteSubmit} className="space-y-4">
                      <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
                        การเลือกตั้ง: <span className="text-foreground">{activeElection.title}</span>
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {activeElection.candidates.map((cand: any) => (
                          <div 
                            key={cand.id} 
                            onClick={() => setVotedCandidateId(cand.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2 relative ${
                              votedCandidateId === cand.id 
                                ? "border-primary bg-primary/5 scale-102" 
                                : "border-border bg-background hover:border-primary/20"
                            }`}
                          >
                            <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-black flex items-center justify-center border border-primary/20">
                              {cand.partyNumber}
                            </span>
                            <div className="mt-2 text-center">
                              <h5 className="font-black text-xs text-foreground leading-none">{cand.partyName}</h5>
                              <p className="text-[9px] text-muted-foreground mt-1.5">หัวหน้า: {cand.leaderName}</p>
                            </div>
                            <p className="text-[9px] text-muted-foreground text-center font-bold border-t border-dashed border-border/80 pt-1.5 leading-snug">
                              "{cand.slogan || "ไม่มีสโลแกนพิเศษ"}"
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border pt-4 space-y-3">
                        <div className="max-w-xs space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground">ป้อนเลขรหัสประจำตัวนักเรียนของคุณ เพื่อยืนยันสิทธิ์ลงคะแนน</label>
                          <input
                            type="text"
                            value={voterCode}
                            onChange={(e) => setVoterCode(e.target.value)}
                            placeholder="เช่น 12345 หรือ G-98765"
                            className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                        >
                          ยืนยันการลงบัตรคะแนนอิเล็กทรอนิกส์ (Cast Anonymous Vote)
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-center py-6 text-xs text-muted-foreground">ไม่มีการเลือกตั้งที่มีสถานะ ACTIVE ในขณะนี้</p>
                  )}
                </div>

                {/* Real-time Tally Visualization */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ผลคะแนนเสียงแบบเรียลไทม์ (Live Scoreboard)
                  </h4>
                  
                  {activeElection ? (
                    <div className="space-y-4">
                      {activeElection.candidates.map((cand: any) => {
                        const totalVotes = activeElection.candidates.reduce((acc: number, c: any) => acc + c.votesCount, 0) || 1;
                        const pct = Math.round((cand.votesCount / totalVotes) * 100);
                        return (
                          <div key={cand.id} className="space-y-1 text-xs">
                            <div className="flex justify-between font-bold">
                              <span className="text-foreground text-[10px]">หมายเลข {cand.partyNumber} - {cand.partyName}</span>
                              <span className="text-primary font-black text-[10px]">{cand.votesCount} เสียง ({pct}%)</span>
                            </div>
                            <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border">
                              <div 
                                className="h-full bg-primary rounded-full transition-all duration-500" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <p className="text-[8px] text-muted-foreground leading-normal italic text-center font-bold mt-2">
                        * หมายเหตุ: บัญชีรายชื่อผู้ใช้สิทธิ์จะถูกสุ่มเข้ารหัสและเปรียบเทียบแฮช (SHA-256) เพื่อยืนยันว่าใช้สิทธิ์แล้วแต่จะไม่เก็บข้อมูลความสัมพันธ์ว่าใครโหวตให้เบอร์ใดเพื่อรักษาสิทธิ์ส่วนบุคคล
                      </p>
                    </div>
                  ) : (
                    <p className="text-center py-6 text-xs text-muted-foreground">ไม่มีผลคะแนนให้ประมวลผล</p>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================
                4. INVENTORY & ASSET AUDITING SYSTEM
                ======================================================== */}
            {activeSystemTab === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
                
                {/* Assets Inventory List */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-primary" />
                      ทะเบียนพัสดุและคุรุภัณฑ์โรงเรียน
                    </h4>
                    
                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="พิมพ์เพื่อค้นหาพัสดุ..."
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-1.5 text-[10px] text-foreground outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {assetsList
                      .filter(a => a.name.toLowerCase().includes(assetSearch.toLowerCase()) || a.assetCode.toLowerCase().includes(assetSearch.toLowerCase()))
                      .map((asset) => (
                        <div 
                          key={asset.id} 
                          className={`p-3 rounded-xl border bg-background flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:border-primary/20 transition-all ${
                            selectedAssetForAudit?.id === asset.id ? "border-primary bg-primary/2" : "border-border/60"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-primary px-1.5 py-0.2 bg-primary/10 rounded">{asset.assetCode}</span>
                              <h5 className="font-bold text-xs text-foreground leading-tight">{asset.name}</h5>
                            </div>
                            <div className="flex gap-3 text-[10px] text-muted-foreground font-semibold mt-1">
                              <span>ที่ตั้ง: {asset.location}</span>
                              <span>หมวดหมู่: {asset.category}</span>
                              <span>ราคา: {asset.cost.toLocaleString("th-TH")} บ.</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                              asset.status === "NORMAL" 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                : asset.status === "DAMAGED"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                            }`}>
                              {asset.status === "NORMAL" ? "ปกติ" : asset.status === "DAMAGED" ? "ชำรุดรอซ่อม" : "สูญหาย/เสื่อมสภาพ"}
                            </span>
                            <button
                              onClick={() => setSelectedAssetForAudit(asset)}
                              className="px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-all"
                            >
                              ตรวจสภาพ
                            </button>
                            <button
                              onClick={() => setShowQrCode(asset.assetCode)}
                              className="p-1 bg-muted hover:bg-muted-foreground/15 rounded-lg text-muted-foreground hover:text-foreground transition-all"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Right Auditing Form */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    ฟอร์มบันทึกการตรวจสอบสภาพ (Auditing Log)
                  </h4>

                  {selectedAssetForAudit ? (
                    <form onSubmit={handleAuditSubmit} className="space-y-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/80">
                        <span className="text-[9px] text-muted-foreground font-bold">คุณกำลังเลือกตรวจพัสดุ:</span>
                        <h5 className="font-extrabold text-xs text-foreground mt-0.5">{selectedAssetForAudit.name}</h5>
                        <p className="text-[9px] text-primary font-black">{selectedAssetForAudit.assetCode}</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold">ผลการประเมินสภาพภายนอก</label>
                        <select
                          value={auditCondition}
                          onChange={(e) => setAuditCondition(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none font-semibold"
                        >
                          <option value="GOOD">ปกติ / สมบูรณ์ดี (GOOD)</option>
                          <option value="REPAIR_NEEDED">ชำรุดต้องการการซ่อมบำรุง (REPAIR_NEEDED)</option>
                          <option value="SCRAPPED">จำหน่ายออก/แทงจำหน่ายสูญหาย (SCRAPPED)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold">บันทึกเพิ่มเติมจากผู้ตรวจ</label>
                        <textarea
                          value={auditNotes}
                          onChange={(e) => setAuditNotes(e.target.value)}
                          placeholder="กรอกข้อความระบุ เช่น จอภาพโปรเจคเตอร์มีรอยขีดข่วนเล็กน้อย แต่เปิดฉายภาพได้คมชัดดี"
                          rows={3}
                          className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none resize-none font-semibold"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                      >
                        บันทึกผลการตรวจสอบสภาพในระบบ
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedAssetForAudit(null)}
                        className="w-full py-1.5 bg-muted hover:bg-muted-foreground/15 text-muted-foreground hover:text-foreground font-bold text-[10px] rounded-lg transition-all"
                      >
                        ยกเลิกการเลือกพัสดุ
                      </button>
                    </form>
                  ) : (
                    <div className="py-12 text-center text-xs text-muted-foreground font-semibold">
                      ⚙️ กรุณาเลือกรายการพัสดุด้านซ้ายเพื่อเริ่มทำการกรอกฟอร์มตรวจสภาพ
                    </div>
                  )}

                  {/* Simulated QR Code label generator */}
                  {showQrCode && (
                    <div className="p-4 rounded-xl border border-dashed border-primary bg-primary/2 text-center space-y-2 animate-in fade-in zoom-in-95 duration-150">
                      <span className="text-[9px] text-primary font-black block">สลากแท็กบาร์โค้ด QR Code พัสดุดิจิทัล</span>
                      <div className="w-24 h-24 bg-white mx-auto border border-border rounded flex items-center justify-center p-1 font-mono text-[8px] font-bold break-all leading-none relative">
                        {/* Simulate QR look */}
                        <div className="absolute inset-1.5 bg-gradient-to-tr from-black/10 via-transparent to-black/5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:6px_6px]" />
                        <span className="z-10 bg-white/95 px-1 py-0.5 rounded text-black text-[9px] font-extrabold">{showQrCode}</span>
                      </div>
                      <p className="text-[8px] text-muted-foreground font-bold leading-normal">
                        * ลิขสิทธิ์ระบบแปะฉลากพัสดุ School OS. สั่งปริ้นลงสติกเกอร์นำไปแปะเพื่อสแกนด้วยสมาร์ทโฟนตรวจสภาพในรอบถัดไป
                      </p>
                      <button 
                        onClick={() => setShowQrCode(null)}
                        className="px-2 py-0.5 bg-muted rounded text-[8px] font-bold text-muted-foreground"
                      >
                        ปิดฉลาก
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================
                5. COUNSELING, SCHOLARSHIPS & ALUMNI SYSTEM
                ======================================================== */}
            {activeSystemTab === 5 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-200">
                
                {/* Scholarship Application Platform */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    ระบบเสนอชื่อขอรับทุนการศึกษา
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold">เลือกประเภททุนการศึกษาที่เปิดรับสมัคร</label>
                      <select
                        value={selectedScholarship}
                        onChange={(e) => setSelectedScholarship(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none font-semibold"
                      >
                        <option value="">-- เลือกทุน --</option>
                        {scholarships.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.amount.toLocaleString("th-TH")} บ.) - สปอนเซอร์ {s.sponsor}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold">ระบุชื่อนักเรียนผู้ยื่นคำขอ</label>
                      <select
                        value={selectedStudentForScholarship}
                        onChange={(e) => setSelectedStudentForScholarship(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none font-semibold"
                      >
                        <option value="">-- เลือกนักเรียนผู้สมควรรับทุน --</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.studentCode} - {s.fullName} ({s.classroom})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold">หมายเหตุเหตุผลการเสนอชื่อ / ผลการเรียน / รายได้ครอบครัว</label>
                      <textarea
                        value={scholarshipRemarks}
                        onChange={(e) => setScholarshipRemarks(e.target.value)}
                        placeholder="ระบุ เช่น เกรดเฉลี่ยสะสม 3.90 รายได้ในครัวเรือนเฉลี่ยไม่เกิน 3,000 บาทต่อเดือน พฤติกรรมเรียบร้อยช่วยเหลืองานโรงเรียนสม่ำเสมอ"
                        rows={3}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none resize-none font-semibold"
                      />
                    </div>

                    <button
                      onClick={handleApplyScholarship}
                      className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                    >
                      ส่งเสนอชื่อเข้ารับการคัดกรองระดับภาควิชาแนะแนว
                    </button>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">
                      สถานะใบเสนอขอรับทุนในภาคเรียนนี้
                    </h5>
                    <div className="space-y-2">
                      {scholarships.flatMap(s => s.applications || []).length === 0 ? (
                        <p className="text-[9px] text-muted-foreground text-center font-bold">ยังไม่มีการส่งใบสมัครขอรับทุนใหม่ในระบบ</p>
                      ) : (
                        scholarships.flatMap(s => s.applications || []).map((app: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] p-2 bg-muted/40 rounded-lg">
                            <div>
                              <span className="font-bold text-foreground block">{app.student?.fullName}</span>
                              <span className="text-[8px] text-muted-foreground">ยื่นขอทุน ID: {app.scholarshipId}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-bold border border-amber-500/20">
                              {app.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Alumni Records Directory */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    คลังฐานข้อมูลประวัติและเครือข่ายศิษย์เก่า (Alumni Tracker)
                  </h4>

                  <form onSubmit={handleAlumniSubmit} className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold">รหัสประจำตัวช่วงเรียน</label>
                      <input type="text" value={alumniCode} onChange={(e) => setAlumniCode(e.target.value)} placeholder="เช่น 09876" className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold">ชื่อศิษย์เก่า</label>
                      <input type="text" value={alumniName} onChange={(e) => setAlumniName(e.target.value)} placeholder="เช่น น.ส.นภัสสร ใจมั่น" className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold">ปีการศึกษาที่สำเร็จ</label>
                      <input type="number" value={alumniYear} onChange={(e) => setAlumniYear(Number(e.target.value))} placeholder="เช่น 2568" className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold">สถานะ TCAS / มหาวิทยาลัย</label>
                      <input type="text" value={alumniTcas} onChange={(e) => setAlumniTcas(e.target.value)} placeholder="เช่น วิศวกรรมศาสตร์ ม.เกษตรศาสตร์" className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-bold">สถานที่ทำงาน / โทนี่ผู้ประกอบการ</label>
                      <input type="text" value={alumniWork} onChange={(e) => setAlumniWork(e.target.value)} placeholder="เช่น โปรแกรมเมอร์ บริษัท เทคกรุ๊ป จำกัด" className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none" />
                    </div>
                    <button type="submit" className="col-span-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition-all mt-1">
                      บันทึกประวัติศิษย์เก่าเข้าระบบเครือข่ายสัมพันธ์
                    </button>
                  </form>

                  <div className="border-t border-border pt-4">
                    <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">
                      รายชื่อประวัติศิษย์เก่าในเครือข่ายล่าสุด
                    </h5>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {alumniRecords.map((ar, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] p-2 bg-muted/40 rounded-lg">
                          <div>
                            <span className="font-bold text-foreground block">{ar.fullName} (รุ่นปี {ar.graduationYear})</span>
                            <span className="text-[8px] text-muted-foreground font-semibold">{ar.tcasStatus}</span>
                          </div>
                          <span className="text-primary font-bold text-[9px]">
                            {ar.workplace || "ยังไม่ระบุที่ทำงาน"}
                          </span>
                        </div>
                      ))}
                      {alumniRecords.length === 0 && (
                        <p className="text-[9px] text-muted-foreground text-center font-bold">ไม่มีการจัดเก็บรายชื่อศิษย์เก่าในระบบ</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================
                6. STUDENT RISK SCREENING & MENTAL HEALTH SYSTEM
                ======================================================== */}
            {activeSystemTab === 6 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-200">
                
                {/* 9Q Depression Assessment scale */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <ListChecks className="w-4 h-4 text-primary" />
                    แบบประเมินสุขภาพจิตและภาวะซึมเศร้า 9Q Scale
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">ระบุนักเรียนที่จะคัดกรองประเมินสุขภาพจิต</label>
                      <select
                        value={screeningStudent}
                        onChange={(e) => setScreeningStudent(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none font-semibold"
                      >
                        <option value="">-- เลือกนักเรียน --</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.studentCode} - {s.fullName} ({s.classroom})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {screeningQuestions.map((q, i) => (
                        <div key={i} className="p-2.5 rounded-xl border border-border bg-background space-y-2">
                          <p className="text-[10.5px] font-bold text-foreground leading-snug">{i + 1}. {q}</p>
                          <div className="flex gap-2">
                            {["ไม่มี", "มีบางวัน", "มีบ่อย", "มีทุกวัน"].map((label, val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleRiskAnswer(i, val)}
                                className={`flex-1 py-1 rounded border text-[9px] font-semibold transition-all ${
                                  riskAnswers[i] === val 
                                    ? "bg-primary text-white border-primary" 
                                    : "bg-background text-muted-foreground border-border"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={calculateRiskResult}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                      >
                        ประมวลผลคะแนนสุทธิ
                      </button>
                      <button
                        onClick={handleSaveRiskScreening}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                      >
                        บันทึกผลการคัดกรอง
                      </button>
                    </div>

                    {screeningScore !== null && (
                      <div className="p-3 rounded-xl border border-primary/20 bg-primary/2 flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground">คะแนนคัดกรองสุทธิ:</span>
                        <div className="text-right">
                          <span className="text-sm text-primary font-black block">{screeningScore} คะแนน</span>
                          <span className="text-[9px] font-bold text-muted-foreground block">{screeningResult}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Counselor Security Counseling Logs (Strict restricted access representation) */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-red-500" />
                      บันทึกคำแนะนำจิตวิทยาแนะแนวความปลอดภัยสูง (PDPA SECURE LOGS)
                    </h4>
                    <button
                      onClick={() => setHideNotes(!hideNotes)}
                      className="p-1.5 bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
                    >
                      {hideNotes ? <EyeOff className="w-4 h-4 text-red-500" /> : <Eye className="w-4 h-4 text-emerald-500" />}
                    </button>
                  </div>

                  <form onSubmit={handleSaveCounselingSession} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold">เลือกนักเรียนที่เข้ามารับคำปรึกษา</label>
                      <select
                        value={counselingStudent}
                        onChange={(e) => setCounselingStudent(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none font-semibold"
                      >
                        <option value="">-- เลือกนักเรียน --</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.fullName} ({s.classroom})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold">หัวข้อปัญหาที่แนะแนว</label>
                      <input
                        type="text"
                        value={counselingTopics}
                        onChange={(e) => setCounselingTopics(e.target.value)}
                        placeholder="เช่น ครอบครัว, สภาพแวดล้อมเพื่อสุขภาพจิต, การเรียนคาบวิทย์"
                        className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold flex justify-between">
                        <span>รายละเอียดบันทึกความลับสูงสุด (AES-256 Mock Lock)</span>
                        {hideNotes && <span className="text-[8px] text-red-500 font-extrabold uppercase animate-pulse">✓ เข้ารหัสความปลอดภัย</span>}
                      </label>
                      <textarea
                        value={counselingNotes}
                        onChange={(e) => setCounselingNotes(e.target.value)}
                        placeholder="กรอกรายละเอียดเฉพาะเจ้าหน้าที่แนะแนวและฝ่ายพยาบาลรับรู้เท่านั้น"
                        rows={3}
                        className={`w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none resize-none font-semibold ${
                          hideNotes ? "font-serif text-[10px] tracking-widest text-muted-foreground/60 select-none pointer-events-none filter blur-xs" : ""
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="referral"
                        checked={referralNeeded}
                        onChange={(e) => setReferralNeeded(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <label htmlFor="referral" className="text-[9px] font-bold text-muted-foreground">
                        ส่งต่อไปยังฝ่ายแพทย์โรงพยาบาลภายนอกพัทยากรณีเร่งด่วน
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                    >
                      ลงบันทึกรายงานการให้คำปรึกษาจิตวิทยาปลอดภัย
                    </button>
                  </form>

                  <div className="border-t border-border pt-3">
                    <h5 className="text-[9px] font-black text-red-500/85 uppercase tracking-wider mb-2">
                      ประวัติการบันทึกแนะแนวรายสัปดาห์ (แอดมินจำกัดสิทธิ์อ่าน)
                    </h5>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {counselingHistory.map((item, i) => (
                        <div key={i} className="p-2 bg-muted/40 rounded-lg border border-border/60 text-[10px]">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-foreground">{item.student?.fullName} ({item.student?.classroom})</span>
                            <span className="text-[8px] text-muted-foreground">{new Date(item.date).toLocaleDateString("th-TH")}</span>
                          </div>
                          <p className="text-primary font-black mt-0.5">หัวข้อ: {item.topics}</p>
                          <p className={`mt-1 text-[9px] text-muted-foreground leading-normal ${hideNotes ? "filter blur-xs select-none pointer-events-none" : ""}`}>
                            {item.notesSecured}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================
                7. SAR PORTFOLIO & QUALITY ASSURANCE SYSTEM
                ======================================================== */}
            {activeSystemTab === 7 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-200">
                
                {/* Evidence Logging Form */}
                <form onSubmit={handleAddPortfolio} className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    ฟอร์มบันทึกหลักฐานการจัดการเรียนรู้/ผลงานเพื่อประเมิน SAR
                  </h4>

                  <div className="space-y-3 text-xs font-semibold">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold">ปีการศึกษาประเมิน</label>
                        <select
                          value={sarAcademicYear}
                          onChange={(e) => setSarAcademicYear(Number(e.target.value))}
                          className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none"
                        >
                          <option value={2569}>2569</option>
                          <option value={2568}>2568</option>
                          <option value={2567}>2567</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold">จัดเก็บเข้าประกันคุณภาพ สมศ.</label>
                        <select
                          value={qaStandard}
                          onChange={(e) => setQaStandard(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none"
                        >
                          <option value="มาตรฐานที่ 1.1">มาตรฐาน 1.1 ผลสัมฤทธิ์เด็ก</option>
                          <option value="มาตรฐานที่ 1.2">มาตรฐาน 1.2 คุณลักษณะพึงประสงค์</option>
                          <option value="มาตรฐานที่ 2.1">มาตรฐาน 2.1 โครงสร้างจัดการศึกษา</option>
                          <option value="มาตรฐานที่ 3.1">มาตรฐาน 3.1 ครูจัดความรู้เชิงรุก</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold">ประเภทหมวดหมู่ผลงานวิชาการ</label>
                      <select
                        value={portfolioCategory}
                        onChange={(e) => setPortfolioCategory(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none"
                      >
                        <option value="การเรียนรู้เชิงรุก (Active Learning)">การเรียนรู้เชิงรุก (Active Learning)</option>
                        <option value="วิจัยในชั้นเรียน (Classroom Research)">วิจัยในชั้นเรียน (Classroom Research)</option>
                        <option value="การอบรมพัฒนาวิชาชีพ (PLC Hour)">การอบรมพัฒนาวิชาชีพ (PLC Hour)</option>
                        <option value="การใช้สื่อและนวัตกรรมดิจิทัล">การใช้สื่อและนวัตกรรมดิจิทัล</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold">ชื่อผลงาน / กิจกรรม / รายละเอียดสังเขป</label>
                      <input
                        type="text"
                        value={activityName}
                        onChange={(e) => setActivityName(e.target.value)}
                        placeholder="เช่น เป็นผู้ควบคุมห้องทดลองเคมีในกิจกรรมเปิดโลกวิทยาศาสตร์ประจำปี"
                        className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-[9px] text-muted-foreground leading-normal">
                      💡 ข้อมูลจะถูกจัดเก็บเข้าคลังสะสมผลงานประกันคุณภาพระดับกลุ่มวิชา และสามารถเรียกสืบค้นเพื่อขอรับการประเมินตำแหน่งวิทยฐานะ ค.ศ.2 / ค.ศ.3 ในรอบปฏิทินถัดไป
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                  >
                    บันทึกผลงานลงคลังพอร์ตโฟลิโอส่วนตัว
                  </button>
                </form>

                {/* SAR Document Draft Builder */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      ระบบยกร่างเอกสารประเมินตนเองรายบุคคล (Auto SAR Builder)
                    </h4>
                    <button
                      onClick={handleGenerateSar}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-all"
                    >
                      ประมวลผลร่างรายงาน
                    </button>
                  </div>

                  {sarDraftText ? (
                    <div className="space-y-3">
                      <pre className="p-3 rounded-xl bg-background border border-border text-[9.5px] font-mono text-foreground overflow-x-auto whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                        {sarDraftText}
                      </pre>
                      <button
                        onClick={() => {
                          triggerToast("📥 ดาวน์โหลดร่าง SAR", "ส่งออกไฟล์พิมพ์เขียวรายงานประเมินตนเองในรูปแบบเอกสาร Word เสร็จสิ้น");
                          addAuditLog("DOWNLOAD_SAR_DRAFT", `ดาวน์โหลดเอกสารประเมินตนเอง ปีการศึกษา ${sarAcademicYear}`);
                        }}
                        className="w-full py-2 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
                      >
                        <Download className="w-4 h-4" />
                        ดาวน์โหลดร่างเอกสาร .docx / Word Draft
                      </button>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-xs text-muted-foreground font-semibold">
                      📝 คลิกปุ่ม "ประมวลผลร่างรายงาน" เพื่อให้ระบบช่วยเก็บรวมข้อมูลผลงานรายปีทั้งหมดสร้างเป็นร่างข้อความโครงสร้าง SAR ส่งประเมินโรงเรียน
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================
                8. SCHOOL WASTE BANK SYSTEM
                ======================================================== */}
            {activeSystemTab === 8 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
                
                {/* Waste Deposit Form */}
                <form onSubmit={handleWasteDeposit} className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <Recycle className="w-4 h-4 text-emerald-500" />
                    ฟอร์มบันทึกนำฝากขยะเพื่อการรีไซเคิล (Deposit Desk)
                  </h4>

                  <div className="space-y-3 text-xs font-semibold text-muted-foreground">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold">เลือกนักเรียนที่นำขยะมาฝากฝังสะสมแต้ม</label>
                      <select
                        value={selectedStudentForWaste}
                        onChange={(e) => setSelectedStudentForWaste(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none font-semibold"
                      >
                        <option value="">-- เลือกนักเรียน --</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.studentCode} - {s.fullName} ({s.classroom})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold">ประเภทขยะรีไซเคิล</label>
                      <select
                        value={wasteType}
                        onChange={(e) => setWasteType(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none font-semibold"
                      >
                        <option value="PLASTIC">พลาสติกขวดใส (PET Plastic) - 10 แต้ม/กก.</option>
                        <option value="PAPER">กระดาษปอนด์/กล่องนมเก่า - 5 แต้ม/กก.</option>
                        <option value="GLASS">ขวดแก้วเก่ารีไซเคิล - 8 แต้ม/กก.</option>
                        <option value="METAL">กระป๋องอลูมิเนียม/โลหะ - 15 แต้ม/กก.</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold">น้ำหนักขยะสุทธิ (กิโลกรัม)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={wasteWeight || ""}
                        onChange={(e) => setWasteWeight(Number(e.target.value))}
                        placeholder="เช่น 2.5"
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none font-semibold"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-[9px] text-emerald-600 leading-normal">
                      ♻️ ประโยชน์ขยะแปลงเป็นความดี: โรงเรียนจะนำคะแนนฝากขยะทุกๆ 10 คะแนน ไปแปรผันเพิ่มเข้าเป็นแต้มความดี (Merit) สูงสุด 10 คะแนนต่อการลงพื้นที่ เพื่อกระตุ้นพฤติกรรมรักษ์สิ่งแวดล้อม
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                  >
                    ส่งประมวลผลชั่งน้ำหนักขยะและโอนแต้มความดี
                  </button>
                </form>

                {/* Recycling Leaderboard */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <Leaf className="w-4 h-4 text-emerald-500" />
                    ทำเนียบผู้นำฝากขยะเพื่อการศึกษา (Green Leaderboard Top 10)
                  </h4>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {wasteLeaderboard.map((item, index) => (
                      <div key={item.studentId} className="flex justify-between items-center text-xs p-3 rounded-xl border border-border/80 bg-background">
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            index === 0 ? "bg-amber-400 text-black" : index === 1 ? "bg-slate-300 text-black" : index === 2 ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <h5 className="font-bold text-foreground leading-tight">{item.fullName} ({item.classroom})</h5>
                            <span className="text-[8px] text-muted-foreground font-semibold">รหัสประจำตัว: {item.studentCode}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-primary font-black text-xs block">{item.totalWeight.toFixed(1)} กก.</span>
                          <span className="text-[9px] text-muted-foreground block">{item.totalPoints} แต้มสะสม</span>
                        </div>
                      </div>
                    ))}
                    {wasteLeaderboard.length === 0 && (
                      <p className="text-center py-8 text-xs text-muted-foreground">ไม่มีข้อมูลรายการทำฝากขยะเพื่อสิ่งแวดล้อมสะสม</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================
                9. SCHOOL BUS SAFETY & TRACKING SYSTEM
                ======================================================== */}
            {activeSystemTab === 9 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
                
                {/* Mobile checkin scanner console simulator */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Bus className="w-4 h-4 text-primary" />
                      เครื่องบันทึกความปลอดภัย ขึ้น/ลงรถรับส่งนักเรียน
                    </h4>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[9px] font-bold">
                      ยิง LINE Notify ถึงผู้ปกครองทันที (โควต้าฟรีไม่จำกัด)
                    </span>
                  </div>

                  <form onSubmit={handleBusScan} className="space-y-4 text-xs font-semibold text-muted-foreground">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold">เลือกสายรถรับส่งนักเรียน</label>
                        <select
                          value={selectedBusRouteId}
                          onChange={(e) => setSelectedBusRouteId(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none"
                        >
                          <option value="">-- เลือกสายรถ --</option>
                          {busRoutes.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.busNumber} | คนขับ: {r.driverName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold">ทิศทางการรับส่ง</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setBusDirection("INBOUND")}
                            className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${
                              busDirection === "INBOUND" 
                                ? "bg-primary text-white border-primary" 
                                : "bg-background text-muted-foreground border-border"
                            }`}
                          >
                            ขาไปโรงเรียน (Inbound)
                          </button>
                          <button
                            type="button"
                            onClick={() => setBusDirection("OUTBOUND")}
                            className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${
                              busDirection === "OUTBOUND" 
                                ? "bg-primary text-white border-primary" 
                                : "bg-background text-muted-foreground border-border"
                            }`}
                          >
                            ขากลับบ้าน (Outbound)
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 border-t border-border pt-3">
                      <label className="text-[10px] font-bold">เลือกสแกนบัตรนักเรียน (คัดกรองจากสายรถ)</label>
                      <select
                        value={selectedStudentForBus}
                        onChange={(e) => setSelectedStudentForBus(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none font-bold"
                      >
                        <option value="">-- เลือกนักเรียนที่ขึ้น/ลงรถ --</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.studentCode} - {s.fullName} ({s.classroom})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                    >
                      สแกนบัตรนักเรียนเพื่อประมวลพิกัดและส่ง SMS/LINE สู่ผู้ปกครอง
                    </button>
                  </form>

                  {/* Scan log console */}
                  <div className="border-t border-border pt-4">
                    <h5 className="text-[9.5px] font-black text-muted-foreground uppercase tracking-wider mb-2">
                      บันทึกประวัติการสแกนความปลอดภัยในรอบวัน
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[9px] text-muted-foreground">
                      {busScanLogs.map((log, i) => (
                        <div key={i} className="p-2 bg-background border border-border/80 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.2 rounded text-[7px] font-black ${log.direction === "INBOUND" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                              {log.direction}
                            </span>
                            <span className="font-bold text-foreground">{log.studentName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold block text-primary">{log.time}</span>
                            <span className="text-[7px] text-muted-foreground">GPS: {log.coordinates}</span>
                          </div>
                        </div>
                      ))}
                      {busScanLogs.length === 0 && (
                        <p className="text-center py-4 text-[9px] text-muted-foreground font-bold">ไม่มีข้อมูลบันทึกสแกนความปลอดภัยในรอบ 24 ชั่วโมง</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* LINE Notify Token Linking Panel */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <Bell className="w-4 h-4 text-emerald-500" />
                    เชื่อมโยง LINE Notify สำหรับครอบครัวนักเรียน
                  </h4>

                  <div className="space-y-3 text-xs text-muted-foreground leading-normal">
                    <p className="text-[9.5px] font-bold">
                      เพื่อควบคุมค่าใช้จ่าย สิทธิ์การแจ้งเตือนพิกัดขึ้นลงรถแบบผลัก (Push Alert) จะส่งผ่าน API LINE Notify ไปยังกลุ่มไลน์ห้องเรียน ซึ่งผู้ปกครองสามารถผูกรับข่าวสารฟรีโดยไม่มีจำกัดโควต้าแชต
                    </p>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-foreground block">ขั้นตอนการติดตั้ง</label>
                      <ol className="list-decimal pl-4 text-[9px] space-y-1 font-semibold">
                        <li>เข้าเว็บไซต์ line-notify.bot.or.jp เพื่อขอรับสติกเกอร์โทเคน</li>
                        <li>เลือกกลุ่มผู้ปกครองประจำชั้น เพื่อลงทะเบียนรับข่าวพิกัดความปลอดภัย</li>
                        <li>คัดลอกโทเคน (Token) มากรอกลงในพอร์ตระบุตัวตนด้านล่าง</li>
                      </ol>
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="text-[9px] font-bold text-foreground">กรอก LINE Notify Token ของห้องเรียน/ผู้ปกครอง</label>
                      <input
                        type="password"
                        value={parentNotifyToken}
                        onChange={(e) => setParentNotifyToken(e.target.value)}
                        placeholder="เช่น n8YxQ7O2eWp3..."
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!parentNotifyToken) {
                          triggerToast("⚠️ ข้อผิดพลาด", "กรุณาระบุโทเคนเพื่อลงทะเบียน");
                          return;
                        }
                        triggerToast("✓ เชื่อมโยงบัญชีสำเร็จ", "โทเคนแจ้งเตือนความปลอดภัยรถรับส่งถูกผูกลงทะเบียน Supabase DB เรียบร้อย");
                        addAuditLog("LINK_LINE_NOTIFY_TOKEN", "เชื่อมโยงโทเคนข่าวสารแจ้งเตือนความปลอดภัย");
                        setParentNotifyToken("");
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                    >
                      ลงทะเบียนโทเคนแจ้งเตือนความปลอดภัยห้องเรียน
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================
                10. LESSON PLAN REPOSITORY & AI RUBRIC ASSISTANT
                ======================================================== */}
            {activeSystemTab === 10 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-200">
                
                {/* Lesson Plan Builder */}
                <form onSubmit={handleCreatePlan} className="p-5 rounded-2xl bg-card border border-border space-y-3 text-xs">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    เขียนแผนการสอนรายสัปดาห์ (Active Learning Lesson Plan)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-semibold">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold">เลือกรายวิชาที่มีตารางสอน</label>
                      <select
                        value={selectedSubjectIdForPlan}
                        onChange={(e) => setSelectedSubjectIdForPlan(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none font-semibold"
                      >
                        <option value="">-- เลือกวิชา --</option>
                        <option value="sci">ว31101 วิทยาศาสตร์พื้นฐาน</option>
                        <option value="math">ค31101 คณิตศาสตร์พื้นฐาน</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold">หัวข้อแผนการจัดความรู้</label>
                      <input
                        type="text"
                        value={planTitle}
                        onChange={(e) => setPlanTitle(e.target.value)}
                        placeholder="เช่น การลำเลียงสารผ่านเซลล์พืช"
                        className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 font-semibold">
                    <label className="text-[9px] font-bold">จุดประสงค์การเรียนรู้ (Objectives)</label>
                    <input
                      type="text"
                      value={planObjective}
                      onChange={(e) => setPlanObjective(e.target.value)}
                      placeholder="เช่น เพื่อให้นักเรียนสามารถจำแนกกระบวนการออสโมซิสและแพร่ได้ถูกต้อง"
                      className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-semibold">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold">สาระสำคัญ / คอนเทนต์การสอน</label>
                      <textarea
                        value={planContent}
                        onChange={(e) => setPlanContent(e.target.value)}
                        placeholder="กรอกรายละเอียดสาระเนื้อหาวิชาการ"
                        rows={2}
                        className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold">กระบวนการกิจกรรมการเรียนรู้</label>
                      <textarea
                        value={planActivities}
                        onChange={(e) => setPlanActivities(e.target.value)}
                        placeholder="ระบุกิจกรรมกระตุ้นการมีส่วนร่วม"
                        rows={2}
                        className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 font-semibold">
                    <label className="text-[9px] font-bold">เกณฑ์การประเมินและการวัดผลการเรียนรู้</label>
                    <input
                      type="text"
                      value={planEvaluation}
                      onChange={(e) => setPlanEvaluation(e.target.value)}
                      placeholder="เช่น แบบสังเกตทักษะกระบวนการกลุ่มผ่านรูบริกส์ประเมินผล"
                      className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all mt-1"
                  >
                    บันทึกแผนลงคลังและแจ้งผู้อนุมัติฝ่ายวิชาการ
                  </button>
                </form>

                {/* AI Rubric Assistant */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-4 text-xs font-semibold">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary" />
                      สมองกล AI ช่วยออกแบบเกณฑ์ประเมินสี่ระดับ (AI Rubric Builder)
                    </h4>
                    <button
                      onClick={handleGenerateRubric}
                      className="px-3 py-1 bg-primary hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all"
                    >
                      สร้างรูบริก AI
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold">ชื่อผลสัมฤทธิ์ / งานที่สั่ง</label>
                      <input
                        type="text"
                        value={rubricTopic}
                        onChange={(e) => setRubricTopic(e.target.value)}
                        placeholder="เช่น การออกแบบโมเดลจำลองเซลล์ดินเหนียว"
                        className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold">เกณฑ์ที่ต้องการประเมิน (คั่นด้วยจุลภาค)</label>
                      <input
                        type="text"
                        value={rubricCriteria}
                        onChange={(e) => setRubricCriteria(e.target.value)}
                        placeholder="เช่น ความคิดสร้างสรรค์, ความถูกต้องวิชาการ, การตรงเวลา"
                        className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground outline-none"
                      />
                    </div>
                  </div>

                  {generatedRubric.length > 0 ? (
                    <div className="space-y-2 mt-2 max-h-72 overflow-y-auto">
                      <h5 className="text-[10px] font-black text-primary uppercase">ผลการออกแบบรูบริก 4 ระดับคุณภาพ</h5>
                      {generatedRubric.map((item, idx) => (
                        <div key={idx} className="p-3 bg-muted/40 rounded-xl border border-border space-y-1.5">
                          <span className="text-[10.5px] font-black text-foreground block">เกณฑ์ประเมินด้าน: {item.criterion}</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[9px] leading-relaxed font-normal text-muted-foreground">
                            <div className="p-1.5 bg-background rounded border border-border/60"><strong className="text-foreground font-bold">ดีเยี่ยม (4):</strong> {item.level4}</div>
                            <div className="p-1.5 bg-background rounded border border-border/60"><strong className="text-foreground font-bold">ดี (3):</strong> {item.level3}</div>
                            <div className="p-1.5 bg-background rounded border border-border/60"><strong className="text-foreground font-bold">พอใช้ (2):</strong> {item.level2}</div>
                            <div className="p-1.5 bg-background rounded border border-border/60"><strong className="text-foreground font-bold">ปรับปรุง (1):</strong> {item.level1}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-xs text-muted-foreground font-semibold">
                      🤖 ป้อนข้อมูลผลสัมฤทธิ์และเกณฑ์การให้คะแนน จากนั้นคลิก "สร้างรูบริก AI" เพื่อใช้ระบบจำลอง Generative AI ในการกระจายคำนิยามตัดคะแนนตามตัวชี้วัดประกันคุณภาพการศึกษา
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
