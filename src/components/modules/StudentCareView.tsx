"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, Heart, Search, CheckCircle2, AlertCircle, ShieldAlert,
  ArrowLeft, ArrowRight, User, Home, Sparkles, Plus, Trash2, MapPin, 
  Camera, Lock, FileText, ChevronRight, HelpCircle, AlertTriangle, Edit3
} from "lucide-react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend 
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// Server Actions
import { 
  getStudentCareList, 
  getStudentCareDetail, 
  saveHomeVisitData, 
  saveSdqAssessmentData, 
  getStudentCareStats,
  searchThaiAddress
} from "@/app/actions/student-care";
import { 
  createStudent, 
  updateStudent, 
  deleteStudent 
} from "@/app/actions/student";

const getInputStyle = (value: any, isSelect = false) => {
  const base = "w-full bg-background border rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all duration-300 font-bold ";
  
  // Check if value is filled
  const isFilled = value !== undefined && value !== null && value !== "" && 
                   (typeof value === "string" ? !value.includes("เลือก") : true) &&
                   value !== "ไม่ทราบ";

  if (isFilled) {
    // Filled state: Soft mint-green
    return base + "bg-emerald-50/45 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10";
  } else {
    // Empty/Pending state: Soft warm amber
    return base + "bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10";
  }
};

interface StudentCareViewProps {
  role: string;
  lang: string;
}

export default function StudentCareView({ role, lang }: StudentCareViewProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "home-visit" | "sdq">("dashboard");

  // Central student CRUD states
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);

  // Thai Address Autocomplete
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionField, setActiveSuggestionField] = useState<"tambon" | "amphoe" | "province" | null>(null);
  
  // Student Form states
  const [studentId, setStudentId] = useState("");
  const [studentCodeForm, setStudentCodeForm] = useState("");
  const [studentNameForm, setStudentNameForm] = useState("");
  const [studentNicknameForm, setStudentNicknameForm] = useState("");
  const [studentClassroomForm, setStudentClassroomForm] = useState("ม.6/1");
  const [studentParentNameForm, setStudentParentNameForm] = useState("");
  const [studentParentPhoneForm, setStudentParentPhoneForm] = useState("");
  const [studentGenderForm, setStudentGenderForm] = useState("ชาย");

  // CRUD actions for central Student database
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createStudent({
        studentCode: studentCodeForm,
        fullName: studentNameForm,
        nickname: studentNicknameForm || undefined,
        classroom: studentClassroomForm,
        gender: studentGenderForm,
        status: "ปกติ",
        parentName: studentParentNameForm || undefined,
        parentPhone: studentParentPhoneForm || undefined,
        homeVisited: false
      });

      if (res.success) {
        showToast(lang === "th" ? "สำเร็จ" : "Success", lang === "th" ? `บันทึกข้อมูล ${studentNameForm} ลงฐานข้อมูลกลางแล้ว` : `Added ${studentNameForm} to central database`);
        setIsAddStudentOpen(false);
        // Reset form
        setStudentCodeForm("");
        setStudentNameForm("");
        setStudentNicknameForm("");
        setStudentParentNameForm("");
        setStudentParentPhoneForm("");
        await fetchInitialData();
      } else {
        setError(res.error || "Cannot create student");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create student");
    }
  };

  const handleOpenEditStudent = (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setStudentId(s.id);
    setStudentCodeForm(s.studentCode);
    setStudentNameForm(s.fullName);
    setStudentNicknameForm(s.nickname || "");
    setStudentClassroomForm(s.classroom);
    setStudentGenderForm(s.gender || "ชาย");
    setStudentParentNameForm(s.parentName || "");
    setStudentParentPhoneForm(s.parentPhone || "");
    setIsEditStudentOpen(true);
  };

  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateStudent(studentId, {
        studentCode: studentCodeForm,
        fullName: studentNameForm,
        nickname: studentNicknameForm || undefined,
        classroom: studentClassroomForm,
        status: "ปกติ",
        parentName: studentParentNameForm || undefined,
        parentPhone: studentParentPhoneForm || undefined,
        homeVisited: false
      });

      if (res.success) {
        showToast(lang === "th" ? "สำเร็จ" : "Success", lang === "th" ? `อัปเดตข้อมูลของ ${studentNameForm} เรียบร้อย` : `Updated ${studentNameForm} successfully`);
        setIsEditStudentOpen(false);
        await fetchInitialData();
      } else {
        setError(res.error || "Cannot update student");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update student");
    }
  };

  const handleDeleteStudent = async (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(lang === "th" ? `คุณแน่ใจว่าต้องการลบนักเรียน ${s.fullName} ออกจากฐานข้อมูลกลางใช่หรือไม่?` : `Are you sure you want to delete student ${s.fullName} from central database?`)) return;
    try {
      const res = await deleteStudent(s.id);
      if (res.success) {
        showToast(lang === "th" ? "สำเร็จ" : "Success", lang === "th" ? `ลบข้อมูล ${s.fullName} ออกจากระบบเรียบร้อย` : `Deleted ${s.fullName} successfully`);
        await fetchInitialData();
      } else {
        setError(res.error || "Cannot delete student");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete student");
    }
  };
  
  // Data States
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Directory Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Wizard / Edit States
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    profile: {
      nationalId: "",
      nickname: "",
      birthDate: "",
      nationality: "ไทย",
      race: "ไทย",
      religion: "พุทธ",
      bloodType: "O",
      weight: "",
      height: "",
      congenitalDisease: "",
      disabilityType: "",
      disadvantageType: "ไม่ด้อยโอกาส",
      profileImage: "",
      birthProvince: "",
      birthAmphoe: "",
      birthTambon: "",
      previousSchool: "",
      moveInReason: "",
      familyStatus: "พ่อแม่อยู่ด้วยกัน",
      livingWith: "พ่อและแม่",
      closestMember: "มารดา",
      timeSpentTogether: 5,
      siblingsSameParents: 0,
      siblingsDiffParents: 0,
      familyMembers: []
    },
    father: {
      prefix: "",
      name: "",
      idCard: "",
      phone: "",
      job: "",
      income: "",
      status: "",
      health: "",
      age: ""
    },
    mother: {
      prefix: "",
      name: "",
      idCard: "",
      phone: "",
      job: "",
      income: "",
      status: "",
      health: "",
      age: ""
    },
    guardian: {
      prefix: "",
      name: "",
      relation: "",
      phone: "",
      education: "",
      job: "",
      income: "",
      age: ""
    },
    homeVisit: {
      visitStatus: "PENDING",
      lastVisitDate: "",
      recordedBy: "",
      informantRelation: "",
      latitude: "",
      longitude: "",
      imgHouseOutside: "",
      imgHouseInside: "",
      photoSource: "",
      noPhotoReason: "",
      livingArrangements: "",
      rentalFee: 0,
      houseNumber: "",
      villageNo: "",
      buildingFloor: "",
      buildingWall: "",
      buildingRoof: "",
      toiletCondition: "",
      drinkingWater: "",
      electricity: "",
      cleanliness: "",
      safety: "",
      surroundingEnv: "",
      disasterSafety: "",
      agriculturalLand: "",
      vehicles: { car: 0, motorcycle: 1, ageOver15Years: false },
      householdAppliances: { refrigerator: true, television: true, airConditioner: false, fan: true, washingMachine: false, riceCooker: true, computer: false, waterHeater: false },
      totalHouseholdIncome: 0,
      householdMembers: 1,
      incomePerCapita: 0,
      welfareStatus: "",
      dependents: { disabled: 0, chronicIllness: 0, elderly: 0 },
      dailyAllowance: 40,
      travelMethod: "",
      distanceToSchool: 1,
      travelTimeMins: 15,
      travelCost: 0,
      isInstitutional: false,
      institutionType: "",
      institutionName: "",
      institutionProvince: "",
      institutionManager: "",
      institutionPhone: "",
      institutionEntryDate: "",
      institutionBoarding: "ไปกลับ",
      institutionHelp: { scholarship: false, meals: false },
      institutionExpense: 0,
      institutionChildren: 0,
      institutionIncome: 0,
      institutionAssets: {}
    }
  });

  // SDQ Assessment Form States
  const [sdqStudentId, setSdqStudentId] = useState<string | null>(null);
  const [sdqAssessor, setSdqAssessor] = useState<"TEACHER" | "PARENT" | "STUDENT">("TEACHER");
  const [sdqAnswers, setSdqAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const listRes = await getStudentCareList();
      const statsRes = await getStudentCareStats();
      
      if (listRes.success) setStudents(listRes.data || []);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err: any) {
      setError(err.message || "Failed to load database content");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (title: string, msg: string) => {
    setSuccessMsg(`${title}: ${msg}`);
    setTimeout(() => setSuccessMsg(""), 4500);
  };

  const compressImage = (file: File, maxW: number = 1000, maxH: number = 1000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxW) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            }
          } else {
            if (height > maxH) {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.75);
            resolve(compressed);
          } else {
            reject(new Error("Canvas context is null"));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: "imgHouseOutside" | "imgHouseInside" | "profileImage") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast(lang === "th" ? "กำลังประมวลผล..." : "Processing...", lang === "th" ? "ระบบกำลังบีบอัดไฟล์ภาพเพื่อประหยัดพื้นที่จัดเก็บ" : "Compressing image to optimize storage space");
      const compressedBase64 = await compressImage(file, 1000, 1000);
      
      if (targetField === "profileImage") {
        setFormData((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, profileImage: compressedBase64 }
        }));
      } else {
        setFormData((prev: any) => ({
          ...prev,
          homeVisit: { ...prev.homeVisit, [targetField]: compressedBase64 }
        }));
      }
      
      showToast(lang === "th" ? "อัปโหลดรูปสำเร็จ" : "Upload Success", lang === "th" ? "ภาพได้รับการบีบอัดและแนบในแบบฟอร์มเรียบร้อยแล้ว" : "Image compressed and attached successfully");
    } catch (err: any) {
      alert(lang === "th" ? "เกิดข้อผิดพลาดในการประมวลผลรูปภาพ: " + err.message : "Error processing image: " + err.message);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัด GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev: any) => ({
          ...prev,
          homeVisit: {
            ...prev.homeVisit,
            latitude: parseFloat(position.coords.latitude.toFixed(6)),
            longitude: parseFloat(position.coords.longitude.toFixed(6))
          }
        }));
        showToast(lang === "th" ? "ดึงพิกัดสำเร็จ" : "GPS Found", lang === "th" ? "ดึงข้อมูลละติจูดและลองจิจูดจากอุปกรณ์สำเร็จ" : "Latitude and longitude populated");
      },
      (error) => {
        alert("ไม่สามารถดึงพิกัดได้: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleOpenNavigation = () => {
    const lat = formData.homeVisit.latitude;
    const lng = formData.homeVisit.longitude;
    if (!lat || !lng) {
      alert(lang === "th" ? "กรุณากรอกหรือดึงพิกัดละติจูด/ลองจิจูดก่อนนำทาง" : "Please enter or fetch GPS coordinates first");
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  const getAgeFromBirthdate = (birthDateString: string) => {
    if (!birthDateString) return "";
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : "";
  };

  const copyParentToGuardian = (parentType: "father" | "mother") => {
    const parent = formData[parentType];
    setFormData((prev: any) => ({
      ...prev,
      guardian: {
        ...prev.guardian,
        prefix: parent.prefix || "",
        name: parent.name || "",
        relation: parentType === "father" ? "บิดา" : "มารดา",
        phone: parent.phone || "",
        job: parent.job || "",
        income: parent.income || "",
        age: parent.age || ""
      }
    }));
    showToast(
      lang === "th" ? "คัดลอกสำเร็จ" : "Copied",
      lang === "th" 
        ? `ดึงข้อมูลจาก${parentType === "father" ? "บิดา" : "มารดา"}มายังผู้ปกครองเรียบร้อย` 
        : `Copied data from ${parentType} to guardian`
    );
  };

  // Helper to load student data into editing state
  const handleEditStudent = async (studentId: string) => {
    setLoading(true);
    try {
      const res = await getStudentCareDetail(studentId);
      if (res.success && res.data) {
        const stud = res.data;
        // Map database state to component form state
        setEditingStudentId(studentId);
        setCurrentStep(1);

        const vehiclesObj = stud.homeVisit?.vehicles ? JSON.parse(stud.homeVisit.vehicles) : { car: 0, motorcycle: 0, ageOver15Years: false };
        const householdAppliancesObj = stud.homeVisit?.householdAppliances 
          ? JSON.parse(stud.homeVisit.householdAppliances) 
          : { refrigerator: true, television: true, airConditioner: false, fan: true, washingMachine: false, riceCooker: true, computer: false, waterHeater: false };
        const dependentsObj = stud.homeVisit?.dependents ? JSON.parse(stud.homeVisit.dependents) : { disabled: 0, chronicIllness: 0, elderly: 0 };
        const institutionHelpObj = stud.homeVisit?.institutionHelp ? JSON.parse(stud.homeVisit.institutionHelp) : { scholarship: false, meals: false };

        // Parse special family records
        const fatherRecord: any = stud.profile?.familyMembers?.find((m: any) => m.relation === "บิดา") || {};
        const motherRecord: any = stud.profile?.familyMembers?.find((m: any) => m.relation === "มารดา") || {};
        const guardianRecord: any = stud.profile?.familyMembers?.find((m: any) => m.relation === "ผู้ปกครอง") || {};

        // Filter general family members
        const generalFamilyMembers = stud.profile?.familyMembers?.filter(
          (m: any) => m.relation !== "บิดา" && m.relation !== "มารดา" && m.relation !== "ผู้ปกครอง"
        ) || [];

        setFormData({
          profile: {
            nationalId: stud.profile?.nationalId || "",
            nickname: stud.profile?.nickname || stud.nickname || "",
            birthDate: stud.profile?.birthDate ? new Date(stud.profile.birthDate).toISOString().split("T")[0] : "",
            nationality: stud.profile?.nationality || "ไทย",
            race: stud.profile?.race || "ไทย",
            religion: stud.profile?.religion || "พุทธ",
            bloodType: stud.profile?.bloodType || "O",
            weight: stud.profile?.weight || stud.weight || "",
            height: stud.profile?.height || stud.height || "",
            congenitalDisease: stud.profile?.congenitalDisease || "",
            disabilityType: stud.profile?.disabilityType || "",
            disadvantageType: stud.profile?.disadvantageType || "ไม่ด้อยโอกาส",
            profileImage: stud.profile?.profileImage || "",
            birthProvince: stud.profile?.birthProvince || "",
            birthAmphoe: stud.profile?.birthAmphoe || "",
            birthTambon: stud.profile?.birthTambon || "",
            previousSchool: stud.profile?.previousSchool || "",
            moveInReason: stud.profile?.moveInReason || "",
            familyStatus: stud.profile?.familyStatus || "พ่อแม่อยู่ด้วยกัน",
            livingWith: stud.profile?.livingWith || "พ่อและแม่",
            closestMember: stud.profile?.closestMember || "มารดา",
            timeSpentTogether: stud.profile?.timeSpentTogether || 5,
            siblingsSameParents: stud.profile?.siblingsSameParents || 0,
            siblingsDiffParents: stud.profile?.siblingsDiffParents || 0,
            familyMembers: generalFamilyMembers
          },
          father: {
            prefix: fatherRecord.prefix || "",
            name: fatherRecord.name || "",
            idCard: fatherRecord.nationalId || "",
            phone: fatherRecord.phone || "",
            job: fatherRecord.job || "",
            income: fatherRecord.wages || "",
            status: fatherRecord.status || "มีชีวิตอยู่",
            health: fatherRecord.health || "ปกติ",
            age: fatherRecord.age || ""
          },
          mother: {
            prefix: motherRecord.prefix || "",
            name: motherRecord.name || "",
            idCard: motherRecord.nationalId || "",
            phone: motherRecord.phone || "",
            job: motherRecord.job || "",
            income: motherRecord.wages || "",
            status: motherRecord.status || "มีชีวิตอยู่",
            health: motherRecord.health || "ปกติ",
            age: motherRecord.age || ""
          },
          guardian: {
            prefix: guardianRecord.prefix || "",
            name: guardianRecord.name || "",
            relation: guardianRecord.status || "", // Storing relation in status field
            phone: guardianRecord.phone || "",
            education: guardianRecord.education || "",
            job: guardianRecord.job || "",
            income: guardianRecord.wages || "",
            age: guardianRecord.age || ""
          },
          homeVisit: {
            visitStatus: stud.homeVisit?.visitStatus || "PENDING",
            lastVisitDate: stud.homeVisit?.lastVisitDate ? new Date(stud.homeVisit.lastVisitDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            recordedBy: stud.homeVisit?.recordedBy || "",
            informantRelation: stud.homeVisit?.informantRelation || "",
            latitude: stud.homeVisit?.latitude || "",
            longitude: stud.homeVisit?.longitude || "",
            imgHouseOutside: stud.homeVisit?.imgHouseOutside || "",
            imgHouseInside: stud.homeVisit?.imgHouseInside || "",
            photoSource: stud.homeVisit?.photoSource || "",
            noPhotoReason: stud.homeVisit?.noPhotoReason || "",
            livingArrangements: stud.homeVisit?.livingArrangements || "",
            rentalFee: stud.homeVisit?.rentalFee || 0,
            houseNumber: stud.homeVisit?.houseNumber || "",
            villageNo: stud.homeVisit?.villageNo || "",
            buildingFloor: stud.homeVisit?.buildingFloor || "",
            buildingWall: stud.homeVisit?.buildingWall || "",
            buildingRoof: stud.homeVisit?.buildingRoof || "",
            toiletCondition: stud.homeVisit?.toiletCondition || "",
            drinkingWater: stud.homeVisit?.drinkingWater || "",
            electricity: stud.homeVisit?.electricity || "",
            cleanliness: stud.homeVisit?.cleanliness || "",
            safety: stud.homeVisit?.safety || "",
            surroundingEnv: stud.homeVisit?.surroundingEnv || "",
            disasterSafety: stud.homeVisit?.disasterSafety || "",
            agriculturalLand: stud.homeVisit?.agriculturalLand || "",
            vehicles: vehiclesObj,
            householdAppliances: householdAppliancesObj,
            totalHouseholdIncome: stud.homeVisit?.totalHouseholdIncome || 0,
            householdMembers: stud.homeVisit?.householdMembers || 1,
            incomePerCapita: stud.homeVisit?.incomePerCapita || 0,
            welfareStatus: stud.homeVisit?.welfareStatus || "",
            dependents: dependentsObj,
            dailyAllowance: stud.homeVisit?.dailyAllowance || 40,
            travelMethod: stud.homeVisit?.travelMethod || "",
            distanceToSchool: stud.homeVisit?.distanceToSchool || 1,
            travelTimeMins: stud.homeVisit?.travelTimeMins || 15,
            travelCost: stud.homeVisit?.travelCost || 0,
            isInstitutional: stud.homeVisit?.isInstitutional || false,
            institutionType: stud.homeVisit?.institutionType || "",
            institutionName: stud.homeVisit?.institutionName || "",
            institutionProvince: stud.homeVisit?.institutionProvince || "",
            institutionManager: stud.homeVisit?.institutionManager || "",
            institutionPhone: stud.homeVisit?.institutionPhone || "",
            institutionEntryDate: stud.homeVisit?.institutionEntryDate || "",
            institutionBoarding: stud.homeVisit?.institutionBoarding || "ไปกลับ",
            institutionHelp: institutionHelpObj,
            institutionExpense: stud.homeVisit?.institutionExpense || 0,
            institutionChildren: stud.homeVisit?.institutionChildren || 0,
            institutionIncome: stud.homeVisit?.institutionIncome || 0,
            institutionAssets: stud.homeVisit?.institutionAssets ? JSON.parse(stud.homeVisit.institutionAssets) : {}
          }
        });
      } else {
        setError(res.error || "Cannot retrieve student data");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load database detail");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHomeVisit = async () => {
    if (!editingStudentId) return;

    // Check nationality to toggle validation rules
    const isForeigner = formData.profile.nationality !== "ไทย";

    // 1. Validate Student's National ID
    const studId = formData.profile.nationalId.trim();
    if (studId) {
      if (!isForeigner) {
        if (!/^\d{13}$/.test(studId)) {
          setError(lang === "th" ? "❌ เลขประจำตัวประชาชนของนักเรียนต้องเป็นตัวเลข 13 หลัก" : "❌ Student's National ID must be exactly 13 digits");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      } else {
        if (!/^[A-Za-z0-9-]+$/.test(studId)) {
          setError(lang === "th" ? "❌ เลขประจำตัวต่างชาติของนักเรียนต้องประกอบด้วยตัวอักษรและตัวเลขเท่านั้น" : "❌ Foreigner's student ID must contain alphanumeric characters only");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }
    }

    // 2. Validate Father's National ID
    if (formData.father.name) {
      const fatherId = formData.father.idCard.trim();
      if (fatherId) {
        if (!isForeigner) {
          if (!/^\d{13}$/.test(fatherId)) {
            setError(lang === "th" ? "❌ เลขประจำตัวประชาชนของบิดาต้องเป็นตัวเลข 13 หลัก" : "❌ Father's National ID must be exactly 13 digits");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
        } else {
          if (!/^[A-Za-z0-9-]+$/.test(fatherId)) {
            setError(lang === "th" ? "❌ เลขประจำตัวต่างชาติของบิดาต้องประกอบด้วยตัวอักษรและตัวเลขเท่านั้น" : "❌ Father's Foreign ID must contain alphanumeric characters only");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
        }
      }
    }

    // 3. Validate Mother's National ID
    if (formData.mother.name) {
      const motherId = formData.mother.idCard.trim();
      if (motherId) {
        if (!isForeigner) {
          if (!/^\d{13}$/.test(motherId)) {
            setError(lang === "th" ? "❌ เลขประจำตัวประชาชนของมารดาต้องเป็นตัวเลข 13 หลัก" : "❌ Mother's National ID must be exactly 13 digits");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
        } else {
          if (!/^[A-Za-z0-9-]+$/.test(motherId)) {
            setError(lang === "th" ? "❌ เลขประจำตัวต่างชาติของมารดาต้องประกอบด้วยตัวอักษรและตัวเลขเท่านั้น" : "❌ Mother's Foreign ID must contain alphanumeric characters only");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
        }
      }
    }

    // 4. Validate Phone Numbers (exactly 10 digits if filled, numbers only)
    if (formData.father.phone) {
      const fatherPhone = formData.father.phone.trim().replace(/[- ]/g, "");
      if (fatherPhone && !/^\d{10}$/.test(fatherPhone)) {
        setError(lang === "th" ? "❌ เบอร์โทรศัพท์ของบิดาต้องเป็นตัวเลข 10 หลัก" : "❌ Father's phone number must be exactly 10 digits");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (formData.mother.phone) {
      const motherPhone = formData.mother.phone.trim().replace(/[- ]/g, "");
      if (motherPhone && !/^\d{10}$/.test(motherPhone)) {
        setError(lang === "th" ? "❌ เบอร์โทรศัพท์ของมารดาต้องเป็นตัวเลข 10 หลัก" : "❌ Mother's phone number must be exactly 10 digits");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (formData.guardian.phone) {
      const guardianPhone = formData.guardian.phone.trim().replace(/[- ]/g, "");
      if (guardianPhone && !/^\d{10}$/.test(guardianPhone)) {
        setError(lang === "th" ? "❌ เบอร์โทรศัพท์ของผู้ปกครองต้องเป็นตัวเลข 10 หลัก" : "❌ Guardian's phone number must be exactly 10 digits");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    // Reset error message if validation passes
    setError("");
    setLoading(true);
    try {
      const res = await saveHomeVisitData(editingStudentId, formData);
      if (res.success) {
        showToast(lang === "th" ? "💾 บันทึกสำเร็จ" : "💾 Saved Successfully", lang === "th" ? "ข้อมูล นร.01 และบันทึกเยี่ยมบ้านได้รับการอัปเดตแล้ว" : "Student profile and visit logs updated");
        setEditingStudentId(null);
        await fetchInitialData();
      } else {
        setError(res.error || "Failed to save profile");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  // SDQ Questionnaire definition
  const sdqQuestions = [
    { id: 1, th: "ใส่ใจความรู้สึกคนอื่น", en: "Considerate of other people's feelings", type: "prosocial", rev: false },
    { id: 2, th: "อยู่ไม่นิ่ง ยืนเลื่อนลอย ทำงานไม่เสร็จ", en: "Restless, overactive, cannot stay still for long", type: "hyper", rev: false },
    { id: 3, th: "มักจะบ่นว่าปวดศีรษะ ปวดท้อง หรือไม่สบายบ่อยๆ", en: "Often complains of headaches, stomach-aches or sickness", type: "emotional", rev: false },
    { id: 4, th: "มักแบ่งปันสิ่งของให้ผู้อื่น", en: "Shares readily with other children", type: "prosocial", rev: false },
    { id: 5, th: "มักจะอาละวาด หรือโกรธรุนแรง", en: "Often has temper tantrums or hot tempers", type: "conduct", rev: false },
    { id: 6, th: "ค่อนข้างแยกตัว ชอบเล่นคนเดียว", en: "Rather solitary, tends to play alone", type: "peer", rev: false },
    { id: 7, th: "มักเชื่อฟัง เชื่อครูหรือพ่อแม่", en: "Generally obedient, usually does what adults request", type: "conduct", rev: true },
    { id: 8, th: "กังวลใจ มักมีเรื่องไม่สบายใจบ่อยๆ", en: "Many worries, seems worried", type: "emotional", rev: false },
    { id: 9, th: "ยินดีช่วยเหลือผู้อื่นเมื่อเขาต้องการ", en: "Helpful if someone is hurt, upset or feeling ill", type: "prosocial", rev: false },
    { id: 10, th: "อยู่ไม่นิ่ง ชอบขยับตัวไปมาตลอดเวลา", en: "Constantly fidgeting or squirming", type: "hyper", rev: false },
    { id: 11, th: "มีเพื่อนสนิทอย่างน้อยหนึ่งคน", en: "Has at least one good friend", type: "peer", rev: true },
    { id: 12, th: "มักจะมีเรื่องทะเลาะวิวาทหรือรังแกผู้อื่น", en: "Often fights with other children or bullies them", type: "conduct", rev: false },
    { id: 13, th: "ดูเศร้าหมอง ท้อแท้ หรือร้องไห้ง่าย", en: "Often unhappy, down-hearted or tearful", type: "emotional", rev: false },
    { id: 14, th: "เพื่อนๆ มักชอบเล่นด้วย", en: "Generally liked by other children", type: "peer", rev: true },
    { id: 15, th: "วอกแวกง่าย สมาธิสั้น", en: "Easily distracted, concentration wanders", type: "hyper", rev: false },
    { id: 16, th: "ประหม่าหรือไม่มั่นใจในตัวเองเมื่อเจอสิ่งใหม่ๆ", en: "Nervous or clingy in new situations, easily loses confidence", type: "emotional", rev: false },
    { id: 17, th: "อ่อนโยนต่อเด็กที่เล็กกว่า", en: "Kind to younger children", type: "prosocial", rev: false },
    { id: 18, th: "มักโกหกหรือขโมยของ", en: "Often lies or cheats", type: "conduct", rev: false },
    { id: 19, th: "โดนเด็กคนอื่นรังแกหรือกลั่นแกล้ง", en: "Picked on or bullied by other children", type: "peer", rev: false },
    { id: 20, th: "มักจะอาสาสมัครช่วยเหลือผู้อื่น", en: "Often volunteers to help others", type: "prosocial", rev: false },
    { id: 21, th: "คิดก่อนทำ", en: "Thinks things out before acting", type: "hyper", rev: true },
    { id: 22, th: "ลักขโมยของจากบ้านหรือที่อื่น", en: "Steals from home, school or elsewhere", type: "conduct", rev: false },
    { id: 23, th: "เข้ากับผู้ใหญ่ได้ดีกว่าเด็กวัยเดียวกัน", en: "Gets on better with adults than with other children", type: "peer", rev: false },
    { id: 24, th: "ขี้กลัว รู้สึกตื่นตระหนกได้ง่าย", en: "Many fears, easily scared", type: "emotional", rev: false },
    { id: 25, th: "ทำงานได้จนเสร็จ มีสมาธิดี", en: "Sees tasks through to the end, good attention span", type: "hyper", rev: true },
  ];

  const handleOpenSdq = (studentId: string) => {
    setSdqStudentId(studentId);
    setSdqAnswers({});
    setSdqAssessor("TEACHER");
  };

  const calculateSdqScores = () => {
    let emotional = 0;
    let conduct = 0;
    let hyper = 0;
    let peer = 0;
    let prosocial = 0;

    sdqQuestions.forEach((q) => {
      const answerVal = sdqAnswers[q.id] || 0; // default 0 if not answered
      let finalScore = answerVal;
      if (q.rev) {
        // Reverse score: 0 -> 2, 1 -> 1, 2 -> 0
        finalScore = 2 - answerVal;
      }

      if (q.type === "emotional") emotional += finalScore;
      else if (q.type === "conduct") conduct += finalScore;
      else if (q.type === "hyper") hyper += finalScore;
      else if (q.type === "peer") peer += finalScore;
      else if (q.type === "prosocial") prosocial += finalScore;
    });

    const total = emotional + conduct + hyper + peer;

    // Determine status based on total score (standard threshold Risk >= 16)
    let status = "NORMAL";
    if (total >= 16) {
      status = "RISK";
    } else if (total >= 12) {
      status = "BORDERLINE";
    }

    return {
      emotionalScore: emotional,
      conductScore: conduct,
      hyperactivityScore: hyper,
      peerScore: peer,
      prosocialScore: prosocial,
      totalScore: total,
      riskStatus: status
    };
  };

  const handleSaveSdq = async () => {
    if (!sdqStudentId) return;
    setLoading(true);
    try {
      const scoreData = calculateSdqScores();
      const res = await saveSdqAssessmentData(
        sdqStudentId,
        sdqAssessor,
        scoreData,
        JSON.stringify(sdqAnswers)
      );

      if (res.success) {
        showToast(
          lang === "th" ? "📝 ส่งประเมิน SDQ สำเร็จ" : "📝 SDQ Evaluation Saved",
          lang === "th" 
            ? `บันทึกแบบประเมินเรียบร้อย ระดับความเสี่ยง: ${scoreData.riskStatus === "RISK" ? "มีปัญหา" : scoreData.riskStatus === "BORDERLINE" ? "เสี่ยง" : "ปกติ"}`
            : `Assessed successfully. Status: ${scoreData.riskStatus}`
        );
        setSdqStudentId(null);
        await fetchInitialData();
      } else {
        setError(res.error || "Cannot save SDQ assessment");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save SDQ data");
    } finally {
      setLoading(false);
    }
  };

  // Filters students list based on search query, classroom, and status
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.studentCode.includes(searchQuery);
    const matchesClass = selectedClassroom === "ALL" || s.classroom === selectedClassroom;
    
    let matchesStatus = true;
    if (selectedStatus === "COMPLETED") {
      matchesStatus = s.homeVisit?.visitStatus === "COMPLETED";
    } else if (selectedStatus === "PENDING") {
      matchesStatus = !s.homeVisit || s.homeVisit.visitStatus !== "COMPLETED";
    }

    return matchesSearch && matchesClass && matchesStatus;
  });

  const classrooms = Array.from(new Set(students.map(s => s.classroom)));

  // Checking locking rules
  const isFormLocked = role === "student" && formData.homeVisit.visitStatus === "COMPLETED";

  // Recharts colors
  const COLORS = ["#8B5CF6", "#38BDF8", "#FB7185", "#F59E0B"];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* SUCCESS / ERROR NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-xs underline cursor-pointer">dismiss</button>
        </div>
      )}

      {/* TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white leading-tight">
              {lang === "th" ? "ระบบดูแลช่วยเหลือนักเรียน (Student Support Portal)" : "Student Support Portal"}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {lang === "th" ? "ประเมินสุขภาพจิต SDQ และลงพื้นที่ตรวจเยี่ยมบ้าน นร.01 เต็มรูปแบบ" : "Mental health SDQ evaluation and full Nor Por 01 home visit tracking"}
            </p>
          </div>
        </div>

        {/* MODE/ROLE BADGE */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 capitalize">
            {lang === "th" ? `บทบาท: ${role === "teacher" ? "คุณครู" : role === "director" ? "ผู้บริหาร" : role === "admin" ? "ผู้ดูแลระบบ" : "นักเรียน"}` : `Role: ${role}`}
          </span>
        </div>
      </div>

      {/* PORTAL MAIN TAB SELECTOR */}
      {!editingStudentId && !sdqStudentId && (
        <div className="flex gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1 shrink-0 overflow-x-auto">
          {[
            { key: "dashboard", label: lang === "th" ? "แผงผู้บริหาร (Dashboard)" : "Executive Dashboard", icon: Activity },
            { key: "home-visit", label: lang === "th" ? "การเยี่ยมบ้าน (นร.01 Wizard)" : "Home Visits (นร.01)", icon: Home },
            { key: "sdq", label: lang === "th" ? "ประเมินสุขภาพจิต (SDQ)" : "SDQ Evaluations", icon: FileText }
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setError("");
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. EXECUTIVE DASHBOARD TAB                                     */}
      {/* ============================================================== */}
      {activeTab === "dashboard" && !editingStudentId && !sdqStudentId && (
        <div className="space-y-6">
          
          {/* STATS HIGHLIGHT CARDS */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="glass-card p-5 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {lang === "th" ? "อัตราความยากจนพิเศษ (รายได้เฉลี่ย <= 3,000 บาท)" : "Ultra-Poor Student Ratio (Income <= 3,000)"}
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {stats.ultraPoorRatio}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({stats.ultraPoorCount} {lang === "th" ? "คน" : "students"})
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="bg-accent h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stats.ultraPoorRatio}%` }}
                  />
                </div>
              </div>

              <div className="glass-card p-5 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {lang === "th" ? "การประเมิน SDQ ครบถ้วน" : "SDQ Evaluations Completed"}
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {students.filter(s => s.sdqAssessments?.length > 0).length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {students.length} {lang === "th" ? "คนทั้งหมด" : "total students"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-500" 
                    style={{ width: `${students.length > 0 ? (students.filter(s => s.sdqAssessments?.length > 0).length / students.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="glass-card p-5 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {lang === "th" ? "เสร็จสิ้นการเยี่ยมบ้าน นร.01" : "นร.01 Home Visit Completed"}
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {students.filter(s => s.homeVisit?.visitStatus === "COMPLETED").length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {students.length} {lang === "th" ? "คนทั้งหมด" : "total students"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${students.length > 0 ? (students.filter(s => s.homeVisit?.visitStatus === "COMPLETED").length / students.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* DUAL COLUMN CHART & TABLE */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* DONUT CHART FOR HIGH RISK DISTRIBUTION */}
            <div className="glass-card p-5 lg:col-span-2 flex flex-col">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                {lang === "th" ? "สัดส่วนความเสี่ยงหลักของนักเรียน" : "Risk Classification Distribution"}
              </h4>
              <p className="text-[10px] text-muted-foreground mb-4">
                {lang === "th" ? "แบ่งตามกลุ่มเสี่ยงและปัญหาพฤติกรรม สุขภาพ ความปลอดภัย เศรษฐกิจ" : "Categorized by behavioral, safety, health, and economic indicators"}
              </p>

              {stats && stats.riskDistribution && stats.riskDistribution.length > 0 ? (
                <div className="flex-1 min-h-[220px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={stats.riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.riskDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                  <span className="text-xs text-slate-450">{lang === "th" ? "ไม่มีข้อมูลความเสี่ยงสะสม" : "No risk data collected yet"}</span>
                </div>
              )}
            </div>

            {/* CLASSROOM PROGRESS LIST */}
            <div className="glass-card p-5 lg:col-span-3 flex flex-col">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4">
                {lang === "th" ? "ตารางความคืบหน้ารายชั้นเรียน" : "Classroom Completion Progress"}
              </h4>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="py-2.5">{lang === "th" ? "ชั้นเรียน" : "Classroom"}</th>
                      <th className="py-2.5">{lang === "th" ? "นักเรียนทั้งหมด" : "Total Students"}</th>
                      <th className="py-2.5">{lang === "th" ? "การเยี่ยมบ้าน (นร.01)" : "Home Visits (%)"}</th>
                      <th className="py-2.5">{lang === "th" ? "การประเมิน SDQ" : "SDQ Eval (%)"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.classroomProgress?.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100/50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-3 font-bold text-slate-900 dark:text-white">{item.classroom}</td>
                        <td className="py-3 font-medium text-slate-500">{item.totalStudents} {lang === "th" ? "คน" : "students"}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.homeVisitProgress}%</span>
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full" style={{ width: `${item.homeVisitProgress}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.sdqProgress}%</span>
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div className="bg-primary h-full" style={{ width: `${item.sdqProgress}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 2. DIRECTORIES LIST (HOME VISIT & SDQ DIRECTORIES)             */}
      {/* ============================================================== */}
      {!editingStudentId && !sdqStudentId && activeTab !== "dashboard" && (
        <div className="space-y-4">
          
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="glass-card p-4 flex flex-col md:flex-row gap-3 items-center">
            
            {/* Search Input */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "th" ? "ค้นหาชื่อนักเรียน หรือรหัสประจำตัว..." : "Search by student name or code..."}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none text-xs rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
              />
            </div>

            {role === "admin" && (
              <button
                onClick={() => setIsAddStudentOpen(true)}
                className="w-full md:w-auto h-10 px-4 rounded-xl bg-primary hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary/10 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === "th" ? "เพิ่มนักเรียนใหม่" : "Add Student"}</span>
              </button>
            )}

            {/* Classroom Select Dropdown */}
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full md:w-44 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none text-xs rounded-xl focus:border-primary font-bold cursor-pointer"
            >
              <option value="ALL">{lang === "th" ? "ทุกระดับชั้น" : "All Classrooms"}</option>
              {classrooms.map((cls, idx) => (
                <option key={idx} value={cls}>{cls}</option>
              ))}
            </select>

            {/* Status Select Dropdown */}
            {activeTab === "home-visit" && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full md:w-44 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none text-xs rounded-xl focus:border-primary font-bold cursor-pointer"
              >
                <option value="ALL">{lang === "th" ? "ทุกสถานะเยี่ยมบ้าน" : "All Home Visit Status"}</option>
                <option value="COMPLETED">{lang === "th" ? "เยี่ยมบ้านเสร็จสิ้น" : "Completed"}</option>
                <option value="PENDING">{lang === "th" ? "รอดำเนินการ" : "Pending"}</option>
              </select>
            )}
          </div>

          {/* STUDENTS GRID / LIST (Optimized for Mobile viewports) */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              <span className="text-xs text-muted-foreground">{lang === "th" ? "กำลังโหลดข้อมูล..." : "Loading students data..."}</span>
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-xs text-left border-collapse bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-bold bg-muted/20">
                    <th className="py-3 px-4 text-center">รหัสประจำตัว</th>
                    <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                    <th className="py-3 px-4 text-center">ชั้นเรียน</th>
                    <th className="py-3 px-4 text-center">กลุ่มสถานะ</th>
                    <th className="py-3 px-4 text-center">การเยี่ยมบ้าน (นร.01)</th>
                    <th className="py-3 px-4 text-center">ประเมินสุขภาพ (SDQ)</th>
                    <th className="py-3 px-4 text-center">การดำเนินการ</th>
                    {role === "admin" && <th className="py-3 px-4 text-right">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-semibold text-slate-700 dark:text-slate-355">
                  {filteredStudents.map((s) => {
                    const homeVisitCompleted = s.homeVisit?.visitStatus === "COMPLETED";
                    const hasSdq = s.sdqAssessments && s.sdqAssessments.length > 0;
                    
                    return (
                      <tr key={s.id} className="hover:bg-muted/30 transition-all">
                        <td className="py-3 px-4 text-center font-mono">{s.studentCode}</td>
                        <td className="py-3 px-4 font-bold text-foreground">{s.fullName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-500 rounded-full font-bold">
                            {s.classroom}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            s.status === "ช่วยเหลือเร่งด่วน" 
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/25" 
                              : s.status === "เสี่ยง" 
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/25" 
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/25"
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${homeVisitCompleted ? "text-emerald-500" : "text-amber-500"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${homeVisitCompleted ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                            {homeVisitCompleted ? (lang === "th" ? "เยี่ยมบ้านแล้ว" : "Completed") : (lang === "th" ? "รอดำเนินการ" : "Pending")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${hasSdq ? "text-primary" : "text-slate-400"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${hasSdq ? "bg-primary animate-pulse" : "bg-slate-300"}`} />
                            {hasSdq ? (lang === "th" ? "ประเมินแล้ว" : "Assessed") : (lang === "th" ? "ไม่ได้ประเมิน" : "Not Assessed")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {activeTab === "home-visit" ? (
                            <button
                              onClick={() => handleEditStudent(s.id)}
                              className="py-1 px-3 bg-primary/10 hover:bg-primary text-primary hover:text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                            >
                              <Home className="w-3 h-3" />
                              <span>{lang === "th" ? "กรอกข้อมูล / ตรวจสอบ" : "Fill Wizard / Review"}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenSdq(s.id)}
                              className="py-1 px-3 bg-primary/10 hover:bg-primary text-primary hover:text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                            >
                              <FileText className="w-3 h-3" />
                              <span>{lang === "th" ? "ทำประเมิน SDQ" : "Do SDQ Assessment"}</span>
                            </button>
                          )}
                        </td>
                        {role === "admin" && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={(e) => handleOpenEditStudent(s, e)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary rounded-lg transition-colors cursor-pointer"
                                title={lang === "th" ? "แก้ไขนักเรียน" : "Edit student"}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteStudent(s, e)}
                                className="p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title={lang === "th" ? "ลบนักเรียน" : "Delete student"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
              <AlertCircle className="w-10 h-10 text-slate-350 mb-3" />
              <h5 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">{lang === "th" ? "ไม่พบข้อมูลนักเรียน" : "No students found"}</h5>
              <p className="text-xs text-muted-foreground mt-1">{lang === "th" ? "ลองค้นหาด้วยคำอื่น หรือปรับสเกลตัวกรอง" : "Try resetting your search query or filters"}</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. 9-STEP HOME VISIT WIZARD FORM                               */}
      {/* ============================================================== */}
      {editingStudentId && activeTab === "home-visit" && (
        <div className="glass-card p-6 space-y-6">
          
          {/* Wizard Header */}
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditingStudentId(null)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 hover:text-foreground transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h4 className="font-extrabold text-sm text-slate-950 dark:text-white">
                  {lang === "th" ? "แบบบันทึกการเยี่ยมบ้าน นร.01 และประวัติครอบครัว" : "นร.01 Family Registry & Visit Records"}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {lang === "th" ? `ผู้กําหนดค่า: ${students.find(s => s.id === editingStudentId)?.fullName}` : `Student: ${students.find(s => s.id === editingStudentId)?.fullName}`}
                </p>
              </div>
            </div>
            
            {/* Step Counter */}
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20">
              {lang === "th" ? `ขั้นตอนที่ ${currentStep} / 2` : `Step ${currentStep} of 2`}
            </span>
          </div>

          {/* STEP INDICATOR TABS */}
          <div className="flex items-center gap-3 py-1 border-b border-slate-100 dark:border-slate-850 pb-4 flex-wrap">
            {[
              { num: 1, label: lang === "th" ? "1. ข้อมูลทั่วไปนักเรียน" : "1. Student Profile" },
              { num: 2, label: lang === "th" ? "2. ข้อมูลการเยี่ยมบ้านและครอบครัว" : "2. Home Visit Details" }
            ].map((step) => (
              <button
                key={step.num}
                type="button"
                onClick={() => setCurrentStep(step.num)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  currentStep === step.num
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>

          {/* LOCK WARNING */}
          {isFormLocked && (
            <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center gap-3">
              <Lock className="w-5 h-5 shrink-0 animate-pulse" />
              <div className="text-xs font-semibold">
                <p>{lang === "th" ? "ข้อมูลใบสมัครถูกส่งเข้าสู่ระบบปลายทางแล้วและล็อกเพื่อตรวจสอบความถูกต้อง" : "Form locked. The visit record was completed by the classroom teacher."}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{lang === "th" ? "ท่านอยู่ในบทบาทนักเรียนจึงทำได้เพียงเปิดดูเท่านั้น หากพบข้อมูลคลาดเคลื่อน กรุณาแจ้งครูประจำชั้น" : "Students cannot modify finalized records."}</p>
              </div>
            </div>
          )}

          {/* STEP FORMS CONTENT ROUTER */}
          <div className="space-y-6 min-h-[300px]">
            
            {/* STEP 1: ข้อมูลทั่วไปของนักเรียน */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                <h5 className="font-bold text-xs text-primary col-span-1 md:col-span-2 border-b pb-1">ข้อมูลทั่วไปนักเรียน</h5>
                
                {/* 1. รูปประจำตัวนักเรียน */}
                <div className="col-span-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">รูปประจำตัวนักเรียน</label>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-amber-400 dark:hover:border-amber-500 transition relative">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isFormLocked}
                      onChange={(e) => handleImageUpload(e, "profileImage")}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-550 dark:text-slate-450 overflow-hidden shadow-inner shrink-0">
                      {formData.profile.profileImage ? (
                        <img src={formData.profile.profileImage} className="w-full h-full object-cover" alt="Student Profile" />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-350">เปลี่ยนรูปโปรไฟล์</p>
                      <p className="text-[9px] text-slate-400">แตะเพื่อถ่ายรูปหรืออัปโหลด (ระบบบีบอัดอัตโนมัติ)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">เลขประจำตัวประชาชน / G-Code</label>
                  <input
                    type="text"
                    disabled={isFormLocked}
                    value={formData.profile.nationalId}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, nationalId: e.target.value }
                    })}
                    className={getInputStyle(formData.profile.nationalId, false)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">ชื่อเล่น (Nickname)</label>
                  <input
                    type="text"
                    disabled={isFormLocked}
                    value={formData.profile.nickname}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, nickname: e.target.value }
                    })}
                    className={getInputStyle(formData.profile.nickname, false)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">วันเกิด (Birth Date)</label>
                  <input
                    type="date"
                    disabled={isFormLocked}
                    value={formData.profile.birthDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, birthDate: e.target.value }
                    })}
                    className={getInputStyle(formData.profile.birthDate, false)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">อายุ (ปี)</label>
                  <input
                    type="text"
                    readOnly
                    value={getAgeFromBirthdate(formData.profile.birthDate)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-400 outline-none text-center"
                    placeholder={lang === "th" ? "คำนวณอายุอัตโนมัติ" : "Auto calculated"}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">สัญชาติ (Nationality)</label>
                  <input
                    type="text"
                    disabled={isFormLocked}
                    value={formData.profile.nationality}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, nationality: e.target.value }
                    })}
                    className={getInputStyle(formData.profile.nationality, false)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">เชื้อชาติ (Race)</label>
                  <input
                    type="text"
                    disabled={isFormLocked}
                    value={formData.profile.race}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, race: e.target.value }
                    })}
                    className={getInputStyle(formData.profile.race, false)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">ศาสนา (Religion)</label>
                  <select
                    disabled={isFormLocked}
                    value={formData.profile.religion}
                    onChange={(e) =>
                    setFormData({
                      ...formData,
                      profile: { ...formData.profile, religion: e.target.value }
                    })}
                    className={getInputStyle(formData.profile.religion, true)}
                  >
                    <option value="">เลือกศาสนา...</option>
                    <option value="พุทธ">พุทธ</option>
                    <option value="คริสต์">คริสต์</option>
                    <option value="อิสลาม">อิสลาม</option>
                    <option value="ฮินดู">ฮินดู</option>
                    <option value="ไม่มีศาสนา">ไม่มีศาสนา</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">หมู่โลหิต (Blood Type)</label>
                  <select
                    disabled={isFormLocked}
                    value={formData.profile.bloodType}
                    onChange={(e) =>
                    setFormData({
                      ...formData,
                      profile: { ...formData.profile, bloodType: e.target.value }
                    })}
                    className={getInputStyle(formData.profile.bloodType, true)}
                  >
                    <option value="">เลือกหมู่โลหิต...</option>
                    <option value="ไม่ทราบ">ไม่ทราบ</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="O">O</option>
                    <option value="AB">AB</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">น้ำหนัก (กิโลกรัม)</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.profile.weight}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, weight: parseFloat(e.target.value) || "" }
                    })}
                    className={getInputStyle(formData.profile.weight, false)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">ส่วนสูง (เซนติเมตร)</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.profile.height}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, height: parseFloat(e.target.value) || "" }
                    })}
                    className={getInputStyle(formData.profile.height, false)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">โรคประจำตัว (Congenital Disease)</label>
                  <input
                    type="text"
                    disabled={isFormLocked}
                    value={formData.profile.congenitalDisease}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, congenitalDisease: e.target.value }
                    })}
                    className={getInputStyle(formData.profile.congenitalDisease, false)}
                    placeholder="ไม่มี (ระบุถ้ามี)"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">ประเภทความด้อยโอกาส</label>
                  <select
                    disabled={isFormLocked}
                    value={formData.profile.disadvantageType || "ไม่ด้อยโอกาส"}
                    onChange={(e) =>
                    setFormData({
                      ...formData,
                      profile: { ...formData.profile, disadvantageType: e.target.value }
                    })}
                    className={getInputStyle(formData.profile.disadvantageType || "ไม่ด้อยโอกาส", true)}
                  >
                    <option value="">เลือกประเภทความด้อยโอกาส...</option>
                    <option value="ไม่ด้อยโอกาส">ไม่ด้อยโอกาส</option>
                    <option value="ถูกบังคับให้ขายแรงงาน">ถูกบังคับให้ขายแรงงาน</option>
                    <option value="เด็กอยู่ในธุรกิจทางเพศ">เด็กอยู่ในธุรกิจทางเพศ</option>
                    <option value="เด็กถูกทอดทิ้ง">เด็กถูกทอดทิ้ง</option>
                    <option value="เด็กในสถานพินิจและคุ้มครองเด็กเยาวชน">เด็กในสถานพินิจและคุ้มครองเด็กเยาวชน</option>
                    <option value="เด็กเร่ร่อน">เด็กเร่ร่อน</option>
                    <option value="ผลกระทบจากเอดส์">ผลกระทบจากเอดส์</option>
                    <option value="ชนกลุ่มน้อย">ชนกลุ่มน้อย</option>
                    <option value="เด็กที่ถูกทำร้ายทารุณ">เด็กที่ถูกทำร้ายทารุณ</option>
                    <option value="เด็กยากจน">เด็กยากจน</option>
                    <option value="เด็กที่มีปัญหาเกี่ยวกับยาเสพติด">เด็กที่มีปัญหาเกี่ยวกับยาเสพติด</option>
                    <option value="กำพร้า">กำพร้า</option>
                    <option value="ทำงานรับผิดชอบตนเองและครอบครัว">ทำงานรับผิดชอบตนเองและครอบครัว</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">ประเภทความพิการ</label>
                  <select
                    disabled={isFormLocked}
                    value={formData.profile.disabilityType || "ไม่พิการ"}
                    onChange={(e) =>
                    setFormData({
                      ...formData,
                      profile: { ...formData.profile, disabilityType: e.target.value }
                    })}
                    className={getInputStyle(formData.profile.disabilityType || "ไม่พิการ", true)}
                  >
                    <option value="">เลือกประเภทความพิการ...</option>
                    <option value="ไม่พิการ">ไม่พิการ</option>
                    <option value="บกพร่องทางการมองเห็น">บกพร่องทางการมองเห็น</option>
                    <option value="บกพร่องทางการได้ยิน">บกพร่องทางการได้ยิน</option>
                    <option value="บกพร่องทางร่างกายหรือสุขภาพ">บกพร่องทางร่างกายหรือสุขภาพ</option>
                    <option value="บกพร่องทางสติปัญญา">บกพร่องทางสติปัญญา</option>
                    <option value="บกพร่องทางการเรียนรู้">บกพร่องทางการเรียนรู้</option>
                    <option value="บกพร่องทางการพูดและภาษา">บกพร่องทางการพูดและภาษา</option>
                    <option value="บกพร่องทางพฤติกรรมหรืออารมณ์">บกพร่องทางพฤติกรรมหรืออารมณ์</option>
                    <option value="ออทิสติก">ออทิสติก</option>
                    <option value="ความพิการซ้อน">ความพิการซ้อน</option>
                  </select>
                </div>

                <h5 className="font-bold text-xs text-primary col-span-1 md:col-span-2 border-b pb-1 mt-2">สถานที่เกิด & การย้ายเข้า</h5>
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">ตำบลที่เกิด (Birth Tambon)</label>
                  <input
                    type="text"
                    disabled={isFormLocked}
                    value={formData.profile.birthTambon}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        profile: { ...formData.profile, birthTambon: val }
                      });
                      setActiveSuggestionField("tambon");
                      if (val.trim().length >= 2) {
                        const res = await searchThaiAddress(val);
                        if (res.success && res.data) {
                          setAddressSuggestions(res.data);
                          setShowSuggestions(true);
                        }
                      } else {
                        setAddressSuggestions([]);
                        setShowSuggestions(false);
                      }
                    }}
                    placeholder="พิมพ์ชื่อตำบลเพื่อค้นหา..."
                    className={getInputStyle(formData.profile.birthTambon, false)}
                  />
                  {showSuggestions && addressSuggestions.length > 0 && activeSuggestionField === "tambon" && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 divide-y divide-slate-100 dark:divide-slate-900 custom-scrollbar text-xs font-semibold text-slate-700 dark:text-slate-350">
                      {addressSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              profile: {
                                ...formData.profile,
                                birthTambon: item.subdistrict,
                                birthAmphoe: item.district,
                                birthProvince: item.province
                              }
                            });
                            setShowSuggestions(false);
                            setAddressSuggestions([]);
                            setActiveSuggestionField(null);
                          }}
                          className="px-3 py-2.5 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                        >
                          ต. {item.subdistrict} &rarr; อ. {item.district} &rarr; จ. {item.province} ({item.zipCode})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">อำเภอที่เกิด (Birth Amphoe)</label>
                  <input
                    type="text"
                    disabled={isFormLocked}
                    value={formData.profile.birthAmphoe}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        profile: { ...formData.profile, birthAmphoe: val }
                      });
                      setActiveSuggestionField("amphoe");
                      if (val.trim().length >= 2) {
                        const res = await searchThaiAddress(val);
                        if (res.success && res.data) {
                          setAddressSuggestions(res.data);
                          setShowSuggestions(true);
                        }
                      } else {
                        setAddressSuggestions([]);
                        setShowSuggestions(false);
                      }
                    }}
                    placeholder="พิมพ์ชื่ออำเภอเพื่อค้นหา..."
                    className={getInputStyle(formData.profile.birthAmphoe, false)}
                  />
                  {showSuggestions && addressSuggestions.length > 0 && activeSuggestionField === "amphoe" && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 divide-y divide-slate-100 dark:divide-slate-900 custom-scrollbar text-xs font-semibold text-slate-700 dark:text-slate-350">
                      {addressSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              profile: {
                                ...formData.profile,
                                birthTambon: item.subdistrict,
                                birthAmphoe: item.district,
                                birthProvince: item.province
                              }
                            });
                            setShowSuggestions(false);
                            setAddressSuggestions([]);
                            setActiveSuggestionField(null);
                          }}
                          className="px-3 py-2.5 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                        >
                          ต. {item.subdistrict} &rarr; อ. {item.district} &rarr; จ. {item.province} ({item.zipCode})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">จังหวัดที่เกิด (Birth Province)</label>
                  <input
                    type="text"
                    disabled={isFormLocked}
                    value={formData.profile.birthProvince}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        profile: { ...formData.profile, birthProvince: val }
                      });
                      setActiveSuggestionField("province");
                      if (val.trim().length >= 2) {
                        const res = await searchThaiAddress(val);
                        if (res.success && res.data) {
                          setAddressSuggestions(res.data);
                          setShowSuggestions(true);
                        }
                      } else {
                        setAddressSuggestions([]);
                        setShowSuggestions(false);
                      }
                    }}
                    placeholder="พิมพ์ชื่อจังหวัดเพื่อค้นหา..."
                    className={getInputStyle(formData.profile.birthProvince, false)}
                  />
                  {showSuggestions && addressSuggestions.length > 0 && activeSuggestionField === "province" && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 divide-y divide-slate-100 dark:divide-slate-900 custom-scrollbar text-xs font-semibold text-slate-700 dark:text-slate-350">
                      {addressSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              profile: {
                                ...formData.profile,
                                birthTambon: item.subdistrict,
                                birthAmphoe: item.district,
                                birthProvince: item.province
                              }
                            });
                            setShowSuggestions(false);
                            setAddressSuggestions([]);
                            setActiveSuggestionField(null);
                          }}
                          className="px-3 py-2.5 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                        >
                          ต. {item.subdistrict} &rarr; อ. {item.district} &rarr; จ. {item.province} ({item.zipCode})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">เหตุผลการย้ายเข้าสถานศึกษา (Move In Reason)</label>
                  <select
                    disabled={isFormLocked}
                    value={formData.profile.moveInReason || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, moveInReason: e.target.value }
                    })}
                    className={getInputStyle(formData.profile.moveInReason || "", true)}
                  >
                    <option value="">เลือกสาเหตุที่ย้าย...</option>
                    <option value="จบชั้นประถมศึกษา (ป.6)">จบชั้นประถมศึกษา (ป.6)</option>
                    <option value="จบการศึกษาภาคบังคับ (ม.3)">จบการศึกษาภาคบังคับ (ม.3)</option>
                    <option value="ย้ายติดตามผู้ปกครอง">ย้ายติดตามผู้ปกครอง</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
              </div>
            )}
            {/* STEP 2: ข้อมูลการเยี่ยมบ้านและประวัติครอบครัว (Combined remaining 8 sections) */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in duration-200 w-full">
                
                {/* SECTION 2.1: ข้อมูลบิดา */}
                <div className="glass-card p-6 border border-slate-100 dark:border-slate-850 space-y-4 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                  <h5 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <span>{lang === "th" ? "ส่วนที่ 2.1: ข้อมูลบิดา" : "Section 2.1: Father's Details"}</span>
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex gap-2 col-span-1 md:col-span-2">
                      <div className="w-1/3">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">คำนำหน้า</label>
                        {(() => {
                          const isFatherPrefixOther = formData.father.prefix && !["นาย", "นาง", "นางสาว", "ดร.", "พระ"].includes(formData.father.prefix);
                          const fatherPrefixSelectVal = isFatherPrefixOther ? "อื่นๆ" : (formData.father.prefix || "");
                          return (
                            <>
                              <select
                                disabled={isFormLocked}
                                value={fatherPrefixSelectVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData({
                                    ...formData,
                                    father: { ...formData.father, prefix: val === "อื่นๆ" ? "" : val }
                                  });
                                }}
                                className={getInputStyle(fatherPrefixSelectVal, true)}
                              >
                                <option value="">เลือกคำนำหน้า...</option>
                                <option value="นาย">นาย</option>
                                <option value="นาง">นาง</option>
                                <option value="นางสาว">นางสาว</option>
                                <option value="ดร.">ดร.</option>
                                <option value="พระ">พระ</option>
                                <option value="อื่นๆ">อื่นๆ</option>
                              </select>
                              {(fatherPrefixSelectVal === "อื่นๆ" || isFatherPrefixOther) && (
                                <input
                                  type="text"
                                  disabled={isFormLocked}
                                  value={formData.father.prefix === "อื่นๆ" ? "" : formData.father.prefix}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    father: { ...formData.father, prefix: e.target.value }
                                  })}
                                  placeholder="ระบุคำนำหน้าอื่น..."
                                  className="w-full mt-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] outline-none focus:border-primary"
                                />
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="w-2/3">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">ชื่อ-นามสกุล บิดา</label>
                        <input
                          type="text"
                          disabled={isFormLocked}
                          value={formData.father.name}
                          onChange={(e) => setFormData({
                            ...formData,
                            father: { ...formData.father, name: e.target.value }
                          })}
                          className={getInputStyle(formData.father.name, false)}
                          placeholder="ชื่อ-สกุล"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">เลขบัตรประชาชนบิดา</label>
                      <input
                        type="text"
                        disabled={isFormLocked}
                        value={formData.father.idCard}
                        onChange={(e) => setFormData({
                          ...formData,
                          father: { ...formData.father, idCard: e.target.value }
                        })}
                        className={getInputStyle(formData.father.idCard, false)}
                        placeholder="เลขบัตรประชาชน"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">อายุ (ปี)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.father.age}
                        onChange={(e) => setFormData({
                          ...formData,
                          father: { ...formData.father, age: e.target.value }
                        })}
                        className={getInputStyle(formData.father.age, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">เบอร์โทรศัพท์</label>
                      <input
                        type="tel"
                        disabled={isFormLocked}
                        value={formData.father.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          father: { ...formData.father, phone: e.target.value }
                        })}
                        className={getInputStyle(formData.father.phone, false)}
                        placeholder="เบอร์โทร"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">อาชีพหลัก</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.father.job}
                        onChange={(e) => setFormData({
                          ...formData,
                          father: { ...formData.father, job: e.target.value }
                        })}
                        className={getInputStyle(formData.father.job, true)}
                      >
                        <option value="">เลือกอาชีพ...</option>
                        <option value="รับจ้างทั่วไป">รับจ้างทั่วไป</option>
                        <option value="เกษตรกร">เกษตรกร</option>
                        <option value="ค้าขาย">ค้าขาย</option>
                        <option value="ข้าราชการ">ข้าราชการ</option>
                        <option value="พนักงานบริษัท">พนักงานบริษัท</option>
                        <option value="ธุรกิจส่วนตัว">ธุรกิจส่วนตัว</option>
                        <option value="ว่างงาน">ว่างงาน</option>
                        <option value="พนักงานรัฐวิสาหกิจ">พนักงานรัฐวิสาหกิจ</option>
                        <option value="ลูกจ้าง">ลูกจ้าง</option>
                        <option value="พนักงานราชการ">พนักงานราชการ</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">รายได้ต่อเดือน (บาท)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.father.income}
                        onChange={(e) => setFormData({
                          ...formData,
                          father: { ...formData.father, income: e.target.value }
                        })}
                        className={getInputStyle(formData.father.income, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">สถานภาพบิดา</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.father.status}
                        onChange={(e) => setFormData({
                          ...formData,
                          father: { ...formData.father, status: e.target.value }
                        })}
                        className={getInputStyle(formData.father.status, true)}
                      >
                        <option value="">เลือกสถานภาพ...</option>
                        <option value="มีชีวิตอยู่">มีชีวิตอยู่</option>
                        <option value="ถึงแก่กรรม">ถึงแก่กรรม</option>
                        <option value="สาบสูญ">สาบสูญ</option>
                        <option value="แยกกันอยู่">แยกกันอยู่</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">สภาพร่างกาย/สุขภาพ</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.father.health}
                        onChange={(e) => setFormData({
                          ...formData,
                          father: { ...formData.father, health: e.target.value }
                        })}
                        className={getInputStyle(formData.father.health, true)}
                      >
                        <option value="">เลือกสุขภาพ...</option>
                        <option value="ปกติ">ปกติ</option>
                        <option value="พิการ">พิการ</option>
                        <option value="เจ็บป่วยเรื้อรัง">เจ็บป่วยเรื้อรัง</option>
                        <option value="ทุพพลภาพ">ทุพพลภาพ</option>
                        <option value="ไม่ทราบ">ไม่ทราบ</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2.2: ข้อมูลมารดา */}
                <div className="glass-card p-6 border border-slate-100 dark:border-slate-850 space-y-4 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-500"></div>
                  <h5 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-pink-500" />
                    <span>{lang === "th" ? "ส่วนที่ 2.2: ข้อมูลมารดา" : "Section 2.2: Mother's Details"}</span>
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex gap-2 col-span-1 md:col-span-2">
                      <div className="w-1/3">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">คำนำหน้า</label>
                        {(() => {
                          const isMotherPrefixOther = formData.mother.prefix && !["นาง", "นางสาว", "ดร."].includes(formData.mother.prefix);
                          const motherPrefixSelectVal = isMotherPrefixOther ? "อื่นๆ" : (formData.mother.prefix || "");
                          return (
                            <>
                              <select
                                disabled={isFormLocked}
                                value={motherPrefixSelectVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData({
                                    ...formData,
                                    mother: { ...formData.mother, prefix: val === "อื่นๆ" ? "" : val }
                                  });
                                }}
                                className={getInputStyle(motherPrefixSelectVal, true)}
                              >
                                <option value="">เลือกคำนำหน้า...</option>
                                <option value="นาง">นาง</option>
                                <option value="นางสาว">นางสาว</option>
                                <option value="ดร.">ดร.</option>
                                <option value="อื่นๆ">อื่นๆ</option>
                              </select>
                              {(motherPrefixSelectVal === "อื่นๆ" || isMotherPrefixOther) && (
                                <input
                                  type="text"
                                  disabled={isFormLocked}
                                  value={formData.mother.prefix === "อื่นๆ" ? "" : formData.mother.prefix}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    mother: { ...formData.mother, prefix: e.target.value }
                                  })}
                                  placeholder="ระบุคำนำหน้าอื่น..."
                                  className="w-full mt-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] outline-none focus:border-primary"
                                />
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="w-2/3">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">ชื่อ-นามสกุล มารดา</label>
                        <input
                          type="text"
                          disabled={isFormLocked}
                          value={formData.mother.name}
                          onChange={(e) => setFormData({
                            ...formData,
                            mother: { ...formData.mother, name: e.target.value }
                          })}
                          className={getInputStyle(formData.mother.name, false)}
                          placeholder="ชื่อ-สกุล"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">เลขบัตรประชาชนมารดา</label>
                      <input
                        type="text"
                        disabled={isFormLocked}
                        value={formData.mother.idCard}
                        onChange={(e) => setFormData({
                          ...formData,
                          mother: { ...formData.mother, idCard: e.target.value }
                        })}
                        className={getInputStyle(formData.mother.idCard, false)}
                        placeholder="เลขบัตรประชาชน"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">อายุ (ปี)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.mother.age}
                        onChange={(e) => setFormData({
                          ...formData,
                          mother: { ...formData.mother, age: e.target.value }
                        })}
                        className={getInputStyle(formData.mother.age, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">เบอร์โทรศัพท์</label>
                      <input
                        type="tel"
                        disabled={isFormLocked}
                        value={formData.mother.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          mother: { ...formData.mother, phone: e.target.value }
                        })}
                        className={getInputStyle(formData.mother.phone, false)}
                        placeholder="เบอร์โทร"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">อาชีพหลัก</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.mother.job}
                        onChange={(e) => setFormData({
                          ...formData,
                          mother: { ...formData.mother, job: e.target.value }
                        })}
                        className={getInputStyle(formData.mother.job, true)}
                      >
                        <option value="">เลือกอาชีพ...</option>
                        <option value="รับจ้างทั่วไป">รับจ้างทั่วไป</option>
                        <option value="เกษตรกร">เกษตรกร</option>
                        <option value="ค้าขาย">ค้าขาย</option>
                        <option value="ข้าราชการ">ข้าราชการ</option>
                        <option value="พนักงานบริษัท">พนักงานบริษัท</option>
                        <option value="ธุรกิจส่วนตัว">ธุรกิจส่วนตัว</option>
                        <option value="ว่างงาน">ว่างงาน</option>
                        <option value="พนักงานรัฐวิสาหกิจ">พนักงานรัฐวิสาหกิจ</option>
                        <option value="ลูกจ้าง">ลูกจ้าง</option>
                        <option value="พนักงานราชการ">พนักงานราชการ</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">รายได้ต่อเดือน (บาท)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.mother.income}
                        onChange={(e) => setFormData({
                          ...formData,
                          mother: { ...formData.mother, income: e.target.value }
                        })}
                        className={getInputStyle(formData.mother.income, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">สถานภาพมารดา</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.mother.status}
                        onChange={(e) => setFormData({
                          ...formData,
                          mother: { ...formData.mother, status: e.target.value }
                        })}
                        className={getInputStyle(formData.mother.status, true)}
                      >
                        <option value="">เลือกสถานภาพ...</option>
                        <option value="มีชีวิตอยู่">มีชีวิตอยู่</option>
                        <option value="ถึงแก่กรรม">ถึงแก่กรรม</option>
                        <option value="สาบสูญ">สาบสูญ</option>
                        <option value="แยกกันอยู่">แยกกันอยู่</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">สภาพร่างกาย/สุขภาพ</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.mother.health}
                        onChange={(e) => setFormData({
                          ...formData,
                          mother: { ...formData.mother, health: e.target.value }
                        })}
                        className={getInputStyle(formData.mother.health, true)}
                      >
                        <option value="">เลือกสุขภาพ...</option>
                        <option value="ปกติ">ปกติ</option>
                        <option value="พิการ">พิการ</option>
                        <option value="เจ็บป่วยเรื้อรัง">เจ็บป่วยเรื้อรัง</option>
                        <option value="ทุพพลภาพ">ทุพพลภาพ</option>
                        <option value="ไม่ทราบ">ไม่ทราบ</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2.3: ข้อมูลผู้ปกครอง */}
                <div className="glass-card p-6 border border-slate-100 dark:border-slate-850 space-y-4 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
                  <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
                    <h5 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-500" />
                      <span>{lang === "th" ? "ส่วนที่ 2.3: ข้อมูลผู้ปกครอง" : "Section 2.3: Guardian's Details"}</span>
                    </h5>
                    
                    {!isFormLocked && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => copyParentToGuardian("father")}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold rounded-xl transition cursor-pointer"
                        >
                          ดึงข้อมูลบิดา
                        </button>
                        <button
                          type="button"
                          onClick={() => copyParentToGuardian("mother")}
                          className="px-2.5 py-1 bg-pink-50 text-pink-700 hover:bg-pink-100 text-[10px] font-bold rounded-xl transition cursor-pointer"
                        >
                          ดึงข้อมูลมารดา
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex gap-2 col-span-1 md:col-span-2">
                      <div className="w-1/3">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">คำนำหน้า</label>
                        {(() => {
                          const isGuardianPrefixOther = formData.guardian.prefix && !["นาย", "นาง", "นางสาว", "ดร.", "พระ"].includes(formData.guardian.prefix);
                          const guardianPrefixSelectVal = isGuardianPrefixOther ? "อื่นๆ" : (formData.guardian.prefix || "");
                          return (
                            <>
                              <select
                                disabled={isFormLocked}
                                value={guardianPrefixSelectVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData({
                                    ...formData,
                                    guardian: { ...formData.guardian, prefix: val === "อื่นๆ" ? "" : val }
                                  });
                                }}
                                className={getInputStyle(guardianPrefixSelectVal, true)}
                              >
                                <option value="">เลือก...</option>
                                <option value="นาย">นาย</option>
                                <option value="นาง">นาง</option>
                                <option value="นางสาว">นางสาว</option>
                                <option value="ดร.">ดร.</option>
                                <option value="พระ">พระ</option>
                                <option value="อื่นๆ">อื่นๆ</option>
                              </select>
                              {(guardianPrefixSelectVal === "อื่นๆ" || isGuardianPrefixOther) && (
                                <input
                                  type="text"
                                  disabled={isFormLocked}
                                  value={formData.guardian.prefix === "อื่นๆ" ? "" : formData.guardian.prefix}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    guardian: { ...formData.guardian, prefix: e.target.value }
                                  })}
                                  placeholder="ระบุคำนำหน้าอื่น..."
                                  className="w-full mt-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] outline-none focus:border-primary"
                                />
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="w-2/3">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">ชื่อ-นามสกุล ผู้ปกครอง</label>
                        <input
                          type="text"
                          disabled={isFormLocked}
                          value={formData.guardian.name}
                          onChange={(e) => setFormData({
                            ...formData,
                            guardian: { ...formData.guardian, name: e.target.value }
                          })}
                          className={getInputStyle(formData.guardian.name, false)}
                          placeholder="ชื่อ-สกุล"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ความสัมพันธ์กับนักเรียน</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.guardian.relation}
                        onChange={(e) => setFormData({
                          ...formData,
                          guardian: { ...formData.guardian, relation: e.target.value }
                        })}
                        className={getInputStyle(formData.guardian.relation, true)}
                      >
                        <option value="">เลือกความสัมพันธ์...</option>
                        <option value="บิดา">บิดา</option>
                        <option value="มารดา">มารดา</option>
                        <option value="ปู่">ปู่</option>
                        <option value="ย่า">ย่า</option>
                        <option value="ตา">ตา</option>
                        <option value="ยาย">ยาย</option>
                        <option value="น้า">น้า</option>
                        <option value="อา">อา</option>
                        <option value="ลุง">ลุง</option>
                        <option value="ป้า">ป้า</option>
                        <option value="พี่">พี่</option>
                        <option value="น้อง">น้อง</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">อายุ (ปี)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.guardian.age}
                        onChange={(e) => setFormData({
                          ...formData,
                          guardian: { ...formData.guardian, age: e.target.value }
                        })}
                        className={getInputStyle(formData.guardian.age, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">เบอร์โทรศัพท์ผู้ปกครอง</label>
                      <input
                        type="tel"
                        disabled={isFormLocked}
                        value={formData.guardian.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          guardian: { ...formData.guardian, phone: e.target.value }
                        })}
                        className={getInputStyle(formData.guardian.phone, false)}
                        placeholder="เบอร์โทร"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">การศึกษาสูงสุด</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.guardian.education}
                        onChange={(e) => setFormData({
                          ...formData,
                          guardian: { ...formData.guardian, education: e.target.value }
                        })}
                        className={getInputStyle(formData.guardian.education, true)}
                      >
                        <option value="">เลือกการศึกษา...</option>
                        <option value="ต่ำกว่า ม.ต้น / ม.3">ต่ำกว่า ม.ต้น / ม.3</option>
                        <option value="ม.ต้น / ม.3">ม.ต้น / ม.3</option>
                        <option value="ม.ปลาย / ปวช.">ม.ปลาย / ปวช.</option>
                        <option value="อนุปริญญา / ปวส.">อนุปริญญา / ปวส.</option>
                        <option value="ปริญญาตรี">ปริญญาตรี</option>
                        <option value="สูงกว่าปริญญาตรี">สูงกว่าปริญญาตรี</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">อาชีพผู้ปกครอง</label>
                      {(() => {
                        const isOtherJob = formData.guardian.job === "อื่นๆ" || formData.guardian.job?.startsWith("อื่นๆ:");
                        const selectJobVal = isOtherJob ? "อื่นๆ" : (formData.guardian.job || "");
                        const otherJobVal = formData.guardian.job?.startsWith("อื่นๆ:") ? formData.guardian.job.split(":")[1] : "";
                        return (
                          <>
                            <select
                              disabled={isFormLocked}
                              value={selectJobVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData({
                                  ...formData,
                                  guardian: { ...formData.guardian, job: val }
                                });
                              }}
                              className={getInputStyle(selectJobVal, true)}
                            >
                              <option value="">เลือกอาชีพ...</option>
                              <option value="รับจ้างทั่วไป">รับจ้างทั่วไป</option>
                              <option value="เกษตรกร">เกษตรกร</option>
                              <option value="ค้าขาย">ค้าขาย</option>
                              <option value="ข้าราชการ">ข้าราชการ</option>
                              <option value="พนักงานบริษัท">พนักงานบริษัท</option>
                              <option value="ธุรกิจส่วนตัว">ธุรกิจส่วนตัว</option>
                              <option value="ว่างงาน">ว่างงาน</option>
                              <option value="พนักงานรัฐวิสาหกิจ">พนักงานรัฐวิสาหกิจ</option>
                              <option value="ลูกจ้าง">ลูกจ้าง</option>
                              <option value="พนักงานราชการ">พนักงานราชการ</option>
                              <option value="อื่นๆ">อื่นๆ</option>
                            </select>
                            {isOtherJob && (
                              <div className="mt-2 animate-in fade-in duration-200">
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">ระบุอาชีพอื่นๆ</label>
                                <input
                                  type="text"
                                  disabled={isFormLocked}
                                  value={otherJobVal}
                                  onChange={(e) => {
                                    const text = e.target.value;
                                    setFormData({
                                      ...formData,
                                      guardian: { ...formData.guardian, job: text ? `อื่นๆ:${text}` : "อื่นๆ" }
                                    });
                                  }}
                                  placeholder="ระบุอาชีพผู้ปกครอง..."
                                  className={getInputStyle(otherJobVal, false)}
                                />
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">รายได้ผู้ปกครองต่อเดือน (บาท)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.guardian.income}
                        onChange={(e) => setFormData({
                          ...formData,
                          guardian: { ...formData.guardian, income: e.target.value }
                        })}
                        className={getInputStyle(formData.guardian.income, false)}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2.4: สมาชิกครัวเรือนอื่น (ม.1-3) */}
                <div className="glass-card p-6 border border-slate-100 dark:border-slate-850 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 flex-wrap gap-2">
                    <h5 className="font-extrabold text-sm text-primary flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                      <span>{lang === "th" ? "ส่วนที่ 2.4: สมาชิกครัวเรือนอื่น (ไม่รวม บิดา/มารดา/ผู้ปกครอง)" : "Section 2.4: Other Household Members"}</span>
                    </h5>
                    {!isFormLocked && (
                      <button
                        type="button"
                        onClick={() => {
                          const newMembers = [...formData.profile.familyMembers, {
                            relation: "พี่",
                            name: "",
                            nationalId: "",
                            hasNoId: false,
                            education: "ประถมศึกษา",
                            age: 15,
                            hasDisability: false,
                            hasChronicDisease: false,
                            wages: 0,
                            agriculturalIncome: 0,
                            businessIncome: 0,
                            welfareIncome: 0,
                            otherIncome: 0
                          }];
                          setFormData({
                            ...formData,
                            profile: { ...formData.profile, familyMembers: newMembers }
                          });
                        }}
                        className="px-2.5 py-1.5 bg-primary text-white text-[10px] font-bold rounded-xl hover:bg-primary/95 flex items-center gap-1 cursor-pointer transition-all shadow-sm shadow-primary/10"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มสมาชิก</span>
                      </button>
                    )}
                  </div>

                  {formData.profile.familyMembers.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      ยังไม่มีสมาชิกในครอบครัวเพิ่มเติม (ระบุเฉพาะกรณีที่มีญาติ หรือพี่น้อง ร่วมอยู่อาศัยในครัวเรือน)
                    </div>
                  ) : (
                    <div className="space-y-4 pr-1">
                      {formData.profile.familyMembers.map((member: any, index: number) => (
                        <div key={index} className="p-5 border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl relative space-y-3">
                          {!isFormLocked && (
                            <button
                              type="button"
                              onClick={() => {
                                const filtered = formData.profile.familyMembers.filter((_: any, i: number) => i !== index);
                                setFormData({
                                  ...formData,
                                  profile: { ...formData.profile, familyMembers: filtered }
                                });
                              }}
                              className="absolute right-3 top-3 p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400">ความสัมพันธ์</label>
                              <select
                                disabled={isFormLocked}
                                value={member.relation}
                                onChange={(e) =>
                    {
                                  const updated = [...formData.profile.familyMembers];
                                  updated[index].relation = e.target.value;
                                  setFormData({ ...formData, profile: { ...formData.profile, familyMembers: updated } });
                                }}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold outline-none cursor-pointer"
                              >
                                <option value="">เลือกข้อมูล...</option>
                                <option value="พี่">พี่</option>
                                <option value="น้อง">น้อง</option>
                                <option value="ปู่ย่าตายาย">ปู่ย่าตายาย</option>
                                <option value="ลุงป้าน้าอา">ลุงป้าน้าอา</option>
                                <option value="อื่นๆ">อื่นๆ</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-400">ชื่อ-นามสกุล</label>
                              <input
                                type="text"
                                disabled={isFormLocked}
                                value={member.name}
                                onChange={(e) => {
                                  const updated = [...formData.profile.familyMembers];
                                  updated[index].name = e.target.value;
                                  setFormData({ ...formData, profile: { ...formData.profile, familyMembers: updated } });
                                }}
                                className="w-full px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none font-semibold"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-400">อายุ (ปี)</label>
                              <input
                                type="number"
                                disabled={isFormLocked}
                                value={member.age}
                                onChange={(e) => {
                                  const updated = [...formData.profile.familyMembers];
                                  updated[index].age = parseInt(e.target.value) || 0;
                                  setFormData({ ...formData, profile: { ...formData.profile, familyMembers: updated } });
                                }}
                                className="w-full px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none font-semibold"
                              />
                            </div>
                          </div>

                          {/* Income Splits */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                            <div>
                              <label className="text-[8px] font-bold text-slate-400 block mb-0.5">ค่าจ้าง/เงินเดือน</label>
                              <input
                                type="number"
                                disabled={isFormLocked}
                                value={member.wages}
                                onChange={(e) => {
                                  const updated = [...formData.profile.familyMembers];
                                  updated[index].wages = parseFloat(e.target.value) || 0;
                                  setFormData({ ...formData, profile: { ...formData.profile, familyMembers: updated } });
                                }}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] outline-none font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-slate-400 block mb-0.5">เกษตรกรรม</label>
                              <input
                                type="number"
                                disabled={isFormLocked}
                                value={member.agriculturalIncome}
                                onChange={(e) => {
                                  const updated = [...formData.profile.familyMembers];
                                  updated[index].agriculturalIncome = parseFloat(e.target.value) || 0;
                                  setFormData({ ...formData, profile: { ...formData.profile, familyMembers: updated } });
                                }}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] outline-none font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-slate-400 block mb-0.5">ธุรกิจส่วนตัว</label>
                              <input
                                type="number"
                                disabled={isFormLocked}
                                value={member.businessIncome}
                                onChange={(e) => {
                                  const updated = [...formData.profile.familyMembers];
                                  updated[index].businessIncome = parseFloat(e.target.value) || 0;
                                  setFormData({ ...formData, profile: { ...formData.profile, familyMembers: updated } });
                                }}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] outline-none font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-slate-400 block mb-0.5">สวัสดิการรัฐ</label>
                              <input
                                type="number"
                                disabled={isFormLocked}
                                value={member.welfareIncome}
                                onChange={(e) => {
                                  const updated = [...formData.profile.familyMembers];
                                  updated[index].welfareIncome = parseFloat(e.target.value) || 0;
                                  setFormData({ ...formData, profile: { ...formData.profile, familyMembers: updated } });
                                }}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] outline-none font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-slate-400 block mb-0.5">รายได้อื่นๆ</label>
                              <input
                                type="number"
                                disabled={isFormLocked}
                                value={member.otherIncome}
                                onChange={(e) => {
                                  const updated = [...formData.profile.familyMembers];
                                  updated[index].otherIncome = parseFloat(e.target.value) || 0;
                                  setFormData({ ...formData, profile: { ...formData.profile, familyMembers: updated } });
                                }}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] outline-none font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 2.5: ความสัมพันธ์ในครอบครัว */}
                <div className="glass-card p-6 border border-slate-100 dark:border-slate-850 space-y-4">
                  <h5 className="font-extrabold text-sm text-primary border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                    <span>{lang === "th" ? "ส่วนที่ 2.5: ความสัมพันธ์ในครอบครัวและภาระพี่น้อง" : "Section 2.5: Family Relationships & Siblings"}</span>
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">สถานภาพครอบครัว (สถานภาพสมรสของบิดามารดา)</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.profile.familyStatus}
                        onChange={(e) =>
                    setFormData({
                          ...formData,
                          profile: { ...formData.profile, familyStatus: e.target.value }
                        })}
                        className={getInputStyle(formData.profile.familyStatus, true)}
                      >
                        <option value="">เลือกข้อมูล...</option>
                        <option value="พ่อแม่อยู่ด้วยกัน">พ่อแม่อยู่ด้วยกัน</option>
                        <option value="พ่อแม่แยกกันอยู่">พ่อแม่แยกกันอยู่</option>
                        <option value="พ่อแม่หย่าร้าง">พ่อแม่หย่าร้าง</option>
                        <option value="เสียชีวิตทั้งคู่/สาบสูญ">เสียชีวิตทั้งคู่/สาบสูญ</option>
                        <option value="บิดาเสียชีวิต/สาบสูญ">บิดาเสียชีวิต/สาบสูญ</option>
                        <option value="มารดาเสียชีวิต/สาบสูญ">มารดาเสียชีวิต/สาบสูญ</option>
                        <option value="พ่อสมรสใหม่">พ่อสมรสใหม่</option>
                        <option value="แม่สมรสใหม่">แม่สมรสใหม่</option>
                        <option value="พ่อแม่ทอดทิ้ง">พ่อแม่ทอดทิ้ง</option>
                        <option value="กำพร้า">กำพร้า</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">มีเวลาอยู่ร่วมกันในครอบครัวเฉลี่ย (ชั่วโมง/วัน)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.profile.timeSpentTogether}
                        onChange={(e) => setFormData({
                          ...formData,
                          profile: { ...formData.profile, timeSpentTogether: parseFloat(e.target.value) || 0 }
                        })}
                        className={getInputStyle(formData.profile.timeSpentTogether, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">จำนวนพี่น้องร่วมบิดามารดา (คน)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.profile.siblingsSameParents}
                        onChange={(e) => setFormData({
                          ...formData,
                          profile: { ...formData.profile, siblingsSameParents: parseInt(e.target.value) || 0 }
                        })}
                        className={getInputStyle(formData.profile.siblingsSameParents, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">จำนวนพี่น้องต่างบิดามารดา (คน)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.profile.siblingsDiffParents}
                        onChange={(e) => setFormData({
                          ...formData,
                          profile: { ...formData.profile, siblingsDiffParents: parseInt(e.target.value) || 0 }
                        })}
                        className={getInputStyle(formData.profile.siblingsDiffParents, false)}
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-amber-600 dark:text-amber-500 block mb-2">
                        ในครอบครัว สนิทสนมกับใครมากที่สุด (เลือกได้มากกว่า 1 ข้อ)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["บิดา", "มารดา", "พี่น้อง", "ปู่ย่าตายาย", "ลุงป้าน้าอา", "อื่นๆ"].map((opt) => {
                          const currentList = formData.profile.closestMember ? formData.profile.closestMember.split(",") : [];
                          const isChecked = opt === "อื่นๆ"
                            ? currentList.some((x: string) => x === "อื่นๆ" || x.startsWith("อื่นๆ:"))
                            : currentList.includes(opt);
                          
                          return (
                            <button
                              key={opt}
                              type="button"
                              disabled={isFormLocked}
                              onClick={() => {
                                const current = formData.profile.closestMember ? formData.profile.closestMember.split(",") : [];
                                let updated;
                                if (opt === "อื่นๆ") {
                                  const hasOther = current.some((x: string) => x === "อื่นๆ" || x.startsWith("อื่นๆ:"));
                                  if (hasOther) {
                                    updated = current.filter((x: string) => x !== "อื่นๆ" && !x.startsWith("iOS:") && !x.startsWith("อื่นๆ:"));
                                  } else {
                                    updated = [...current, "อื่นๆ"];
                                  }
                                } else {
                                  if (current.includes(opt)) {
                                    updated = current.filter((x: string) => x !== opt);
                                  } else {
                                    updated = [...current, opt];
                                  }
                                }
                                setFormData({
                                  ...formData,
                                  profile: { ...formData.profile, closestMember: updated.join(",") }
                                });
                              }}
                              className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                                isChecked 
                                  ? "border-primary bg-primary/5 text-primary" 
                                  : "border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      
                      {(() => {
                        const currentList = formData.profile.closestMember ? formData.profile.closestMember.split(",") : [];
                        const isOtherChecked = currentList.some((x: string) => x === "อื่นๆ" || x.startsWith("อื่นๆ:"));
                        const otherVal = currentList.find((x: string) => x.startsWith("อื่นๆ:"))?.split(":")[1] || "";
                        if (!isOtherChecked) return null;
                        return (
                          <div className="mt-2 animate-in fade-in duration-200">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">ระบุรายละเอียดอื่นๆ</label>
                            <input
                              type="text"
                              disabled={isFormLocked}
                              value={otherVal}
                              onChange={(e) => {
                                const text = e.target.value;
                                const current = formData.profile.closestMember ? formData.profile.closestMember.split(",") : [];
                                const filtered = current.filter((x: string) => x !== "อื่นๆ" && !x.startsWith("อื่นๆ:"));
                                const updated = [...filtered, text ? `อื่นๆ:${text}` : "อื่นๆ"];
                                setFormData({
                                  ...formData,
                                  profile: { ...formData.profile, closestMember: updated.join(",") }
                                });
                              }}
                              placeholder="ระบุความสัมพันธ์อื่นๆ เช่น ป้าสะใภ้, เพื่อนบ้าน"
                              className={getInputStyle(otherVal, false)}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* SECTION 2.6: ลักษณะที่อยู่อาศัย */}
                <div className="glass-card p-6 border border-slate-100 dark:border-slate-850 space-y-4">
                  <h5 className="font-extrabold text-sm text-primary border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                    <span>{lang === "th" ? "ส่วนที่ 2.6: ลักษณะที่อยู่อาศัยและโครงสร้างบ้าน" : "Section 2.6: Housing & Conditions"}</span>
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">บ้านเลขที่</label>
                      <input
                        type="text"
                        disabled={isFormLocked}
                        value={formData.homeVisit.houseNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, houseNumber: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.houseNumber, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">หมู่ที่ / ตรอก / ซอย / ชุมชน</label>
                      <input
                        type="text"
                        disabled={isFormLocked}
                        value={formData.homeVisit.villageNo}
                        onChange={(e) => setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, villageNo: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.villageNo, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">นักเรียนอาศัยอยู่กับใคร</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.profile.livingWith}
                        onChange={(e) => setFormData({
                          ...formData,
                          profile: { ...formData.profile, livingWith: e.target.value }
                        })}
                        className={getInputStyle(formData.profile.livingWith, true)}
                      >
                        <option value="">เลือกผู้ที่อยู่อาศัยร่วม...</option>
                        <option value="บิดาและมารดา">บิดาและมารดา</option>
                        <option value="บิดา">บิดา</option>
                        <option value="มารดา">มารดา</option>
                        <option value="พี่/น้อง (ไม่ได้อยู่กับบิดามารดา)">พี่/น้อง (ไม่ได้อยู่กับบิดามารดา)</option>
                        <option value="เพื่อน/คนรู้จัก">เพื่อน/คนรู้จัก</option>
                        <option value="ผู้ปกครองที่ไม่ใช่มารดา">ผู้ปกครองที่ไม่ใช่มารดา</option>
                        <option value="พักอยู่ที่โรงเรียน (นักเรียนประจำ)">พักอยู่ที่โรงเรียน (นักเรียนประจำ)</option>
                        <option value="พักอยู่คนเดียว (หอพัก/บ้านเช่า)">พักอยู่คนเดียว (หอพัก/บ้านเช่า)</option>
                        <option value="พักกับมูลนิธิ/วัด/นายจ้าง">พักกับมูลนิธิ/วัด/นายจ้าง</option>
                        <option value="อื่น ๆ">อื่น ๆ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ลักษณะการอยู่อาศัย (Living Arrangement)</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.homeVisit.livingArrangements}
                        onChange={(e) => setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, livingArrangements: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.livingArrangements, true)}
                      >
                        <option value="">เลือกสถานะการอยู่อาศัย...</option>
                        <option value="บ้านตนเอง">บ้านตนเอง / เจ้าของบ้าน</option>
                        <option value="อยู่กับผู้อื่น/อยู่ฟรี">อยู่กับผู้อื่น / อาศัยอยู่ฟรี</option>
                        <option value="หอพัก">หอพัก</option>
                        <option value="บ้านเช่า">บ้านเช่า</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ค่าเช่าบ้านต่อเดือน (ถ้ามี - บาท)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.homeVisit.rentalFee}
                        onChange={(e) => setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, rentalFee: parseFloat(e.target.value) || 0 }
                        })}
                        className={getInputStyle(formData.homeVisit.rentalFee, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">วัสดุโครงสร้าง: พื้นบ้าน</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.homeVisit.buildingFloor}
                        onChange={(e) => setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, buildingFloor: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.buildingFloor, true)}
                      >
                        <option value="">เลือกวัสดุพื้นบ้าน...</option>
                        <option value="กระเบื้อง/เซรามิค">กระเบื้อง/เซรามิค</option>
                        <option value="ปาเก้/ไม้ขัดเงา">ปาเก้/ไม้ขัดเงา</option>
                        <option value="ซีเมนต์เปลือย">ซีเมนต์เปลือย</option>
                        <option value="ไม้กระดาน">ไม้กระดาน</option>
                        <option value="ไวนิล/กระเบื้องยาง/เสื่อน้ำมัน">ไวนิล/กระเบื้องยาง/เสื่อน้ำมัน</option>
                        <option value="ไม้ไผ่">ไม้ไผ่</option>
                        <option value="ดิน/ทราย">ดิน/ทราย</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">วัสดุโครงสร้าง: ฝาบ้าน/ผนัง</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.homeVisit.buildingWall}
                        onChange={(e) => setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, buildingWall: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.buildingWall, true)}
                      >
                        <option value="">เลือกวัสดุฝาผนัง...</option>
                        <option value="ฉาบซีเมนต์">ฉาบซีเมนต์</option>
                        <option value="อิฐ/ก้อนปูน/อิฐบล็อก">อิฐ/ก้อนปูน/อิฐบล็อก</option>
                        <option value="สังกะสี">สังกะสี</option>
                        <option value="ไม้กระดาน">ไม้กระดาน</option>
                        <option value="ไม้อัด">ไม้อัด</option>
                        <option value="สมาร์ทบอร์ด/ไฟเบอร์/ซีเมนต์บอร์ด">สมาร์ทบอร์ด/ไฟเบอร์/ซีเมนต์บอร์ด</option>
                        <option value="ไม้ไผ่/ท่อนไม้/เศษไม้">ไม้ไผ่/ท่อนไม้/เศษไม้</option>
                        <option value="ดิน/ไวนิลและอื่นๆ">ดิน/ไวนิลและอื่นๆ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">วัสดุโครงสร้าง: หลังคา</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.homeVisit.buildingRoof}
                        onChange={(e) => setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, buildingRoof: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.buildingRoof, true)}
                      >
                        <option value="">เลือกวัสดุหลังคา...</option>
                        <option value="กระเบื้อง">กระเบื้อง / เซรามิค</option>
                        <option value="สังกะสี">โลหะ (สังกะสี / เหล็ก)</option>
                        <option value="ไม้กระดาน">ไม้กระดาน</option>
                        <option value="ใบไม้/วัสดุธรรมชาติ">ใบไม้ / วัสดุธรรมชาติ</option>
                        <option value="ไวนิล/กระดาษ/แผ่นพลาสติก">ไวนิล / กระดาษ / แผ่นพลาสติก</option>
                        <option value="อื่น ๆ">อื่น ๆ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">สภาพสุขา (Toilet Condition)</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.homeVisit.toiletCondition}
                        onChange={(e) =>
                    setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, toiletCondition: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.toiletCondition, true)}
                      >
                        <option value="">เลือกสภาพสุขา...</option>
                        <option value="มีถูกสุขลักษณะ">มีถูกสุขลักษณะ (ช้อนส้วม/ชักโครก)</option>
                        <option value="ไม่มีสุขา">ไม่มีห้องสุขา</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">แหล่งน้ำดื่ม</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.homeVisit.drinkingWater}
                        onChange={(e) =>
                    setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, drinkingWater: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.drinkingWater, true)}
                      >
                        <option value="">เลือกแหล่งน้ำดื่ม...</option>
                        <option value="น้ำบรรจุขวด/ตู้หยอดน้ำ">น้ำขวด / ตู้หยอดน้ำ</option>
                        <option value="น้ำประปา">น้ำประปา</option>
                        <option value="น้ำบ่อ/น้ำบาดาล">น้ำบ่อ / น้ำบาดาล</option>
                        <option value="น้ำฝน/น้ำภูเขา/ลำธาร">น้ำฝน / ธรรมชาติ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">แหล่งไฟฟ้า</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.homeVisit.electricity}
                        onChange={(e) =>
                    setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, electricity: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.electricity, true)}
                      >
                        <option value="">เลือกแหล่งไฟฟ้า...</option>
                        <option value="มีไฟฟ้าใช้งาน">มีไฟฟ้าใช้งานหลัก (มิเตอร์แยก)</option>
                        <option value="มีเครื่องปั่นไฟ/โซล่าเซลล์">มีเครื่องปั่นไฟ / โซล่าเซลล์</option>
                        <option value="มีไฟต่อพ่วง/แบตเตอรี่">มีไฟต่อพ่วง / แบตเตอรี่</option>
                        <option value="ไม่มีไฟฟ้าใช้">ไม่มีไฟฟ้าใช้</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2.7: ความปลอดภัยและสิ่งแวดล้อม */}
                <div className="glass-card p-6 border border-slate-100 dark:border-slate-850 space-y-4">
                  <h5 className="font-extrabold text-sm text-primary border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                    <span>{lang === "th" ? "ส่วนที่ 2.7: ความปลอดภัย สิ่งแวดล้อม และสินทรัพย์" : "Section 2.7: Safety, Environment & Appliances"}</span>
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">สภาพตัวบ้านโดยรวม</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.homeVisit.cleanliness}
                        onChange={(e) =>
                    setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, cleanliness: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.cleanliness, true)}
                      >
                        <option value="">เลือกสภาพตัวบ้านโดยรวม...</option>
                        <option value="ดี">ดี มั่นคงแข็งแรง</option>
                        <option value="พอใช้">พอใช้ (เสื่อมโทรมเล็กน้อย)</option>
                        <option value="เก่าทรุดโทรม">เก่าทรุดโทรม (ชำรุดหลายส่วน)</option>
                        <option value="พื้นที่คับแคบ">พื้นที่คับแคบ แออัด</option>
                        <option value="ไม่มีความเป็นสัดส่วน">ไม่มีความเป็นสัดส่วน</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ความสะอาดเรียบร้อย</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.homeVisit.surroundingEnv}
                        onChange={(e) =>
                    setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, surroundingEnv: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.surroundingEnv, true)}
                      >
                        <option value="">เลือกความสะอาดเรียบร้อย...</option>
                        <option value="สะอาดมีระเบียบ">สะอาดเป็นระเบียบเรียบร้อย</option>
                        <option value="ไม่ค่อยสะอาด">ไม่ค่อยสะอาด</option>
                        <option value="สกปรกไม่มีระเบียบ">สกปรกไม่มีระเบียบ</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ความปลอดภัยของที่อยู่อาศัย</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.homeVisit.safety}
                        onChange={(e) =>
                    setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, safety: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.safety, true)}
                      >
                        <option value="">เลือกความปลอดภัยที่อยู่อาศัย...</option>
                        <option value="ปลอดภัย">ปลอดภัยดี</option>
                        <option value="ไม่ปลอดภัย">เสี่ยงภัย / ไม่ปลอดภัย</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ความปลอดภัยด้านภัยพิบัติธรรมชาติ</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.homeVisit.disasterSafety}
                        onChange={(e) =>
                    setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, disasterSafety: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.disasterSafety, true)}
                      >
                        <option value="">เลือกความปลอดภัยด้านภัยพิบัติ...</option>
                        <option value="ปลอดภัย">ปลอดภัย</option>
                        <option value="เสี่ยงน้ำท่วม">เสี่ยงน้ำท่วม</option>
                        <option value="เสี่ยงดินถล่ม">เสี่ยงดินถล่ม</option>
                        <option value="เสี่ยงวาตภัย">เสี่ยงวาตภัย</option>
                        <option value="เสี่ยงมลพิษทางอากาศ">เสี่ยงมลพิษทางอากาศ</option>
                        <option value="เสี่ยงโรคระบาด">เสี่ยงโรคระบาด</option>
                      </select>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-amber-600 dark:text-amber-500 block mb-2">
                        ของใช้ในครัวเรือน (ที่ยังใช้งานได้จริง)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: "refrigerator", label: "ตู้เย็น" },
                          { key: "television", label: "โทรทัศน์" },
                          { key: "fan", label: "พัดลม" },
                          { key: "washingMachine", label: "เครื่องซักผ้า" },
                          { key: "riceCooker", label: "หม้อหุงข้าวไฟฟ้า" },
                          { key: "airConditioner", label: "เครื่องปรับอากาศ" },
                          { key: "computer", label: "คอมพิวเตอร์" },
                          { key: "waterHeater", label: "เครื่องทำน้ำอุ่น" }
                        ].map((item) => {
                          const isChecked = formData.homeVisit.householdAppliances?.[item.key];
                          return (
                            <button
                              key={item.key}
                              type="button"
                              disabled={isFormLocked}
                              onClick={() => {
                                setFormData((prev: any) => ({
                                  ...prev,
                                  homeVisit: {
                                    ...prev.homeVisit,
                                    householdAppliances: {
                                      ...prev.homeVisit.householdAppliances,
                                      [item.key]: !isChecked
                                    }
                                  }
                                }));
                              }}
                              className={`py-2 text-[10px] font-bold rounded-xl border text-center transition-all ${
                                isChecked 
                                  ? "border-primary bg-primary/5 text-primary" 
                                  : "border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500"
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2.8: การเดินทางและค่าใช้จ่าย */}
                <div className="glass-card p-6 border border-slate-100 dark:border-slate-850 space-y-4">
                  <h5 className="font-extrabold text-sm text-primary border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                    <span>{lang === "th" ? "ส่วนที่ 2.8: การเดินทางและค่าใช้จ่ายมาโรงเรียน" : "Section 2.8: Travel & Expenses"}</span>
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">โรงเรียนเดิมก่อนหน้า (Previous School)</label>
                      <input
                        type="text"
                        disabled={isFormLocked}
                        value={formData.profile.previousSchool}
                        onChange={(e) => setFormData({
                          ...formData,
                          profile: { ...formData.profile, previousSchool: e.target.value }
                        })}
                        className={getInputStyle(formData.profile.previousSchool, false)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">วิธีเดินทางมาโรงเรียน (Travel Method)</label>
                      <select
                        disabled={isFormLocked}
                        value={formData.homeVisit.travelMethod}
                        onChange={(e) =>
                    setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, travelMethod: e.target.value }
                        })}
                        className={getInputStyle(formData.homeVisit.travelMethod, true)}
                      >
                        <option value="">เลือกวิธีเดินทางมาโรงเรียน...</option>
                        <option value="เดินเท้า">เดินเท้า</option>
                        <option value="จักรยาน">จักรยาน</option>
                        <option value="จักรยานยนต์ส่วนตัว">จักรยานยนต์ส่วนตัว</option>
                        <option value="รถยนต์ส่วนตัว">รถยนต์ส่วนตัว</option>
                        <option value="รถโดยสารประจำทาง">รถโดยสารประจำทาง</option>
                        <option value="รถรับส่งนักเรียน">รถรับส่งนักเรียน</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ระยะทาง (กิโลเมตร)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.homeVisit.distanceToSchool}
                        onChange={(e) => setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, distanceToSchool: parseFloat(e.target.value) || 0 }
                        })}
                        className={getInputStyle(formData.homeVisit.distanceToSchool, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">เวลาเดินทางไป-กลับ (นาที)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.homeVisit.travelTimeMins}
                        onChange={(e) => setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, travelTimeMins: parseInt(e.target.value) || 0 }
                        })}
                        className={getInputStyle(formData.homeVisit.travelTimeMins, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">เงินค่าขนมมาโรงเรียนต่อวัน (บาท)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.homeVisit.dailyAllowance}
                        onChange={(e) => setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, dailyAllowance: parseFloat(e.target.value) || 0 }
                        })}
                        className={getInputStyle(formData.homeVisit.dailyAllowance, false)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ค่าเดินทางต่อเดือน (ถ้ามี - บาท)</label>
                      <input
                        type="number"
                        disabled={isFormLocked}
                        value={formData.homeVisit.travelCost}
                        onChange={(e) => setFormData({
                          ...formData,
                          homeVisit: { ...formData.homeVisit, travelCost: parseFloat(e.target.value) || 0 }
                        })}
                        className={getInputStyle(formData.homeVisit.travelCost, false)}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2.9: บันทึกอาจารย์ประจำชั้นและอัปโหลด/พิกัด */}
                <div className="glass-card p-6 border border-slate-100 dark:border-slate-850 space-y-4">
                  <h5 className="font-extrabold text-sm text-primary border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                    <span>{lang === "th" ? "ส่วนที่ 2.9: สรุปบันทึกการเยี่ยมบ้าน พิกัด และภาพถ่าย" : "Section 2.9: Teacher Record & Media"}</span>
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {role === "student" ? (
                      <div className="col-span-1 md:col-span-2 p-6 border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/60 rounded-2xl text-center text-xs text-slate-400">
                        <Lock className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                        <span>ส่วนการอัปโหลดรูปภาพ พิกัดจีพีเอส และความเห็นครู สงวนสิทธิ์สำหรับคุณครูผู้ประเมินในการบันทึกเท่านั้น</span>
                      </div>
                    ) : (
                      <>
                        <div className="col-span-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">ความกังวลของผู้ปกครอง / สภาพปัญหาหลักที่พบ</label>
                          <textarea
                            disabled={isFormLocked}
                            value={formData.homeVisit.parentConcerns || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              homeVisit: { ...formData.homeVisit, parentConcerns: e.target.value }
                            })}
                            rows={3}
                            className={getInputStyle(formData.homeVisit.parentConcerns || "", false)}
                            placeholder="ระบุความกังวลหรือปัญหาของผู้ปกครอง..."
                          />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">แนวทางการช่วยเหลือที่โรงเรียนควรให้เพิ่มเติม</label>
                          <textarea
                            disabled={isFormLocked}
                            value={formData.homeVisit.schoolHelpNeeded || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              homeVisit: { ...formData.homeVisit, schoolHelpNeeded: e.target.value }
                            })}
                            rows={3}
                            className={getInputStyle(formData.homeVisit.schoolHelpNeeded || "", false)}
                            placeholder="แนวทางช่วยเหลือเพิ่มเติม..."
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">ผู้ให้ข้อมูลการเยี่ยมบ้าน</label>
                          <select
                            disabled={isFormLocked}
                            value={formData.homeVisit.informantRelation || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              homeVisit: { ...formData.homeVisit, informantRelation: e.target.value }
                            })}
                            className={getInputStyle(formData.homeVisit.informantRelation || "", true)}
                          >
                            <option value="">เลือกผู้ให้ข้อมูล...</option>
                            <option value="ผู้ปกครอง">ผู้ปกครอง</option>
                            <option value="บิดา">บิดา</option>
                            <option value="มารดา">มารดา</option>
                            <option value="ปู่">ปู่</option>
                            <option value="ย่า">ย่า</option>
                            <option value="ตา">ตา</option>
                            <option value="ยาย">ยาย</option>
                            <option value="น้า">น้า</option>
                            <option value="อา">อา</option>
                            <option value="ลุง">ลุง</option>
                            <option value="ป้า">ป้า</option>
                            <option value="พี่ชาย">พี่ชาย</option>
                            <option value="พี่สาว">พี่สาว</option>
                            <option value="เพื่อนบ้าน">เพื่อนบ้าน</option>
                            <option value="อื่นๆ">อื่นๆ</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">ภาพที่พักของนักเรียนได้มาจาก</label>
                          <select
                            disabled={isFormLocked}
                            value={formData.homeVisit.photoSource || "ครูลงเยี่ยมบ้านด้วยตัวเอง"}
                            onChange={(e) =>
                    setFormData({
                              ...formData,
                              homeVisit: { ...formData.homeVisit, photoSource: e.target.value }
                            })}
                            className={getInputStyle(formData.homeVisit.photoSource || "ครูลงเยี่ยมบ้านด้วยตัวเอง", true)}
                          >
                            <option value="">เลือกแหล่งที่มาของภาพถ่าย...</option>
                            <option value="ครูลงเยี่ยมบ้านด้วยตัวเอง">ครูลงเยี่ยมบ้านด้วยตัวเอง</option>
                            <option value="ให้นักเรียนถ่ายภาพมาให้">ให้นักเรียนถ่ายภาพมาให้</option>
                          </select>
                        </div>

                        {/* GPS Section */}
                        <div className="col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-3">
                          <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400 block mb-1">📍 ตำแหน่งที่พัก (GPS)</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isFormLocked}
                              onClick={handleGetLocation}
                              className="flex-1 bg-slate-900 dark:bg-slate-800 text-white py-2.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2 text-xs cursor-pointer"
                            >
                              <span>ดึงพิกัดปัจจุบัน (GPS)</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleOpenNavigation}
                              className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600 transition flex items-center justify-center gap-2 text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                            >
                              <span>นำทางด้วย Google Map</span>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-1/2">
                              <label className="text-[8px] font-bold text-slate-400 block mb-0.5">ละติจูด (Lat)</label>
                              <input
                                type="number"
                                step="any"
                                disabled={isFormLocked}
                                value={formData.homeVisit.latitude || ""}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  homeVisit: { ...formData.homeVisit, latitude: parseFloat(e.target.value) || "" }
                                })}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs text-center font-bold outline-none"
                              />
                            </div>
                            <div className="w-1/2">
                              <label className="text-[8px] font-bold text-slate-400 block mb-0.5">ลองจิจูด (Long)</label>
                              <input
                                type="number"
                                step="any"
                                disabled={isFormLocked}
                                value={formData.homeVisit.longitude || ""}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  homeVisit: { ...formData.homeVisit, longitude: parseFloat(e.target.value) || "" }
                                })}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs text-center font-bold outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Image Upload Area with resize compressor */}
                        <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">รูปภายนอกบ้าน (เห็นหลังคาและฝาบ้าน)</label>
                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center bg-slate-50 dark:bg-slate-900/40 relative group cursor-pointer hover:border-indigo-500 transition-all">
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isFormLocked}
                                onChange={(e) => handleImageUpload(e, "imgHouseOutside")}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                              />
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <span className="text-xl">📸</span>
                                <span className="text-[9px] text-slate-400 font-bold">แตะเพื่อเลือกภาพ/ถ่ายรูป</span>
                                <span className="text-[7px] text-slate-400 font-semibold">(บีบอัดไฟล์ภาพอัตโนมัติ)</span>
                              </div>
                            </div>
                            {formData.homeVisit.imgHouseOutside && (
                              <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200/50">
                                <img src={formData.homeVisit.imgHouseOutside} className="w-full h-28 object-cover" alt="House Outside" />
                                <button
                                  type="button"
                                  disabled={isFormLocked}
                                  onClick={() => setFormData({ ...formData, homeVisit: { ...formData.homeVisit, imgHouseOutside: "" } })}
                                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs font-bold hover:bg-black"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">รูปภายในบ้าน (เห็นสภาพความเป็นอยู่)</label>
                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center bg-slate-50 dark:bg-slate-900/40 relative group cursor-pointer hover:border-indigo-500 transition-all">
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isFormLocked}
                                onChange={(e) => handleImageUpload(e, "imgHouseInside")}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                              />
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <span className="text-xl">🏠</span>
                                <span className="text-[9px] text-slate-400 font-bold">แตะเพื่อเลือกภาพ/ถ่ายรูป</span>
                                <span className="text-[7px] text-slate-400 font-semibold">(บีบอัดไฟล์ภาพอัตโนมัติ)</span>
                              </div>
                            </div>
                            {formData.homeVisit.imgHouseInside && (
                              <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200/50">
                                <img src={formData.homeVisit.imgHouseInside} className="w-full h-28 object-cover" alt="House Inside" />
                                <button
                                  type="button"
                                  disabled={isFormLocked}
                                  onClick={() => setFormData({ ...formData, homeVisit: { ...formData.homeVisit, imgHouseInside: "" } })}
                                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs font-bold hover:bg-black"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">สถานะบันทึกทะเบียนเยี่ยมบ้าน นร.01</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { key: "PENDING", label: "กำลังดำเนินการ (Pending)" },
                              { key: "COMPLETED", label: "เสร็จสิ้นสมบูรณ์ (Completed)" },
                              { key: "NOT_FOUND", label: "ไม่พบตัวนักเรียน / ข้อยกเว้น" }
                            ].map((s) => (
                              <button
                                key={s.key}
                                type="button"
                                disabled={isFormLocked}
                                onClick={() => setFormData({
                                  ...formData,
                                  homeVisit: { ...formData.homeVisit, visitStatus: s.key }
                                })}
                                className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                                  formData.homeVisit.visitStatus === s.key 
                                    ? "border-primary bg-primary/5 text-primary animate-pulse" 
                                    : "border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500"
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* TWO-PAGE NAVIGATION FOOTER */}
          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-850 pt-5">
            <button
              onClick={() => setCurrentStep(1)}
              disabled={currentStep === 1}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === "th" ? "ก่อนหน้า" : "Back"}</span>
            </button>

            {currentStep === 1 ? (
              <button
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>{lang === "th" ? "ถัดไป" : "Next"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSaveHomeVisit}
                disabled={isFormLocked}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white hover:opacity-95 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-primary/10 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === "th" ? "บันทึกและส่งข้อมูล นร.01" : "Finalize & Save"}</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 4. SDQ QUESTIONNAIRE ASSESSMENT SCREEN                         */}
      {/* ============================================================== */}
      {sdqStudentId && activeTab === "sdq" && (
        <div className="glass-card p-6 space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSdqStudentId(null)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 hover:text-foreground transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h4 className="font-extrabold text-sm text-slate-950 dark:text-white">
                  {lang === "th" ? "แบบประเมินจุดเด่นและจุดด้อย (SDQ Assessment)" : "Strengths and Difficulties Questionnaire (SDQ)"}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {lang === "th" ? `ประเมินนักเรียน: ${students.find(s => s.id === sdqStudentId)?.fullName}` : `Student: ${students.find(s => s.id === sdqStudentId)?.fullName}`}
                </p>
              </div>
            </div>

            {/* Assessor Type swapper */}
            <select
              value={sdqAssessor}
              onChange={(e) =>
                    setSdqAssessor(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold outline-none cursor-pointer"
            >
              <option value="">เลือกข้อมูล...</option>
              <option value="TEACHER">{lang === "th" ? "ครูประเมิน" : "Teacher Assessor"}</option>
              <option value="PARENT">{lang === "th" ? "ผู้ปกครองประเมิน" : "Parent Assessor"}</option>
              <option value="STUDENT">{lang === "th" ? "นักเรียนประเมินตนเอง" : "Student Assessor"}</option>
            </select>
          </div>

          {/* QUESTIONS LIST */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {sdqQuestions.map((q) => {
              const selectedValue = sdqAnswers[q.id];
              return (
                <div 
                  key={q.id}
                  className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {q.id}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {lang === "th" ? q.th : q.en}
                      </p>
                      <span className="text-[9px] text-slate-400 capitalize font-medium">{q.type}</span>
                    </div>
                  </div>

                  {/* Radio card answers (0=Not true, 1=Somewhat true, 2=Certainly true) */}
                  <div className="grid grid-cols-3 gap-2 shrink-0 md:w-80">
                    {[
                      { val: 0, th: "ไม่จริง", en: "Not True" },
                      { val: 1, th: "จริงบางส่วน", en: "Somewhat True" },
                      { val: 2, th: "จริงแน่นอน", en: "Certainly True" }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setSdqAnswers({
                          ...sdqAnswers,
                          [q.id]: opt.val
                        })}
                        className={`py-2 text-[10px] font-bold rounded-xl border text-center transition-all cursor-pointer ${
                          selectedValue === opt.val 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500"
                        }`}
                      >
                        {lang === "th" ? opt.th : opt.en}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-5">
            <span className="text-[10px] text-slate-400 font-semibold">
              {lang === "th" ? "* โปรดประเมินให้ครบทั้ง 25 ข้อเพื่อความเที่ยงตรง" : "* Please answer all 25 questions for accuracy"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSdqStudentId(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                {lang === "th" ? "ยกเลิก" : "Cancel"}
              </button>
              <button
                onClick={handleSaveSdq}
                className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === "th" ? "บันทึกผลการประเมิน SDQ" : "Save Evaluation"}</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 4. ADD & EDIT CENTRAL STUDENT MODALS                           */}
      {/* ============================================================== */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsAddStudentOpen(false)} 
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 cursor-pointer"
            >
              <Plus className="w-4 h-4 rotate-45" />
            </button>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4">
              {lang === "th" ? "เพิ่มนักเรียนใหม่ลงฐานข้อมูลกลาง" : "Add Student to Central Database"}
            </h3>
            <form onSubmit={handleAddStudent} className="space-y-4 text-xs font-semibold text-slate-650 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "ชื่อ-นามสกุล *" : "Full Name *"}</label>
                <input 
                  required 
                  type="text" 
                  placeholder="เช่น เด็กชายสมจิต สมบูรณ์" 
                  value={studentNameForm} 
                  onChange={(e) => setStudentNameForm(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-foreground text-xs outline-none focus:border-primary font-semibold" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "รหัสประจำตัวนักเรียน *" : "Student ID *"}</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="เช่น 10001" 
                    value={studentCodeForm} 
                    onChange={(e) => setStudentCodeForm(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-foreground text-xs outline-none focus:border-primary font-mono font-semibold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "ชื่อเล่น" : "Nickname"}</label>
                  <input 
                    type="text" 
                    placeholder="เช่น จิต" 
                    value={studentNicknameForm} 
                    onChange={(e) => setStudentNicknameForm(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-foreground text-xs outline-none focus:border-primary font-semibold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "ระดับชั้น/ห้องเรียน *" : "Classroom *"}</label>
                  <select 
                    value={studentClassroomForm} 
                    onChange={(e) =>
                    setStudentClassroomForm(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-350 text-xs outline-none focus:border-primary cursor-pointer font-bold"
                  >
                    <option value="">เลือกข้อมูล...</option>
                    <option value="ม.1/1">ม.1/1</option>
                    <option value="ม.1/2">ม.1/2</option>
                    <option value="ม.4/1">ม.4/1</option>
                    <option value="ม.6/1">ม.6/1</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "เพศ *" : "Gender *"}</label>
                  <select 
                    value={studentGenderForm} 
                    onChange={(e) =>
                    setStudentGenderForm(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-350 text-xs outline-none focus:border-primary cursor-pointer font-bold"
                  >
                    <option value="">เลือกข้อมูล...</option>
                    <option value="ชาย">{lang === "th" ? "ชาย" : "Male"}</option>
                    <option value="หญิง">{lang === "th" ? "หญิง" : "Female"}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "ชื่อผู้ปกครอง" : "Parent Name"}</label>
                  <input 
                    type="text" 
                    placeholder="เช่น นายบุญธรรม สมบูรณ์" 
                    value={studentParentNameForm} 
                    onChange={(e) => setStudentParentNameForm(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-foreground text-xs outline-none focus:border-primary font-semibold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "เบอร์โทรผู้ปกครอง" : "Parent Phone"}</label>
                  <input 
                    type="text" 
                    placeholder="เช่น 0891234567" 
                    value={studentParentPhoneForm} 
                    onChange={(e) => setStudentParentPhoneForm(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-foreground text-xs outline-none focus:border-primary font-mono font-semibold" 
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 font-bold">
                <button 
                  type="button" 
                  onClick={() => setIsAddStudentOpen(false)} 
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs transition-all cursor-pointer"
                >
                  {lang === "th" ? "ยกเลิก" : "Cancel"}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-indigo-700 text-white text-xs transition-all shadow-md shadow-primary/10 cursor-pointer"
                >
                  {lang === "th" ? "บันทึก" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsEditStudentOpen(false)} 
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 cursor-pointer"
            >
              <Plus className="w-4 h-4 rotate-45" />
            </button>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4">
              {lang === "th" ? "แก้ไขข้อมูลนักเรียนฐานข้อมูลกลาง" : "Edit Central Student Database Details"}
            </h3>
            <form onSubmit={handleEditStudentSubmit} className="space-y-4 text-xs font-semibold text-slate-650 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "ชื่อ-นามสกุล *" : "Full Name *"}</label>
                <input 
                  required 
                  type="text" 
                  value={studentNameForm} 
                  onChange={(e) => setStudentNameForm(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-foreground text-xs outline-none focus:border-primary font-semibold" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "รหัสประจำตัวนักเรียน *" : "Student ID *"}</label>
                  <input 
                    required 
                    type="text" 
                    value={studentCodeForm} 
                    onChange={(e) => setStudentCodeForm(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-foreground text-xs outline-none focus:border-primary font-mono font-semibold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "ชื่อเล่น" : "Nickname"}</label>
                  <input 
                    type="text" 
                    value={studentNicknameForm} 
                    onChange={(e) => setStudentNicknameForm(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-foreground text-xs outline-none focus:border-primary font-semibold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "ระดับชั้น/ห้องเรียน *" : "Classroom *"}</label>
                  <select 
                    value={studentClassroomForm} 
                    onChange={(e) =>
                    setStudentClassroomForm(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-350 text-xs outline-none focus:border-primary cursor-pointer font-bold"
                  >
                    <option value="">เลือกข้อมูล...</option>
                    <option value="ม.1/1">ม.1/1</option>
                    <option value="ม.1/2">ม.1/2</option>
                    <option value="ม.4/1">ม.4/1</option>
                    <option value="ม.6/1">ม.6/1</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "เพศ *" : "Gender *"}</label>
                  <select 
                    value={studentGenderForm} 
                    onChange={(e) =>
                    setStudentGenderForm(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-350 text-xs outline-none focus:border-primary cursor-pointer font-bold"
                  >
                    <option value="">เลือกข้อมูล...</option>
                    <option value="ชาย">{lang === "th" ? "ชาย" : "Male"}</option>
                    <option value="หญิง">{lang === "th" ? "หญิง" : "Female"}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "ชื่อผู้ปกครอง" : "Parent Name"}</label>
                  <input 
                    type="text" 
                    value={studentParentNameForm} 
                    onChange={(e) => setStudentParentNameForm(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-foreground text-xs outline-none focus:border-primary font-semibold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">{lang === "th" ? "เบอร์โทรผู้ปกครอง" : "Parent Phone"}</label>
                  <input 
                    type="text" 
                    value={studentParentPhoneForm} 
                    onChange={(e) => setStudentParentPhoneForm(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-foreground text-xs outline-none focus:border-primary font-mono font-semibold" 
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 font-bold">
                <button 
                  type="button" 
                  onClick={() => setIsEditStudentOpen(false)} 
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs transition-all cursor-pointer"
                >
                  {lang === "th" ? "ยกเลิก" : "Cancel"}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-indigo-700 text-white text-xs transition-all shadow-md shadow-primary/10 cursor-pointer"
                >
                  {lang === "th" ? "บันทึก" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
