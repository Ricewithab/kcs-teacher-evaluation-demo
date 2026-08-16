"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, ClipboardCheck, FileText, Goal, MessageSquareText } from "lucide-react";
import { demoStatus, eligibleStaff, FRAMEWORK, ROLE_USERS } from "@/lib/demo-data";
import { usePersistedDemoState } from "@/lib/use-demo-state";
import { useDemoRole } from "./AppShell";

const statusLabels:Record<string,string>={complete:"Complete",scheduled:"Scheduled",overdue:"Overdue",feedback_due:"Feedback due",reflection_due:"Reflection due",not_yet_due:"Not yet due",observation:"In progress",required:"Required"};

export function EvaluationCenter(){
  const {role}=useDemoRole();
  const {state}=usePersistedDemoState();
  const teacher=ROLE_USERS.teacher;
  const list=role==="teacher"?[teacher]:state?state.staff.filter((s:any)=>s.division==="High School"&&s.evaluation_eligible&&s.active).slice(0,14):eligibleStaff("High School").slice(0,14);
  const framework=state?.framework??FRAMEWORK;
  function statusFor(person:any){
    if(!state)return demoStatus(person);
    const evaluation=state.evaluations.find((item:any)=>item.teacher_id===person.id);
    return evaluation?statusLabels[String(evaluation.status)]??String(evaluation.status):"Not yet due";
  }
  function planFor(person:any){return state?.lessonPlans.find((plan:any)=>plan.teacher_id===person.id)}
  function goalFor(person:any){return state?.developmentGoals.find((goal:any)=>goal.teacher_id===person.id&&goal.status==="active")}
  const teacherEvaluation=state?.evaluations.find((evaluation:any)=>evaluation.teacher_id===teacher.id);
  return <div className="page"><header className="page-head"><div><span className="eyebrow">Evaluation workflow</span><h1>{role==="teacher"?"My evaluations":"Evaluation centre"}</h1><p>Schedule → prepare → observe → feedback → reflect → develop → follow up.</p></div></header>
    <section className="workflow"><Step icon={<CalendarClock/>} label="Schedule"/><Step icon={<FileText/>} label="Lesson plan"/><Step icon={<ClipboardCheck/>} label="Observe"/><Step icon={<MessageSquareText/>} label="Feedback"/><Step icon={<CheckCircle2/>} label="Reflection"/><Step icon={<Goal/>} label="Develop"/></section>
    {role==="teacher"&&<section className="hero compact"><div><span className="hero-kicker">Observation 2 · {statusFor(teacher)}</span><h2>{teacherEvaluation?.class_name??"Grade 10 IGCSE Mathematics"}</h2><p>18 September · Period 3 · Evaluator: Cathryn Gao</p><div className="button-row"><Link href="/evaluations/demo" className="button primary">Open connected record</Link></div></div><div className={`status ${statusFor(teacher).toLowerCase().replaceAll(" ","-")}`}>{statusFor(teacher)}</div></section>}
    <section className="card"><div className="card-title"><div><h2>{role==="teacher"?"Annual record":"High School records"}</h2><p>{framework.academicYear} · {framework.observationsRequired} formal observations required per teacher</p></div></div>
      <div className="eval-table head"><span>Teacher</span><span>Department</span><span>Current stage</span><span>Lesson plan</span><span>Development</span></div>{list.map((person:any)=><div className="eval-table" key={person.id}><span><strong>{person.name}</strong><small>{person.position}</small></span><span>{person.department}</span><span><b className={`status ${statusFor(person).toLowerCase().replaceAll(" ","-")}`}>{statusFor(person)}</b></span><span>{planFor(person)?.status==="complete"?"Submitted":"Required"}</span><span>{goalFor(person)?"Follow-up":"On track"}</span></div>)}
    </section>
    <section className="grid two"><article className="card"><div className="card-title"><div><h2>Observation record</h2><p>Every stage is retained online as one connected record.</p></div></div><ul className="record-list"><li>Scheduling details and evaluator</li><li>Attached lesson plan and supporting material</li><li>Rubric ratings, notes and evidence</li><li>Written strengths and development feedback</li><li>Teacher reflection and acknowledgement</li><li>Development goal, action and review date</li><li>Follow-up evidence in the next observation</li></ul><Link className="button secondary" href="/evaluations/demo">Open full demo record</Link></article><article className="card"><div className="card-title"><div><h2>Previous target follows forward</h2><p>The next evaluator sees what the teacher was working on.</p></div></div><div className="goal-box"><span>Previous development priority</span><strong>Formative assessment</strong><p>{goalFor(teacher)?.action??"Use whole-class checks for understanding before moving into independent practice."}</p><div className="goal-meta">Follow-up required in this observation</div></div></article></section>
  </div>
}
function Step({icon,label}:{icon:React.ReactNode;label:string}){return <div>{icon}<span>{label}</span></div>}
