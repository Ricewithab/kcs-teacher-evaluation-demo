"use client";

import { CalendarRange, GripVertical, Save, Settings2, ShieldCheck, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { FRAMEWORK, STAFF, type StaffMember } from "@/lib/demo-data";
import { useDemoRole } from "./AppShell";

const hsDepartments=["语文人文组Chinese&Humanities","英语组English","数学经济组 Maths & Economics","科学计算机组 Science & Computer Science","升学指导 College Counseling"];

export function MasterConfiguration(){
 const {role}=useDemoRole();
 const [required,setRequired]=useState(FRAMEWORK.observationsRequired);
 const [feedbackDays,setFeedbackDays]=useState(FRAMEWORK.feedbackDueDays);
 const [reflectionDays,setReflectionDays]=useState(FRAMEWORK.reflectionDueDays);
 const [saved,setSaved]=useState(false);
 const initial=useMemo(()=>Object.fromEntries(hsDepartments.map(d=>[d,STAFF.filter(s=>s.division==="High School"&&s.department===d).map(s=>s.id)])),[]);
 const [buckets,setBuckets]=useState<Record<string,string[]>>(initial);
 const [dragged,setDragged]=useState<string|null>(null);
 function drop(dept:string){if(!dragged)return;setBuckets(current=>{const next=Object.fromEntries(Object.entries(current).map(([k,v])=>[k,v.filter(id=>id!==dragged)]));next[dept]=[...(next[dept]??[]),dragged];return next});setDragged(null)}
 if(role!=="master") return <div className="page"><header className="page-head"><div><span className="eyebrow">Master-only configuration</span><h1>System preview</h1><p>In production, only the Head of School/Master account can change the school framework and staff management lines.</p></div></header><section className="card locked"><ShieldCheck/><h2>Master controls are protected</h2><p>Switch the demo role to <strong>Head of School · Master</strong> to interact with these settings.</p></section></div>;
 return <div className="page"><header className="page-head"><div><span className="eyebrow">Head of School · Master</span><h1>Configure Teacher Evaluation</h1><p>Define the school's requirements once. Every dashboard then tracks staff against the same framework.</p></div><button className="button primary" onClick={()=>setSaved(true)}><Save size={15}/>{saved?"Configuration saved":"Save framework"}</button></header>
 <section className="grid two"><article className="card form-card"><div className="card-title"><div><h2>Annual requirements</h2><p>2026–27 Teacher Evaluation Cycle</p></div><Settings2/></div><div className="config-grid"><label>Formal observations per teacher<input type="number" min="1" max="8" value={required} onChange={e=>setRequired(Number(e.target.value))}/></label><label>Feedback due within<input type="number" min="1" value={feedbackDays} onChange={e=>setFeedbackDays(Number(e.target.value))}/><small>working days</small></label><label>Teacher reflection due within<input type="number" min="1" value={reflectionDays} onChange={e=>setReflectionDays(Number(e.target.value))}/><small>working days</small></label><Toggle label="Lesson plan required before observation" checked/><Toggle label="Development goal required" checked/><Toggle label="Follow-up carried into next observation" checked/></div></article>
 <article className="card"><div className="card-title"><div><h2>Observation windows</h2><p>Managers are prompted to schedule within these periods.</p></div><CalendarRange/></div><div className="window-list">{FRAMEWORK.windows.map((w,i)=><div key={w.id}><b>{i+1}</b><div><strong>{w.label}</strong><span>{w.range}</span></div><small>Complete by {w.due}</small></div>)}</div></article></section>
 <section className="card"><div className="card-title"><div><h2>Organisation & management lines</h2><p>The roster is initially inferred from the staff list. Master can then drag staff between departments to correct the structure.</p></div><UsersRound/></div><div className="org-builder">{hsDepartments.map(dept=><div className="org-column" key={dept} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(dept)}><div className="org-column-head"><strong>{dept}</strong><span>{buckets[dept]?.length??0} staff</span></div>{(buckets[dept]??[]).map(id=>{const person=STAFF.find(s=>s.id===id)!;return <Person key={id} person={person} onDrag={()=>setDragged(id)}/>})}</div>)}</div><p className="source-note">This is the first-pass inferred High School structure. Cross-divisional managers and secondary reporting relationships will be supported separately rather than forcing the school into one rigid tree.</p></section>
 </div>
}
function Toggle({label,checked}:{label:string;checked:boolean}){const [on,setOn]=useState(checked);return <button className="toggle-row" onClick={()=>setOn(v=>!v)}><span>{label}</span><i className={on?"on":""}><b/></i></button>}
function Person({person,onDrag}:{person:StaffMember;onDrag:()=>void}){return <div className="org-person" draggable onDragStart={onDrag}><GripVertical size={15}/><div><strong>{person.name}</strong><span>{person.position}</span></div>{person.role==="manager"&&<b>Lead</b>}</div>}
