import { env } from "cloudflare:workers";
import { FRAMEWORK, STAFF, demoStatus } from "@/lib/demo-data";

const FRAMEWORK_ID = "framework-2026-27";
const DEMO_EVALUATION_ID = "demo-eval-yidi-observation-2";
const DEMO_PLAN_ID = "demo-plan-yidi-gradient";

function db() {
  return (env as unknown as Record<string, any>).kcs_teacher_evaluation_demo_db;
}

function nowIso() {
  return new Date().toISOString();
}

function bool(value: unknown) {
  return Number(value) === 1;
}

function managerForStaff(staffId: string) {
  const person = STAFF.find((member) => member.id === staffId);
  if (!person || person.id === "s1") return null;

  const divisionHeads: Record<string, string> = {
    SLT: "s1",
    Primary: "s3",
    "Middle School": "s4",
    "High School": "s5",
    "Cross-Divisional": "s1",
  };

  if (person.role === "division") return "s1";
  if (person.role === "manager") return divisionHeads[person.division] ?? "s1";

  const departmentLead = STAFF.find(
    (candidate) =>
      candidate.id !== person.id &&
      candidate.status === "Active" &&
      candidate.role === "manager" &&
      candidate.division === person.division &&
      candidate.department === person.department,
  );
  return departmentLead?.id ?? divisionHeads[person.division] ?? "s1";
}

function normaliseDemoStatus(status: ReturnType<typeof demoStatus>) {
  return status.toLowerCase().replaceAll(" ", "_");
}

async function audit(actorId: string, action: string, entityType: string, entityId: string, before: unknown, after: unknown) {
  await db()
    .prepare(`INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, before_json, after_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), actorId, action, entityType, entityId, before == null ? null : JSON.stringify(before), after == null ? null : JSON.stringify(after), nowIso())
    .run();
}

export async function ensureDemoSeeded() {
  const d1 = db();
  const framework = await d1.prepare("SELECT id FROM evaluation_frameworks WHERE id = ?").bind(FRAMEWORK_ID).first();
  if (!framework) {
    await d1.prepare(`INSERT INTO evaluation_frameworks
      (id, academic_year, observations_required, lesson_plan_required, feedback_due_days, reflection_due_days, development_goal_required, follow_up_required)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(FRAMEWORK_ID, FRAMEWORK.academicYear, FRAMEWORK.observationsRequired, 1, FRAMEWORK.feedbackDueDays, FRAMEWORK.reflectionDueDays, 1, 1)
      .run();

    const windows = [
      ["w1", "Observation 1", "2026-09-01", "2026-11-30"],
      ["w2", "Observation 2", "2027-01-01", "2027-03-31"],
      ["w3", "Observation 3", "2027-04-01", "2027-06-18"],
    ];
    await d1.batch(windows.map(([id, label, startsOn, endsOn]) => d1.prepare(`INSERT OR IGNORE INTO evaluation_windows
      (id, framework_id, label, starts_on, ends_on, required_count) VALUES (?, ?, ?, ?, ?, 1)`)
      .bind(id, FRAMEWORK_ID, label, startsOn, endsOn)));
  }

  const staffCount = await d1.prepare("SELECT COUNT(*) AS count FROM staff").first<{ count: number }>();
  if (!staffCount || Number(staffCount.count) === 0) {
    await d1.batch(
      STAFF.map((member) => d1.prepare(`INSERT OR IGNORE INTO staff
        (id, name, position, division, department, system_role, evaluation_eligible, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(member.id, member.name, member.position, member.division, member.department, member.role, member.evaluationEligible ? 1 : 0, member.status === "Active" ? 1 : 0)),
    );

    const reportingStatements = STAFF.filter((member) => member.id !== "s1").map((member) => {
      const managerId = managerForStaff(member.id);
      return d1.prepare(`INSERT OR IGNORE INTO reporting_lines (id, staff_id, manager_id, relationship)
        VALUES (?, ?, ?, 'primary')`).bind(`report-${member.id}`, member.id, managerId);
    });
    await d1.batch(reportingStatements);
  }

  const evaluationCount = await d1.prepare("SELECT COUNT(*) AS count FROM evaluations").first<{ count: number }>();
  if (!evaluationCount || Number(evaluationCount.count) === 0) {
    const eligible = STAFF.filter((member) => member.evaluationEligible && member.status === "Active");
    await d1.batch(eligible.map((member, index) => {
      const evaluatorId = managerForStaff(member.id) ?? "s1";
      const isYidi = member.id === "s47";
      const status = isYidi ? "observation" : normaliseDemoStatus(demoStatus(member));
      const day = String((index % 24) + 2).padStart(2, "0");
      return d1.prepare(`INSERT OR IGNORE INTO evaluations
        (id, teacher_id, evaluator_id, framework_id, window_id, scheduled_at, class_name, subject, status, ratings_json, evidence_json, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          isYidi ? DEMO_EVALUATION_ID : `demo-eval-${member.id}-1`,
          member.id,
          evaluatorId,
          FRAMEWORK_ID,
          "w1",
          isYidi ? "2026-09-18T10:20:00+08:00" : `2026-10-${day}T09:00:00+08:00`,
          isYidi ? "Grade 10 Mathematics" : "Demo class",
          isYidi ? "IGCSE Mathematics" : member.department,
          status,
          isYidi ? JSON.stringify({
            "Learning environment": "Strong",
            "Lesson structure and clarity": "Secure",
            "Student engagement": "Strong",
            "Questioning and formative assessment": "Developing",
            "Differentiation and support": "Secure",
            "Subject knowledge": "Strong",
          }) : null,
          isYidi ? JSON.stringify({
            "Learning environment": "Students settled quickly and routines were clear.",
            "Lesson structure and clarity": "Learning intention and success criteria were visible and referenced during the lesson.",
            "Student engagement": "Most students participated actively in guided and independent practice.",
            "Questioning and formative assessment": "Mini-whiteboards were used, but the hinge question did not yet change the next teaching step.",
            "Differentiation and support": "Scaffolded coordinate grids supported students who needed additional structure.",
            "Subject knowledge": "Explanations of gradient and rate of change were accurate and well connected to examples.",
          }) : null,
          status === "complete" ? `2026-10-${day}T10:00:00+08:00` : null,
        );
    }));
  }

  const plan = await d1.prepare("SELECT id FROM lesson_plans WHERE id = ?").bind(DEMO_PLAN_ID).first();
  if (!plan) {
    const payload = {
      curriculum: "Cambridge IGCSE Mathematics 0580",
      durationMinutes: 70,
      outcomes: [0, 1, 2],
      priorLearning: "Students can plot coordinates and interpret basic linear graphs.",
      successCriteria: "Students can calculate gradient correctly, explain the sign of a gradient, and interpret gradient as a rate of change.",
      keyVocabulary: "gradient, slope, coordinates, rate of change, change in x, change in y",
      keyQuestions: "What does the sign of a gradient tell us? How can two lines have the same gradient? What does gradient mean in this context?",
      differentiation: "Support: pre-labelled coordinate grids and scaffolded formula. Extension: missing-coordinate and equation-of-line problems.",
      misconceptions: "Reversing x/y changes; losing negative signs; treating steepness visually without calculating.",
      resources: "Mini-whiteboards, coordinate-grid worksheet, graphing display, exit ticket.",
      phases: [],
    };
    await d1.prepare(`INSERT INTO lesson_plans
      (id, teacher_id, evaluation_id, subject, class_name, lesson_title, payload_json, status, updated_at)
      VALUES (?, 's47', ?, 'IGCSE Mathematics', 'Grade 10 Mathematics', ?, ?, 'complete', ?)`)
      .bind(DEMO_PLAN_ID, DEMO_EVALUATION_ID, "Understanding gradient in straight-line graphs", JSON.stringify(payload), nowIso())
      .run();
  }

  const existingFeedback = await d1.prepare("SELECT id FROM feedback WHERE evaluation_id = ?").bind(DEMO_EVALUATION_ID).first();
  if (!existingFeedback) {
    await d1.prepare(`INSERT INTO feedback (id, evaluation_id, strengths, development_areas, summary, submitted_at)
      VALUES (?, ?, ?, ?, ?, NULL)`)
      .bind(
        "demo-feedback-yidi",
        DEMO_EVALUATION_ID,
        "Clear mathematical explanations, strong routines and purposeful guided practice.",
        "Use formative checks to decide whether to reteach, extend or move on before independent practice.",
        "A strong lesson with a clear next step around responsive formative assessment.",
      )
      .run();
  }

  const existingReflection = await d1.prepare("SELECT id FROM reflections WHERE evaluation_id = ?").bind(DEMO_EVALUATION_ID).first();
  if (!existingReflection) {
    await d1.prepare(`INSERT INTO reflections (id, evaluation_id, teacher_id, reflection, next_steps, acknowledged_at)
      VALUES (?, ?, 's47', ?, ?, NULL)`)
      .bind(
        "demo-reflection-yidi",
        DEMO_EVALUATION_ID,
        "The mini-whiteboards gave me useful information, but I moved on too quickly. Next time I will pause after the hinge question and adapt the next task based on the responses.",
        "Pause after the hinge question and select the next task based on whole-class responses.",
      )
      .run();
  }

  const existingGoal = await d1.prepare("SELECT id FROM development_goals WHERE id = 'demo-goal-yidi'").first();
  if (!existingGoal) {
    await d1.prepare(`INSERT INTO development_goals
      (id, teacher_id, source_evaluation_id, title, action, review_on, status)
      VALUES ('demo-goal-yidi', 's47', ?, ?, ?, '2026-10-20', 'active')`)
      .bind(
        DEMO_EVALUATION_ID,
        "Questioning & formative assessment",
        "Use formative evidence to adapt the next teaching step before independent practice.",
      )
      .run();
  }
}

export async function getDemoState() {
  await ensureDemoSeeded();
  const d1 = db();
  const [staffResult, reportingResult, frameworkRow, windowsResult, evaluationsResult, lessonPlansResult, feedbackResult, reflectionsResult, goalsResult] = await Promise.all([
    d1.prepare("SELECT * FROM staff ORDER BY id").all(),
    d1.prepare("SELECT * FROM reporting_lines").all(),
    d1.prepare("SELECT * FROM evaluation_frameworks WHERE id = ?").bind(FRAMEWORK_ID).first(),
    d1.prepare("SELECT * FROM evaluation_windows WHERE framework_id = ? ORDER BY starts_on").bind(FRAMEWORK_ID).all(),
    d1.prepare("SELECT * FROM evaluations ORDER BY scheduled_at").all(),
    d1.prepare("SELECT * FROM lesson_plans ORDER BY updated_at DESC").all(),
    d1.prepare("SELECT * FROM feedback").all(),
    d1.prepare("SELECT * FROM reflections").all(),
    d1.prepare("SELECT * FROM development_goals").all(),
  ]);

  const framework = frameworkRow ? {
    id: frameworkRow.id,
    academicYear: frameworkRow.academic_year,
    observationsRequired: Number(frameworkRow.observations_required),
    lessonPlanRequired: bool(frameworkRow.lesson_plan_required),
    feedbackDueDays: Number(frameworkRow.feedback_due_days),
    reflectionDueDays: Number(frameworkRow.reflection_due_days),
    developmentGoalRequired: bool(frameworkRow.development_goal_required),
    followUpRequired: bool(frameworkRow.follow_up_required),
    windows: (windowsResult.results ?? []).map((row: any) => ({
      id: row.id,
      label: row.label,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      requiredCount: Number(row.required_count),
    })),
  } : null;

  return {
    framework,
    staff: (staffResult.results ?? []).map((row: any) => ({ ...row, evaluation_eligible: bool(row.evaluation_eligible), active: bool(row.active) })),
    reportingLines: reportingResult.results ?? [],
    evaluations: (evaluationsResult.results ?? []).map((row: any) => ({
      ...row,
      ratings: row.ratings_json ? JSON.parse(row.ratings_json) : null,
      evidence: row.evidence_json ? JSON.parse(row.evidence_json) : null,
    })),
    lessonPlans: (lessonPlansResult.results ?? []).map((row: any) => ({ ...row, payload: JSON.parse(row.payload_json) })),
    feedback: feedbackResult.results ?? [],
    reflections: reflectionsResult.results ?? [],
    developmentGoals: goalsResult.results ?? [],
  };
}

export async function saveFramework(input: {
  actorId: string;
  observationsRequired: number;
  lessonPlanRequired: boolean;
  feedbackDueDays: number;
  reflectionDueDays: number;
  developmentGoalRequired: boolean;
  followUpRequired: boolean;
}) {
  await ensureDemoSeeded();
  const d1 = db();
  const before = await d1.prepare("SELECT * FROM evaluation_frameworks WHERE id = ?").bind(FRAMEWORK_ID).first();
  await d1.prepare(`UPDATE evaluation_frameworks SET
    observations_required = ?, lesson_plan_required = ?, feedback_due_days = ?, reflection_due_days = ?, development_goal_required = ?, follow_up_required = ?
    WHERE id = ?`)
    .bind(input.observationsRequired, input.lessonPlanRequired ? 1 : 0, input.feedbackDueDays, input.reflectionDueDays, input.developmentGoalRequired ? 1 : 0, input.followUpRequired ? 1 : 0, FRAMEWORK_ID)
    .run();
  const after = await d1.prepare("SELECT * FROM evaluation_frameworks WHERE id = ?").bind(FRAMEWORK_ID).first();
  await audit(input.actorId, "framework.updated", "evaluation_framework", FRAMEWORK_ID, before, after);
  return after;
}

export async function saveStaffPlacement(input: { actorId: string; staffId: string; department: string }) {
  await ensureDemoSeeded();
  const d1 = db();
  const before = await d1.prepare("SELECT * FROM staff WHERE id = ?").bind(input.staffId).first();
  if (!before) throw new Error("Staff member not found");
  await d1.prepare("UPDATE staff SET department = ? WHERE id = ?").bind(input.department, input.staffId).run();

  const candidateManager = await d1.prepare(`SELECT id FROM staff
    WHERE division = ? AND department = ? AND system_role = 'manager' AND active = 1 AND id != ? LIMIT 1`)
    .bind(before.division, input.department, input.staffId).first<{ id: string }>();
  if (candidateManager?.id) {
    await d1.prepare(`INSERT INTO reporting_lines (id, staff_id, manager_id, relationship)
      VALUES (?, ?, ?, 'primary')
      ON CONFLICT(id) DO UPDATE SET manager_id = excluded.manager_id`)
      .bind(`report-${input.staffId}`, input.staffId, candidateManager.id)
      .run();
  }
  const after = await d1.prepare("SELECT * FROM staff WHERE id = ?").bind(input.staffId).first();
  await audit(input.actorId, "staff.placement.updated", "staff", input.staffId, before, after);
  return after;
}

export async function saveLessonPlan(input: {
  actorId: string;
  id: string;
  teacherId: string;
  evaluationId?: string | null;
  subject: string;
  className: string;
  lessonTitle: string;
  payload: unknown;
  status: "draft" | "complete";
}) {
  await ensureDemoSeeded();
  const d1 = db();
  const before = await d1.prepare("SELECT * FROM lesson_plans WHERE id = ?").bind(input.id).first();
  await d1.prepare(`INSERT INTO lesson_plans
    (id, teacher_id, evaluation_id, subject, class_name, lesson_title, payload_json, status, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET teacher_id = excluded.teacher_id, evaluation_id = excluded.evaluation_id,
      subject = excluded.subject, class_name = excluded.class_name, lesson_title = excluded.lesson_title,
      payload_json = excluded.payload_json, status = excluded.status, updated_at = excluded.updated_at`)
    .bind(input.id, input.teacherId, input.evaluationId ?? null, input.subject, input.className, input.lessonTitle, JSON.stringify(input.payload), input.status, nowIso())
    .run();
  const after = await d1.prepare("SELECT * FROM lesson_plans WHERE id = ?").bind(input.id).first();
  await audit(input.actorId, "lesson_plan.saved", "lesson_plan", input.id, before, after);
  return after;
}

export async function saveEvaluation(input: {
  actorId: string;
  id: string;
  ratings: Record<string, string>;
  evidence: Record<string, string>;
  status?: string;
}) {
  await ensureDemoSeeded();
  const d1 = db();
  const before = await d1.prepare("SELECT * FROM evaluations WHERE id = ?").bind(input.id).first();
  if (!before) throw new Error("Evaluation not found");
  await d1.prepare("UPDATE evaluations SET ratings_json = ?, evidence_json = ?, status = ? WHERE id = ?")
    .bind(JSON.stringify(input.ratings), JSON.stringify(input.evidence), input.status ?? before.status, input.id)
    .run();
  const after = await d1.prepare("SELECT * FROM evaluations WHERE id = ?").bind(input.id).first();
  await audit(input.actorId, "evaluation.saved", "evaluation", input.id, before, after);
  return after;
}

export async function saveFeedback(input: { actorId: string; evaluationId: string; strengths: string; developmentAreas: string; summary?: string }) {
  await ensureDemoSeeded();
  const d1 = db();
  const id = `feedback-${input.evaluationId}`;
  const before = await d1.prepare("SELECT * FROM feedback WHERE evaluation_id = ?").bind(input.evaluationId).first();
  await d1.prepare(`INSERT INTO feedback (id, evaluation_id, strengths, development_areas, summary, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET strengths = excluded.strengths, development_areas = excluded.development_areas,
      summary = excluded.summary, submitted_at = excluded.submitted_at`)
    .bind(before?.id ?? id, input.evaluationId, input.strengths, input.developmentAreas, input.summary ?? null, nowIso())
    .run();
  const after = await d1.prepare("SELECT * FROM feedback WHERE evaluation_id = ?").bind(input.evaluationId).first();
  await audit(input.actorId, "feedback.saved", "evaluation", input.evaluationId, before, after);
  return after;
}

export async function saveReflection(input: { actorId: string; evaluationId: string; teacherId: string; reflection: string; nextSteps: string }) {
  await ensureDemoSeeded();
  const d1 = db();
  const id = `reflection-${input.evaluationId}`;
  const before = await d1.prepare("SELECT * FROM reflections WHERE evaluation_id = ?").bind(input.evaluationId).first();
  await d1.prepare(`INSERT INTO reflections (id, evaluation_id, teacher_id, reflection, next_steps, acknowledged_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET reflection = excluded.reflection, next_steps = excluded.next_steps, acknowledged_at = excluded.acknowledged_at`)
    .bind(before?.id ?? id, input.evaluationId, input.teacherId, input.reflection, input.nextSteps, nowIso())
    .run();
  const after = await d1.prepare("SELECT * FROM reflections WHERE evaluation_id = ?").bind(input.evaluationId).first();
  await audit(input.actorId, "reflection.saved", "evaluation", input.evaluationId, before, after);
  return after;
}

export async function saveDevelopmentGoal(input: { actorId: string; id: string; teacherId: string; sourceEvaluationId: string; title: string; action: string; reviewOn: string; status: string }) {
  await ensureDemoSeeded();
  const d1 = db();
  const before = await d1.prepare("SELECT * FROM development_goals WHERE id = ?").bind(input.id).first();
  await d1.prepare(`INSERT INTO development_goals (id, teacher_id, source_evaluation_id, title, action, review_on, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, action = excluded.action, review_on = excluded.review_on, status = excluded.status`)
    .bind(input.id, input.teacherId, input.sourceEvaluationId, input.title, input.action, input.reviewOn, input.status)
    .run();
  const after = await d1.prepare("SELECT * FROM development_goals WHERE id = ?").bind(input.id).first();
  await audit(input.actorId, "development_goal.saved", "development_goal", input.id, before, after);
  return after;
}

export { FRAMEWORK_ID, DEMO_EVALUATION_ID, DEMO_PLAN_ID };
