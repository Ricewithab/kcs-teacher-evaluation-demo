import { getDemoState } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getDemoState(), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Unable to load demo state", error);
    return Response.json({ error: "Unable to load demo state" }, { status: 500 });
  }
}
