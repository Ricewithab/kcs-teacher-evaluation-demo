import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { getEvaluationAccess } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";
import { saveFeedback } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const body = await request.json();
    if (!body.evaluationId) return Response.json({ error: "evaluationId is required" }, { status: 400 });
    const context = await getRequestContext(request, String(body.actorId ?? "s1"));
    if (!context) return unauthorized();
    if (context.mode === "production") {
      if (!context.identity) return unauthorized();
      const access = await getEvaluationAccess(context.identity, String(body.evaluationId));
      if (!access.canEvaluate) return forbidden("You are not permitted to write feedback for this evaluation");
    }
    const feedback = await saveFeedback({
      actorId: context.actorId,
      evaluationId: String(body.evaluationId),
      strengths: String(body.strengths ?? ""),
      developmentAreas: String(body.developmentAreas ?? ""),
      summary: body.summary ? String(body.summary) : undefined,
    });
    return Response.json({ ok: true, feedback });
  } catch (error) {
    console.error("Unable to save feedback", error);
    return Response.json({ error: "Unable to save feedback" }, { status: 500 });
  }
}
