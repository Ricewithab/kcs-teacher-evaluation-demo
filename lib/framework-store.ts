import { recordAudit } from "@/lib/audit";
import { database } from "@/lib/database";

export async function saveFrameworkById(input: {
  frameworkId: string;
  actorId: string;
  observationsRequired: number;
  lessonPlanRequired: boolean;
  feedbackDueDays: number;
  reflectionDueDays: number;
  developmentGoalRequired: boolean;
  followUpRequired: boolean;
}) {
  const d1 = database();
  const before = await d1.prepare("SELECT * FROM evaluation_frameworks WHERE id = ?").bind(input.frameworkId).first<any>();
  if (!before) throw new Error("Academic year framework not found");
  if (before.archived_at) throw new Error("Archived academic years are read-only");
  await d1.prepare(`UPDATE evaluation_frameworks SET
    observations_required = ?, lesson_plan_required = ?, feedback_due_days = ?, reflection_due_days = ?,
    development_goal_required = ?, follow_up_required = ? WHERE id = ?`)
    .bind(
      input.observationsRequired,
      input.lessonPlanRequired ? 1 : 0,
      input.feedbackDueDays,
      input.reflectionDueDays,
      input.developmentGoalRequired ? 1 : 0,
      input.followUpRequired ? 1 : 0,
      input.frameworkId,
    ).run();
  const after = await d1.prepare("SELECT * FROM evaluation_frameworks WHERE id = ?").bind(input.frameworkId).first();
  await recordAudit(input.actorId, "framework.updated", "evaluation_framework", input.frameworkId, before, after);
  return after;
}
