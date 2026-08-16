import { recordAudit } from "@/lib/audit";
import { database } from "@/lib/database";
import { DEFAULT_EVALUATION_TYPES, DEFAULT_RATING_SCALE, DEFAULT_RUBRIC } from "@/lib/rubric-store";

export async function listAcademicYears() {
  const result = await database().prepare(`SELECT id, academic_year, observations_required, lesson_plan_required,
    feedback_due_days, reflection_due_days, development_goal_required, follow_up_required,
    is_active, created_at, archived_at
    FROM evaluation_frameworks
    ORDER BY academic_year DESC`).all<any>();
  return result.results ?? [];
}

export async function getActiveAcademicYear() {
  return database().prepare(`SELECT * FROM evaluation_frameworks
    WHERE is_active = 1 AND archived_at IS NULL
    ORDER BY created_at DESC LIMIT 1`).first<any>();
}

function frameworkId(academicYear: string) {
  return `framework-${academicYear}`.toLowerCase().replace(/[–—]/g, "-").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

export async function createAcademicYear(input: {
  actorId: string;
  academicYear: string;
  copyFromId?: string | null;
  activate?: boolean;
}) {
  const d1 = database();
  const label = input.academicYear.trim();
  if (!/^\d{4}\s*[–—-]\s*\d{2,4}$/.test(label)) throw new Error("Use an academic year such as 2027–28");
  const id = frameworkId(label);
  const existing = await d1.prepare("SELECT id FROM evaluation_frameworks WHERE id = ? OR academic_year = ? LIMIT 1").bind(id, label).first();
  if (existing) throw new Error("That academic year already exists");

  const source = input.copyFromId
    ? await d1.prepare("SELECT * FROM evaluation_frameworks WHERE id = ?").bind(input.copyFromId).first<any>()
    : await getActiveAcademicYear();
  const now = new Date().toISOString();
  const settings = source ?? {
    observations_required: 3,
    lesson_plan_required: 1,
    feedback_due_days: 3,
    reflection_due_days: 5,
    development_goal_required: 1,
    follow_up_required: 1,
    rubric_json: JSON.stringify(DEFAULT_RUBRIC),
    rating_scale_json: JSON.stringify(DEFAULT_RATING_SCALE),
    evaluation_types_json: JSON.stringify(DEFAULT_EVALUATION_TYPES),
  };

  await d1.prepare(`INSERT INTO evaluation_frameworks
    (id, academic_year, observations_required, lesson_plan_required, feedback_due_days, reflection_due_days,
      development_goal_required, follow_up_required, rubric_json, rating_scale_json, evaluation_types_json,
      is_active, created_at, archived_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NULL)`)
    .bind(
      id,
      label,
      Number(settings.observations_required ?? 3),
      Number(settings.lesson_plan_required ?? 1),
      Number(settings.feedback_due_days ?? 3),
      Number(settings.reflection_due_days ?? 5),
      Number(settings.development_goal_required ?? 1),
      Number(settings.follow_up_required ?? 1),
      settings.rubric_json ?? JSON.stringify(DEFAULT_RUBRIC),
      settings.rating_scale_json ?? JSON.stringify(DEFAULT_RATING_SCALE),
      settings.evaluation_types_json ?? JSON.stringify(DEFAULT_EVALUATION_TYPES),
      now,
    ).run();

  if (source?.id) {
    const windows = await d1.prepare("SELECT * FROM evaluation_windows WHERE framework_id = ? ORDER BY starts_on").bind(source.id).all<any>();
    const sourceYearMatch = String(source.academic_year ?? "").match(/^(\d{4})/);
    const targetYearMatch = label.match(/^(\d{4})/);
    const yearDelta = sourceYearMatch && targetYearMatch ? Number(targetYearMatch[1]) - Number(sourceYearMatch[1]) : 0;
    for (const window of windows.results ?? []) {
      const shift = (dateValue: string) => {
        const date = new Date(`${dateValue}T00:00:00Z`);
        if (Number.isNaN(date.getTime())) return dateValue;
        date.setUTCFullYear(date.getUTCFullYear() + yearDelta);
        return date.toISOString().slice(0, 10);
      };
      const windowId = `${id}-${String(window.id).replace(/^framework-[^-]+-/, "")}`.replace(/[^A-Za-z0-9_-]/g, "-");
      await d1.prepare(`INSERT INTO evaluation_windows (id, framework_id, label, starts_on, ends_on, required_count)
        VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(windowId, id, window.label, shift(window.starts_on), shift(window.ends_on), Number(window.required_count ?? 1)).run();
    }
  }

  if (input.activate) await activateAcademicYear({ actorId: input.actorId, frameworkId: id });
  await recordAudit(input.actorId, "academic_year.created", "evaluation_framework", id, null, { academicYear: label, copiedFrom: source?.id ?? null });
  return d1.prepare("SELECT * FROM evaluation_frameworks WHERE id = ?").bind(id).first();
}

export async function activateAcademicYear(input: { actorId: string; frameworkId: string }) {
  const d1 = database();
  const target = await d1.prepare("SELECT * FROM evaluation_frameworks WHERE id = ? AND archived_at IS NULL").bind(input.frameworkId).first<any>();
  if (!target) throw new Error("Academic year not found or archived");
  const before = await getActiveAcademicYear();
  await d1.batch([
    d1.prepare("UPDATE evaluation_frameworks SET is_active = 0 WHERE is_active = 1"),
    d1.prepare("UPDATE evaluation_frameworks SET is_active = 1 WHERE id = ?").bind(input.frameworkId),
  ]);
  await recordAudit(input.actorId, "academic_year.activated", "evaluation_framework", input.frameworkId, before, target);
  return target;
}

export async function archiveAcademicYear(input: { actorId: string; frameworkId: string }) {
  const d1 = database();
  const before = await d1.prepare("SELECT * FROM evaluation_frameworks WHERE id = ?").bind(input.frameworkId).first<any>();
  if (!before) throw new Error("Academic year not found");
  if (Number(before.is_active) === 1) throw new Error("Activate another academic year before archiving the active one");
  const archivedAt = new Date().toISOString();
  await d1.prepare("UPDATE evaluation_frameworks SET archived_at = ? WHERE id = ?").bind(archivedAt, input.frameworkId).run();
  await recordAudit(input.actorId, "academic_year.archived", "evaluation_framework", input.frameworkId, before, { ...before, archived_at: archivedAt });
}
