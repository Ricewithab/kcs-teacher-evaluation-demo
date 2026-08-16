import { database } from "@/lib/database";

function boolean(value: unknown) { return Number(value) === 1; }

export async function getActiveFrameworkState() {
  const framework = await database().prepare(`SELECT * FROM evaluation_frameworks
    WHERE is_active = 1 AND archived_at IS NULL
    ORDER BY created_at DESC LIMIT 1`).first<any>();
  if (!framework) return null;
  const windows = await database().prepare("SELECT * FROM evaluation_windows WHERE framework_id = ? ORDER BY starts_on")
    .bind(framework.id).all<any>();
  return {
    id: framework.id,
    academicYear: framework.academic_year,
    observationsRequired: Number(framework.observations_required),
    lessonPlanRequired: boolean(framework.lesson_plan_required),
    feedbackDueDays: Number(framework.feedback_due_days),
    reflectionDueDays: Number(framework.reflection_due_days),
    developmentGoalRequired: boolean(framework.development_goal_required),
    followUpRequired: boolean(framework.follow_up_required),
    isActive: boolean(framework.is_active),
    createdAt: framework.created_at,
    archivedAt: framework.archived_at,
    windows: (windows.results ?? []).map((row: any) => ({
      id: row.id,
      label: row.label,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      requiredCount: Number(row.required_count),
    })),
  };
}
