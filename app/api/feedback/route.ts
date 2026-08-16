import { saveFeedback } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.evaluationId) return Response.json({ error: "evaluationId is required" }, { status: 400 });
    const feedback = await saveFeedback({
      actorId: String(body.actorId ?? "s1"),
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
