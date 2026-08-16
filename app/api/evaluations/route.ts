import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { getEvaluationAccess } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";
import { saveEvaluation } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const body = await request.json();
    if (!body.id || !body.ratings || !body.evidence) return Response.json({ error: "id, ratings and evidence are required" }, { status: 400 });
    const context = await getRequestContext(request, String(body.actorId ?? "s1"));
    if (!context) return unauthorized();
    if (context.mode === "production") {
      if (!context.identity) return unauthorized();
      const access = await getEvaluationAccess(context.identity, String(body.id));
      if (!access.canEvaluate) return forbidden("You are not permitted to edit this observation");
    }
    const evaluation = await saveEvaluation({
      actorId: context.actorId,
      id: String(body.id),
      ratings: body.ratings,
      evidence: body.evidence,
      status: body.status ? String(body.status) : undefined,
    });
    return Response.json({ ok: true, evaluation });
  } catch (error) {
    console.error("Unable to save evaluation", error);
    return Response.json({ error: "Unable to save evaluation" }, { status: 500 });
  }
}
