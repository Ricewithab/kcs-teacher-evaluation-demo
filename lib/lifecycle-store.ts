import { database } from "@/lib/database";
import { recordAudit } from "@/lib/audit";

export async function submitObservation(evaluationId: string, actorId: string) {
  const before = await database().prepare("SELECT * FROM evaluations WHERE id = ?").bind(evaluationId).first<any>();
  if (!before) throw new Error("Evaluation not found");
  const now = new Date().toISOString();
  await database().prepare(`UPDATE evaluations SET status = 'feedback_due', completed_at = COALESCE(completed_at, ?) WHERE id = ?`)
    .bind(now, evaluationId).run();
  const after = await database().prepare("SELECT * FROM evaluations WHERE id = ?").bind(evaluationId).first<any>();
  await recordAudit(actorId, "evaluation.observation.submitted", "evaluation", evaluationId, before, after);
  return after;
}

export async function markFeedbackSubmitted(evaluationId: string, actorId: string) {
  const before = await database().prepare("SELECT * FROM evaluations WHERE id = ?").bind(evaluationId).first<any>();
  if (!before) throw new Error("Evaluation not found");
  await database().prepare("UPDATE evaluations SET status = 'reflection_due' WHERE id = ?").bind(evaluationId).run();
  const after = await database().prepare("SELECT * FROM evaluations WHERE id = ?").bind(evaluationId).first<any>();
  await recordAudit(actorId, "evaluation.feedback.released", "evaluation", evaluationId, before, after);
  return after;
}

export async function advanceAfterReflection(evaluationId: string, actorId: string) {
  const row = await database().prepare(`SELECT e.*, ef.development_goal_required,
    (SELECT COUNT(*) FROM development_goals g WHERE g.source_evaluation_id = e.id AND g.status = 'active') AS goal_count
    FROM evaluations e JOIN evaluation_frameworks ef ON ef.id = e.framework_id WHERE e.id = ?`)
    .bind(evaluationId).first<any>();
  if (!row) throw new Error("Evaluation not found");
  const nextStatus = Boolean(row.development_goal_required) && Number(row.goal_count ?? 0) === 0 ? "development_due" : "complete";
  await database().prepare("UPDATE evaluations SET status = ? WHERE id = ?").bind(nextStatus, evaluationId).run();
  const after = await database().prepare("SELECT * FROM evaluations WHERE id = ?").bind(evaluationId).first<any>();
  await recordAudit(actorId, "evaluation.reflection.submitted", "evaluation", evaluationId, row, after);
  return after;
}

export async function advanceAfterDevelopmentGoal(evaluationId: string, actorId: string) {
  const row = await database().prepare(`SELECT e.*,
    (SELECT COUNT(*) FROM reflections r WHERE r.evaluation_id = e.id AND r.acknowledged_at IS NOT NULL) AS reflection_count
    FROM evaluations e WHERE e.id = ?`).bind(evaluationId).first<any>();
  if (!row) throw new Error("Evaluation not found");
  if (Number(row.reflection_count ?? 0) === 0) return row;
  await database().prepare("UPDATE evaluations SET status = 'complete' WHERE id = ?").bind(evaluationId).run();
  const after = await database().prepare("SELECT * FROM evaluations WHERE id = ?").bind(evaluationId).first<any>();
  await recordAudit(actorId, "evaluation.development_goal.confirmed", "evaluation", evaluationId, row, after);
  return after;
}
