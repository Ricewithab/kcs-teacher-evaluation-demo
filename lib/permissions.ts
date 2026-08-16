import type { SessionIdentity } from "@/lib/auth-types";
import { database } from "@/lib/database";

export function canAdministerSystem(identity: SessionIdentity) {
  return identity.isSystemAdmin || identity.systemRole === "master";
}

export function canLeadEvaluations(identity: SessionIdentity) {
  return canAdministerSystem(identity) || identity.systemRole === "division" || identity.systemRole === "manager";
}

async function allActiveStaffIds() {
  const result = await database().prepare("SELECT id FROM staff WHERE active = 1").all<{ id: string }>();
  return new Set((result.results ?? []).map((row) => row.id));
}

/**
 * Operational scope follows the school reporting hierarchy only.
 * A technical system administrator keeps whole-system administration rights,
 * but that override must not turn their personal "My team" dashboard into the whole school.
 */
export async function hierarchyStaffIds(identity: SessionIdentity) {
  if (identity.systemRole === "master") return allActiveStaffIds();

  const ids = new Set<string>([identity.staffId]);
  if (identity.systemRole !== "division" && identity.systemRole !== "manager") return ids;

  const result = await database().prepare(`WITH RECURSIVE descendants(id) AS (
    SELECT staff_id FROM reporting_lines WHERE manager_id = ? AND relationship = 'primary'
    UNION
    SELECT rl.staff_id
      FROM reporting_lines rl
      JOIN descendants d ON rl.manager_id = d.id
      WHERE rl.relationship = 'primary'
  )
  SELECT id FROM descendants`).bind(identity.staffId).all<{ id: string }>();
  for (const row of result.results ?? []) ids.add(row.id);
  return ids;
}

/**
 * Authorization scope. Technical system administrators deliberately retain access
 * to all active staff so they can repair/configure the system when required.
 */
export async function visibleStaffIds(identity: SessionIdentity) {
  if (identity.isSystemAdmin) return allActiveStaffIds();
  return hierarchyStaffIds(identity);
}

export async function canAccessStaff(identity: SessionIdentity, staffId: string) {
  return (await visibleStaffIds(identity)).has(staffId);
}

export async function canScheduleTeacher(identity: SessionIdentity, teacherId: string) {
  return canLeadEvaluations(identity) && (await canAccessStaff(identity, teacherId));
}

export async function getEvaluationAccess(identity: SessionIdentity, evaluationId: string) {
  const evaluation = await database().prepare(`SELECT id, teacher_id, evaluator_id, status FROM evaluations WHERE id = ?`)
    .bind(evaluationId).first<{ id: string; teacher_id: string; evaluator_id: string; status: string }>();
  if (!evaluation) return { evaluation: null, canView: false, canEvaluate: false, canReflect: false };
  const visible = await canAccessStaff(identity, evaluation.teacher_id);
  const assignedEvaluator = evaluation.evaluator_id === identity.staffId;
  const ownRecord = evaluation.teacher_id === identity.staffId;
  return {
    evaluation,
    canView: visible || assignedEvaluator || ownRecord,
    canEvaluate: canLeadEvaluations(identity) && (visible || assignedEvaluator),
    canReflect: ownRecord,
  };
}

export async function canEditLessonPlan(identity: SessionIdentity, teacherId: string) {
  return identity.isSystemAdmin || identity.staffId === teacherId;
}

export async function canViewLessonPlan(identity: SessionIdentity, teacherId: string, evaluationId?: string | null) {
  if (identity.staffId === teacherId || identity.isSystemAdmin || (await canAccessStaff(identity, teacherId))) return true;
  if (!evaluationId) return false;
  const access = await getEvaluationAccess(identity, evaluationId);
  return access.canView;
}

export function canManageFramework(identity: SessionIdentity) {
  return canAdministerSystem(identity);
}

export function canManageHierarchy(identity: SessionIdentity) {
  return canAdministerSystem(identity);
}

export function canManageAccounts(identity: SessionIdentity) {
  return canAdministerSystem(identity);
}

export function canViewAudit(identity: SessionIdentity) {
  return canAdministerSystem(identity);
}
