import type { SessionIdentity } from "@/lib/auth-types";
import { recordAudit } from "@/lib/audit";
import { database } from "@/lib/database";
import { visibleStaffIds } from "@/lib/permissions";

const chunk = <T,>(items: T[], size: number) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));

async function runBatches(statements: any[]) {
  for (const group of chunk(statements, 50)) if (group.length) await database().batch(group);
}

function stableRequirementId(frameworkId: string, windowId: string, teacherId: string, sequence: number) {
  return `req-${frameworkId}-${windowId}-${teacherId}-${sequence}`.replace(/[^A-Za-z0-9_-]/g, "-");
}

export async function syncEvaluationRequirements(frameworkId: string, actorId: string) {
  const d1 = database();
  const [windowsResult, staffResult] = await Promise.all([
    d1.prepare("SELECT id, starts_on, ends_on, required_count FROM evaluation_windows WHERE framework_id = ? ORDER BY starts_on").bind(frameworkId).all<any>(),
    d1.prepare("SELECT id FROM staff WHERE evaluation_eligible = 1 AND active = 1 ORDER BY id").all<{ id: string }>(),
  ]);
  const windows = windowsResult.results ?? [];
  const staff = staffResult.results ?? [];
  if (!windows.length) throw new Error("Configure at least one evaluation window before generating requirements");

  const expected = new Set<string>();
  const now = new Date().toISOString();
  const statements: any[] = [];
  for (const teacher of staff) {
    for (const window of windows) {
      const count = Math.max(1, Number(window.required_count ?? 1));
      for (let sequence = 1; sequence <= count; sequence += 1) {
        const id = stableRequirementId(frameworkId, String(window.id), teacher.id, sequence);
        expected.add(id);
        statements.push(d1.prepare(`INSERT INTO evaluation_requirements
          (id, framework_id, window_id, teacher_id, sequence_number, due_on, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'required', ?, ?)
          ON CONFLICT(id) DO UPDATE SET due_on = excluded.due_on, updated_at = excluded.updated_at`)
          .bind(id, frameworkId, window.id, teacher.id, sequence, window.ends_on, now, now));
      }
    }
  }
  await runBatches(statements);

  const existing = await d1.prepare("SELECT id, evaluation_id FROM evaluation_requirements WHERE framework_id = ?").bind(frameworkId).all<any>();
  const removable = (existing.results ?? []).filter((row: any) => !expected.has(String(row.id)) && !row.evaluation_id);
  await runBatches(removable.map((row: any) => d1.prepare("DELETE FROM evaluation_requirements WHERE id = ?").bind(row.id)));

  const unlinkedEvaluations = await d1.prepare(`SELECT e.id, e.teacher_id, e.window_id
    FROM evaluations e
    LEFT JOIN evaluation_requirements r ON r.evaluation_id = e.id
    WHERE e.framework_id = ? AND r.id IS NULL AND e.window_id IS NOT NULL
    ORDER BY e.scheduled_at`).bind(frameworkId).all<any>();
  let linked = 0;
  for (const evaluation of unlinkedEvaluations.results ?? []) {
    const requirement = await d1.prepare(`SELECT id FROM evaluation_requirements
      WHERE framework_id = ? AND window_id = ? AND teacher_id = ? AND evaluation_id IS NULL AND waived_at IS NULL
      ORDER BY sequence_number LIMIT 1`)
      .bind(frameworkId, evaluation.window_id, evaluation.teacher_id).first<{ id: string }>();
    if (requirement?.id) {
      await d1.prepare("UPDATE evaluation_requirements SET evaluation_id = ?, updated_at = ? WHERE id = ?")
        .bind(evaluation.id, now, requirement.id).run();
      linked += 1;
    }
  }

  const after = await d1.prepare("SELECT COUNT(*) AS count FROM evaluation_requirements WHERE framework_id = ?").bind(frameworkId).first<{ count: number }>();
  await recordAudit(actorId, "evaluation_requirements.synced", "evaluation_framework", frameworkId, null, {
    requirements: Number(after?.count ?? 0),
    eligibleStaff: staff.length,
    linkedEvaluations: linked,
  });
  return { requirements: Number(after?.count ?? 0), eligibleStaff: staff.length, linkedEvaluations: linked };
}

function addWorkingDays(value: string | null, days: number) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  let remaining = Math.max(0, days);
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return date.toISOString();
}

function expired(value: string | null, now: Date) {
  return Boolean(value && new Date(value).getTime() < now.getTime());
}

function deriveStatus(row: any, now: Date) {
  if (row.waived_at) return { status: "waived", dueAt: null, needsAction: false };
  if (!row.evaluation_id) {
    const start = new Date(`${row.starts_on}T00:00:00Z`);
    const due = new Date(`${row.due_on}T23:59:59Z`);
    if (now.getTime() > due.getTime()) return { status: "overdue", dueAt: row.due_on, needsAction: true };
    if (now.getTime() >= start.getTime()) return { status: "due", dueAt: row.due_on, needsAction: true };
    return { status: "not_yet_due", dueAt: row.due_on, needsAction: false };
  }

  if (row.evaluation_status === "complete") return { status: "complete", dueAt: null, needsAction: false };
  const hasObservationEvidence = Boolean(row.ratings_json || row.evidence_json || row.completed_at);
  if (!hasObservationEvidence) return { status: "scheduled", dueAt: row.scheduled_at, needsAction: false };

  if (!row.feedback_submitted_at) {
    const dueAt = addWorkingDays(row.completed_at, Number(row.feedback_due_days ?? 3));
    return { status: expired(dueAt, now) ? "feedback_overdue" : "feedback_due", dueAt, needsAction: true };
  }
  if (!row.reflection_submitted_at) {
    const dueAt = addWorkingDays(row.feedback_submitted_at, Number(row.reflection_due_days ?? 5));
    return { status: expired(dueAt, now) ? "reflection_overdue" : "reflection_due", dueAt, needsAction: true };
  }
  if (Boolean(row.development_goal_required) && Number(row.goal_count ?? 0) === 0) {
    return { status: "development_due", dueAt: null, needsAction: true };
  }
  return { status: "complete", dueAt: null, needsAction: false };
}

export async function listEvaluationRequirements(identity?: SessionIdentity | null) {
  const result = await database().prepare(`SELECT r.*, w.label AS window_label, w.starts_on, w.ends_on,
    e.scheduled_at, e.status AS evaluation_status, e.ratings_json, e.evidence_json, e.completed_at,
    f.submitted_at AS feedback_submitted_at,
    refl.acknowledged_at AS reflection_submitted_at,
    ef.feedback_due_days, ef.reflection_due_days, ef.development_goal_required,
    (SELECT COUNT(*) FROM development_goals g WHERE g.source_evaluation_id = e.id AND g.status = 'active') AS goal_count
    FROM evaluation_requirements r
    JOIN evaluation_windows w ON w.id = r.window_id
    JOIN evaluation_frameworks ef ON ef.id = r.framework_id
    LEFT JOIN evaluations e ON e.id = r.evaluation_id
    LEFT JOIN feedback f ON f.evaluation_id = e.id
    LEFT JOIN reflections refl ON refl.evaluation_id = e.id
    ORDER BY w.starts_on, r.teacher_id, r.sequence_number`).all<any>();
  let rows = result.results ?? [];
  if (identity) {
    const visible = await visibleStaffIds(identity);
    rows = rows.filter((row: any) => visible.has(row.teacher_id) || row.evaluator_id === identity.staffId);
  }
  const now = new Date();
  return rows.map((row: any) => ({ ...row, ...deriveStatus(row, now) }));
}

export async function linkRequirementToEvaluation(requirementId: string, evaluationId: string) {
  await database().prepare("UPDATE evaluation_requirements SET evaluation_id = ?, updated_at = ? WHERE id = ?")
    .bind(evaluationId, new Date().toISOString(), requirementId).run();
}
