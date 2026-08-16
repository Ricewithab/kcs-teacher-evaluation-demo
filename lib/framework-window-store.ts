import { env } from "cloudflare:workers";

function db(){return (env as unknown as Record<string,any>).kcs_teacher_evaluation_demo_db}
function nowIso(){return new Date().toISOString()}

export type EvaluationWindowInput={id:string;label:string;startsOn:string;endsOn:string;requiredCount:number};

export async function saveEvaluationWindows(input:{actorId:string;frameworkId:string;windows:EvaluationWindowInput[]}){
 const d1=db();
 const before=(await d1.prepare("SELECT * FROM evaluation_windows WHERE framework_id = ? ORDER BY starts_on").bind(input.frameworkId).all()).results??[];
 const statements=input.windows.map(window=>d1.prepare(`INSERT INTO evaluation_windows (id, framework_id, label, starts_on, ends_on, required_count)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET label=excluded.label,starts_on=excluded.starts_on,ends_on=excluded.ends_on,required_count=excluded.required_count`)
  .bind(window.id,input.frameworkId,window.label,window.startsOn,window.endsOn,Math.max(1,window.requiredCount)));
 if(statements.length)await d1.batch(statements);
 const after=(await d1.prepare("SELECT * FROM evaluation_windows WHERE framework_id = ? ORDER BY starts_on").bind(input.frameworkId).all()).results??[];
 await d1.prepare(`INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, before_json, after_json, created_at)
  VALUES (?, ?, 'framework.windows.updated', 'evaluation_framework', ?, ?, ?, ?)`)
  .bind(crypto.randomUUID(),input.actorId,input.frameworkId,JSON.stringify(before),JSON.stringify(after),nowIso()).run();
 return after;
}
