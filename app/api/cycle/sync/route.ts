import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { syncEvaluationRequirements } from "@/lib/cycle-store";
import { canManageFramework } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";

export async function POST(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const body = await request.json() as { frameworkId?: string; actorId?: string };
    if (!body.frameworkId) return Response.json({ error: "frameworkId is required" }, { status: 400 });
    const context = await getRequestContext(request, String(body.actorId ?? "s1"));
    if (!context) return unauthorized();
    if (context.mode === "production" && (!context.identity || !canManageFramework(context.identity))) return forbidden();
    const result = await syncEvaluationRequirements(String(body.frameworkId), context.actorId);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate evaluation requirements";
    return Response.json({ error: message }, { status: 400 });
  }
}
