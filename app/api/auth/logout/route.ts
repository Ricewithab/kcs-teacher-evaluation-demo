import { deleteSession, mutationOriginAllowed } from "@/lib/auth";

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const header = await deleteSession(request);
  return Response.json({ ok: true }, { headers: { "set-cookie": header, "cache-control": "no-store" } });
}
