import { getAppMode } from "@/lib/app-mode";
import { getAuthenticatedIdentity } from "@/lib/auth";
import type { SessionIdentity } from "@/lib/auth-types";

export type RequestContext = {
  mode: "demo" | "production";
  identity: SessionIdentity | null;
  actorId: string;
};

export async function getRequestContext(request: Request, demoActorId = "s1"): Promise<RequestContext | null> {
  const mode = getAppMode();
  if (mode === "demo") return { mode, identity: null, actorId: demoActorId };
  const identity = await getAuthenticatedIdentity(request);
  if (!identity) return null;
  return { mode, identity, actorId: identity.staffId };
}
