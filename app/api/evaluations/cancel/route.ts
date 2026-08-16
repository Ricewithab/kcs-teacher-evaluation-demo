import { forbidden, getAuthenticatedIdentity, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { database } from "@/lib/database";
import { getEvaluationAccess } from "@/lib/permissions";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const identity = await getAuthenticatedIdentity(request);
    if (!identity) return unauthorized();
    const body = await request.json() as { evaluationId?: string; reason?: string };
    if (!body.evaluationId || !String(body.reason ?? "").trim()) return Response.json({ error: "Evaluation and cancellation reason are required" }, { status: 400 });
    const access = await getEvaluationAccess(identity, body.evaluationId);
    if (!access.evaluation) return Response.json({ error: "Evaluation not found" }, { status: 404 });
    if (!access.canEvaluate) return forbidden("You are not permitted to cancel this observation");
    const before = await database().prepare("SELECT * FROM evaluations WHERE id = ?").bind(body.evaluationId).first<any>();
    if (before.completed_at) return Response.json({ error: "A submitted observation cannot be cancelled" }, { status: 409 });
    const requirement = await database().prepare("SELECT * FROM evaluation_requirements WHERE evaluation_id = ?").bind(body.evaluationId).first<any>();
    const now = new Date().toISOString();
    await database().batch([
      database().prepare("UPDATE evaluations SET status = 'cancelled' WHERE id = ?").bind(body.evaluationId),
      ...(requirement ? [database().prepare("UPDATE evaluation_requirements SET evaluation_id = NULL, status = 'required', updated_at = ? WHERE id = ?").bind(now, requirement.id)] : []),
    ]);
    const after = await database().prepare("SELECT * FROM evaluations WHERE id = ?").bind(body.evaluationId).first();
    await recordAudit(identity.staffId, "evaluation.cancelled", "evaluation", body.evaluationId, before, { evaluation: after, reason: String(body.reason).trim(), requirementReopened: requirement?.id ?? null });
    return Response.json({ ok: true, requirementId: requirement?.id ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel observation";
    return Response.json({ error: message }, { status: 400 });
  }
}
