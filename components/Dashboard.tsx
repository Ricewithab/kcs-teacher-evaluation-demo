"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpenCheck, CalendarClock, CheckCircle2, ClipboardCheck, Goal, UsersRound } from "lucide-react";
import { departmentSummary, demoStatus, eligibleStaff, FRAMEWORK, ROLE_USERS } from "@/lib/demo-data";
import { useDemoRole } from "./AppShell";

const statusClass = (value: string) => value.toLowerCase().replaceAll(" ", "-");

export function Dashboard() {
  const { role } = useDemoRole();
  if (role === "teacher") return <TeacherDashboard />;
  if (role === "manager") return <ManagerDashboard />;
  if (role === "division") return <DivisionDashboard />;
  return <MasterDashboard />;
}

function TeacherDashboard() {
  const teacher = ROLE_USERS.teacher;
  return <div className="page">
    <PageHead eyebrow="My teaching" title={`Good afternoon, ${teacher.name}`} text="Your next evaluation, lesson-plan actions and professional development in one place." />
    <section className="hero"><div><span className="hero-kicker"><CalendarClock size={15}/> Next formal evaluation</span><h2>Grade 10 IGCSE Mathematics · Straight-line graphs</h2><p>18 September · Period 3 · Evaluator: Cathryn Gao</p><div className="button-row"><Link className="button primary" href="/lesson-planning">Create lesson plan <ArrowRight size={15}/></Link><Link className="button secondary" href="/evaluations">View evaluation criteria</Link></div></div><div className="progress-ring"><strong>1/3</strong><span>annual observations</span></div></section>
    <section className="stat-grid four"><Stat icon={<ClipboardCheck/>} value="1 of 3" label="Evaluations complete"/><Stat icon={<BookOpenCheck/>} value="Required" label="Lesson plan for next visit"/><Stat icon={<Goal/>} value="1 active" label="Development goal"/><Stat icon={<CheckCircle2/>} value="2" label="Actions completed"/></section>
    <section className="grid two"><article className="card"><CardTitle title="What you need to do" subtitle="The system keeps the evaluation cycle moving."/><Task done text="Observation scheduled"/><Task text="Complete lesson plan" meta="Due 17 Sep"/><Task text="Review previous development goal" meta="Questioning & formative assessment"/><Task text="Complete post-observation reflection" meta="Opens after feedback"/></article><article className="card"><CardTitle title="Professional development" subtitle="Previous targets carry into the next observation."/><div className="goal-box"><span>Current goal</span><strong>Use formative checks before independent practice</strong><p>Follow-up evidence will be requested in the next formal observation.</p><div className="goal-meta">Set after Observation 1 · Review in Observation 2</div></div></article></section>
  </div>;
}

function ManagerDashboard() {
  const team = eligibleStaff("High School").filter((s) => s.department.includes("Maths"));
  return <div className="page"><PageHead eyebrow="Department leadership" title="Mathematics, Economics & Computer Science" text="Everything you are responsible for completing with your team." />
    <section className="stat-grid four"><Stat icon={<UsersRound/>} value={String(team.length)} label="Teachers"/><Stat icon={<CheckCircle2/>} value="67%" label="Cycle 1 complete"/><Stat icon={<CalendarClock/>} value="2" label="Upcoming"/><Stat icon={<AlertTriangle/>} value="1" label="Needs action" tone="warn"/></section>
    <section className="card"><CardTitle title="My teachers" subtitle={`2026–27 requirement: ${FRAMEWORK.observationsRequired} formal observations per teacher.`}/><div className="teacher-table head"><span>Teacher</span><span>Observation 1</span><span>Observation 2</span><span>Observation 3</span><span>Next action</span></div>{team.map((person, i) => <div className="teacher-table" key={person.id}><span><strong>{person.name}</strong><small>{person.position}</small></span>{[0,1,2].map((n) => <span key={n} className={`status ${statusClass(demoStatus(person,n))}`}>{demoStatus(person,n)}</span>)}<span><Link href="/evaluations">Open <ArrowRight size={14}/></Link></span></div>)}</section>
  </div>;
}

function DivisionDashboard() {
  const people = eligibleStaff("High School");
  const groups = departmentSummary("High School");
  const overdue = people.filter((p) => demoStatus(p) === "Overdue").length;
  return <div className="page"><PageHead eyebrow="High School" title="Teacher Evaluation" text="A clear view of progress without needing departments to submit separate tracking sheets." />
    <section className="stat-grid five"><Stat icon={<UsersRound/>} value={String(people.length)} label="Evaluation-eligible staff"/><Stat icon={<CheckCircle2/>} value="84%" label="On track"/><Stat icon={<CalendarClock/>} value="6" label="Upcoming"/><Stat icon={<AlertTriangle/>} value={String(overdue)} label="Overdue" tone="warn"/><Stat icon={<Goal/>} value="7" label="Follow-up actions"/></section>
    <section className="grid division-grid"><article className="card"><CardTitle title="Departments" subtitle="Clicking a department will later drill into its teachers and evidence."/><div className="dept-list">{groups.map((g) => <div key={g.department}><div><strong>{g.department}</strong><span>{g.members.length} staff · {g.overdue} overdue</span></div><div className="bar"><i style={{width:`${Math.max(12,g.percent)}%`}}/></div><b>{g.percent}%</b></div>)}</div></article><article className="card"><CardTitle title="Teaching & learning trends" subtitle="Fictional demo insights aggregated from observation records."/><Trend label="Common strengths" items={["Positive learning environment","Subject knowledge","Student engagement"]}/><Trend label="Development priorities" items={["Formative assessment","Differentiation","Questioning"]}/></article></section>
  </div>;
}

function MasterDashboard() {
  const all = eligibleStaff();
  return <div className="page"><PageHead eyebrow="Whole school · Master" title="Teacher Evaluation System" text="Set the school's evaluation expectations once, then see completion and improvement across every level." actions={<Link className="button primary" href="/master"><Settings2Icon/>Configure system</Link>} />
    <section className="hero master-hero"><div><span className="hero-kicker"><ClipboardCheck size={15}/> {FRAMEWORK.academicYear} framework</span><h2>{FRAMEWORK.observationsRequired} formal observations per teacher</h2><p>Lesson plan required · feedback within {FRAMEWORK.feedbackDueDays} working days · reflection within {FRAMEWORK.reflectionDueDays} working days.</p></div><div className="progress-ring"><strong>{all.length}</strong><span>eligible staff</span></div></section>
    <section className="stat-grid four"><Stat icon={<CheckCircle2/>} value="89%" label="School on track"/><Stat icon={<CalendarClock/>} value="21" label="Scheduled"/><Stat icon={<AlertTriangle/>} value="8" label="Overdue" tone="warn"/><Stat icon={<Goal/>} value="17" label="Open development actions"/></section>
    <section className="card"><CardTitle title="Division view" subtitle="Drill down from school to division, department, teacher and evidence."/><div className="division-cards">{["Primary","Middle School","High School","Cross-Divisional"].map((division, i) => <div key={division}><span>{division}</span><strong>{[94,90,84,92][i]}%</strong><small>{eligibleStaff(division).length} evaluation-eligible staff</small><div className="bar"><i style={{width:`${[94,90,84,92][i]}%`}}/></div></div>)}</div></section>
  </div>;
}

function PageHead({eyebrow,title,text,actions}:{eyebrow:string;title:string;text:string;actions?:React.ReactNode}){return <header className="page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{actions}</header>}
function Stat({icon,value,label,tone}:{icon:React.ReactNode;value:string;label:string;tone?:string}){return <article className={`stat ${tone??""}`}><div>{icon}</div><strong>{value}</strong><span>{label}</span></article>}
function CardTitle({title,subtitle}:{title:string;subtitle:string}){return <div className="card-title"><div><h2>{title}</h2><p>{subtitle}</p></div></div>}
function Task({text,meta,done}:{text:string;meta?:string;done?:boolean}){return <div className={`task ${done?"done":""}`}><span>{done?<CheckCircle2/>:<span className="empty-check"/>}</span><div><strong>{text}</strong>{meta&&<small>{meta}</small>}</div></div>}
function Trend({label,items}:{label:string;items:string[]}){return <div className="trend"><span>{label}</span>{items.map((item,i)=><div key={item}><b>{i+1}</b><strong>{item}</strong></div>)}</div>}
function Settings2Icon(){return <span aria-hidden>⚙</span>}
