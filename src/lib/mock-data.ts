import { Student, Teacher, LeaveRequest, HealthVisit, TimelineEvent, NotificationItem, AuditLogItem } from "@/types/school-os";

export const initialStudents: Student[] = [
  {
    id: "std-1",
    studentCode: "10001",
    fullName: "นายธนพล รักเรียน",
    nickname: "พีท",
    classroom: "ม.6/1",
    seatNumber: 1,
    gender: "ชาย",
    status: "ปกติ",
    attendanceToday: "present",
    behaviorPoints: 100,
    sdqScore: 12,
    sdqRisk: "ปกติ",
    bmi: 21.5,
    bmiStatus: "สมส่วน",
    parentName: "นายสมชาย รักเรียน",
    parentPhone: "081-234-5678",
    homeVisited: true
  },
  {
    id: "std-2",
    studentCode: "10002",
    fullName: "นางสาวกานต์ชนก สุขใจ",
    nickname: "กิ๊ฟ",
    classroom: "ม.6/1",
    seatNumber: 2,
    gender: "หญิง",
    status: "เสี่ยง",
    attendanceToday: "present",
    behaviorPoints: 75,
    sdqScore: 19,
    sdqRisk: "เสี่ยง",
    bmi: 25.8,
    bmiStatus: "เริ่มอ้วน",
    parentName: "นางนงลักษณ์ สุขใจ",
    parentPhone: "082-345-6789",
    homeVisited: true
  },
  {
    id: "std-3",
    studentCode: "10003",
    fullName: "นายปฏิพล ดวงดี",
    nickname: "นิว",
    classroom: "ม.6/1",
    seatNumber: 3,
    gender: "ชาย",
    status: "ช่วยเหลือเร่งด่วน",
    attendanceToday: "absent",
    behaviorPoints: 40,
    sdqScore: 23,
    sdqRisk: "มีปัญหา",
    bmi: 17.1,
    bmiStatus: "ผอม",
    parentName: "นายพิชัย ดวงดี",
    parentPhone: "083-456-7890",
    homeVisited: false
  },
  {
    id: "std-4",
    studentCode: "10004",
    fullName: "นางสาวศิริพร งามเลิศ",
    nickname: "ฟิล์ม",
    classroom: "ม.6/1",
    seatNumber: 4,
    gender: "หญิง",
    status: "ปกติ",
    attendanceToday: "late",
    behaviorPoints: 95,
    sdqScore: 8,
    sdqRisk: "ปกติ",
    bmi: 20.2,
    bmiStatus: "สมส่วน",
    parentName: "นางสมพร งามเลิศ",
    parentPhone: "084-567-8901",
    homeVisited: true
  },
  {
    id: "std-5",
    studentCode: "10005",
    fullName: "นายอภิวัฒน์ แสนดี",
    nickname: "บาส",
    classroom: "ม.6/1",
    seatNumber: 5,
    gender: "ชาย",
    status: "เสี่ยง",
    attendanceToday: "leave",
    behaviorPoints: 80,
    sdqScore: 17,
    sdqRisk: "เสี่ยง",
    bmi: 29.4,
    bmiStatus: "อ้วน",
    parentName: "นายประเสริฐ แสนดี",
    parentPhone: "085-678-9012",
    homeVisited: false
  },
  {
    id: "std-6",
    studentCode: "10006",
    fullName: "นางสาวมินตรา แก้วมณี",
    nickname: "มิ้น",
    classroom: "ม.5/2",
    seatNumber: 12,
    gender: "หญิง",
    status: "ปกติ",
    attendanceToday: "present",
    behaviorPoints: 100,
    sdqScore: 5,
    sdqRisk: "ปกติ",
    bmi: 19.8,
    bmiStatus: "สมส่วน",
    parentName: "นายมงคล แก้วมณี",
    parentPhone: "086-789-0123",
    homeVisited: true
  },
  {
    id: "std-7",
    studentCode: "10007",
    fullName: "นายจิรายุ ทองแท้",
    nickname: "เจมส์",
    classroom: "ม.4/3",
    seatNumber: 24,
    gender: "ชาย",
    status: "ปกติ",
    attendanceToday: "present",
    behaviorPoints: 90,
    sdqScore: 10,
    sdqRisk: "ปกติ",
    bmi: 22.1,
    bmiStatus: "สมส่วน",
    parentName: "นางวรรณา ทองแท้",
    parentPhone: "087-890-1234",
    homeVisited: false
  }
];

export const initialTeachers: Teacher[] = [
  {
    id: "tch-1",
    employeeCode: "T2001",
    fullName: "ครูอัญชลี รัตนโกสินทร์",
    position: "ครูชำนาญการพิเศษ",
    department: "ภาษาไทย",
    licenseNumber: "6210900012345",
    licenseExpiry: "2572-04-12",
    dutyDay: "วันจันทร์"
  },
  {
    id: "tch-2",
    employeeCode: "T2002",
    fullName: "ครูวิทยาศาสตร์ มุ่งมั่น",
    position: "ครู ค.ศ. 1",
    department: "วิทยาศาสตร์และเทคโนโลยี",
    licenseNumber: "6420900054321",
    licenseExpiry: "2574-08-25",
    dutyDay: "วันอังคาร"
  },
  {
    id: "tch-3",
    employeeCode: "T2003",
    fullName: "ครูสมเกียรติ กีฬาดี",
    position: "ครูอัตราจ้าง",
    department: "สุขศึกษาและพลศึกษา",
    licenseNumber: "6610900098765",
    licenseExpiry: "2571-12-05",
    dutyDay: "วันพฤหัสบดี"
  }
];

export const initialLeaveRequests: LeaveRequest[] = [
  {
    id: "req-1",
    requesterName: "ครูอัญชลี รัตนโกสินทร์",
    requesterRole: "ครูผู้สอน",
    leaveType: "ลากิจส่วนตัว",
    reason: "เข้าร่วมพิธีพระราชทานปริญญาบัตรของบุตรชาย",
    startDate: "2026-05-21",
    endDate: "2026-05-22",
    status: "PENDING",
    workflowSteps: [
      { step: 1, approver: "หัวหน้ากลุ่มสาระฯ", role: "Head of Dept", decision: "APPROVED", decidedAt: "2026-05-20 08:30" },
      { step: 2, approver: "รองผู้อำนวยการกลุ่มงานบริหารบุคคล", role: "Deputy Director", decision: "PENDING" },
      { step: 3, approver: "ผู้อำนวยการโรงเรียน", role: "Director", decision: "PENDING" }
    ]
  },
  {
    id: "req-2",
    requesterName: "นายสมชาย กุลสตรี (ภารโรง)",
    requesterRole: "บุคลากรสนับสนุน",
    leaveType: "ลาป่วย",
    reason: "มีอาการไข้หวัดใหญ่ แพทย์สั่งหยุดพักผ่อน",
    startDate: "2026-05-20",
    endDate: "2026-05-20",
    status: "APPROVED",
    workflowSteps: [
      { step: 1, approver: "หัวหน้าฝ่ายอาคารสถานที่", role: "Supervisor", decision: "APPROVED", decidedAt: "2026-05-20 07:15" },
      { step: 2, approver: "ผู้อำนวยการโรงเรียน", role: "Director", decision: "APPROVED", decidedAt: "2026-05-20 07:45" }
    ]
  }
];

export const initialHealthVisits: HealthVisit[] = [
  {
    id: "h-1",
    studentName: "นายปฏิพล ดวงดี",
    classroom: "ม.6/1",
    symptoms: "มีไข้ ตัวร้อน คลื่นไส้อาเจียน",
    medicineUsed: "พาราเซตามอล 500 มก. 1 เม็ด",
    actionTaken: "ให้นอนพักที่ห้องพยาบาล 1 คาบและโทรแจ้งผู้ปกครองให้มารับตัวกลับบ้าน",
    visitTime: "2026-05-20 09:15"
  },
  {
    id: "h-2",
    studentName: "นางสาวกานต์ชนก สุขใจ",
    classroom: "ม.6/1",
    symptoms: "ปวดหัว ปวดตา เพลียแดด",
    medicineUsed: "ยาแก้ปวด และทายาหม่อง",
    actionTaken: "ให้นอนพักสายตา 30 นาที แล้วกลับเข้าเรียนคาบถัดไป",
    visitTime: "2026-05-20 10:40"
  }
];

export const initialTimelineEvents: TimelineEvent[] = [
  {
    id: "t-1",
    date: "2026-05-20",
    title: "บันทึกการเช็คชื่อเข้าแถว",
    description: "ขาดเรียน (ไม่มีใบลา)",
    category: "attendance",
    icon: "CalendarX",
    actor: "ระบบอัตโนมัติ"
  },
  {
    id: "t-2",
    date: "2026-05-19",
    title: "หักคะแนนความประพฤติ",
    description: "แต่งกายผิดระเบียบโรงเรียน (หัก 5 คะแนน)",
    category: "behavior",
    icon: "ShieldAlert",
    actor: "ครูสมเกียรติ กีฬาดี"
  },
  {
    id: "t-3",
    date: "2026-05-18",
    title: "การเยี่ยมบ้านนักเรียน",
    description: "เยี่ยมบ้านสำเร็จ พบผู้ปกครองและบันทึกประวัติแวดล้อมทางครอบครัวเรียบร้อย",
    category: "home_visit",
    icon: "Home",
    actor: "ครูอัญชลี รัตนโกสินทร์"
  },
  {
    id: "t-4",
    date: "2026-05-15",
    title: "ทำแบบประเมินสุขภาพจิต SDQ",
    description: "ประเมินเสร็จสิ้น ผลลัพธ์: 'กลุ่มเสี่ยงด้านอารมณ์'",
    category: "health",
    icon: "HeartPulse",
    actor: "ครูแนะแนว"
  },
  {
    id: "t-5",
    date: "2026-05-12",
    title: "สอบกลางภาควิชาคณิตศาสตร์",
    description: "ผลคะแนนสอบ 18/20 คะแนน (อยู่ในเกณฑ์ดีมาก)",
    category: "academic",
    icon: "GraduationCap",
    actor: "ครูสมชาย สอนดี"
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: "n-1",
    title: "นักเรียนขาดเรียน เกิน 3 วัน",
    message: "นายปฏิพล ดวงดี (ม.6/1) ขาดเรียนติดต่อกัน 3 วันแล้ว ระบบได้แจ้งเตือนผู้ปกครองทาง LINE อัตโนมัติ",
    channel: "both",
    isRead: false,
    createdAt: "2026-05-20 07:30"
  },
  {
    id: "n-2",
    title: "คำขออนุมัติค้างพิจารณา",
    message: "ใบลาของ ครูอัญชลี รัตนโกสินทร์ กำลังรอการอนุมัติขั้นที่ 2 จากท่าน",
    channel: "app",
    isRead: false,
    createdAt: "2026-05-20 08:35"
  },
  {
    id: "n-3",
    title: "ระบบบันทึกความปลอดภัย",
    message: "ส่งออกผลคะแนนเฉลี่ยสะสม GPA ภาคเรียนที่ 2/2568 สำเร็จ",
    channel: "app",
    isRead: true,
    createdAt: "2026-05-19 16:30"
  }
];

export const initialAuditLogs: AuditLogItem[] = [
  {
    id: "l-1",
    actor: "ครูวิทยาศาสตร์ มุ่งมั่น",
    action: "UPDATE",
    module: "Academic Setup",
    details: "แก้ไขตารางสอนวิชาวิทยาศาสตร์ ชั้น ม.6/1 คาบที่ 3",
    timestamp: "2026-05-20 09:24:12"
  },
  {
    id: "l-2",
    actor: "ผู้อำนวยการโรงเรียน",
    action: "APPROVE",
    module: "Operations (Leave)",
    details: "อนุมัติใบลาป่วย ของ นายสมชาย กุลสตรี",
    timestamp: "2026-05-20 07:45:22"
  },
  {
    id: "l-3",
    actor: "ระบบอัตโนมัติ (Rule Engine)",
    action: "TRIGGER_ACTION",
    module: "Notification Manager",
    details: "นักเรียน ม.6/1 ขาดเรียนสะสม 3 วัน -> ส่งข้อความเตือนผู้ปกครองทาง LINE",
    timestamp: "2026-05-20 07:30:01"
  }
];
