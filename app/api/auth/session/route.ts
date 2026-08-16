import { getAppMode } from "@/lib/app-mode";
import { getAuthenticatedIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const mode = getAppMode();
  if (mode === "demo") {
    return Response.json({ mode, user: null }, { headers: { "cache-control": "no-store" } });
  }
  const user = await getAuthenticatedIdentity(request);
  return Response.json(
    { mode, user },
    { status: user ? 200 : 401, headers: { "cache-control": "no-store" } },
  );
}
