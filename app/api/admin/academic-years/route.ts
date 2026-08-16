import { forbidden, getAuthenticatedIdentity, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { activateAcademicYear, archiveAcademicYear, createAcademicYear, listAcademicYears } from "@/lib/academic-year-store";
import { canManageFramework } from "@/lib/permissions";

async function requireMaster(request: Request) {
  const identity = await getAuthenticatedIdentity(request);
  if (!identity) return { identity: null, response: unauthorized() };
  if (!canManageFramework(identity)) return { identity: null, response: forbidden() };
  return { identity, response: null };
}

export async function GET(request: Request) {
  const access = await requireMaster(request);
  if (access.response) return access.response;
  return Response.json({ academicYears: await listAcademicYears() }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const access = await requireMaster(request);
    if (access.response || !access.identity) return access.response!;
    const body = await request.json() as { academicYear?: string; copyFromId?: string; activate?: boolean };
    if (!body.academicYear) return Response.json({ error: "Academic year is required" }, { status: 400 });
    const framework = await createAcademicYear({
      actorId: access.identity.staffId,
      academicYear: body.academicYear,
      copyFromId: body.copyFromId ?? null,
      activate: Boolean(body.activate),
    });
    return Response.json({ ok: true, framework });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create academic year";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const access = await requireMaster(request);
    if (access.response || !access.identity) return access.response!;
    const body = await request.json() as { frameworkId?: string; action?: string };
    if (!body.frameworkId || !body.action) return Response.json({ error: "Framework and action are required" }, { status: 400 });
    if (body.action === "activate") {
      const framework = await activateAcademicYear({ actorId: access.identity.staffId, frameworkId: body.frameworkId });
      return Response.json({ ok: true, framework });
    }
    if (body.action === "archive") {
      await archiveAcademicYear({ actorId: access.identity.staffId, frameworkId: body.frameworkId });
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown academic-year action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update academic year";
    return Response.json({ error: message }, { status: 400 });
  }
}
