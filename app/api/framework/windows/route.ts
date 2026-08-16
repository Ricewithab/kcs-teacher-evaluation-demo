import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { saveEvaluationWindows } from "@/lib/framework-window-store";
import { canManageFramework } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const body = await request.json();
    if (!body.frameworkId || !Array.isArray(body.windows)) return Response.json({ error: "frameworkId and windows are required" }, { status: 400 });
    const context = await getRequestContext(request, String(body.actorId ?? "s1"));
    if (!context) return unauthorized();
    if (context.mode === "production" && (!context.identity || !canManageFramework(context.identity))) return forbidden();
    const windows = body.windows.map((window: any) => ({
      id: String(window.id),
      label: String(window.label),
      startsOn: String(window.startsOn),
      endsOn: String(window.endsOn),
      requiredCount: Math.max(1, Number(window.requiredCount ?? 1)),
    }));
    const saved = await saveEvaluationWindows({ actorId: context.actorId, frameworkId: String(body.frameworkId), windows });
    return Response.json({ ok: true, windows: saved });
  } catch (error) {
    console.error("Unable to save evaluation windows", error);
    return Response.json({ error: "Unable to save evaluation windows" }, { status: 500 });
  }
}
