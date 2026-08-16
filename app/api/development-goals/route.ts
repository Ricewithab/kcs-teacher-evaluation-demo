import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { getEvaluationAccess } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";
import { saveDevelopmentGoal } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const body = await request.json();
    if (!body.id || !body.teacherId || !body.sourceEvaluationId) {
      return Response.json({ error: "id, teacherId and sourceEvaluationId are required" }, { status: 400 });
    }
    const context = await getRequestContext(request, String(body.actorId ?? "s1"));
    if (!context) return unauthorized();
    let teacherId = String(body.teacherId);
    if (context.mode === "production") {
      if (!context.identity) return unauthorized();
      const access = await getEvaluationAccess(context.identity, String(body.sourceEvaluationId));
      if (!access.canEvaluate || !access.evaluation) return forbidden("You are not permitted to set this development goal");
      teacherId = access.evaluation.teacher_id;
    }
    const goal = await saveDevelopmentGoal({
      actorId: context.actorId,
      id: String(body.id),
      teacherId,
      sourceEvaluationId: String(body.sourceEvaluationId),
      title: String(body.title ?? "Development goal"),
      action: String(body.action ?? ""),
      reviewOn: String(body.reviewOn ?? ""),
      status: String(body.status ?? "active"),
    });
    return Response.json({ ok: true, goal });
  } catch (error) {
    console.error("Unable to save development goal", error);
    return Response.json({ error: "Unable to save development goal" }, { status: 500 });
  }
}
