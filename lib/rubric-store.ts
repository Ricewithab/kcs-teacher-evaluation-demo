import { recordAudit } from "@/lib/audit";
import { database } from "@/lib/database";

export const DEFAULT_RUBRIC = [
  { id: "learning-environment", label: "Learning environment", description: "Classroom climate, routines and conditions for learning." },
  { id: "lesson-structure", label: "Lesson structure and clarity", description: "Purpose, sequencing, explanations and clarity." },
  { id: "student-engagement", label: "Student engagement", description: "Participation and productive involvement in learning." },
  { id: "formative-assessment", label: "Questioning and formative assessment", description: "Checks for understanding and use of evidence." },
  { id: "differentiation", label: "Differentiation and support", description: "Adaptation, scaffolding and challenge." },
  { id: "subject-knowledge", label: "Subject knowledge", description: "Accuracy and disciplinary understanding." }
];
export const DEFAULT_RATING_SCALE = ["Developing", "Secure", "Strong", "Exceptional"];
export const DEFAULT_EVALUATION_TYPES = ["Formal observation", "Informal observation", "Follow-up evaluation"];

function parseValue<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export async function getRubric(frameworkId: string) {
  const row = await database().prepare("SELECT rubric_json, rating_scale_json, evaluation_types_json FROM evaluation_frameworks WHERE id = ?").bind(frameworkId).first<any>();
  if (!row) throw new Error("Evaluation framework not found");
  return {
    rubric: parseValue(row.rubric_json, DEFAULT_RUBRIC),
    ratingScale: parseValue(row.rating_scale_json, DEFAULT_RATING_SCALE),
    evaluationTypes: parseValue(row.evaluation_types_json, DEFAULT_EVALUATION_TYPES)
  };
}

export async function saveRubric(input:{frameworkId:string;actorId:string;rubric:any[];ratingScale:string[];evaluationTypes:string[]}) {
  const before = await getRubric(input.frameworkId);
  await database().prepare("UPDATE evaluation_frameworks SET rubric_json = ?, rating_scale_json = ?, evaluation_types_json = ? WHERE id = ?").bind(JSON.stringify(input.rubric), JSON.stringify(input.ratingScale), JSON.stringify(input.evaluationTypes), input.frameworkId).run();
  const after = await getRubric(input.frameworkId);
  await recordAudit(input.actorId, "framework.rubric.updated", "evaluation_framework", input.frameworkId, before, after);
  return after;
}
