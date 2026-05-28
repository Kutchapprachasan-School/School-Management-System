import { pgTable, uuid, varchar, timestamp, boolean, integer, date, numeric, text, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. CORE SYSTEM & MULTI-TENANCY CONFIG
// ==========================================

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  province: varchar("province", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").references(() => schools.id),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  status: varchar("status", { length: 50 }).default("active").notNull(), // active, suspended, pending
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).unique().notNull(), // super_admin, teacher, parent, etc.
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
});

export const userRoles = pgTable("user_roles", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.roleId] })
]);

// ==========================================
// 2. ACADEMIC CALENDAR & BASE STRUCTURES
// ==========================================

export const academicYears = pgTable("academic_years", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").references(() => schools.id).notNull(),
  yearName: varchar("year_name", { length: 50 }).notNull(), // e.g. "2569"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const semesters = pgTable("semesters", {
  id: uuid("id").primaryKey().defaultRandom(),
  academicYearId: uuid("academic_year_id").references(() => academicYears.id, { onDelete: "cascade" }).notNull(),
  semesterName: varchar("semester_name", { length: 50 }).notNull(), // e.g. "ภาคเรียนที่ 1"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").references(() => schools.id).notNull(),
  academicYearId: uuid("academic_year_id").references(() => academicYears.id).notNull(),
  homeroomTeacherId: uuid("homeroom_teacher_id"), // references teachers.id (defined below)
  className: varchar("class_name", { length: 100 }).notNull(), // e.g. "ม.6/1"
  roomNumber: varchar("room_number", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 3. STUDENT & PARENT REGISTER MODULE
// ==========================================

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").references(() => schools.id).notNull(),
  studentCode: varchar("student_code", { length: 50 }).unique().notNull(),
  nationalId: varchar("national_id", { length: 13 }),
  prefix: varchar("prefix", { length: 20 }), // นาย, นางสาว
  fullName: varchar("full_name", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 100 }),
  birthDate: date("birth_date"),
  gender: varchar("gender", { length: 10 }).notNull(), // ชาย, หญิง
  status: varchar("status", { length: 50 }).default("ปกติ").notNull(), // ปกติ, เสี่ยง, ช่วยเหลือเร่งด่วน
  behaviorPoints: integer("behavior_points").default(100).notNull(),
  currentClassId: uuid("current_class_id").references(() => classes.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const parents = pgTable("parents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  lineUserId: varchar("line_user_id", { length: 255 }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  relationship: varchar("relationship", { length: 100 }).notNull(), // บิดา, มารดา, ผู้ปกครอง
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentParents = pgTable("student_parents", {
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  parentId: uuid("parent_id").references(() => parents.id, { onDelete: "cascade" }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.studentId, table.parentId] })
]);

// ==========================================
// 4. TEACHER & ACADEMIC tracking MODULES
// ==========================================

export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  employeeCode: varchar("employee_code", { length: 50 }).unique().notNull(),
  position: varchar("position", { length: 100 }), // ครูชำนาญการ, ครู ค.ศ. 1
  licenseNumber: varchar("license_number", { length: 13 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").references(() => schools.id).notNull(),
  subjectCode: varchar("subject_code", { length: 50 }).notNull(), // ท33101
  subjectName: varchar("subject_name", { length: 255 }).notNull(), // ภาษาไทยพื้นฐาน
  credits: numeric("credits", { precision: 3, scale: 1 }).notNull(), // 1.5
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classSubjects = pgTable("class_subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => classes.id, { onDelete: "cascade" }).notNull(),
  subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "cascade" }).notNull(),
  teacherId: uuid("teacher_id").references(() => teachers.id).notNull(),
  semesterId: uuid("semester_id").references(() => semesters.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").references(() => schools.id).notNull(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  semesterId: uuid("semester_id").references(() => semesters.id).notNull(),
  recordDate: date("record_date").notNull(),
  statusCode: varchar("status_code", { length: 50 }).notNull(), // present, absent, late, leave, sick
  remarks: text("remarks"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const grades = pgTable("grades", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").references(() => schools.id).notNull(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  classSubjectId: uuid("class_subject_id").references(() => classSubjects.id, { onDelete: "cascade" }).notNull(),
  semesterId: uuid("semester_id").references(() => semesters.id).notNull(),
  midtermScore: numeric("midterm_score", { precision: 5, scale: 2 }).default("0"),
  finalScore: numeric("final_score", { precision: 5, scale: 2 }).default("0"),
  totalScore: numeric("total_score", { precision: 5, scale: 2 }).default("0"),
  gradeValue: numeric("grade_value", { precision: 3, scale: 2 }), // 4.00, 3.50
  sgsSyncStatus: varchar("sgs_sync_status", { length: 50 }).default("pending").notNull(), // pending, synced, error
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 5. LEAVE SYSTEM & WORKFLOW ENGINE
// ==========================================

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").references(() => schools.id).notNull(),
  requesterId: uuid("requester_id").references(() => users.id).notNull(),
  leaveType: varchar("leave_type", { length: 100 }).notNull(), // ลากิจ, ลาป่วย
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 50 }).default("PENDING").notNull(), // DRAFT, PENDING, APPROVED, REJECTED
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workflowSteps = pgTable("workflow_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  leaveRequestId: uuid("leave_request_id").references(() => leaveRequests.id, { onDelete: "cascade" }).notNull(),
  stepNumber: integer("step_number").notNull(),
  approverRole: varchar("approver_role", { length: 100 }).notNull(), // Supervisor, Deputy Director, Director
  deciderId: uuid("decider_id").references(() => users.id),
  decision: varchar("decision", { length: 50 }).default("PENDING").notNull(), // PENDING, APPROVED, REJECTED, RETURNED
  decidedAt: timestamp("decided_at"),
  comments: text("comments"),
});

// ==========================================
// 6. HEALTH CENTER, TIMELINE & AUDITING
// ==========================================

export const healthVisits = pgTable("health_visits", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").references(() => schools.id).notNull(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  semesterId: uuid("semester_id").references(() => semesters.id).notNull(),
  symptoms: text("symptoms").notNull(),
  medicineUsed: varchar("medicine_used", { length: 255 }),
  actionTaken: text("action_taken"),
  visitTime: timestamp("visit_time").defaultNow().notNull(),
});

export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // attendance, behavior, academic, health, request, home_visit
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(), // CREATE_STUDENT, UPDATE_GRADE, etc.
  module: varchar("module", { length: 100 }).notNull(),
  details: text("details").notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 7. DRIZZLE RELATIONS (PRE-JOIN DEFINITIONS)
// ==========================================

export const usersRelations = relations(users, ({ many, one }) => ({
  userRoles: many(userRoles),
  school: one(schools, { fields: [users.schoolId], references: [schools.id] }),
  auditLogs: many(auditLogs),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  classroom: one(classes, { fields: [students.currentClassId], references: [classes.id] }),
  studentParents: many(studentParents),
  attendanceRecords: many(attendanceRecords),
  grades: many(grades),
  healthVisits: many(healthVisits),
  timelineEvents: many(timelineEvents),
}));

export const classesRelations = relations(classes, ({ many, one }) => ({
  students: many(students),
  classSubjects: many(classSubjects),
  homeroomTeacher: one(teachers, { fields: [classes.homeroomTeacherId], references: [teachers.id] }),
}));
