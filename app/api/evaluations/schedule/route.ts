import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { linkRequirementToEvaluation } from "@/lib/cycle-store";
import { database } from "@/lib/database";
import { canAccessStaff, canScheduleTeacher } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";
import { scheduleObservation } from "@/lib/scheduling-store";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const body = await request.json();
    if (!body.teacherId || !body.evaluatorId || !body.frameworkId || !body.scheduledAt || !body.className || !body.subject) {
      return Response.json({ error: "Missing scheduling fields" }, { status: 400 });
    }
    const context = await getRequestContext(request, String(body.actorId ?? body.evaluatorId));
    if (!context) return unauthorized();
    if (context.mode === "production") {
      if (!context.identity) return unauthorized();
      const teacherAllowed = await canScheduleTeacher(context.identity, String(body.teacherId));
      const evaluatorAllowed = String(body.evaluatorId) === context.identity.staffId || await canAccessStaff(context.identity, String(body.evaluatorId));
      if (!teacherAllowed || !evaluatorAllowed) return forbidden("You cannot schedule this teacher/evaluator combination");
    }
    if (body.requirementId) {
      const requirement = await database().prepare("SELECT teacher_id, framework_id, evaluation_id FROM evaluation_requirements WHERE id = ?")
        .bind(String(body.requirementId)).first<any>();
      if (!requirement || requirement.teacher_id !== String(body.teacherId) || requirement.framework_id !== String(body.frameworkId)) {
        return Response.json({ error: "The selected requirement does not match this teacher and framework" }, { status: 400 });
      }
      if (requirement.evaluation_id && requirement.evaluation_id !== body.id) {
        return Response.json({ error: "This requirement already has an evaluation" }, { status: 409 });
      }
    }
    const evaluation = await scheduleObservation({
      actorId: context.actorId,
      id: body.id ? String(body.id) : undefined,
      teacherId: String(body.teacherId),
      evaluatorId: String(body.evaluatorId),
      frameworkId: String(body.frameworkId),
      windowId: body.windowId ? String(body.windowId) : null,
      scheduledAt: String(body.scheduledAt),
      className: String(body.className),
      subject: String(body.subject),
      evaluationType: body.evaluationType ? String(body.evaluationType) : null,
    });
    if (body.requirementId) await linkRequirementToEvaluation(String(body.requirementId), String(evaluation.id));
    return Response.json({ ok: true, evaluation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to schedule observation";
    console.error("Unable to schedule observation", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
