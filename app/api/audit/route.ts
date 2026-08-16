import { forbidden, unauthorized } from "@/lib/auth";
import { canViewAudit } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";
import { recentAuditLog } from "@/lib/scheduling-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request);
    if (!context) return unauthorized();
    if (context.mode === "production" && (!context.identity || !canViewAudit(context.identity))) return forbidden();
    return Response.json({ auditLog: await recentAuditLog(30) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Unable to load audit log", error);
    return Response.json({ error: "Unable to load audit log" }, { status: 500 });
  }
}
