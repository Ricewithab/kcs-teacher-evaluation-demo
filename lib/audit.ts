import { database } from "@/lib/database";

export async function recordAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  before: unknown = null,
  after: unknown = null,
) {
  await database().prepare(`INSERT INTO audit_log
    (id, actor_id, action, entity_type, entity_id, before_json, after_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      crypto.randomUUID(),
      actorId,
      action,
      entityType,
      entityId,
      before == null ? null : JSON.stringify(before),
      after == null ? null : JSON.stringify(after),
      new Date().toISOString(),
    )
    .run();
}
