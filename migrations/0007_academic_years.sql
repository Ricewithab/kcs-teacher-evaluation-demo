ALTER TABLE evaluation_frameworks ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0;
ALTER TABLE evaluation_frameworks ADD COLUMN created_at TEXT;
ALTER TABLE evaluation_frameworks ADD COLUMN archived_at TEXT;

UPDATE evaluation_frameworks
SET is_active = CASE WHEN id = 'framework-2026-27' THEN 1 ELSE 0 END,
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS idx_evaluation_frameworks_active ON evaluation_frameworks(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_evaluation_framework
  ON evaluation_frameworks(is_active) WHERE is_active = 1;
