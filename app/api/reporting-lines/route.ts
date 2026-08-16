import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { canManageHierarchy } from "@/lib/permissions";
import { savePrimaryReportingLine } from "@/lib/reporting-line-store";
import { getRequestContext } from "@/lib/request-context";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const body = await request.json();
    if (!body.staffId) return Response.json({ error: "staffId is required" }, { status: 400 });
    const context = await getRequestContext(request, String(body.actorId ?? "s1"));
    if (!context) return unauthorized();
    if (context.mode === "production" && (!context.identity || !canManageHierarchy(context.identity))) return forbidden();
    const line = await savePrimaryReportingLine({
      actorId: context.actorId,
      staffId: String(body.staffId),
      managerId: body.managerId ? String(body.managerId) : null,
    });
    return Response.json({ ok: true, reportingLine: line });
  } catch (error) {
    console.error("Unable to save reporting line", error);
    return Response.json({ error: "Unable to save reporting line" }, { status: 500 });
  }
}
