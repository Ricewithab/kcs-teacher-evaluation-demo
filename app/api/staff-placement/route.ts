import { saveStaffPlacement } from "@/lib/server-store";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.staffId || !body.department) {
      return Response.json({ error: "staffId and department are required" }, { status: 400 });
    }
    const staff = await saveStaffPlacement({
      actorId: String(body.actorId ?? "s1"),
      staffId: String(body.staffId),
      department: String(body.department),
    });
    return Response.json({ ok: true, staff });
  } catch (error) {
    console.error("Unable to save staff placement", error);
    return Response.json({ error: "Unable to save staff placement" }, { status: 500 });
  }
}
