"use client";

import { CalendarRange, GripVertical, History, Save, Settings2, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FRAMEWORK, STAFF, type StaffMember } from "@/lib/demo-data";
import { apiPath } from "@/lib/paths";
import { useDemoRole } from "./AppShell";

const hsDepartments=["语文人文组Chinese&Humanities","英语组English","数学经济组 Maths & Economics","科学计算机组 Science & Computer Science","升学指导 College Counseling"];
type WindowConfig={id:string;label:string;startsOn:string;endsOn:string;requiredCount:number};
const defaultWindows:WindowConfig[]=[
 {id:"w1",label:"Observation 1",startsOn:"2026-09-01",endsOn:"2026-11-30",requiredCount:1},
 {id:"w2",label:"Observation 2",startsOn:"2027-01-01",endsOn:"2027-03-31",requiredCount:1},
 {id:"w3",label:"Observation 3",startsOn:"2027-04-01",endsOn:"2027-06-18",requiredCount:1},
];

export function MasterConfiguration(){
 const {role}=useDemoRole();
 const [required,setRequired]=useState(FRAMEWORK.observationsRequired);
 const [feedbackDays,setFeedbackDays]=useState(FRAMEWORK.feedbackDueDays);
 const [reflectionDays,setReflectionDays]=useState(FRAMEWORK.reflectionDueDays);
 const [lessonPlanRequired,setLessonPlanRequired]=useState(FRAMEWORK.lessonPlanRequired);
 const [developmentGoalRequired,setDevelopmentGoalRequired]=useState(FRAMEWORK.developmentGoalRequired);
 const [followUpRequired,setFollowUpRequired]=useState(FRAMEWORK.followUpRequired);
 const [windows,setWindows]=useState<WindowConfig[]>(defaultWindows);
 const [auditLog,setAuditLog]=useState<any[]>([]);
 const [saved,setSaved]=useState(false);
 const [saving,setSaving]=useState(false);
 const [loadedFromD1,setLoadedFromD1]=useState(false);
 const initial=useMemo(()=>Object.fromEntries(hsDepartments.map(d=>[d,STAFF.filter(s=>s.division==="High School"&&s.department===d).map(s=>s.id)])),[]);
 const [buckets,setBuckets]=useState<Record<string,string[]>>(initial);
 const [dragged,setDragged]=useState<string|null>(null);
 const windowTotal=windows.reduce((sum,window)=>sum+Number(window.requiredCount||0),0);

 async function loadAudit(){
  try{const response=await fetch(apiPath("/api/audit"),{cache:"no-store"});if(response.ok){const data=await response.json();setAuditLog(data.auditLog??[])}}catch(error){console.error(error)}
 }

 useEffect(()=>{
  let active=true;
  fetch(apiPath("/api/state"),{cache:"no-store"})
   .then(async response=>{if(!response.ok)throw new Error("Unable to load D1 state");return response.json()})
   .then(data=>{
    if(!active)return;
    if(data.framework){
      setRequired(Number(data.framework.observationsRequired));
      setFeedbackDays(Number(data.framework.feedbackDueDays));
      setReflectionDays(Number(data.framework.reflectionDueDays));
      setLessonPlanRequired(Boolean(data.framework.lessonPlanRequired));
      setDevelopmentGoalRequired(Boolean(data.framework.developmentGoalRequired));
      setFollowUpRequired(Boolean(data.framework.followUpRequired));
      if(Array.isArray(data.framework.windows)&&data.framework.windows.length)setWindows(data.framework.windows);
    }
    if(Array.isArray(data.staff)){
      const next=Object.fromEntries(hsDepartments.map(dept=>[dept,data.staff.filter((s:any)=>s.division==="High School"&&s.department===dept).map((s:any)=>s.id)]));
      setBuckets(next);
    }
    setLoadedFromD1(true);
   })
   .catch(error=>console.error(error));
  void loadAudit();
  return()=>{active=false};
 },[]);

 async function save(){
  if(windowTotal!==required){window.alert(`The observation windows currently require ${windowTotal} observations, but the annual requirement is ${required}. Adjust the window counts so they match.`);return}
  setSaving(true);setSaved(false);
  try{
   const [frameworkResponse,windowsResponse]=await Promise.all([
    fetch(apiPath("/api/framework"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({actorId:"s1",observationsRequired:required,lessonPlanRequired,feedbackDueDays:feedbackDays,reflectionDueDays:reflectionDays,developmentGoalRequired,followUpRequired})}),
    fetch(apiPath("/api/framework/windows"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({actorId:"s1",frameworkId:"framework-2026-27",windows})}),
   ]);
   if(!frameworkResponse.ok||!windowsResponse.ok)throw new Error("Unable to save framework");
   setSaved(true);await loadAudit();
  }catch(error){console.error(error);window.alert("The framework could not be saved.")}
  finally{setSaving(false)}
 }

 async function drop(dept:string){
  if(!dragged)return;
  const staffId=dragged;
  setBuckets(current=>{const next=Object.fromEntries(Object.entries(current).map(([k,v])=>[k,v.filter(id=>id!==staffId)]));next[dept]=[...(next[dept]??[]),staffId];return next});
  setDragged(null);
  try{
   const response=await fetch(apiPath("/api/staff-placement"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({actorId:"s1",staffId,department:dept})});
   if(!response.ok)throw new Error("Unable to save staff placement");
   await loadAudit();
  }catch(error){console.error(error);window.alert("The staff placement could not be saved. Reloading the page will restore the stored structure.")}
 }
 function updateWindow(id:string,patch:Partial<WindowConfig>){setWindows(current=>current.map(window=>window.id===id?{...window,...patch}:window))}

 if(role!=="master") return <div className="page"><header className="page-head"><div><span className="eyebrow">Master-only configuration</span><h1>System preview</h1><p>In production, only the Head of School/Master account can change the school framework and staff management lines.</p></div></header><section className="card locked"><ShieldCheck/><h2>Master controls are protected</h2><p>Switch the demo role to <strong>Head of School · Master</strong> to interact with these settings.</p></section></div>;
 return <div className="page"><header className="page-head"><div><span className="eyebrow">Head of School · Master</span><h1>Configure Teacher Evaluation</h1><p>Define the school's requirements once. Every dashboard then tracks staff against the same framework.</p></div><button className="button primary" onClick={save} disabled={saving}><Save size={15}/>{saving?"Saving…":saved?"Saved online":"Save framework"}</button></header>
 <section className="planner-banner"><ShieldCheck/><div><strong>{loadedFromD1?"Connected to Cloudflare D1":"Loading stored configuration…"}</strong><span>Framework changes and organisation edits are retained online and written to the audit log.</span></div><b>Master controlled</b></section>
 <section className="grid two"><article className="card form-card"><div className="card-title"><div><h2>Annual requirements</h2><p>2026–27 Teacher Evaluation Cycle</p></div><Settings2/></div><div className="config-grid"><label>Formal observations per teacher<input type="number" min="1" max="8" value={required} onChange={e=>setRequired(Number(e.target.value))}/></label><label>Feedback due within<input type="number" min="1" value={feedbackDays} onChange={e=>setFeedbackDays(Number(e.target.value))}/><small>working days</small></label><label>Teacher reflection due within<input type="number" min="1" value={reflectionDays} onChange={e=>setReflectionDays(Number(e.target.value))}/><small>working days</small></label><Toggle label="Lesson plan required before observation" checked={lessonPlanRequired} onChange={setLessonPlanRequired}/><Toggle label="Development goal required" checked={developmentGoalRequired} onChange={setDevelopmentGoalRequired}/><Toggle label="Follow-up carried into next observation" checked={followUpRequired} onChange={setFollowUpRequired}/></div></article>
 <article className="card"><div className="card-title"><div><h2>Observation windows</h2><p>Set when each required observation should be scheduled and completed.</p></div><CalendarRange/></div><div className="window-edit-list">{windows.map((w,i)=><div className="window-edit" key={w.id}><b>{i+1}</b><div><label>Window name<input value={w.label} onChange={e=>updateWindow(w.id,{label:e.target.value})}/></label><div className="window-date-grid"><label>From<input type="date" value={w.startsOn} onChange={e=>updateWindow(w.id,{startsOn:e.target.value})}/></label><label>Complete by<input type="date" value={w.endsOn} onChange={e=>updateWindow(w.id,{endsOn:e.target.value})}/></label></div></div><label className="window-count">Required<input type="number" min="1" max="5" value={w.requiredCount} onChange={e=>updateWindow(w.id,{requiredCount:Number(e.target.value)})}/></label></div>)}</div><div className={`window-total ${windowTotal===required?"valid":"invalid"}`}>Window total: <strong>{windowTotal}</strong> · Annual requirement: <strong>{required}</strong>{windowTotal!==required&&<span> · These must match before saving.</span>}</div></article></section>
 <section className="card"><div className="card-title"><div><h2>Organisation & management lines</h2><p>The roster is initially inferred from the staff list. Master can then drag staff between departments to correct the structure.</p></div><UsersRound/></div><div className="org-builder">{hsDepartments.map(dept=><div className="org-column" key={dept} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(dept)}><div className="org-column-head"><strong>{dept}</strong><span>{buckets[dept]?.length??0} staff</span></div>{(buckets[dept]??[]).map(id=>{const person=STAFF.find(s=>s.id===id)!;return <Person key={id} person={person} onDrag={()=>setDragged(id)}/>})}</div>)}</div><p className="source-note">Moving a staff member persists their department in D1 and updates the inferred primary manager when the destination has a department lead. Explicit secondary reporting lines can be layered on without changing the dashboard permission model.</p></section>
 <section className="card"><div className="card-title"><div><h2>Recent audit history</h2><p>Key framework, organisation and evaluation changes remain traceable.</p></div><History/></div>{auditLog.length===0?<p className="source-note">No changes have been recorded yet. Saving this framework will create the first audit entries.</p>:<div className="audit-list">{auditLog.slice(0,8).map(item=><div key={item.id}><span><strong>{item.actor_name??item.actor_id}</strong><small>{String(item.action).replaceAll("."," · ")}</small></span><time>{new Date(item.created_at).toLocaleString()}</time></div>)}</div>}</section>
 </div>
}
function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(value:boolean)=>void}){return <button type="button" className="toggle-row" onClick={()=>onChange(!checked)}><span>{label}</span><i className={checked?"on":""}><b/></i></button>}
function Person({person,onDrag}:{person:StaffMember;onDrag:()=>void}){return <div className="org-person" draggable onDragStart={onDrag}><GripVertical size={15}/><div><strong>{person.name}</strong><span>{person.position}</span></div>{person.role==="manager"&&<b>Lead</b>}</div>}
