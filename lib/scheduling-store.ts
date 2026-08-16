import { env } from "cloudflare:workers";
import { getRubric } from "@/lib/rubric-store";

function db(){return (env as unknown as Record<string,any>).kcs_teacher_evaluation_demo_db}
function nowIso(){return new Date().toISOString()}

async function audit(actorId:string,action:string,entityId:string,before:unknown,after:unknown){
 await db().prepare(`INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, before_json, after_json, created_at)
 VALUES (?, ?, ?, 'evaluation', ?, ?, ?, ?)`)
 .bind(crypto.randomUUID(),actorId,action,entityId,before==null?null:JSON.stringify(before),after==null?null:JSON.stringify(after),nowIso()).run();
}

export async function scheduleObservation(input:{actorId:string;id?:string;teacherId:string;evaluatorId:string;frameworkId:string;windowId?:string|null;scheduledAt:string;className:string;subject:string;evaluationType?:string|null}){
 const d1=db();
 const id=input.id??crypto.randomUUID();
 const before=await d1.prepare("SELECT * FROM evaluations WHERE id = ?").bind(id).first<any>();
 const frameworkConfig=await getRubric(input.frameworkId);
 const evaluationType=input.evaluationType?.trim()||frameworkConfig.evaluationTypes[0]||"Formal observation";
 if(!frameworkConfig.evaluationTypes.includes(evaluationType))throw new Error("Evaluation type is not configured for this academic year");
 const rubricSnapshot=before?.rubric_snapshot_json??JSON.stringify(frameworkConfig.rubric);
 const ratingSnapshot=before?.rating_scale_snapshot_json??JSON.stringify(frameworkConfig.ratingScale);
 await d1.prepare(`INSERT INTO evaluations
  (id, teacher_id, evaluator_id, framework_id, window_id, scheduled_at, class_name, subject, evaluation_type,
   rubric_snapshot_json, rating_scale_snapshot_json, status, ratings_json, evidence_json, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', NULL, NULL, NULL)
  ON CONFLICT(id) DO UPDATE SET teacher_id=excluded.teacher_id,evaluator_id=excluded.evaluator_id,framework_id=excluded.framework_id,
   window_id=excluded.window_id,scheduled_at=excluded.scheduled_at,class_name=excluded.class_name,subject=excluded.subject,
   evaluation_type=excluded.evaluation_type,status=CASE WHEN evaluations.completed_at IS NULL THEN 'scheduled' ELSE evaluations.status END`)
  .bind(id,input.teacherId,input.evaluatorId,input.frameworkId,input.windowId??null,input.scheduledAt,input.className,input.subject,evaluationType,rubricSnapshot,ratingSnapshot).run();
 const after=await d1.prepare("SELECT * FROM evaluations WHERE id = ?").bind(id).first();
 await audit(input.actorId,before?"evaluation.rescheduled":"evaluation.scheduled",id,before,after);
 return after;
}

export async function recentAuditLog(limit=30){
 const result=await db().prepare(`SELECT a.*, s.name AS actor_name FROM audit_log a LEFT JOIN staff s ON s.id=a.actor_id ORDER BY a.created_at DESC LIMIT ?`).bind(limit).all();
 return result.results??[];
}
