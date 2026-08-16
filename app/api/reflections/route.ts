import { saveReflection } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.evaluationId || !body.teacherId) {
      return Response.json({ error: "evaluationId and teacherId are required" }, { status: 400 });
    }
    const reflection = await saveReflection({
      actorId: String(body.actorId ?? body.teacherId),
      evaluationId: String(body.evaluationId),
      teacherId: String(body.teacherId),
      reflection: String(body.reflection ?? ""),
      nextSteps: String(body.nextSteps ?? ""),
    });
    return Response.json({ ok: true, reflection });
  } catch (error) {
    console.error("Unable to save reflection", error);
    return Response.json({ error: "Unable to save reflection" }, { status: 500 });
  }
}
