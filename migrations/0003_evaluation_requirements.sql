CREATE TABLE IF NOT EXISTS evaluation_requirements (
  id TEXT PRIMARY KEY NOT NULL,
  framework_id TEXT NOT NULL,
  window_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  sequence_number INTEGER NOT NULL DEFAULT 1,
  due_on TEXT NOT NULL,
  evaluation_id TEXT,
  status TEXT NOT NULL DEFAULT 'required',
  waived_at TEXT,
  waived_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_requirement_unique_slot
  ON evaluation_requirements(framework_id, window_id, teacher_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_requirements_teacher ON evaluation_requirements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_requirements_framework ON evaluation_requirements(framework_id);
CREATE INDEX IF NOT EXISTS idx_requirements_window ON evaluation_requirements(window_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_requirements_evaluation
  ON evaluation_requirements(evaluation_id) WHERE evaluation_id IS NOT NULL;
