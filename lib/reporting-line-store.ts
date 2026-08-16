import { env } from "cloudflare:workers";

function db(){return (env as unknown as Record<string,any>).kcs_teacher_evaluation_demo_db}
function nowIso(){return new Date().toISOString()}

export async function savePrimaryReportingLine(input:{actorId:string;staffId:string;managerId:string|null}){
 const d1=db();
 const id=`report-${input.staffId}`;
 const before=await d1.prepare("SELECT * FROM reporting_lines WHERE id = ?").bind(id).first();
 await d1.prepare(`INSERT INTO reporting_lines (id, staff_id, manager_id, relationship)
  VALUES (?, ?, ?, 'primary')
  ON CONFLICT(id) DO UPDATE SET manager_id=excluded.manager_id,relationship='primary'`)
  .bind(id,input.staffId,input.managerId).run();
 const after=await d1.prepare("SELECT * FROM reporting_lines WHERE id = ?").bind(id).first();
 await d1.prepare(`INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, before_json, after_json, created_at)
  VALUES (?, ?, 'reporting_line.updated', 'staff', ?, ?, ?, ?)`)
  .bind(crypto.randomUUID(),input.actorId,input.staffId,before?JSON.stringify(before):null,JSON.stringify(after),nowIso()).run();
 return after;
}
