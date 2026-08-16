import { saveEvaluation } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id || !body.ratings || !body.evidence) {
      return Response.json({ error: "id, ratings and evidence are required" }, { status: 400 });
    }
    const evaluation = await saveEvaluation({
      actorId: String(body.actorId ?? "s1"),
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
