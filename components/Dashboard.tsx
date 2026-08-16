"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpenCheck, CalendarClock, CheckCircle2, ClipboardCheck, Goal, UsersRound } from "lucide-react";
import { demoStatus, eligibleStaff, FRAMEWORK, ROLE_USERS } from "@/lib/demo-data";
import { usePersistedDemoState, type PersistedDemoState } from "@/lib/use-demo-state";
import { useDemoRole } from "./AppShell";

const statusClass = (value: string) => value.toLowerCase().replaceAll(" ", "-");
const statusLabels:Record<string,string>={complete:"Complete",scheduled:"Scheduled",overdue:"Overdue",feedback_due:"Feedback due",reflection_due:"Reflection due",not_yet_due:"Not yet due",observation:"In progress",required:"Required"};

type Person={id:string;name:string;position:string;division:string;department:string};

export function Dashboard() {
  const { role } = useDemoRole();
  const {state}=usePersistedDemoState();
  if (role === "teacher") return <TeacherDashboard state={state}/>;
  if (role === "manager") return <ManagerDashboard state={state}/>;
  if (role === "division") return <DivisionDashboard state={state}/>;
  return <MasterDashboard state={state}/>;
}

function framework(state:PersistedDemoState|null){return state?.framework??FRAMEWORK}
function people(state:PersistedDemoState|null,division?:string):Person[]{
  if(!state)return eligibleStaff(division);
  return state.staff.filter(s=>Boolean(s.evaluation_eligible)&&Boolean(s.active)&&(!division||s.division===division)).map(s=>({id:s.id,name:s.name,position:s.position,division:s.division,department:s.department}));
}
function evaluationStatus(state:PersistedDemoState|null,person:Person,offset=0){
  if(!state)return demoStatus(person as any,offset);
  const records=state.evaluations.filter(e=>e.teacher_id===person.id).sort((a,b)=>String(a.scheduled_at??"").localeCompare(String(b.scheduled_at??"")));
  const record=records[offset];
  if(!record)return "Not yet due";
  return statusLabels[String(record.status)]??String(record.status);
}
function divisionProgress(state:PersistedDemoState|null,division:string){
  const members=people(state,division);if(!members.length)return 100;
  const overdue=members.filter(p=>evaluationStatus(state,p)==="Overdue").length;
  return Math.round(((members.length-overdue)/members.length)*100);
}
function groupsFor(state:PersistedDemoState|null,division:string){
  const members=people(state,division);const grouped=new Map<string,Person[]>();
  for(const person of members)grouped.set(person.department,[...(grouped.get(person.department)??[]),person]);
  return [...grouped.entries()].map(([department,group])=>{const overdue=group.filter(p=>evaluationStatus(state,p)==="Overdue").length;return{department,members:group,overdue,percent:Math.round(((group.length-overdue)/Math.max(1,group.length))*100)}});
}

function TeacherDashboard({state}:{state:PersistedDemoState|null}) {
  const teacher = ROLE_USERS.teacher;
  const config=framework(state);
  const completed=state?state.evaluations.filter(e=>e.teacher_id===teacher.id&&e.status==="complete").length:1;
  const plan=state?.lessonPlans.find(p=>p.teacher_id===teacher.id);
  const goal=state?.developmentGoals.find(g=>g.teacher_id===teacher.id&&g.status==="active");
  return <div className="page">
    <PageHead eyebrow="My teaching" title={`Good afternoon, ${teacher.name}`} text="Your next evaluation, lesson-plan actions and professional development in one place." />
    <section className="hero"><div><span className="hero-kicker"><CalendarClock size={15}/> Next formal evaluation</span><h2>Grade 10 IGCSE Mathematics · Straight-line graphs</h2><p>18 September · Period 3 · Evaluator: Cathryn Gao</p><div className="button-row"><Link className="button primary" href="/lesson-planning">Create lesson plan <ArrowRight size={15}/></Link><Link className="button secondary" href="/evaluations">View evaluation criteria</Link></div></div><div className="progress-ring"><strong>{completed}/{config.observationsRequired}</strong><span>annual observations</span></div></section>
    <section className="stat-grid four"><Stat icon={<ClipboardCheck/>} value={`${completed} of ${config.observationsRequired}`} label="Evaluations complete"/><Stat icon={<BookOpenCheck/>} value={plan?.status==="complete"?"Submitted":"Required"} label="Lesson plan for next visit"/><Stat icon={<Goal/>} value={goal?"1 active":"None"} label="Development goal"/><Stat icon={<CheckCircle2/>} value="2" label="Actions completed"/></section>
    <section className="grid two"><article className="card"><CardTitle title="What you need to do" subtitle="The system keeps the evaluation cycle moving."/><Task done text="Observation scheduled"/><Task done={plan?.status==="complete"} text="Complete lesson plan" meta="Due 17 Sep"/><Task text="Review previous development goal" meta="Questioning & formative assessment"/><Task text="Complete post-observation reflection" meta="Opens after feedback"/></article><article className="card"><CardTitle title="Professional development" subtitle="Previous targets carry into the next observation."/><div className="goal-box"><span>Current goal</span><strong>{goal?.action??"Use formative checks before independent practice"}</strong><p>Follow-up evidence will be requested in the next formal observation.</p><div className="goal-meta">Active target · follows into the next observation</div></div></article></section>
  </div>;
}

function ManagerDashboard({state}:{state:PersistedDemoState|null}) {
  const config=framework(state);
  const team = people(state,"High School").filter((s) => s.department.includes("Maths"));
  const statuses=team.map(person=>evaluationStatus(state,person));
  const onTrack=Math.round((statuses.filter(s=>s!=="Overdue").length/Math.max(1,statuses.length))*100);
  const upcoming=statuses.filter(s=>s==="Scheduled"||s==="In progress").length;
  const needsAction=statuses.filter(s=>["Overdue","Feedback due","Reflection due"].includes(s)).length;
  return <div className="page"><PageHead eyebrow="Department leadership" title="Mathematics, Economics & Computer Science" text="Everything you are responsible for completing with your team." />
    <section className="stat-grid four"><Stat icon={<UsersRound/>} value={String(team.length)} label="Teachers"/><Stat icon={<CheckCircle2/>} value={`${onTrack}%`} label="Cycle 1 on track"/><Stat icon={<CalendarClock/>} value={String(upcoming)} label="Upcoming / in progress"/><Stat icon={<AlertTriangle/>} value={String(needsAction)} label="Needs action" tone="warn"/></section>
    <section className="card"><CardTitle title="My teachers" subtitle={`${config.academicYear} requirement: ${config.observationsRequired} formal observations per teacher.`}/><div className="teacher-table head"><span>Teacher</span><span>Observation 1</span><span>Observation 2</span><span>Observation 3</span><span>Next action</span></div>{team.map((person) => <div className="teacher-table" key={person.id}><span><strong>{person.name}</strong><small>{person.position}</small></span>{[0,1,2].map((n) => {const status=evaluationStatus(state,person,n);return <span key={n} className={`status ${statusClass(status)}`}>{status}</span>})}<span><Link href="/evaluations">Open <ArrowRight size={14}/></Link></span></div>)}</section>
  </div>;
}

function DivisionDashboard({state}:{state:PersistedDemoState|null}) {
  const highSchool = people(state,"High School");
  const groups = groupsFor(state,"High School");
  const statuses=highSchool.map(p=>evaluationStatus(state,p));
  const overdue = statuses.filter(status=>status==="Overdue").length;
  const upcoming=statuses.filter(status=>status==="Scheduled"||status==="In progress").length;
  const followUps=state?state.developmentGoals.filter(goal=>goal.status==="active"&&highSchool.some(p=>p.id===goal.teacher_id)).length:7;
  return <div className="page"><PageHead eyebrow="High School" title="Teacher Evaluation" text="A clear view of progress without needing departments to submit separate tracking sheets." />
    <section className="stat-grid five"><Stat icon={<UsersRound/>} value={String(highSchool.length)} label="Evaluation-eligible staff"/><Stat icon={<CheckCircle2/>} value={`${divisionProgress(state,"High School")}%`} label="On track"/><Stat icon={<CalendarClock/>} value={String(upcoming)} label="Upcoming / in progress"/><Stat icon={<AlertTriangle/>} value={String(overdue)} label="Overdue" tone="warn"/><Stat icon={<Goal/>} value={String(followUps)} label="Follow-up actions"/></section>
    <section className="grid division-grid"><article className="card"><CardTitle title="Departments" subtitle="Clicking a department will later drill into its teachers and evidence."/><div className="dept-list">{groups.map((g) => <div key={g.department}><div><strong>{g.department}</strong><span>{g.members.length} staff · {g.overdue} overdue</span></div><div className="bar"><i style={{width:`${Math.max(12,g.percent)}%`}}/></div><b>{g.percent}%</b></div>)}</div></article><article className="card"><CardTitle title="Teaching & learning trends" subtitle="Fictional demo insights aggregated from observation records."/><Trend label="Common strengths" items={["Positive learning environment","Subject knowledge","Student engagement"]}/><Trend label="Development priorities" items={["Formative assessment","Differentiation","Questioning"]}/></article></section>
  </div>;
}

function MasterDashboard({state}:{state:PersistedDemoState|null}) {
  const config=framework(state);
  const all = people(state);
  const statuses=all.map(p=>evaluationStatus(state,p));
  const overdue=statuses.filter(status=>status==="Overdue").length;
  const scheduled=statuses.filter(status=>status==="Scheduled"||status==="In progress").length;
  const onTrack=Math.round(((all.length-overdue)/Math.max(1,all.length))*100);
  const openGoals=state?state.developmentGoals.filter(goal=>goal.status==="active").length:17;
  return <div className="page"><PageHead eyebrow="Whole school · Master" title="Teacher Evaluation System" text="Set the school's evaluation expectations once, then see completion and improvement across every level." actions={<Link className="button primary" href="/master"><Settings2Icon/>Configure system</Link>} />
    <section className="hero master-hero"><div><span className="hero-kicker"><ClipboardCheck size={15}/> {config.academicYear} framework</span><h2>{config.observationsRequired} formal observations per teacher</h2><p>{config.lessonPlanRequired?"Lesson plan required":"Lesson plan optional"} · feedback within {config.feedbackDueDays} working days · reflection within {config.reflectionDueDays} working days.</p></div><div className="progress-ring"><strong>{all.length}</strong><span>eligible staff</span></div></section>
    <section className="stat-grid four"><Stat icon={<CheckCircle2/>} value={`${onTrack}%`} label="School on track"/><Stat icon={<CalendarClock/>} value={String(scheduled)} label="Scheduled / in progress"/><Stat icon={<AlertTriangle/>} value={String(overdue)} label="Overdue" tone="warn"/><Stat icon={<Goal/>} value={String(openGoals)} label="Open development actions"/></section>
    <section className="card"><CardTitle title="Division view" subtitle="Drill down from school to division, department, teacher and evidence."/><div className="division-cards">{["Primary","Middle School","High School","Cross-Divisional"].map((division) => {const percent=divisionProgress(state,division);return <div key={division}><span>{division}</span><strong>{percent}%</strong><small>{people(state,division).length} evaluation-eligible staff</small><div className="bar"><i style={{width:`${percent}%`}}/></div></div>})}</div></section>
  </div>;
}

function PageHead({eyebrow,title,text,actions}:{eyebrow:string;title:string;text:string;actions?:React.ReactNode}){return <header className="page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{actions}</header>}
function Stat({icon,value,label,tone}:{icon:React.ReactNode;value:string;label:string;tone?:string}){return <article className={`stat ${tone??""}`}><div>{icon}</div><strong>{value}</strong><span>{label}</span></article>}
function CardTitle({title,subtitle}:{title:string;subtitle:string}){return <div className="card-title"><div><h2>{title}</h2><p>{subtitle}</p></div></div>}
function Task({text,meta,done}:{text:string;meta?:string;done?:boolean}){return <div className={`task ${done?"done":""}`}><span>{done?<CheckCircle2/>:<span className="empty-check"/>}</span><div><strong>{text}</strong>{meta&&<small>{meta}</small>}</div></div>}
function Trend({label,items}:{label:string;items:string[]}){return <div className="trend"><span>{label}</span>{items.map((item,i)=><div key={item}><b>{i+1}</b><strong>{item}</strong></div>)}</div>}
function Settings2Icon(){return <span aria-hidden>⚙</span>}
