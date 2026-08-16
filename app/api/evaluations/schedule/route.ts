import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { canAccessStaff, canScheduleTeacher } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";
import { scheduleObservation } from "@/lib/scheduling-store";

export async function PUT(request: Request) {
  try {
    if (!mutationOriginAllowed(request)) return forbidden("Invalid request origin");
    const body = await request.json();
    if (!body.teacherId || !body.evaluatorId || !body.frameworkId || !body.scheduledAt || !body.className || !body.subject) {
      return Response.json({ error: "Missing scheduling fields" }, { status: 400 });
    }
    const context = await getRequestContext(request, String(body.actorId ?? body.evaluatorId));
    if (!context) return unauthorized();
    if (context.mode === "production") {
      if (!context.identity) return unauthorized();
      const teacherAllowed = await canScheduleTeacher(context.identity, String(body.teacherId));
      const evaluatorAllowed = String(body.evaluatorId) === context.identity.staffId || await canAccessStaff(context.identity, String(body.evaluatorId));
      if (!teacherAllowed || !evaluatorAllowed) return forbidden("You cannot schedule this teacher/evaluator combination");
    }
    const evaluation = await scheduleObservation({
      actorId: context.actorId,
      id: body.id ? String(body.id) : undefined,
      teacherId: String(body.teacherId),
      evaluatorId: String(body.evaluatorId),
      frameworkId: String(body.frameworkId),
      windowId: body.windowId ? String(body.windowId) : null,
      scheduledAt: String(body.scheduledAt),
      className: String(body.className),
      subject: String(body.subject),
    });
    return Response.json({ ok: true, evaluation });
  } catch (error) {
    console.error("Unable to schedule observation", error);
    return Response.json({ error: "Unable to schedule observation" }, { status: 500 });
  }
}
