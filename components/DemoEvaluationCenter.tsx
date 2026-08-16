"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, ClipboardCheck, FileText, Goal, MessageSquareText } from "lucide-react";
import { useState } from "react";
import { demoStatus, eligibleStaff, FRAMEWORK, ROLE_USERS } from "@/lib/demo-data";
import { apiPath } from "@/lib/paths";
import { usePersistedDemoState } from "@/lib/use-demo-state";
import { useDemoRole } from "./AppShell";

const statusLabels:Record<string,string>={complete:"Complete",scheduled:"Scheduled",overdue:"Overdue",feedback_due:"Feedback due",reflection_due:"Reflection due",not_yet_due:"Not yet due",observation:"In progress",required:"Required"};

export function DemoEvaluationCenter(){
  const {role}=useDemoRole();
  const {state,refresh}=usePersistedDemoState();
  const teacher=ROLE_USERS.teacher;
  const actor=ROLE_USERS[role];
  const list=role==="teacher"?[teacher]:state?state.staff.filter((s:any)=>s.division==="High School"&&s.evaluation_eligible&&s.active).slice(0,14):eligibleStaff("High School").slice(0,14);
  const candidates=state?state.staff.filter((s:any)=>s.division==="High School"&&s.evaluation_eligible&&s.active):eligibleStaff("High School");
  const framework=state?.framework??FRAMEWORK;
  const canSchedule=role==="manager"||role==="master";
  const [scheduleTeacher,setScheduleTeacher]=useState(teacher.id);
  const [scheduledAt,setScheduledAt]=useState("2026-09-18T10:20");
  const [className,setClassName]=useState("Grade 10 Mathematics");
  const [subject,setSubject]=useState("IGCSE Mathematics");
  const [scheduling,setScheduling]=useState(false);
  const [scheduleSaved,setScheduleSaved]=useState(false);
  function statusFor(person:any){
    if(!state)return demoStatus(person);
    const evaluations=state.evaluations.filter((item:any)=>item.teacher_id===person.id).sort((a:any,b:any)=>String(a.scheduled_at??"").localeCompare(String(b.scheduled_at??"")));
    const evaluation=evaluations[0];
    return evaluation?statusLabels[String(evaluation.status)]??String(evaluation.status):"Not yet due";
  }
  function planFor(person:any){return state?.lessonPlans.find((plan:any)=>plan.teacher_id===person.id)}
  function goalFor(person:any){return state?.developmentGoals.find((goal:any)=>goal.teacher_id===person.id&&goal.status==="active")}
  const teacherEvaluation=state?.evaluations.find((evaluation:any)=>evaluation.teacher_id===teacher.id);
  async function schedule(){
    setScheduling(true);setScheduleSaved(false);
    try{
      const response=await fetch(apiPath("/api/evaluations/schedule"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({actorId:actor.id,teacherId:scheduleTeacher,evaluatorId:actor.id,frameworkId:state?.framework?.id??"framework-2026-27",windowId:state?.framework?.windows?.[0]?.id??"w1",scheduledAt,className,subject})});
      if(!response.ok)throw new Error("Unable to schedule observation");
      setScheduleSaved(true);await refresh();
    }catch(error){console.error(error);window.alert("The observation could not be scheduled.")}
    finally{setScheduling(false)}
  }
  return <div className="page"><header className="page-head"><div><span className="eyebrow">Evaluation workflow</span><h1>{role==="teacher"?"My evaluations":"Evaluation centre"}</h1><p>Schedule → prepare → observe → feedback → reflect → develop → follow up.</p></div></header>
    <section className="workflow"><Step icon={<CalendarClock/>} label="Schedule"/><Step icon={<FileText/>} label="Lesson plan"/><Step icon={<ClipboardCheck/>} label="Observe"/><Step icon={<MessageSquareText/>} label="Feedback"/><Step icon={<CheckCircle2/>} label="Reflection"/><Step icon={<Goal/>} label="Develop"/></section>
    {canSchedule&&<section className="card form-card"><div className="card-title"><div><h2>Schedule an observation</h2><p>Create the observation once; it then appears in the teacher, manager and leadership views.</p></div><CalendarClock/></div><div className="form-grid"><label>Teacher<select value={scheduleTeacher} onChange={e=>setScheduleTeacher(e.target.value)}>{candidates.map((person:any)=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label>Date & time<input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}/></label><label>Class<input value={className} onChange={e=>setClassName(e.target.value)}/></label><label>Subject<input value={subject} onChange={e=>setSubject(e.target.value)}/></label></div><div className="button-row"><button className="button primary" onClick={schedule} disabled={scheduling}>{scheduling?"Scheduling…":scheduleSaved?"Scheduled online":"Schedule observation"}</button><span className="source-note">Evaluator: {actor.name} · stored in Cloudflare D1</span></div></section>}
    {role==="teacher"&&<section className="hero compact"><div><span className="hero-kicker">Observation 2 · {statusFor(teacher)}</span><h2>{teacherEvaluation?.class_name??"Grade 10 IGCSE Mathematics"}</h2><p>18 September · Period 3 · Evaluator: Cathryn Gao</p><div className="button-row"><Link href="/evaluations/demo" className="button primary">Open connected record</Link></div></div><div className={`status ${statusFor(teacher).toLowerCase().replaceAll(" ","-")}`}>{statusFor(teacher)}</div></section>}
    <section className="card"><div className="card-title"><div><h2>{role==="teacher"?"Annual record":"High School records"}</h2><p>{framework.academicYear} · {framework.observationsRequired} formal observations required per teacher</p></div></div>
      <div className="eval-table head"><span>Teacher</span><span>Department</span><span>Current stage</span><span>Lesson plan</span><span>Development</span></div>{list.map((person:any)=><div className="eval-table" key={person.id}><span><strong>{person.name}</strong><small>{person.position}</small></span><span>{person.department}</span><span><b className={`status ${statusFor(person).toLowerCase().replaceAll(" ","-")}`}>{statusFor(person)}</b></span><span>{planFor(person)?.status==="complete"?"Submitted":"Required"}</span><span>{goalFor(person)?"Follow-up":"On track"}</span></div>)}
    </section>
    <section className="grid two"><article className="card"><div className="card-title"><div><h2>Observation record</h2><p>Every stage is retained online as one connected record.</p></div></div><ul className="record-list"><li>Scheduling details and evaluator</li><li>Attached lesson plan and supporting material</li><li>Rubric ratings, notes and evidence</li><li>Written strengths and development feedback</li><li>Teacher reflection and acknowledgement</li><li>Development goal, action and review date</li><li>Follow-up evidence in the next observation</li></ul><Link className="button secondary" href="/evaluations/demo">Open full demo record</Link></article><article className="card"><div className="card-title"><div><h2>Previous target follows forward</h2><p>The next evaluator sees what the teacher was working on.</p></div></div><div className="goal-box"><span>Previous development priority</span><strong>Formative assessment</strong><p>{goalFor(teacher)?.action??"Use whole-class checks for understanding before moving into independent practice."}</p><div className="goal-meta">Follow-up required in this observation</div></div></article></section>
  </div>
}
function Step({icon,label}:{icon:React.ReactNode;label:string}){return <div>{icon}<span>{label}</span></div>}
