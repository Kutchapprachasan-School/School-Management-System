"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import fs from "fs";
import path from "path";

// Authentication helpers
async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }
  return session;
}

// 1. Get student care list (with classroom and status)
export async function getStudentCareList() {
  try {
    const students = await prisma.student.findMany({
      include: {
        homeVisit: true,
        sdqAssessments: true,
        profile: true
      },
      orderBy: [
        { classroom: "asc" },
        { seatNumber: "asc" }
      ]
    });
    return { success: true, data: students };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Get student care detail (home visit, profile, sdq)
export async function getStudentCareDetail(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        profile: {
          include: {
            familyMembers: true
          }
        },
        homeVisit: true,
        sdqAssessments: true
      }
    });

    if (!student) {
      return { success: false, error: "ไม่พบข้อมูลนักเรียน" };
    }

    return { success: true, data: student };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Save Home Visit & Profile Data
export async function saveHomeVisitData(studentId: string, data: any) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    const user = session?.user;
    
    // Check role from session to handle student-only locking
    const userRole = user?.role || "STUDENT";
    const isStudent = userRole === "STUDENT";

    // Check if the current visit status is COMPLETED
    const currentVisit = await prisma.studentHomeVisit.findUnique({
      where: { studentId }
    });

    if (currentVisit?.visitStatus === "COMPLETED" && isStudent) {
      return { success: false, error: "ข้อมูลถูกบันทึกเรียบร้อยแล้วและอยู่ในสถานะเสร็จสิ้น ไม่สามารถแก้ไขได้" };
    }

    // 1. Upsert StudentProfile
    const profileData = data.profile || {};
    
    // Calculate total height/weight to update student model
    const weightVal = parseFloat(profileData.weight) || null;
    const heightVal = parseFloat(profileData.height) || null;
    if (weightVal || heightVal) {
      await prisma.student.update({
        where: { id: studentId },
        data: {
          ...(weightVal && { weight: weightVal }),
          ...(heightVal && { height: heightVal })
        }
      });
    }

    const birthDateVal = profileData.birthDate ? new Date(profileData.birthDate) : new Date();

    const profile = await prisma.studentProfile.upsert({
      where: { studentId },
      create: {
        studentId,
        nationalId: profileData.nationalId || `G-${Date.now()}`,
        nickname: profileData.nickname || "",
        birthDate: birthDateVal,
        nationality: profileData.nationality || "ไทย",
        race: profileData.race || "ไทย",
        religion: profileData.religion || "พุทธ",
        bloodType: profileData.bloodType || "O",
        weight: weightVal || 0.0,
        height: heightVal || 0.0,
        congenitalDisease: profileData.congenitalDisease || null,
        disabilityType: profileData.disabilityType || null,
        disadvantageType: profileData.disadvantageType || "ไม่ด้อยโอกาส",
        profileImage: profileData.profileImage || null,
        birthProvince: profileData.birthProvince || "",
        birthAmphoe: profileData.birthAmphoe || "",
        birthTambon: profileData.birthTambon || "",
        previousSchool: profileData.previousSchool || "",
        moveInReason: profileData.moveInReason || null,
        familyStatus: profileData.familyStatus || "อยู่ร่วมกัน",
        livingWith: profileData.livingWith || "บิดามารดา",
        closestMember: profileData.closestMember || "มารดา",
        timeSpentTogether: parseFloat(profileData.timeSpentTogether) || 0.0,
        siblingsSameParents: parseInt(profileData.siblingsSameParents) || 0,
        siblingsDiffParents: parseInt(profileData.siblingsDiffParents) || 0,
      },
      update: {
        nationalId: profileData.nationalId,
        nickname: profileData.nickname,
        birthDate: birthDateVal,
        nationality: profileData.nationality,
        race: profileData.race,
        religion: profileData.religion,
        bloodType: profileData.bloodType,
        weight: weightVal || 0.0,
        height: heightVal || 0.0,
        congenitalDisease: profileData.congenitalDisease,
        disabilityType: profileData.disabilityType,
        disadvantageType: profileData.disadvantageType,
        profileImage: profileData.profileImage,
        birthProvince: profileData.birthProvince,
        birthAmphoe: profileData.birthAmphoe,
        birthTambon: profileData.birthTambon,
        previousSchool: profileData.previousSchool,
        moveInReason: profileData.moveInReason,
        familyStatus: profileData.familyStatus,
        livingWith: profileData.livingWith,
        closestMember: profileData.closestMember,
        timeSpentTogether: parseFloat(profileData.timeSpentTogether) || 0.0,
        siblingsSameParents: parseInt(profileData.siblingsSameParents) || 0,
        siblingsDiffParents: parseInt(profileData.siblingsDiffParents) || 0,
      }
    });

    // 2. Handle Family Members
    if (profile) {
      const allMembersToSave = [];

      // Add Father if name is provided
      const fatherData = data.father || {};
      if (fatherData.name) {
        allMembersToSave.push({
          relation: "บิดา",
          prefix: fatherData.prefix || "นาย",
          name: fatherData.name,
          nationalId: fatherData.idCard || null,
          phone: fatherData.phone || null,
          job: fatherData.job || null,
          wages: parseFloat(fatherData.income) || 0.0,
          status: fatherData.status || null,
          health: fatherData.health || null,
          age: parseInt(fatherData.age) || 0,
          education: "ประถมศึกษา",
          hasDisability: fatherData.health === "พิการ" || fatherData.health === "ทุพพลภาพ",
          hasChronicDisease: fatherData.health === "เจ็บป่วยเรื้อรัง"
        });
      }

      // Add Mother if name is provided
      const motherData = data.mother || {};
      if (motherData.name) {
        allMembersToSave.push({
          relation: "มารดา",
          prefix: motherData.prefix || "นาง/นางสาว",
          name: motherData.name,
          nationalId: motherData.idCard || null,
          phone: motherData.phone || null,
          job: motherData.job || null,
          wages: parseFloat(motherData.income) || 0.0,
          status: motherData.status || null,
          health: motherData.health || null,
          age: parseInt(motherData.age) || 0,
          education: "ประถมศึกษา",
          hasDisability: motherData.health === "พิการ" || motherData.health === "ทุพพลภาพ",
          hasChronicDisease: motherData.health === "เจ็บป่วยเรื้อรัง"
        });
      }

      // Add Guardian if name is provided
      const guardianData = data.guardian || {};
      if (guardianData.name) {
        allMembersToSave.push({
          relation: "ผู้ปกครอง",
          prefix: guardianData.prefix || "",
          name: guardianData.name,
          nationalId: guardianData.idCard || null,
          phone: guardianData.phone || null,
          job: guardianData.job || null,
          education: guardianData.education || "",
          status: guardianData.relation || null, // Storing guardian's relation in status field
          age: parseInt(guardianData.age) || 0,
          wages: parseFloat(guardianData.income) || 0.0,
          hasDisability: false,
          hasChronicDisease: false
        });
      }

      // Add General Family Members
      if (profileData.familyMembers && Array.isArray(profileData.familyMembers)) {
        for (const m of profileData.familyMembers) {
          // Skip if relation is father/mother/guardian to avoid duplicate save
          if (m.relation === "บิดา" || m.relation === "มารดา" || m.relation === "ผู้ปกครอง") continue;
          allMembersToSave.push({
            relation: m.relation || "ญาติ",
            prefix: m.prefix || null,
            name: m.name || "",
            nationalId: m.nationalId || null,
            phone: m.phone || null,
            job: m.job || null,
            education: m.education || "ประถมศึกษา",
            age: parseInt(m.age) || 0,
            hasDisability: m.hasDisability || false,
            hasChronicDisease: m.hasChronicDisease || false,
            wages: parseFloat(m.wages) || 0.0,
            agriculturalIncome: parseFloat(m.agriculturalIncome) || 0.0,
            businessIncome: parseFloat(m.businessIncome) || 0.0,
            welfareIncome: parseFloat(m.welfareIncome) || 0.0,
            otherIncome: parseFloat(m.otherIncome) || 0.0,
            status: m.status || null,
            health: m.health || null
          });
        }
      }

      // Delete existing family members
      await prisma.familyMember.deleteMany({
        where: { profileId: profile.id }
      });

      // Create new family members in DB
      for (const m of allMembersToSave) {
        const wages = m.wages || 0.0;
        const agriculturalIncome = m.agriculturalIncome || 0.0;
        const businessIncome = m.businessIncome || 0.0;
        const welfareIncome = m.welfareIncome || 0.0;
        const otherIncome = m.otherIncome || 0.0;
        const total = wages + agriculturalIncome + businessIncome + welfareIncome + otherIncome;

        await prisma.familyMember.create({
          data: {
            profileId: profile.id,
            relation: m.relation,
            prefix: m.prefix,
            name: m.name,
            nationalId: m.nationalId,
            phone: m.phone,
            job: m.job,
            education: m.education,
            age: m.age,
            hasDisability: m.hasDisability,
            hasChronicDisease: m.hasChronicDisease,
            status: m.status,
            health: m.health,
            wages,
            agriculturalIncome,
            businessIncome,
            welfareIncome,
            otherIncome,
            totalMonthlyIncome: total
          }
        });
      }
    }

    // 3. Upsert StudentHomeVisit
    const visitData = data.homeVisit || {};
    
    // Auto calculate income per capita
    const totalInc = parseFloat(visitData.totalHouseholdIncome) || 0.0;
    const members = parseInt(visitData.householdMembers) || 1;
    const computedPerCapita = totalInc / Math.max(1, members);

    const homeVisit = await prisma.studentHomeVisit.upsert({
      where: { studentId },
      create: {
        studentId,
        visitStatus: visitData.visitStatus || "PENDING",
        lastVisitDate: visitData.lastVisitDate ? new Date(visitData.lastVisitDate) : new Date(),
        recordedBy: visitData.recordedBy || user?.name || null,
        informantRelation: visitData.informantRelation || null,
        latitude: parseFloat(visitData.latitude) || null,
        longitude: parseFloat(visitData.longitude) || null,
        imgHouseOutside: visitData.imgHouseOutside || null,
        imgHouseInside: visitData.imgHouseInside || null,
        photoSource: visitData.photoSource || null,
        noPhotoReason: visitData.noPhotoReason || null,
        livingArrangements: visitData.livingArrangements || null,
        rentalFee: parseFloat(visitData.rentalFee) || null,
        houseNumber: visitData.houseNumber || null,
        villageNo: visitData.villageNo || null,
        buildingFloor: visitData.buildingFloor || null,
        buildingWall: visitData.buildingWall || null,
        buildingRoof: visitData.buildingRoof || null,
        toiletCondition: visitData.toiletCondition || null,
        drinkingWater: visitData.drinkingWater || null,
        electricity: visitData.electricity || null,
        cleanliness: visitData.cleanliness || null,
        safety: visitData.safety || null,
        surroundingEnv: visitData.surroundingEnv || null,
        disasterSafety: visitData.disasterSafety || null,
        agriculturalLand: visitData.agriculturalLand || null,
        vehicles: visitData.vehicles ? JSON.stringify(visitData.vehicles) : null,
        householdAppliances: visitData.householdAppliances ? JSON.stringify(visitData.householdAppliances) : null,
        totalHouseholdIncome: totalInc,
        householdMembers: members,
        incomePerCapita: computedPerCapita,
        welfareStatus: visitData.welfareStatus || null,
        dependents: visitData.dependents ? JSON.stringify(visitData.dependents) : null,
        dailyAllowance: parseFloat(visitData.dailyAllowance) || 0.0,
        travelMethod: visitData.travelMethod || null,
        distanceToSchool: parseFloat(visitData.distanceToSchool) || 0.0,
        travelTimeMins: parseInt(visitData.travelTimeMins) || 0,
        travelCost: parseFloat(visitData.travelCost) || 0.0,
        isInstitutional: visitData.isInstitutional || false,
        institutionType: visitData.institutionType || null,
        institutionName: visitData.institutionName || null,
        institutionProvince: visitData.institutionProvince || null,
        institutionManager: visitData.institutionManager || null,
        institutionPhone: visitData.institutionPhone || null,
        institutionEntryDate: visitData.institutionEntryDate || null,
        institutionBoarding: visitData.institutionBoarding || null,
        institutionHelp: visitData.institutionHelp ? JSON.stringify(visitData.institutionHelp) : null,
        institutionExpense: parseFloat(visitData.institutionExpense) || null,
        institutionChildren: parseInt(visitData.institutionChildren) || null,
        institutionIncome: parseFloat(visitData.institutionIncome) || null,
        institutionAssets: visitData.institutionAssets ? JSON.stringify(visitData.institutionAssets) : null,
        parentConcerns: visitData.parentConcerns || null,
        schoolHelpNeeded: visitData.schoolHelpNeeded || null,
        educationalPlans: visitData.educationalPlans || null,
        teacherSummary: visitData.teacherSummary || null,
        officerName: visitData.officerName || null,
        officerIdCard: visitData.officerIdCard || null,
        officerPosition: visitData.officerPosition || null,
        officerRecommendation: visitData.officerRecommendation || null,
        officerCertifiedAt: visitData.officerCertifiedAt ? new Date(visitData.officerCertifiedAt) : null,
        directorCertifiedAt: visitData.directorCertifiedAt ? new Date(visitData.directorCertifiedAt) : null,
      },
      update: {
        visitStatus: visitData.visitStatus,
        lastVisitDate: visitData.lastVisitDate ? new Date(visitData.lastVisitDate) : undefined,
        recordedBy: visitData.recordedBy || user?.name || undefined,
        informantRelation: visitData.informantRelation,
        latitude: parseFloat(visitData.latitude) || null,
        longitude: parseFloat(visitData.longitude) || null,
        imgHouseOutside: visitData.imgHouseOutside,
        imgHouseInside: visitData.imgHouseInside,
        photoSource: visitData.photoSource,
        noPhotoReason: visitData.noPhotoReason,
        livingArrangements: visitData.livingArrangements,
        rentalFee: parseFloat(visitData.rentalFee) || null,
        houseNumber: visitData.houseNumber,
        villageNo: visitData.villageNo,
        buildingFloor: visitData.buildingFloor,
        buildingWall: visitData.buildingWall,
        buildingRoof: visitData.buildingRoof,
        toiletCondition: visitData.toiletCondition,
        drinkingWater: visitData.drinkingWater,
        electricity: visitData.electricity,
        cleanliness: visitData.cleanliness,
        safety: visitData.safety,
        surroundingEnv: visitData.surroundingEnv,
        disasterSafety: visitData.disasterSafety,
        agriculturalLand: visitData.agriculturalLand,
        vehicles: visitData.vehicles ? JSON.stringify(visitData.vehicles) : null,
        householdAppliances: visitData.householdAppliances ? JSON.stringify(visitData.householdAppliances) : null,
        totalHouseholdIncome: totalInc,
        householdMembers: members,
        incomePerCapita: computedPerCapita,
        welfareStatus: visitData.welfareStatus,
        dependents: visitData.dependents ? JSON.stringify(visitData.dependents) : null,
        dailyAllowance: parseFloat(visitData.dailyAllowance) || 0.0,
        travelMethod: visitData.travelMethod,
        distanceToSchool: parseFloat(visitData.distanceToSchool) || 0.0,
        travelTimeMins: parseInt(visitData.travelTimeMins) || 0,
        travelCost: parseFloat(visitData.travelCost) || 0.0,
        isInstitutional: visitData.isInstitutional,
        institutionType: visitData.institutionType,
        institutionName: visitData.institutionName,
        institutionProvince: visitData.institutionProvince,
        institutionManager: visitData.institutionManager,
        institutionPhone: visitData.institutionPhone,
        institutionEntryDate: visitData.institutionEntryDate,
        institutionBoarding: visitData.institutionBoarding,
        institutionHelp: visitData.institutionHelp ? JSON.stringify(visitData.institutionHelp) : null,
        institutionExpense: parseFloat(visitData.institutionExpense) || null,
        institutionChildren: parseInt(visitData.institutionChildren) || null,
        institutionIncome: parseFloat(visitData.institutionIncome) || null,
        institutionAssets: visitData.institutionAssets ? JSON.stringify(visitData.institutionAssets) : null,
        parentConcerns: visitData.parentConcerns,
        schoolHelpNeeded: visitData.schoolHelpNeeded,
        educationalPlans: visitData.educationalPlans,
        teacherSummary: visitData.teacherSummary,
        officerName: visitData.officerName,
        officerIdCard: visitData.officerIdCard,
        officerPosition: visitData.officerPosition,
        officerRecommendation: visitData.officerRecommendation,
        officerCertifiedAt: visitData.officerCertifiedAt ? new Date(visitData.officerCertifiedAt) : null,
        directorCertifiedAt: visitData.directorCertifiedAt ? new Date(visitData.directorCertifiedAt) : null,
      }
    });

    revalidatePath("/");
    return { success: true, data: { profile, homeVisit } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Save SDQ Assessment
export async function saveSdqAssessmentData(
  studentId: string,
  assessorType: string,
  scoreData: {
    emotionalScore: number;
    conductScore: number;
    hyperactivityScore: number;
    peerScore: number;
    prosocialScore: number;
    totalScore: number;
    riskStatus: string;
  },
  answers: string
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    if (!session?.user) {
      throw new Error("กรุณาเข้าสู่ระบบ");
    }

    const sdq = await prisma.sdqAssessment.create({
      data: {
        studentId,
        assessorType,
        emotionalScore: scoreData.emotionalScore,
        conductScore: scoreData.conductScore,
        hyperactivityScore: scoreData.hyperactivityScore,
        peerScore: scoreData.peerScore,
        prosocialScore: scoreData.prosocialScore,
        totalScore: scoreData.totalScore,
        riskStatus: scoreData.riskStatus,
        answers: answers
      }
    });

    // Determine student general status from SDQ risk status
    let status = "ปกติ";
    if (scoreData.riskStatus === "RISK" || scoreData.riskStatus === "มีปัญหา") {
      status = "ช่วยเหลือเร่งด่วน";
    } else if (scoreData.riskStatus === "BORDERLINE" || scoreData.riskStatus === "เสี่ยง") {
      status = "เสี่ยง";
    }

    await prisma.student.update({
      where: { id: studentId },
      data: { status }
    });

    revalidatePath("/");
    return { success: true, data: sdq };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Get Student Care statistics (classroom progresses, ultra poor ratio, risk distribution)
export async function getStudentCareStats() {
  try {
    const students = await prisma.student.findMany({
      include: {
        homeVisit: true,
        sdqAssessments: true,
        profile: true
      }
    });

    // Completion progress per classroom
    const classroomProgress: Record<string, {
      total: number;
      homeVisitCompleted: number;
      sdqCompleted: number;
    }> = {};

    let ultraPoorCount = 0;
    
    // Risks for Donut Chart
    let behaviorRiskCount = 0;
    let safetyRiskCount = 0;
    let healthRiskCount = 0;
    let economicRiskCount = 0;

    for (const student of students) {
      const cls = student.classroom || "ไม่ระบุ";
      if (!classroomProgress[cls]) {
        classroomProgress[cls] = { total: 0, homeVisitCompleted: 0, sdqCompleted: 0 };
      }
      
      classroomProgress[cls].total += 1;
      
      const homeVisit = student.homeVisit;
      if (homeVisit && homeVisit.visitStatus === "COMPLETED") {
        classroomProgress[cls].homeVisitCompleted += 1;
      }
      
      const sdqList = student.sdqAssessments;
      if (sdqList && sdqList.length > 0) {
        classroomProgress[cls].sdqCompleted += 1;
      }

      // Economic check (incomePerCapita <= 3000)
      if (homeVisit && homeVisit.incomePerCapita > 0) {
        if (homeVisit.incomePerCapita <= 3000) {
          ultraPoorCount += 1;
          economicRiskCount += 1;
        }
      }

      // Safety Risk
      const safetyCondition = homeVisit?.safety;
      if (safetyCondition === "เสี่ยง" || safetyCondition === "ไม่ปลอดภัย" || safetyCondition === "RISK") {
        safetyRiskCount += 1;
      }

      // Behavioral Risk
      const hasSdqRisk = sdqList.some(s => s.riskStatus === "RISK" || s.riskStatus === "BORDERLINE" || s.riskStatus === "มีปัญหา" || s.riskStatus === "เสี่ยง");
      if (hasSdqRisk || student.status === "เสี่ยง" || student.status === "ช่วยเหลือเร่งด่วน") {
        behaviorRiskCount += 1;
      }

      // Health Risk
      if (student.profile?.congenitalDisease || student.profile?.disabilityType) {
        healthRiskCount += 1;
      }
    }

    const progressList = Object.entries(classroomProgress).map(([classroom, data]) => ({
      classroom,
      totalStudents: data.total,
      homeVisitProgress: data.total > 0 ? Math.round((data.homeVisitCompleted / data.total) * 100) : 0,
      sdqProgress: data.total > 0 ? Math.round((data.sdqCompleted / data.total) * 100) : 0,
    }));

    const ultraPoorRatio = students.length > 0 ? (ultraPoorCount / students.length) * 100 : 0;

    const riskDistribution = [
      { name: "ความเสี่ยงด้านพฤติกรรม (Behavioral)", value: behaviorRiskCount || 0 },
      { name: "ความเสี่ยงด้านความปลอดภัย (Safety)", value: safetyRiskCount || 0 },
      { name: "ความเสี่ยงด้านสุขภาพ (Health)", value: healthRiskCount || 0 },
      { name: "ความเสี่ยงด้านเศรษฐกิจ (Economic)", value: economicRiskCount || 0 }
    ].filter(item => item.value > 0);

    // Fallbacks if all zero
    if (riskDistribution.length === 0) {
      riskDistribution.push(
        { name: "ความเสี่ยงด้านพฤติกรรม (Behavioral)", value: 0 },
        { name: "ความเสี่ยงด้านความปลอดภัย (Safety)", value: 0 },
        { name: "ความเสี่ยงด้านสุขภาพ (Health)", value: 0 },
        { name: "ความเสี่ยงด้านเศรษฐกิจ (Economic)", value: 0 }
      );
    }

    return {
      success: true,
      data: {
        classroomProgress: progressList,
        ultraPoorCount,
        ultraPoorRatio: Math.round(ultraPoorRatio * 10) / 10,
        riskDistribution
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function searchThaiAddress(query: string) {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }
    const cleanQuery = query.trim().toLowerCase();
    const filePath = path.join(process.cwd(), "src/lib/thai-province-data.json");
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "Database file not found" };
    }
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const provinces = JSON.parse(fileContent);
    const results: Array<{
      subdistrict: string;
      district: string;
      province: string;
      zipCode: number;
    }> = [];

    for (const province of provinces) {
      const pName = province.name_th;
      for (const district of province.districts || []) {
        const dName = district.name_th;
        for (const sub of district.sub_districts || []) {
          const sName = sub.name_th;
          const zip = sub.zip_code;
          if (
            sName.toLowerCase().includes(cleanQuery) ||
            dName.toLowerCase().includes(cleanQuery) ||
            pName.toLowerCase().includes(cleanQuery)
          ) {
            results.push({
              subdistrict: sName,
              district: dName,
              province: pName,
              zipCode: zip
            });
            if (results.length >= 15) break;
          }
        }
        if (results.length >= 15) break;
      }
      if (results.length >= 15) break;
    }
    return { success: true, data: results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
