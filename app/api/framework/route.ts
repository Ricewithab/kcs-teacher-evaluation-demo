import { saveFramework } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const saved = await saveFramework({
      actorId: String(body.actorId ?? "s1"),
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
