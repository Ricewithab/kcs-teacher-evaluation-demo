import { createPasswordRecord, generateTemporaryPassword, getAuthenticatedIdentity, insertUserAccount, mutationOriginAllowed, forbidden, unauthorized } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { database } from "@/lib/database";
import { canManageAccounts } from "@/lib/permissions";

async function requireManager(request: Request) {
  const identity = await getAuthenticatedIdentity(request);
  if (!identity) return { identity: null, response: unauthorized() };
  if (!canManageAccounts(identity)) return { identity: null, response: forbidden() };
  return { identity, response: null };
}

export async function GET(request: Request) {
  const access = await requireManager(request);
  if (access.response) return access.response;
  const result = await database().prepare(`SELECT u.id, u.staff_id, u.email, u.active, u.must_change_password,
    u.is_system_admin, u.locked_until, u.last_login_at, u.created_at, u.updated_at,
    s.name, s.position, s.division, s.department, s.system_role
    FROM users u JOIN staff s ON s.id = u.staff_id
    ORDER BY s.name`).all();
  return Response.json({ users: result.results ?? [] }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
    const access = await requireManager(request);
    if (access.response || !access.identity) return access.response!;
    const body = await request.json() as { staffId?: string; email?: string; isSystemAdmin?: boolean };
    if (!body.staffId || !body.email) return Response.json({ error: "Staff member and email are required" }, { status: 400 });
    if (body.isSystemAdmin && !access.identity.isSystemAdmin) return forbidden("Only a system administrator can create another system administrator");

    const temporaryPassword = generateTemporaryPassword();
    const userId = await insertUserAccount({
      staffId: body.staffId,
      email: body.email,
      password: temporaryPassword,
      isSystemAdmin: Boolean(body.isSystemAdmin),
      mustChangePassword: true,
    });
    await recordAudit(access.identity.staffId, "account.created", "user", userId, null, {
      staffId: body.staffId,
      email: body.email.trim().toLowerCase(),
      isSystemAdmin: Boolean(body.isSystemAdmin),
    });
    return Response.json({ ok: true, userId, temporaryPassword });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
    const access = await requireManager(request);
    if (access.response || !access.identity) return access.response!;
    const body = await request.json() as { userId?: string; action?: string; active?: boolean; isSystemAdmin?: boolean };
    if (!body.userId || !body.action) return Response.json({ error: "User and action are required" }, { status: 400 });
    const before = await database().prepare("SELECT id, staff_id, email, active, must_change_password, is_system_admin FROM users WHERE id = ?").bind(body.userId).first<any>();
    if (!before) return Response.json({ error: "Account not found" }, { status: 404 });

    if (body.action === "reset-password") {
      const temporaryPassword = generateTemporaryPassword();
      const record = await createPasswordRecord(temporaryPassword);
      await database().prepare(`UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, must_change_password = 1,
        failed_login_count = 0, locked_until = NULL, updated_at = ? WHERE id = ?`)
        .bind(record.hash, record.salt, record.iterations, new Date().toISOString(), body.userId).run();
      await database().prepare("DELETE FROM user_sessions WHERE user_id = ?").bind(body.userId).run();
      await recordAudit(access.identity.staffId, "account.password.reset", "user", body.userId, before, { ...before, must_change_password: 1 });
      return Response.json({ ok: true, temporaryPassword });
    }

    if (body.action === "set-active") {
      if (body.userId === access.identity.userId && body.active === false) return Response.json({ error: "You cannot deactivate your own account" }, { status: 400 });
      await database().prepare("UPDATE users SET active = ?, updated_at = ? WHERE id = ?")
        .bind(body.active === false ? 0 : 1, new Date().toISOString(), body.userId).run();
      if (body.active === false) await database().prepare("DELETE FROM user_sessions WHERE user_id = ?").bind(body.userId).run();
      await recordAudit(access.identity.staffId, "account.active.changed", "user", body.userId, before, { ...before, active: body.active === false ? 0 : 1 });
      return Response.json({ ok: true });
    }

    if (body.action === "set-system-admin") {
      if (!access.identity.isSystemAdmin) return forbidden("Only a system administrator can change technical administrator access");
      if (body.userId === access.identity.userId && body.isSystemAdmin === false) return Response.json({ error: "You cannot remove your own system-administrator access" }, { status: 400 });
      await database().prepare("UPDATE users SET is_system_admin = ?, updated_at = ? WHERE id = ?")
        .bind(body.isSystemAdmin ? 1 : 0, new Date().toISOString(), body.userId).run();
      await recordAudit(access.identity.staffId, "account.system_admin.changed", "user", body.userId, before, { ...before, is_system_admin: body.isSystemAdmin ? 1 : 0 });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown account action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update account";
    return Response.json({ error: message }, { status: 400 });
  }
}
