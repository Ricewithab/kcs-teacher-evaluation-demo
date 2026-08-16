import { changePassword, createSession, getAuthenticatedIdentity, mutationOriginAllowed, unauthorized } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
    const identity = await getAuthenticatedIdentity(request);
    if (!identity) return unauthorized();
    const body = await request.json() as { currentPassword?: string; nextPassword?: string };
    if (!body.currentPassword || !body.nextPassword) {
      return Response.json({ error: "Current and new passwords are required" }, { status: 400 });
    }
    await changePassword(identity, body.currentPassword, body.nextPassword);
    const header = await createSession(identity.userId, request);
    return Response.json({ ok: true }, { headers: { "set-cookie": header, "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to change password";
    return Response.json({ error: message }, { status: message.includes("Current password") ? 401 : 400 });
  }
}
