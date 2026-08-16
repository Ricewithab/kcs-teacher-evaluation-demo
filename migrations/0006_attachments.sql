CREATE TABLE IF NOT EXISTS evaluation_attachments (
  id TEXT PRIMARY KEY NOT NULL,
  evaluation_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  category TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_evaluation ON evaluation_attachments(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_attachments_owner ON evaluation_attachments(owner_id);
