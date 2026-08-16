import { saveDevelopmentGoal } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id || !body.teacherId || !body.sourceEvaluationId) {
      return Response.json({ error: "id, teacherId and sourceEvaluationId are required" }, { status: 400 });
    }
    const goal = await saveDevelopmentGoal({
      actorId: String(body.actorId ?? "s1"),
      id: String(body.id),
      teacherId: String(body.teacherId),
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
