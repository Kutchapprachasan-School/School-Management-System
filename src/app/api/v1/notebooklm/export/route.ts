import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { initialStudents } from "@/lib/mock-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classroom = searchParams.get("classroom") || "ม.6/1";
    const includeScores = searchParams.get("includeScores") !== "false";
    const includeBehavior = searchParams.get("includeBehavior") !== "false";
    const includeSDQ = searchParams.get("includeSDQ") !== "false";
    const includePlans = searchParams.get("includePlans") !== "false";
    const includeResearch = searchParams.get("includeResearch") !== "false";

    // 1. Query live students from database
    let dbStudents = await prisma.student.findMany({
      where: { classroom },
      include: {
        homeVisit: true,
        behaviorLogs: true,
        sdqAssessments: true,
        subjectScores: {
          include: { subject: true }
        }
      },
      orderBy: { seatNumber: "asc" }
    });

    // Fallback: If DB contains no students, populate from initialStudents
    let finalStudents: any[] = [];
    if (dbStudents.length > 0) {
      finalStudents = dbStudents;
    } else {
      const mockClassStudents = initialStudents.filter(s => s.classroom === classroom);
      finalStudents = mockClassStudents.map(s => {
        // Map mock students to match schema relations roughly for export
        return {
          id: s.id,
          studentCode: s.studentCode,
          fullName: s.fullName,
          nickname: s.nickname || "",
          classroom: s.classroom,
          seatNumber: s.seatNumber || 0,
          gender: s.gender,
          status: s.status,
          weight: s.bmi ? s.bmi * 1.7 * 1.7 : null, // estimated weight
          height: 170,
          behaviorPoints: s.behaviorPoints ?? 100,
          sdqScore: s.sdqScore ?? 10,
          sdqRisk: s.sdqRisk ?? "ปกติ",
          bmi: s.bmi ?? 20.0,
          bmiStatus: s.bmiStatus ?? "สมส่วน",
          parentName: s.parentName,
          parentPhone: s.parentPhone,
          homeVisit: s.homeVisited ? {
            familyIncome: 3000,
            eefStatus: "ELIGIBLE",
            houseCondition: "บ้านครึ่งปูนครึ่งไม้สภาพเก่า หลังคาชำรุดบางส่วน",
            distanceKm: 5.2,
            travelCost: 40,
            visitedAt: new Date("2026-05-18")
          } : null,
          behaviorLogs: s.id === "std-3" ? [
            { id: "b1", type: "DEDUCTION", points: 20, description: "ขาดเรียนติดต่อกัน 3 วันโดยไม่มีใบลาพักผ่อนหรือติดต่อครูประจำชั้น", loggedBy: "ครูอัญชลี", createdAt: new Date("2026-05-20") },
            { id: "b2", type: "DEDUCTION", points: 10, description: "ไม่เข้าแถวเคารพธงชาติและมาสายเกิน 30 นาที", loggedBy: "ครูสมเกียรติ", createdAt: new Date("2026-05-19") }
          ] : s.id === "std-2" ? [
            { id: "b3", type: "DEDUCTION", points: 10, description: "เข้าเรียนช้าและไม่ทำงานส่งในคาบภาษาไทย", loggedBy: "ครูอัญชลี", createdAt: new Date("2026-05-19") }
          ] : [
            { id: "b4", type: "MERIT", points: 10, description: "ช่วยงานจิตอาสาทำความสะอาดบอร์ดนิทรรศการและห้องพักครู", loggedBy: "ครูอัญชลี", createdAt: new Date("2026-05-18") }
          ],
          sdqAssessments: [
            {
              id: "sdq1",
              assessorType: "TEACHER",
              emotionalScore: s.id === "std-3" ? 6 : s.id === "std-2" ? 5 : 2,
              conductScore: s.id === "std-3" ? 5 : s.id === "std-2" ? 3 : 1,
              hyperactivityScore: s.id === "std-3" ? 7 : s.id === "std-2" ? 5 : 3,
              peerScore: s.id === "std-3" ? 5 : s.id === "std-2" ? 3 : 2,
              prosocialScore: s.id === "std-3" ? 3 : s.id === "std-2" ? 5 : 8,
              totalScore: s.sdqScore ?? 10,
              riskStatus: s.sdqRisk ?? "ปกติ",
              createdAt: new Date("2026-05-15")
            }
          ],
          subjectScores: [
            { subject: { code: "ว31101", name: "วิทยาศาสตร์พื้นฐาน" }, totalScore: s.id === "std-3" ? 45 : s.id === "std-2" ? 72 : 85, grade: s.id === "std-3" ? "1" : s.id === "std-2" ? "3" : "4" },
            { subject: { code: "ท31101", name: "ภาษาไทยพื้นฐาน" }, totalScore: s.id === "std-3" ? 40 : s.id === "std-2" ? 70 : 80, grade: s.id === "std-3" ? "1" : s.id === "std-2" ? "3" : "4" },
            { subject: { code: "ค31101", name: "คณิตศาสตร์พื้นฐาน" }, totalScore: s.id === "std-3" ? 38 : s.id === "std-2" ? 65 : 78, grade: s.id === "std-3" ? "0" : s.id === "std-2" ? "2.5" : "3.5" }
          ]
        };
      });
    }

    // 2. Fetch Lesson Plans & Research
    const lessonPlans = await prisma.lessonPlan.findMany({
      include: {
        postRecords: true,
        subject: true
      }
    });

    const researches = await prisma.classroomResearch.findMany({
      include: { subject: true }
    });

    // Fallback Mock data for Lesson Plans and Research if DB is empty
    let finalLessonPlans = lessonPlans;
    if (lessonPlans.length === 0) {
      finalLessonPlans = [
        {
          id: "lp-mock-1",
          title: "บทเรียนที่ 1: การใช้ภาษาโน้มน้าวใจและวิจารณญาณทางภาษา",
          objective: "เพื่อให้นักเรียนเข้าใจกลวิธีทางภาษาและสามารถวิเคราะห์ความน่าเชื่อถือของสื่อรอบตัวได้",
          content: "เนื้อหาหลักสูตรเรื่องกลยุทธ์การโฆษณาชวนเชื่อ วาทศิลป์ของนักพูด และการใช้เหตุผลเชิงตรรกะในสื่อสังคมออนไลน์",
          activities: "1. วิเคราะห์คลิปโฆษณา 3 ชนิด\n2. แบ่งกลุ่มอภิปรายความสมเหตุสมผลของการกล่าวอ้างสรรพคุณ\n3. เขียนบทความรณรงค์สั้นความยาว 1 หน้ากระดาษ",
          evaluation: "การประเมินการเขียนบทวิเคราะห์สื่อสังคมออนไลน์ของนักเรียนในใบงานรายกลุ่ม",
          subject: { code: "ท31101", name: "ภาษาไทยพื้นฐาน" },
          postRecords: [
            {
              id: "pr-mock-1",
              problems: "นักเรียนบางส่วน (เช่น นายปฏิพล นร.กลุ่มช่วยเหลือ) ยังขาดทักษะพื้นฐานในการเขียนประโยคใจความสำคัญ และมีอาการเหม่อลอยเป็นระยะ",
              solutions: "จัดนักเรียนกลุ่มจับคู่คู่หูช่วยเหลือ (Peer-tutoring) โดยให้เพื่อนกลุ่มเก่งคอยประกบ และลดความยาวใบงานงานเขียนลงเหลือครึ่งหน้ากระดาษ",
              suggestions: "ควรเน้นสื่อวิดีโอสั้นหรือ TikTok ในวิชาเรียนครั้งถัดไปเพื่อเพิ่มความสนใจ"
            }
          ]
        }
      ] as any;
    }

    let finalResearches = researches;
    if (researches.length === 0) {
      finalResearches = [
        {
          id: "res-mock-1",
          title: "การแก้ปัญหาทักษะการวิเคราะห์ภาษาในโฆษณาด้วยโมเดลแบบคู่หูช่วยเรียนและชุดใบงานย่อย (Micro-worksheets)",
          classroom: "ม.6/1",
          problems: "นักเรียนกลุ่มหลังห้อง (มีระดับความเสี่ยง SDQ สูง มีความพร้อมครอบครัวต่ำ) มักไม่ส่งงานวิจัย/ใบงาน เนื่องจากเนื้อหางานยาวและกว้างเกินไป ขาดแรงจูงใจ",
          methodology: "1. คัดกรองและแบ่งคู่หูกลุ่มเก่ง-กลุ่มเสี่ยงประคบ\n2. ปรับใบงานแบบเดิมเป็น Micro-worksheets มีส่วนประกอบเพียง 3 ข้อสั้นๆ ให้เสร็จในคาบเรียน\n3. ทำวิจัยติดตามผล 4 สัปดาห์",
          results: "อัตราการส่งงานเพิ่มขึ้นจากเดิม 60% เป็น 95% นักเรียนกลุ่มช่วยเหลือผ่านเกณฑ์การประเมินทักษะภาษาขั้นต่ำทุกคน",
          recommendations: "สมควรขยายผลการใช้ Micro-worksheets ไปยังกลุ่มวิชาคณิตศาสตร์และภาษาอังกฤษที่มีนักเรียนค้างส่งงานสูง",
          subject: { code: "ท31101", name: "ภาษาไทยพื้นฐาน" }
        }
      ] as any;
    }

    // 3. Compile Markdown Document
    let md = `# [SchoolOS v2.0] ข้อมูลโครงสร้างชั้นเรียน ${classroom} สำหรับวิเคราะห์ใน NotebookLM\n`;
    md += `**วันที่ส่งออก:** ${new Date().toLocaleDateString("th-TH")} | **เวลา:** ${new Date().toLocaleTimeString("th-TH")}\n`;
    md += `**ระบบอ้างอิง:** SchoolOS Data Link (Prisma + Supabase Postgres Database Concept)\n`;
    md += `**คำนำ:** รายงานฉบับนี้รวบรวมข้อมูลแบบ 360 องศาเพื่อใช้เป็นฐานข้อมูลในการให้ AI เช่น NotebookLM ช่วยประมวลผล วางแผน และวิเคราะห์แนวทางการดูแลช่วยเหลือนักเรียน\n\n`;

    md += `---\n\n`;
    md += `## 1. ข้อมูลสรุปเชิงสถิติภาพรวมห้องเรียน (Classroom Statistics Overview)\n\n`;
    md += `- **ชั้นเรียนที่วิเคราะห์:** ${classroom}\n`;
    md += `- **จำนวนนักเรียนทั้งหมด:** ${finalStudents.length} คน\n`;
    
    const males = finalStudents.filter(s => s.gender === "ชาย").length;
    const females = finalStudents.filter(s => s.gender === "หญิง").length;
    md += `- **สัดส่วนเพศ:** ชาย ${males} คน | หญิง ${females} คน\n`;

    const riskCount = finalStudents.filter(s => s.status === "เสี่ยง" || s.sdqRisk === "เสี่ยง" || s.sdqRisk === "มีปัญหา").length;
    const helpCount = finalStudents.filter(s => s.status === "ช่วยเหลือเร่งด่วน" || s.sdqRisk === "มีปัญหา").length;
    md += `- **สถิติด้านพฤติกรรมและความเสี่ยง:**\n`;
    md += `  * นักเรียนกลุ่มเสี่ยง (SdqRisk / Status: เสี่ยง): ${riskCount} คน\n`;
    md += `  * นักเรียนกลุ่มช่วยเหลือเร่งด่วน (Status: ช่วยเหลือเร่งด่วน): ${helpCount} คน\n`;
    
    const eefCount = finalStudents.filter(s => s.homeVisit?.eefStatus === "ELIGIBLE").length;
    md += `  * นักเรียนที่เข้าเกณฑ์ กสศ. นร.01 (ทุนยากจนพิเศษ): ${eefCount} คน\n\n`;

    md += `---\n\n`;
    md += `## 2. ทะเบียนรายชื่อและผลการคัดกรองนักเรียนรายบุคคล (Individual Student Screening Profile)\n\n`;
    md += `| เลขที่ | รหัสประจำตัว | ชื่อ-นามสกุล | เพศ | สถานะพฤติกรรม | คะแนนวินัย | ดัชนี BMI (สถานะ) | ประเมินสุขภาพจิต SDQ | สภาพการเยี่ยมบ้าน | รายได้เฉลี่ยครอบครัว |\n`;
    md += `| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

    finalStudents.forEach((s) => {
      const bmiVal = s.bmi ? s.bmi.toFixed(1) : "-";
      const bmiStat = s.bmiStatus || "-";
      const sdqRiskStat = s.sdqRisk || "ปกติ";
      const behaviorPts = s.behaviorPoints ?? 100;
      
      let homeVisitText = "ยังไม่ได้เยี่ยม";
      let incomeText = "ไม่มีข้อมูล";
      if (s.homeVisit) {
        homeVisitText = s.homeVisit.eefStatus === "ELIGIBLE" ? "เยี่ยมแล้ว (กสศ. นร.01)" : "เยี่ยมแล้ว (ปกติ)";
        incomeText = s.homeVisit.familyIncome ? `${s.homeVisit.familyIncome.toLocaleString()} บาท/เดือน` : "ไม่ระบุ";
      }

      md += `| ${s.seatNumber} | ${s.studentCode} | ${s.fullName} (${s.nickname || "-"}) | ${s.gender} | ${s.status} | ${behaviorPts} | ${bmiVal} (${bmiStat}) | ${sdqRiskStat} | ${homeVisitText} | ${incomeText} |\n`;
    });
    md += `\n\n`;

    if (includeScores) {
      md += `---\n\n`;
      md += `## 3. ผลการเรียนและระดับผลการเรียนรายวิชา (Student Academic Achievement)\n\n`;
      md += `ข้อมูลประวัติเกรดและคะแนนสอบสะสมรายบุคคลของภาคเรียนปัจจุบัน:\n\n`;
      finalStudents.forEach((s) => {
        md += `### * [เลขที่ ${s.seatNumber}] ${s.fullName} (${s.studentCode})\n`;
        if (s.subjectScores && s.subjectScores.length > 0) {
          md += `| รหัสวิชา | ชื่อรายวิชา | คะแนนรวมดิบ | เกรดที่ได้ |\n`;
          md += `| :---: | :--- | :---: | :---: |\n`;
          s.subjectScores.forEach((score: any) => {
            md += `| ${score.subject?.code || "-"} | ${score.subject?.name || "-"} | ${score.totalScore ?? "-"} | **${score.grade ?? "-"}** |\n`;
          });
        } else {
          md += `*ไม่มีข้อมูลคะแนน*\n`;
        }
        md += `\n`;
      });
      md += `\n`;
    }

    if (includeBehavior) {
      md += `---\n\n`;
      md += `## 4. บันทึกประวัติพฤติกรรมและการลงบันทึกความประพฤติ (Detailed Behavior Log details)\n\n`;
      md += `บันทึกกิจกรรมความดีและรายการตัดคะแนนความประพฤติโดยครูผู้สอน:\n\n`;
      let behaviorCount = 0;
      finalStudents.forEach((s) => {
        if (s.behaviorLogs && s.behaviorLogs.length > 0) {
          behaviorCount++;
          md += `### * ประวัติพฤติกรรมของ ${s.fullName} (เลขที่ ${s.seatNumber})\n`;
          md += `| วันที่ลงบันทึก | ประเภทการทำรายการ | แต้มคะแนน | รายละเอียดเหตุการณ์ | ผู้แจ้งความประพฤติ |\n`;
          md += `| :---: | :---: | :---: | :--- | :--- |\n`;
          s.behaviorLogs.forEach((b: any) => {
            const dateStr = b.createdAt instanceof Date ? b.createdAt.toISOString().split("T")[0] : String(b.createdAt).substring(0, 10);
            const typeText = b.type === "MERIT" ? "🟢 คะแนนความดี" : "🔴 หักคะแนน";
            md += `| ${dateStr} | ${typeText} | ${b.points} | ${b.description} | ${b.loggedBy} |\n`;
          });
          md += `\n`;
        }
      });
      if (behaviorCount === 0) {
        md += `*ไม่มีรายการประวัติบันทึกพฤติกรรมสะสมในชั้นเรียนนี้*\n\n`;
      }
    }

    if (includeSDQ) {
      md += `---\n\n`;
      md += `## 5. ผลวิเคราะห์เจาะลึกสุขภาพจิตเยาวชน 5 ด้าน (Mental Health & SDQ Subscales Details)\n\n`;
      md += `ผลประเมิน Strengths and Difficulties Questionnaire (SDQ) แยกตามหัวข้อย่อยเพื่อใช้ทำความเข้าใจจุดอ่อนจุดเด่นทางจิตวิทยานักเรียน:\n\n`;
      let sdqCount = 0;
      finalStudents.forEach((s) => {
        if (s.sdqAssessments && s.sdqAssessments.length > 0) {
          sdqCount++;
          md += `### * สถิติสุขภาพจิตของ ${s.fullName} (SDQ สถานะ: ${s.sdqRisk})\n`;
          md += `| ด้านการประเมินสุขภาพจิต | คะแนนดิบของนักเรียน | การตีความประเมินระดับความเสี่ยง |\n`;
          md += `| :--- | :---: | :--- |\n`;
          s.sdqAssessments.forEach((sdq: any) => {
            md += `| 1. ด้านอารมณ์ (Emotional Symptoms Scale) | ${sdq.emotionalScore} | ${sdq.emotionalScore > 5 ? "⚠️ มีปัญหา/เสี่ยง" : "✅ ปกติ"} |\n`;
            md += `| 2. ด้านพฤติกรรมเกเร (Conduct Problems Scale) | ${sdq.conductScore} | ${sdq.conductScore > 3 ? "⚠️ มีปัญหา/เสี่ยง" : "✅ ปกติ"} |\n`;
            md += `| 3. ด้านสมาธิสั้น (Hyperactivity/Inattention) | ${sdq.hyperactivityScore} | ${sdq.hyperactivityScore > 6 ? "⚠️ มีปัญหา/เสี่ยง" : "✅ ปกติ"} |\n`;
            md += `| 4. ด้านความสัมพันธ์กับเพื่อน (Peer Problems Scale) | ${sdq.peerScore} | ${sdq.peerScore > 4 ? "⚠️ มีปัญหา/เสี่ยง" : "✅ ปกติ"} |\n`;
            md += `| 5. ด้านสัมพันธภาพทางสังคม (Prosocial Behavior) | ${sdq.prosocialScore} | ${sdq.prosocialScore < 5 ? "⚠️ ต้องการการพัฒนาอย่างเร่งด่วน" : "✅ ปกติ (เด่นสัมพันธภาพ)"} |\n`;
            md += `| **คะแนนรวมรวมความยากลำบาก (Total Difficulties Score)** | **${sdq.totalScore}** | **ระดับ: ${sdq.riskStatus}** |\n`;
          });
          md += `\n`;
        }
      });
      if (sdqCount === 0) {
        md += `*ไม่มีข้อมูลคะแนนประเมินสุขภาพจิตในระบบคัดกรองปีนี้*\n\n`;
      }
    }

    if (includePlans) {
      md += `---\n\n`;
      md += `## 6. แผนการจัดการเรียนรู้และบันทึกหลังสอนของชั้นเรียน (Classroom Lesson Plans & Post-Teaching Logs)\n\n`;
      md += `ประวัติเอกสารการวางแผนการสอนและแนวทางแก้ไขปัญหาหน้างานของครูผู้รับผิดชอบ:\n\n`;
      finalLessonPlans.forEach((plan: any) => {
        md += `### * แผนการสอนเรื่อง: ${plan.title}\n`;
        md += `- **วิชาที่เปิดสอน:** ${plan.subject?.code} - ${plan.subject?.name}\n`;
        md += `- **เป้าหมาย/จุดประสงค์ (Objectives):** ${plan.objective}\n`;
        md += `- **สาระการเรียนรู้ (Content):** ${plan.content}\n`;
        md += `- **กิจกรรมการสอน (Activities):**\n${plan.activities}\n`;
        md += `- **การวัดผลและประเมิน (Evaluation):** ${plan.evaluation}\n`;
        
        if (plan.postRecords && plan.postRecords.length > 0) {
          md += `- **บันทึกปัญหาหลังสอนและผลตอบรับ:**\n`;
          plan.postRecords.forEach((rec: any, idx: number) => {
            md += `  * *บันทึกครั้งที่ ${idx + 1}:*\n`;
            md += `    - ปัญหาและอุปสรรค: ${rec.problems}\n`;
            md += `    - แนวทางแก้ไขทันที: ${rec.solutions}\n`;
            md += `    - ข้อเสนอแนะเพิ่มเติม: ${rec.suggestions}\n`;
          });
        } else {
          md += `- *ไม่มีการบันทึกปัญหาหลังสอนเข้ามา*\n`;
        }
        md += `\n`;
      });
    }

    if (includeResearch) {
      md += `---\n\n`;
      md += `## 7. งานวิจัยในชั้นเรียนเพื่อแก้ปัญหาการเรียนรู้ (Action Research in Classroom)\n\n`;
      md += `ชุดข้อมูลโครงการวิจัยในชั้นเรียนเพื่อยกระดับพัฒนาการศึกษาห้องเรียนนี้:\n\n`;
      finalResearches.forEach((res: any, idx: number) => {
        md += `### * โครงการวิจัยลำดับที่ ${idx + 1}: ${res.title}\n`;
        md += `- **วิชาที่เกี่ยวข้อง:** ${res.subject?.code} - ${res.subject?.name}\n`;
        md += `- **ห้องเรียนทดลอง:** ${res.classroom}\n`;
        md += `- **ปัญหาและสมมติฐานการวิจัย:** ${res.problems}\n`;
        md += `- **วิธีการดำเนินการและนวัตกรรม:**\n${res.methodology}\n`;
        md += `- **ผลการวิจัย/ประสิทธิผล:** ${res.results}\n`;
        md += `- **ข้อเสนอแนะเพื่อขยายผลต่อ:** ${res.recommendations}\n`;
        md += `\n`;
      });
    }

    md += `---\n\n`;
    md += `**[สิ้นสุดเอกสารรายงานเพื่อการวิเคราะห์ทางวิชาการและกิจการนักเรียน - พัฒนาและออกแบบด้วยมาตรฐานความมั่นคงปลอดภัยข้อมูลประวัตินักเรียน]**\n`;

    return new Response(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="schoolos_notebooklm_export_${classroom}.md"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating NotebookLM Markdown export:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดในการประมวลผลข้อมูลส่งออก" },
      { status: 500 }
    );
  }
}
