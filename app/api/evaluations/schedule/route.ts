import { scheduleObservation } from "@/lib/scheduling-store";

export async function PUT(request:Request){
 try{
  const body=await request.json();
  if(!body.teacherId||!body.evaluatorId||!body.frameworkId||!body.scheduledAt||!body.className||!body.subject){
   return Response.json({error:"Missing scheduling fields"},{status:400});
  }
  const evaluation=await scheduleObservation({actorId:String(body.actorId??body.evaluatorId),id:body.id?String(body.id):undefined,teacherId:String(body.teacherId),evaluatorId:String(body.evaluatorId),frameworkId:String(body.frameworkId),windowId:body.windowId?String(body.windowId):null,scheduledAt:String(body.scheduledAt),className:String(body.className),subject:String(body.subject)});
  return Response.json({ok:true,evaluation});
 }catch(error){console.error("Unable to schedule observation",error);return Response.json({error:"Unable to schedule observation"},{status:500})}
}
