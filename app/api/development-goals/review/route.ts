import { forbidden, getAuthenticatedIdentity, mutationOriginAllowed, unauthorized } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { database } from "@/lib/database";
import { canAccessStaff, canLeadEvaluations } from "@/lib/permissions";

async function goalAccess(request:Request,goalId:string){const identity=await getAuthenticatedIdentity(request);if(!identity)return{identity:null,goal:null,response:unauthorized()};const goal=await database().prepare("SELECT * FROM development_goals WHERE id = ?").bind(goalId).first<any>();if(!goal)return{identity:null,goal:null,response:Response.json({error:"Development goal not found"},{status:404})};if(!(await canAccessStaff(identity,goal.teacher_id))&&identity.staffId!==goal.teacher_id)return{identity:null,goal:null,response:forbidden()};return{identity,goal,response:null}}

export async function GET(request:Request){const url=new URL(request.url);const goalId=url.searchParams.get("goalId");if(!goalId)return Response.json({error:"goalId is required"},{status:400});const access=await goalAccess(request,goalId);if(access.response)return access.response;const result=await database().prepare("SELECT * FROM development_goal_reviews WHERE goal_id = ? ORDER BY reviewed_at DESC").bind(goalId).all();return Response.json({goal:access.goal,reviews:result.results??[]},{headers:{"cache-control":"no-store"}})}

export async function PUT(request:Request){
 try{
  if(!mutationOriginAllowed(request))return forbidden("Invalid request origin");const body=await request.json();if(!body.goalId||!body.evidence||!["continue","close"].includes(String(body.outcome)))return Response.json({error:"goalId, evidence and a valid outcome are required"},{status:400});
  const access=await goalAccess(request,String(body.goalId));if(access.response||!access.identity||!access.goal)return access.response!;if(!canLeadEvaluations(access.identity))return forbidden("Only an evaluator or leader can review a development goal");
  const now=new Date().toISOString();const id=`goal-review-${crypto.randomUUID()}`;await database().prepare(`INSERT INTO development_goal_reviews (id,goal_id,evaluation_id,reviewer_id,evidence,notes,outcome,reviewed_at) VALUES (?,?,?,?,?,?,?,?)`).bind(id,String(body.goalId),body.evaluationId?String(body.evaluationId):null,access.identity.staffId,String(body.evidence).trim(),body.notes?String(body.notes).trim():null,String(body.outcome),now).run();
  const before=access.goal;const nextStatus=String(body.outcome)==="close"?"closed":"active";await database().prepare("UPDATE development_goals SET status = ? WHERE id = ?").bind(nextStatus,String(body.goalId)).run();const after=await database().prepare("SELECT * FROM development_goals WHERE id = ?").bind(String(body.goalId)).first();await recordAudit(access.identity.staffId,"development_goal.reviewed","development_goal",String(body.goalId),before,{goal:after,review:{id,outcome:body.outcome,evidence:body.evidence}});
  return Response.json({ok:true,goal:after,reviewId:id});
 }catch(error){const message=error instanceof Error?error.message:"Unable to save follow-up review";return Response.json({error:message},{status:400})}
}
