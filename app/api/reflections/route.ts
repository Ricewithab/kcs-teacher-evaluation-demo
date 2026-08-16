import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { advanceAfterReflection } from "@/lib/lifecycle-store";
import { getEvaluationAccess } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";
import { saveReflection } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const body = await request.json();
    if (!body.evaluationId || !body.teacherId) return Response.json({ error: "evaluationId and teacherId are required" }, { status: 400 });
    const context = await getRequestContext(request, String(body.actorId ?? body.teacherId));
    if (!context) return unauthorized();
    let teacherId = String(body.teacherId);
    if (context.mode === "production") {
      if (!context.identity) return unauthorized();
      const access = await getEvaluationAccess(context.identity, String(body.evaluationId));
      if (!access.canReflect || !access.evaluation) return forbidden("Only the observed teacher can submit this reflection");
      teacherId = access.evaluation.teacher_id;
    }
    const reflection = await saveReflection({
      actorId: context.actorId,
      evaluationId: String(body.evaluationId),
      teacherId,
      reflection: String(body.reflection ?? ""),
      nextSteps: String(body.nextSteps ?? ""),
    });
    await advanceAfterReflection(String(body.evaluationId), context.actorId);
    return Response.json({ ok: true, reflection });
  } catch (error) {
    console.error("Unable to save reflection", error);
    return Response.json({ error: "Unable to save reflection" }, { status: 500 });
  }
}
