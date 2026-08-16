import { savePrimaryReportingLine } from "@/lib/reporting-line-store";

export async function PUT(request:Request){
 try{
  const body=await request.json();
  if(!body.staffId)return Response.json({error:"staffId is required"},{status:400});
  const line=await savePrimaryReportingLine({actorId:String(body.actorId??"s1"),staffId:String(body.staffId),managerId:body.managerId?String(body.managerId):null});
  return Response.json({ok:true,reportingLine:line});
 }catch(error){console.error("Unable to save reporting line",error);return Response.json({error:"Unable to save reporting line"},{status:500})}
}
