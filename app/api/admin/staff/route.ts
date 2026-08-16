import { forbidden, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { database } from "@/lib/database";
import { canManageHierarchy } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";

async function manager(request:Request){const context=await getRequestContext(request);if(!context)return{context:null,response:unauthorized()};if(context.mode==="production"&&(!context.identity||!canManageHierarchy(context.identity)))return{context:null,response:forbidden()};return{context,response:null}}

export async function GET(request:Request){
 const access=await manager(request);if(access.response)return access.response;
 const [staff,lines]=await Promise.all([database().prepare("SELECT * FROM staff ORDER BY division, department, name").all(),database().prepare("SELECT * FROM reporting_lines WHERE relationship = 'primary'").all()]);
 return Response.json({staff:staff.results??[],reportingLines:lines.results??[]},{headers:{"cache-control":"no-store"}});
}

export async function POST(request:Request){
 try{
  if(!mutationOriginAllowed(request))return forbidden("Invalid request origin");
  const access=await manager(request);if(access.response||!access.context)return access.response!;
  const body=await request.json();
  if(!body.name||!body.position||!body.division||!body.department)return Response.json({error:"Name, position, division and department are required"},{status:400});
  const id=String(body.id??`staff-${crypto.randomUUID()}`);
  await database().prepare(`INSERT INTO staff (id,name,position,division,department,system_role,evaluation_eligible,active) VALUES (?,?,?,?,?,?,?,1)`)
   .bind(id,String(body.name).trim(),String(body.position).trim(),String(body.division).trim(),String(body.department).trim(),String(body.systemRole??"teacher"),body.evaluationEligible===false?0:1).run();
  if(body.managerId)await database().prepare("INSERT INTO reporting_lines (id,staff_id,manager_id,relationship) VALUES (?,?,?,'primary')").bind(`report-${id}`,id,String(body.managerId)).run();
  const after=await database().prepare("SELECT * FROM staff WHERE id = ?").bind(id).first();
  await recordAudit(access.context.actorId,"staff.created","staff",id,null,after);
  return Response.json({ok:true,staff:after});
 }catch(error){const message=error instanceof Error?error.message:"Unable to create staff profile";return Response.json({error:message},{status:400})}
}

export async function PATCH(request:Request){
 try{
  if(!mutationOriginAllowed(request))return forbidden("Invalid request origin");
  const access=await manager(request);if(access.response||!access.context)return access.response!;
  const body=await request.json();if(!body.id)return Response.json({error:"Staff id is required"},{status:400});
  const before=await database().prepare("SELECT * FROM staff WHERE id = ?").bind(String(body.id)).first<any>();if(!before)return Response.json({error:"Staff profile not found"},{status:404});
  const next={name:body.name===undefined?before.name:String(body.name).trim(),position:body.position===undefined?before.position:String(body.position).trim(),division:body.division===undefined?before.division:String(body.division).trim(),department:body.department===undefined?before.department:String(body.department).trim(),systemRole:body.systemRole===undefined?before.system_role:String(body.systemRole),evaluationEligible:body.evaluationEligible===undefined?Number(before.evaluation_eligible):body.evaluationEligible?1:0,active:body.active===undefined?Number(before.active):body.active?1:0};
  await database().prepare("UPDATE staff SET name=?,position=?,division=?,department=?,system_role=?,evaluation_eligible=?,active=? WHERE id=?").bind(next.name,next.position,next.division,next.department,next.systemRole,next.evaluationEligible,next.active,String(body.id)).run();
  if(body.managerId!==undefined){if(body.managerId){await database().prepare(`INSERT INTO reporting_lines (id,staff_id,manager_id,relationship) VALUES (?,?,?,'primary') ON CONFLICT(id) DO UPDATE SET manager_id=excluded.manager_id`).bind(`report-${body.id}`,String(body.id),String(body.managerId)).run()}else await database().prepare("DELETE FROM reporting_lines WHERE staff_id=? AND relationship='primary'").bind(String(body.id)).run()}
  if(!next.active)await database().prepare("UPDATE users SET active=0,updated_at=? WHERE staff_id=?").bind(new Date().toISOString(),String(body.id)).run();
  const after=await database().prepare("SELECT * FROM staff WHERE id = ?").bind(String(body.id)).first();await recordAudit(access.context.actorId,"staff.updated","staff",String(body.id),before,after);
  return Response.json({ok:true,staff:after});
 }catch(error){const message=error instanceof Error?error.message:"Unable to update staff profile";return Response.json({error:message},{status:400})}
}
