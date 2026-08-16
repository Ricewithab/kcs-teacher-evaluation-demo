import { getAppMode } from "@/lib/app-mode";
import { authenticate, createSession, mutationOriginAllowed } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
    if (getAppMode() !== "production") {
      return Response.json({ error: "Account sign-in is disabled while the public demo is active" }, { status: 409 });
    }
    const body = await request.json() as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return Response.json({ error: "Enter your school email and password" }, { status: 400 });
    }
    const user = await authenticate(body.email, body.password);
    if (!user) return Response.json({ error: "Email or password is incorrect" }, { status: 401 });
    const header = await createSession(user.userId, request);
    return Response.json({ user }, { headers: { "set-cookie": header, "cache-control": "no-store" } });
  } catch (error) {
    console.error("Unable to sign in", error);
    return Response.json({ error: "Unable to sign in" }, { status: 500 });
  }
}
