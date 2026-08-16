CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  division TEXT NOT NULL,
  department TEXT NOT NULL,
  system_role TEXT NOT NULL,
  evaluation_eligible INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS reporting_lines (
  id TEXT PRIMARY KEY NOT NULL,
  staff_id TEXT NOT NULL,
  manager_id TEXT,
  relationship TEXT NOT NULL DEFAULT 'primary'
);

CREATE TABLE IF NOT EXISTS evaluation_frameworks (
  id TEXT PRIMARY KEY NOT NULL,
  academic_year TEXT NOT NULL,
  observations_required INTEGER NOT NULL DEFAULT 3,
  lesson_plan_required INTEGER NOT NULL DEFAULT 1,
  feedback_due_days INTEGER NOT NULL DEFAULT 3,
  reflection_due_days INTEGER NOT NULL DEFAULT 5,
  development_goal_required INTEGER NOT NULL DEFAULT 1,
  follow_up_required INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS evaluation_windows (
  id TEXT PRIMARY KEY NOT NULL,
  framework_id TEXT NOT NULL,
  label TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  required_count INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY NOT NULL,
  teacher_id TEXT NOT NULL,
  evaluator_id TEXT NOT NULL,
  framework_id TEXT NOT NULL,
  window_id TEXT,
  scheduled_at TEXT,
  class_name TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'required',
  ratings_json TEXT,
  evidence_json TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS lesson_plans (
  id TEXT PRIMARY KEY NOT NULL,
  teacher_id TEXT NOT NULL,
  evaluation_id TEXT,
  subject TEXT NOT NULL,
  class_name TEXT NOT NULL,
  lesson_title TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY NOT NULL,
  evaluation_id TEXT NOT NULL,
  strengths TEXT,
  development_areas TEXT,
  summary TEXT,
  submitted_at TEXT
);

CREATE TABLE IF NOT EXISTS reflections (
  id TEXT PRIMARY KEY NOT NULL,
  evaluation_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  reflection TEXT,
  next_steps TEXT,
  acknowledged_at TEXT
);

CREATE TABLE IF NOT EXISTS development_goals (
  id TEXT PRIMARY KEY NOT NULL,
  teacher_id TEXT NOT NULL,
  source_evaluation_id TEXT,
  title TEXT NOT NULL,
  action TEXT NOT NULL,
  review_on TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reporting_lines_staff ON reporting_lines(staff_id);
CREATE INDEX IF NOT EXISTS idx_reporting_lines_manager ON reporting_lines(manager_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_teacher ON evaluations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_framework ON evaluations(framework_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher ON lesson_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_evaluation ON lesson_plans(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_evaluation ON feedback(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_reflections_evaluation ON reflections(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_development_goals_teacher ON development_goals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
