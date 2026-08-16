"use client";

import { Plus, Save, SlidersHorizontal, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppSession, useDemoRole } from "@/components/AppShell";
import { apiPath } from "@/lib/paths";
import { usePersistedDemoState } from "@/lib/use-demo-state";

type Criterion={id:string;label:string;description:string};

export function RubricConfiguration(){
 const {role}=useDemoRole();const {mode}=useAppSession();const {state}=usePersistedDemoState();
 const frameworkId=mode==="production"?state?.framework?.id:"framework-2026-27";
 const [rubric,setRubric]=useState<Criterion[]>([]);const [ratingScale,setRatingScale]=useState<string[]>([]);const [evaluationTypes,setEvaluationTypes]=useState<string[]>([]);const [saving,setSaving]=useState(false);const [message,setMessage]=useState("");
 useEffect(()=>{if(role!=="master"||!frameworkId)return;fetch(apiPath(`/api/framework/rubric?frameworkId=${encodeURIComponent(frameworkId)}`),{cache:"no-store"}).then(async response=>{if(!response.ok)throw new Error("Unable to load rubric");return response.json()}).then(data=>{setRubric(data.rubric??[]);setRatingScale(data.ratingScale??[]);setEvaluationTypes(data.evaluationTypes??[])}).catch(error=>setMessage(error.message))},[role,frameworkId]);
 async function save(){if(!frameworkId)return;setSaving(true);setMessage("");try{const response=await fetch(apiPath("/api/framework/rubric"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({frameworkId,actorId:"s1",rubric,ratingScale,evaluationTypes})});const data=await response.json();if(!response.ok)throw new Error(data.error??"Unable to save rubric");setMessage("Rubric configuration saved online.")}catch(caught){setMessage(caught instanceof Error?caught.message:"Unable to save rubric")}finally{setSaving(false)}}
 if(role!=="master")return null;
 return <div className="page rubric-config-page"><section className="card"><div className="card-title split"><div><h2>Evaluation rubric</h2><p>These are system-configurable defaults, not a claim about the school's official rubric. Master can replace them with the approved criteria.</p></div><SlidersHorizontal/></div><div className="rubric-config-list">{rubric.map((criterion,index)=><div key={criterion.id} className="rubric-config-row"><b>{index+1}</b><label>Criterion<input value={criterion.label} onChange={event=>setRubric(current=>current.map(item=>item.id===criterion.id?{...item,label:event.target.value}:item))}/></label><label>Description<input value={criterion.description} onChange={event=>setRubric(current=>current.map(item=>item.id===criterion.id?{...item,description:event.target.value}:item))}/></label><button aria-label="Remove criterion" onClick={()=>setRubric(current=>current.filter(item=>item.id!==criterion.id))}><Trash2 size={15}/></button></div>)}</div><button className="button secondary" onClick={()=>setRubric(current=>[...current,{id:`criterion-${crypto.randomUUID()}`,label:"New criterion",description:""}])}><Plus size={15}/>Add criterion</button><div className="grid two rubric-options"><div><h3>Rating scale</h3><p>One level per line, from lowest to highest.</p><textarea value={ratingScale.join("\n")} onChange={event=>setRatingScale(event.target.value.split("\n"))}/></div><div><h3>Evaluation types</h3><p>One type per line.</p><textarea value={evaluationTypes.join("\n")} onChange={event=>setEvaluationTypes(event.target.value.split("\n"))}/></div></div>{message&&<div className="cycle-message">{message}</div>}<div className="button-row"><button className="button primary" onClick={save} disabled={saving||!frameworkId}><Save size={15}/>{saving?"Saving…":"Save rubric"}</button></div></section></div>
}
