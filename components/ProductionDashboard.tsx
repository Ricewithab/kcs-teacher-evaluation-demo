"use client";

import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck, Goal, UsersRound } from "lucide-react";
import { useAppSession } from "@/components/AppShell";
import { apiPath } from "@/lib/paths";
import { usePersistedDemoState } from "@/lib/use-demo-state";

const labels:Record<string,string>={
  complete:"Complete",waived:"Waived",scheduled:"Scheduled",due:"Schedule",overdue:"Overdue",
  feedback_due:"Feedback due",feedback_overdue:"Feedback overdue",reflection_due:"Reflection due",
  reflection_overdue:"Reflection overdue",development_due:"Development goal due",not_yet_due:"Not yet due",
};
const problemStatuses=new Set(["due","overdue","feedback_due","feedback_overdue","reflection_due","reflection_overdue","development_due"]);

function statusLabel(value:string){return labels[value]??value.replaceAll("_"," ")}
function formatDate(value?:string|null){if(!value)return "—";const date=new Date(value.length===10?`${value}T00:00:00`:value);return Number.isNaN(date.getTime())?value:date.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}
function AppLink({href,className,children}:{href:string;className?:string;children:React.ReactNode}){return <a href={apiPath(href)} className={className}>{children}</a>}
function operationalIds(state:any,user:any){return new Set<string>(state.access?.operationalStaffIds??[user.staffId])}

export function ProductionDashboard(){
 const {user}=useAppSession();
 const {state,loading,error}=usePersistedDemoState();
 if(loading)return <Loading/>;
 if(error||!state||!user)return <ErrorState/>;
 if(user.systemRole==="teacher"||user.systemRole==="staff")return <Teacher user={user} state={state}/>;
 if(user.systemRole==="manager")return <Manager user={user} state={state}/>;
 if(user.systemRole==="division")return <Leadership user={user} state={state} division/>;
 return <Leadership user={user} state={state}/>;
}

function Teacher({user,state}:{user:any;state:any}){
 const requirements=(state.requirements??[]).filter((r:any)=>r.teacher_id===user.staffId);
 const completed=requirements.filter((r:any)=>r.status==="complete"||r.status==="waived").length;
 const action=requirements.filter((r:any)=>problemStatuses.has(r.status));
 const scheduled=requirements.filter((r:any)=>r.status==="scheduled").sort((a:any,b:any)=>String(a.scheduled_at).localeCompare(String(b.scheduled_at)))[0];
 const goal=(state.developmentGoals??[]).find((g:any)=>g.teacher_id===user.staffId&&g.status==="active");
 const plan=scheduled?.evaluation_id?(state.lessonPlans??[]).find((p:any)=>p.evaluation_id===scheduled.evaluation_id):null;
 return <div className="page"><PageHead eyebrow="My teaching" title={`Hello, ${user.name}`} text="Your required evaluations, preparation, feedback and development actions."/>
  <section className="hero"><div><span className="hero-kicker"><CalendarClock size={15}/> Next evaluation</span>{scheduled?<><h2>{scheduled.window_label}</h2><p>{formatDate(scheduled.scheduled_at)} · {scheduled.class_name??"Class to be confirmed"}</p><div className="button-row"><AppLink className="button primary" href={scheduled.evaluation_id?`/evaluations/${scheduled.evaluation_id}`:"/evaluations"}>Open evaluation <ArrowRight size={15}/></AppLink><AppLink className="button secondary" href="/lesson-planning">{plan?"Open lesson plan":"Create lesson plan"}</AppLink></div></>:<><h2>No observation currently scheduled</h2><p>Your line manager can schedule a required observation from the evaluation centre.</p><AppLink className="button secondary" href="/evaluations">View annual requirements</AppLink></>}</div><div className="progress-ring"><strong>{completed}/{requirements.length||0}</strong><span>annual requirements</span></div></section>
  <section className="stat-grid four"><Stat icon={<CheckCircle2/>} value={String(completed)} label="Complete"/><Stat icon={<CalendarClock/>} value={String(requirements.filter((r:any)=>r.status==="scheduled").length)} label="Scheduled"/><Stat icon={<AlertTriangle/>} value={String(action.length)} label="Actions due" tone={action.length?"warn":undefined}/><Stat icon={<Goal/>} value={goal?"1 active":"None"} label="Development goal"/></section>
  <section className="grid two"><article className="card"><CardTitle title="My annual evaluation cycle" subtitle={state.framework?.academicYear??"Current academic year"}/><RequirementList requirements={requirements}/></article><article className="card"><CardTitle title="Current development" subtitle="Targets remain visible until reviewed and closed."/>{goal?<div className="goal-box"><span>Active goal</span><strong>{goal.title}</strong><p>{goal.action}</p><div className="goal-meta">Review {formatDate(goal.review_on)}</div></div>:<div className="empty-state">No active development goal.</div>}</article></section>
 </div>
}

function Manager({user,state}:{user:any;state:any}){
 const operational=operationalIds(state,user);
 const staff=(state.staff??[]).filter((s:any)=>s.id!==user.staffId&&operational.has(s.id)&&s.evaluation_eligible&&s.active);
 const teamIds=new Set(staff.map((s:any)=>s.id));
 const reqs=(state.requirements??[]).filter((r:any)=>teamIds.has(r.teacher_id));
 const action=reqs.filter((r:any)=>problemStatuses.has(r.status)).length;
 const completed=reqs.filter((r:any)=>r.status==="complete"||r.status==="waived").length;
 return <div className="page"><PageHead eyebrow="Department leadership" title={user.department} text="Required observations and next actions for staff in your reporting hierarchy."/>
  <section className="stat-grid four"><Stat icon={<UsersRound/>} value={String(staff.length)} label="Staff in scope"/><Stat icon={<CheckCircle2/>} value={`${completed}/${reqs.length}`} label="Requirements complete"/><Stat icon={<CalendarClock/>} value={String(reqs.filter((r:any)=>r.status==="scheduled").length)} label="Scheduled"/><Stat icon={<AlertTriangle/>} value={String(action)} label="Needs action" tone={action?"warn":undefined}/></section>
  <section className="card"><CardTitle title="My team" subtitle="Only staff in your school reporting line are shown here; technical administrator access does not change this scope."/><TeamTable staff={staff} requirements={reqs}/></section>
 </div>
}

function Leadership({user,state,division=false}:{user:any;state:any;division?:boolean}){
 const operational=operationalIds(state,user);
 const staff=(state.staff??[]).filter((s:any)=>operational.has(s.id)&&s.evaluation_eligible&&s.active);
 const reqs=(state.requirements??[]).filter((r:any)=>operational.has(r.teacher_id));
 const complete=reqs.filter((r:any)=>r.status==="complete"||r.status==="waived").length;
 const scheduled=reqs.filter((r:any)=>r.status==="scheduled").length;
 const overdue=reqs.filter((r:any)=>["overdue","feedback_overdue","reflection_overdue"].includes(r.status)).length;
 const action=reqs.filter((r:any)=>problemStatuses.has(r.status)).length;
 const groups=new Map<string,{staff:Set<string>;requirements:any[]}>();
 for(const person of staff){const key=division?person.department:person.division;const current=groups.get(key)??{staff:new Set(),requirements:[]};current.staff.add(person.id);groups.set(key,current)}
 for(const req of reqs){const person=staff.find((s:any)=>s.id===req.teacher_id);if(!person)continue;const key=division?person.department:person.division;const current=groups.get(key)??{staff:new Set(),requirements:[]};current.requirements.push(req);groups.set(key,current)}
 return <div className="page"><PageHead eyebrow={division?user.division:"Whole school · Master"} title="Teacher Evaluation" text="Live progress against the school’s published evaluation requirements." actions={!division?<AppLink className="button primary" href="/master">Configure system</AppLink>:undefined}/>
  <section className="stat-grid five"><Stat icon={<UsersRound/>} value={String(staff.length)} label="Evaluation-eligible staff"/><Stat icon={<CheckCircle2/>} value={reqs.length?`${Math.round(complete/reqs.length*100)}%`:"—"} label="Requirements complete"/><Stat icon={<CalendarClock/>} value={String(scheduled)} label="Scheduled"/><Stat icon={<AlertTriangle/>} value={String(overdue)} label="Overdue" tone={overdue?"warn":undefined}/><Stat icon={<ClipboardCheck/>} value={String(action)} label="Actions due"/></section>
  <section className="card"><CardTitle title={division?"Departments":"Divisions"} subtitle="Drill-down readiness and completion calculated from individual requirement records."/><div className="division-cards">{[...groups.entries()].map(([name,group])=>{const total=group.requirements.length;const done=group.requirements.filter(r=>r.status==="complete"||r.status==="waived").length;const percent=total?Math.round(done/total*100):0;const needs=group.requirements.filter(r=>problemStatuses.has(r.status)).length;return <div key={name}><span>{name}</span><strong>{percent}%</strong><small>{group.staff.size} staff · {needs} actions due</small><div className="bar"><i style={{width:`${percent}%`}}/></div></div>})}</div></section>
  <section className="card"><CardTitle title="Staff requiring attention" subtitle="The most actionable items across your current scope."/><RequirementActions state={state} requirements={reqs.filter((r:any)=>problemStatuses.has(r.status)).slice(0,12)}/></section>
 </div>
}

function TeamTable({staff,requirements}:{staff:any[];requirements:any[]}){return <div className="production-team-table"><div className="production-team-row head"><span>Staff member</span><span>Annual progress</span><span>Current action</span><span></span></div>{staff.map(person=>{const own=requirements.filter(r=>r.teacher_id===person.id);const done=own.filter(r=>r.status==="complete"||r.status==="waived").length;const next=own.find(r=>problemStatuses.has(r.status))??own.find(r=>r.status==="scheduled")??own.find(r=>r.status==="not_yet_due");return <div className="production-team-row" key={person.id}><span><strong>{person.name}</strong><small>{person.position}</small></span><span><strong>{done}/{own.length}</strong><small>requirements complete</small></span><span><b className={`cycle-status ${next?.status??"complete"}`}>{next?statusLabel(next.status):"Complete"}</b><small>{next?.dueAt?formatDate(next.dueAt):""}</small></span><span><AppLink href="/evaluations">Open <ArrowRight size={13}/></AppLink></span></div>})}</div>}
function RequirementList({requirements}:{requirements:any[]}){if(!requirements.length)return <div className="empty-state">Annual requirements have not been published yet.</div>;return <div className="requirement-list">{requirements.map(req=><div key={req.id}><span><strong>{req.window_label}</strong><small>Complete by {formatDate(req.due_on)}</small></span><b className={`cycle-status ${req.status}`}>{statusLabel(req.status)}</b>{req.evaluation_id?<AppLink href={`/evaluations/${req.evaluation_id}`}>Open</AppLink>:<AppLink href="/evaluations">View</AppLink>}</div>)}</div>}
function RequirementActions({state,requirements}:{state:any;requirements:any[]}){if(!requirements.length)return <div className="empty-state">No outstanding actions in this scope.</div>;return <div className="requirement-action-list">{requirements.map(req=>{const person=state.staff.find((s:any)=>s.id===req.teacher_id);return <div key={req.id}><span><strong>{person?.name??req.teacher_id}</strong><small>{req.window_label} · {req.dueAt?`Due ${formatDate(req.dueAt)}`:"Action required"}</small></span><b className={`cycle-status ${req.status}`}>{statusLabel(req.status)}</b><AppLink href={req.evaluation_id?`/evaluations/${req.evaluation_id}`:"/evaluations"}>Open <ArrowRight size={13}/></AppLink></div>})}</div>}
function PageHead({eyebrow,title,text,actions}:{eyebrow:string;title:string;text:string;actions?:React.ReactNode}){return <header className="page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{actions}</header>}
function Stat({icon,value,label,tone}:{icon:React.ReactNode;value:string;label:string;tone?:string}){return <article className={`stat ${tone??""}`}><div>{icon}</div><strong>{value}</strong><span>{label}</span></article>}
function CardTitle({title,subtitle}:{title:string;subtitle:string}){return <div className="card-title"><div><h2>{title}</h2><p>{subtitle}</p></div></div>}
function Loading(){return <div className="page"><div className="card empty-state">Loading your evaluation workspace…</div></div>}
function ErrorState(){return <div className="page"><div className="card locked"><AlertTriangle/><h2>Unable to load evaluation data</h2><p>Refresh the page. If the problem continues, contact the system administrator.</p></div></div>}
