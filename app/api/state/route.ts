import { unauthorized } from "@/lib/auth";
import { getRequestContext } from "@/lib/request-context";
import { getScopedState } from "@/lib/scoped-state";
import { getDemoState } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request);
    if (!context) return unauthorized();
    const state = context.mode === "production" && context.identity
      ? await getScopedState(context.identity)
      : await getDemoState();
    return Response.json(state, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Unable to load application state", error);
    return Response.json({ error: "Unable to load application state" }, { status: 500 });
  }
}
