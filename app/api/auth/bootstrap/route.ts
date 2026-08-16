import { getAppMode } from "@/lib/app-mode";
import { insertUserAccount, mutationOriginAllowed, verifyBootstrapToken } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { database } from "@/lib/database";
import { ensureDemoSeeded } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoSeeded();
  const row = await database().prepare("SELECT COUNT(*) AS count FROM users").first<{ count: number }>();
  return Response.json({ mode: getAppMode(), hasAccounts: Number(row?.count ?? 0) > 0 }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
    await ensureDemoSeeded();
    const count = await database().prepare("SELECT COUNT(*) AS count FROM users").first<{ count: number }>();
    if (Number(count?.count ?? 0) > 0) {
      return Response.json({ error: "Initial setup has already been completed" }, { status: 409 });
    }

    const body = await request.json() as { token?: string; staffId?: string; email?: string; password?: string };
    if (!body.token || !(await verifyBootstrapToken(body.token))) {
      return Response.json({ error: "Bootstrap token is incorrect or not configured" }, { status: 403 });
    }
    if (!body.staffId || !body.email || !body.password) {
      return Response.json({ error: "Staff member, email and password are required" }, { status: 400 });
    }

    const userId = await insertUserAccount({
      staffId: body.staffId,
      email: body.email,
      password: body.password,
      isSystemAdmin: true,
      mustChangePassword: false,
    });
    await recordAudit(body.staffId, "account.bootstrap.created", "user", userId, null, { staffId: body.staffId, email: body.email.trim().toLowerCase(), isSystemAdmin: true });
    return Response.json({ ok: true, userId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create initial account";
    return Response.json({ error: message }, { status: 400 });
  }
}
