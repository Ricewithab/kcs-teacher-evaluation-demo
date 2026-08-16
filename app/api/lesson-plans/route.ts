import { saveLessonPlan } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id || !body.teacherId || !body.subject || !body.className || !body.lessonTitle) {
      return Response.json({ error: "Missing lesson-plan fields" }, { status: 400 });
    }
    const plan = await saveLessonPlan({
      actorId: String(body.actorId ?? body.teacherId),
      id: String(body.id),
      teacherId: String(body.teacherId),
      evaluationId: body.evaluationId ? String(body.evaluationId) : null,
      subject: String(body.subject),
      className: String(body.className),
      lessonTitle: String(body.lessonTitle),
      payload: body.payload ?? {},
      status: body.status === "draft" ? "draft" : "complete",
    });
    return Response.json({ ok: true, plan });
  } catch (error) {
    console.error("Unable to save lesson plan", error);
    return Response.json({ error: "Unable to save lesson plan" }, { status: 500 });
  }
}
