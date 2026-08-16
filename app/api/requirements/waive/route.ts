import { forbidden, getAuthenticatedIdentity, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { database } from "@/lib/database";
import { canManageFramework } from "@/lib/permissions";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const identity = await getAuthenticatedIdentity(request);
    if (!identity) return unauthorized();
    if (!canManageFramework(identity)) return forbidden("Only Master/System Administrator can waive an annual requirement");
    const body = await request.json() as { requirementId?: string; reason?: string; waive?: boolean };
    if (!body.requirementId) return Response.json({ error: "Requirement id is required" }, { status: 400 });
    const before = await database().prepare("SELECT * FROM evaluation_requirements WHERE id = ?").bind(body.requirementId).first<any>();
    if (!before) return Response.json({ error: "Requirement not found" }, { status: 404 });
    if (before.evaluation_id) return Response.json({ error: "A requirement linked to an evaluation cannot be waived. Cancel or complete the evaluation instead." }, { status: 409 });
    const waive = body.waive !== false;
    if (waive && !String(body.reason ?? "").trim()) return Response.json({ error: "A reason is required when waiving an evaluation requirement" }, { status: 400 });
    const now = new Date().toISOString();
    await database().prepare("UPDATE evaluation_requirements SET waived_at = ?, waived_reason = ?, status = ?, updated_at = ? WHERE id = ?")
      .bind(waive ? now : null, waive ? String(body.reason).trim() : null, waive ? "waived" : "required", now, body.requirementId).run();
    const after = await database().prepare("SELECT * FROM evaluation_requirements WHERE id = ?").bind(body.requirementId).first();
    await recordAudit(identity.staffId, waive ? "evaluation_requirement.waived" : "evaluation_requirement.reinstated", "evaluation_requirement", body.requirementId, before, after);
    return Response.json({ ok: true, requirement: after });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update requirement";
    return Response.json({ error: message }, { status: 400 });
  }
}
