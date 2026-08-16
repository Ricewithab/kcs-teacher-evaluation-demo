import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { canManageFramework } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";
import { saveFramework } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const body = await request.json();
    const context = await getRequestContext(request, String(body.actorId ?? "s1"));
    if (!context) return unauthorized();
    if (context.mode === "production" && (!context.identity || !canManageFramework(context.identity))) return forbidden();

    const saved = await saveFramework({
      actorId: context.actorId,
      observationsRequired: Math.max(1, Number(body.observationsRequired ?? 3)),
      lessonPlanRequired: Boolean(body.lessonPlanRequired),
      feedbackDueDays: Math.max(1, Number(body.feedbackDueDays ?? 3)),
      reflectionDueDays: Math.max(1, Number(body.reflectionDueDays ?? 5)),
      developmentGoalRequired: Boolean(body.developmentGoalRequired),
      followUpRequired: Boolean(body.followUpRequired),
    });
    return Response.json({ ok: true, framework: saved });
  } catch (error) {
    console.error("Unable to save framework", error);
    return Response.json({ error: "Unable to save framework" }, { status: 500 });
  }
}
