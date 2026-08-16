import { recentAuditLog } from "@/lib/scheduling-store";

export const dynamic="force-dynamic";
export async function GET(){
 try{return Response.json({auditLog:await recentAuditLog(30)},{headers:{"cache-control":"no-store"}})}
 catch(error){console.error("Unable to load audit log",error);return Response.json({error:"Unable to load audit log"},{status:500})}
}
