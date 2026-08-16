import type { SessionIdentity } from "@/lib/auth-types";
import { getActiveFrameworkState } from "@/lib/active-framework";
import { visibleStaffIds } from "@/lib/permissions";
import { getDemoState } from "@/lib/server-store";

export async function getScopedState(identity: SessionIdentity) {
  const state = await getDemoState();
  const activeFramework = await getActiveFrameworkState();
  const visible = await visibleStaffIds(identity);
  const evaluations = state.evaluations.filter((item: any) => visible.has(item.teacher_id) || item.evaluator_id === identity.staffId);
  const evaluationIds = new Set(evaluations.map((item: any) => item.id));

  const reportingLines = state.reportingLines.filter((item: any) => visible.has(item.staff_id));
  const referencedStaff = new Set<string>(visible);
  referencedStaff.add(identity.staffId);
  for (const item of evaluations) {
    referencedStaff.add(item.teacher_id);
    referencedStaff.add(item.evaluator_id);
  }
  for (const item of reportingLines) if (item.manager_id) referencedStaff.add(item.manager_id);

  return {
    ...state,
    framework: activeFramework ?? state.framework,
    staff: state.staff.filter((item: any) => referencedStaff.has(item.id)),
    reportingLines,
    evaluations,
    lessonPlans: state.lessonPlans.filter((item: any) => visible.has(item.teacher_id) || (item.evaluation_id && evaluationIds.has(item.evaluation_id))),
    feedback: state.feedback.filter((item: any) => evaluationIds.has(item.evaluation_id)),
    reflections: state.reflections.filter((item: any) => evaluationIds.has(item.evaluation_id)),
    developmentGoals: state.developmentGoals.filter((item: any) => visible.has(item.teacher_id)),
    access: {
      staffIds: [...visible],
      systemRole: identity.systemRole,
      isSystemAdmin: identity.isSystemAdmin,
    },
  };
}
