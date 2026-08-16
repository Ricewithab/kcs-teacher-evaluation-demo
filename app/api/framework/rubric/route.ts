import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { canManageFramework } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";
import { getRubric, saveRubric } from "@/lib/rubric-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const frameworkId = url.searchParams.get("frameworkId") ?? "framework-2026-27";
    const context = await getRequestContext(request);
    if (!context) return unauthorized();
    return Response.json(await getRubric(frameworkId), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load rubric";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const body = await request.json();
    const frameworkId = String(body.frameworkId ?? "framework-2026-27");
    const context = await getRequestContext(request, String(body.actorId ?? "s1"));
    if (!context) return unauthorized();
    if (context.mode === "production" && (!context.identity || !canManageFramework(context.identity))) return forbidden();
    const rubric = Array.isArray(body.rubric) ? body.rubric.filter((item:any)=>String(item?.label??"").trim()).map((item:any,index:number)=>({id:String(item.id??`criterion-${index+1}`),label:String(item.label).trim(),description:String(item.description??"").trim()})) : [];
    const ratingScale = Array.isArray(body.ratingScale) ? body.ratingScale.map((item:any)=>String(item).trim()).filter(Boolean) : [];
    const evaluationTypes = Array.isArray(body.evaluationTypes) ? body.evaluationTypes.map((item:any)=>String(item).trim()).filter(Boolean) : [];
    if (!rubric.length || ratingScale.length < 2) return Response.json({ error: "At least one criterion and two rating levels are required" }, { status: 400 });
    const saved = await saveRubric({ frameworkId, actorId: context.actorId, rubric, ratingScale, evaluationTypes });
    return Response.json({ ok: true, ...saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save rubric";
    return Response.json({ error: message }, { status: 500 });
  }
}
