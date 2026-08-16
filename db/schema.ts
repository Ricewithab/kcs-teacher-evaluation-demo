import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const staff = sqliteTable("staff", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull(),
  division: text("division").notNull(),
  department: text("department").notNull(),
  systemRole: text("system_role").notNull(),
  evaluationEligible: integer("evaluation_eligible", { mode: "boolean" }).notNull().default(true),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const reportingLines = sqliteTable("reporting_lines", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull(),
  managerId: text("manager_id"),
  relationship: text("relationship").notNull().default("primary"),
});

export const evaluationFrameworks = sqliteTable("evaluation_frameworks", {
  id: text("id").primaryKey(),
  academicYear: text("academic_year").notNull(),
  observationsRequired: integer("observations_required").notNull().default(3),
  lessonPlanRequired: integer("lesson_plan_required", { mode: "boolean" }).notNull().default(true),
  feedbackDueDays: integer("feedback_due_days").notNull().default(3),
  reflectionDueDays: integer("reflection_due_days").notNull().default(5),
  developmentGoalRequired: integer("development_goal_required", { mode: "boolean" }).notNull().default(true),
  followUpRequired: integer("follow_up_required", { mode: "boolean" }).notNull().default(true),
});

export const evaluationWindows = sqliteTable("evaluation_windows", {
  id: text("id").primaryKey(),
  frameworkId: text("framework_id").notNull(),
  label: text("label").notNull(),
  startsOn: text("starts_on").notNull(),
  endsOn: text("ends_on").notNull(),
  requiredCount: integer("required_count").notNull().default(1),
});

export const evaluations = sqliteTable("evaluations", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull(),
  evaluatorId: text("evaluator_id").notNull(),
  frameworkId: text("framework_id").notNull(),
  windowId: text("window_id"),
  scheduledAt: text("scheduled_at"),
  className: text("class_name"),
  subject: text("subject"),
  status: text("status").notNull().default("required"),
  ratingsJson: text("ratings_json"),
  evidenceJson: text("evidence_json"),
  completedAt: text("completed_at"),
});

export const lessonPlans = sqliteTable("lesson_plans", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull(),
  evaluationId: text("evaluation_id"),
  subject: text("subject").notNull(),
  className: text("class_name").notNull(),
  lessonTitle: text("lesson_title").notNull(),
  payloadJson: text("payload_json").notNull(),
  status: text("status").notNull().default("draft"),
  updatedAt: text("updated_at").notNull(),
});

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey(),
  evaluationId: text("evaluation_id").notNull(),
  strengths: text("strengths"),
  developmentAreas: text("development_areas"),
  summary: text("summary"),
  submittedAt: text("submitted_at"),
});

export const reflections = sqliteTable("reflections", {
  id: text("id").primaryKey(),
  evaluationId: text("evaluation_id").notNull(),
  teacherId: text("teacher_id").notNull(),
  reflection: text("reflection"),
  nextSteps: text("next_steps"),
  acknowledgedAt: text("acknowledged_at"),
});

export const developmentGoals = sqliteTable("development_goals", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull(),
  sourceEvaluationId: text("source_evaluation_id"),
  title: text("title").notNull(),
  action: text("action").notNull(),
  reviewOn: text("review_on"),
  status: text("status").notNull().default("active"),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  beforeJson: text("before_json"),
  afterJson: text("after_json"),
  createdAt: text("created_at").notNull(),
});
