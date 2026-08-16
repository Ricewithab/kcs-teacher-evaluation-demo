ALTER TABLE development_goals ADD COLUMN support_required TEXT;

CREATE TABLE IF NOT EXISTS development_goal_reviews (
  id TEXT PRIMARY KEY NOT NULL,
  goal_id TEXT NOT NULL,
  evaluation_id TEXT,
  reviewer_id TEXT NOT NULL,
  evidence TEXT NOT NULL,
  notes TEXT,
  outcome TEXT NOT NULL,
  reviewed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goal_reviews_goal ON development_goal_reviews(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_reviews_evaluation ON development_goal_reviews(evaluation_id);
