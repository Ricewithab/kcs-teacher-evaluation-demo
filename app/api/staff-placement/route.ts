import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { canManageHierarchy } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";
import { saveStaffPlacement } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const body = await request.json();
    if (!body.staffId || !body.department) return Response.json({ error: "staffId and department are required" }, { status: 400 });
    const context = await getRequestContext(request, String(body.actorId ?? "s1"));
    if (!context) return unauthorized();
    if (context.mode === "production" && (!context.identity || !canManageHierarchy(context.identity))) return forbidden();
    const staff = await saveStaffPlacement({ actorId: context.actorId, staffId: String(body.staffId), department: String(body.department) });
    return Response.json({ ok: true, staff });
  } catch (error) {
    console.error("Unable to save staff placement", error);
    return Response.json({ error: "Unable to save staff placement" }, { status: 500 });
  }
}
