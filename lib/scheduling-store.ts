import { env } from "cloudflare:workers";

function db(){return (env as unknown as Record<string,any>).kcs_teacher_evaluation_demo_db}
function nowIso(){return new Date().toISOString()}

async function audit(actorId:string,action:string,entityId:string,before:unknown,after:unknown){
 await db().prepare(`INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, before_json, after_json, created_at)
 VALUES (?, ?, ?, 'evaluation', ?, ?, ?, ?)`)
 .bind(crypto.randomUUID(),actorId,action,entityId,before==null?null:JSON.stringify(before),after==null?null:JSON.stringify(after),nowIso()).run();
}

export async function scheduleObservation(input:{actorId:string;id?:string;teacherId:string;evaluatorId:string;frameworkId:string;windowId?:string|null;scheduledAt:string;className:string;subject:string}){
 const d1=db();
 const id=input.id??crypto.randomUUID();
 const before=await d1.prepare("SELECT * FROM evaluations WHERE id = ?").bind(id).first();
 await d1.prepare(`INSERT INTO evaluations
  (id, teacher_id, evaluator_id, framework_id, window_id, scheduled_at, class_name, subject, status, ratings_json, evidence_json, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', NULL, NULL, NULL)
  ON CONFLICT(id) DO UPDATE SET teacher_id=excluded.teacher_id,evaluator_id=excluded.evaluator_id,framework_id=excluded.framework_id,
   window_id=excluded.window_id,scheduled_at=excluded.scheduled_at,class_name=excluded.class_name,subject=excluded.subject,status='scheduled'`)
  .bind(id,input.teacherId,input.evaluatorId,input.frameworkId,input.windowId??null,input.scheduledAt,input.className,input.subject).run();
 const after=await d1.prepare("SELECT * FROM evaluations WHERE id = ?").bind(id).first();
 await audit(input.actorId,before?"evaluation.rescheduled":"evaluation.scheduled",id,before,after);
 return after;
}

export async function recentAuditLog(limit=30){
 const result=await db().prepare(`SELECT a.*, s.name AS actor_name FROM audit_log a LEFT JOIN staff s ON s.id=a.actor_id ORDER BY a.created_at DESC LIMIT ?`).bind(limit).all();
 return result.results??[];
}
