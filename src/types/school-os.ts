export type UserRole = 
  | "super_admin" 
  | "school_admin" 
  | "director" 
  | "vice_director" 
  | "department_head" 
  | "homeroom_teacher" 
  | "teacher" 
  | "nurse" 
  | "librarian" 
  | "student" 
  | "parent"
  | "admin";

export type PermissionScope = "self" | "classroom" | "department" | "school";

export type WorkflowStatus = 
  | "DRAFT" 
  | "PENDING" 
  | "APPROVED" 
  | "REJECTED" 
  | "RETURNED" 
  | "CANCELLED" 
  | "COMPLETED";

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  nickname?: string;
  classroom: string;
  seatNumber: number;
  gender: "ชาย" | "หญิง";
  status: "ปกติ" | "เสี่ยง" | "ช่วยเหลือเร่งด่วน";
  attendanceToday?: "present" | "absent" | "late" | "leave" | "sick";
  behaviorPoints: number;
  sdqScore: number;
  sdqRisk: "ปกติ" | "เสี่ยง" | "มีปัญหา";
  bmi: number;
  bmiStatus: string;
  parentName: string;
  parentPhone: string;
  homeVisited: boolean;
  profileImage?: string;
  profile?: any;
}

export interface Teacher {
  id: string;
  employeeCode: string;
  fullName: string;
  position: string;
  department: string;
  licenseNumber: string;
  licenseExpiry: string;
  dutyDay: string;
}

export interface LeaveRequest {
  id: string;
  requesterName: string;
  requesterRole: string;
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: WorkflowStatus;
  workflowSteps: {
    step: number;
    approver: string;
    role: string;
    decision: "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";
    decidedAt?: string;
    comments?: string;
  }[];
}

export interface HealthVisit {
  id: string;
  studentName: string;
  classroom: string;
  symptoms: string;
  medicineUsed: string;
  actionTaken: string;
  visitTime: string;
  temperature?: number;
}

export interface TimelineEvent {
  id: string;
  studentId?: string;
  date: string;
  title: string;
  description: string;
  category: "attendance" | "behavior" | "academic" | "health" | "request" | "home_visit";
  icon: string;
  actor: string;
  actorRole?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  channel: "app" | "line" | "both";
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  actor: string;
  action: string;
  module: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  details: string;
  timestamp: string;
}
