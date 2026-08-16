"use client";

import Link from "next/link";
import { BookOpenCheck, CheckCircle2, ClipboardCheck, Goal, MessageSquareText, Save } from "lucide-react";
import { useState } from "react";
import { ROLE_USERS } from "@/lib/demo-data";
import { useDemoRole } from "./AppShell";

const criteria = [
  "Learning environment",
  "Lesson structure and clarity",
  "Student engagement",
  "Questioning and formative assessment",
  "Differentiation and support",
  "Subject knowledge",
];

export function EvaluationRecord() {
  const { role } = useDemoRole();
  const teacher = ROLE_USERS.teacher;
  const canEvaluate = role === "manager" || role === "master";
  const canReflect = role === "teacher";
  const [saved, setSaved] = useState(false);
  const [ratings, setRatings] = useState<Record<string, string>>(() => Object.fromEntries(criteria.map((c, i) => [c, ["Strong", "Secure", "Strong", "Developing", "Secure", "Strong"][i]])));
  const [evidence, setEvidence] = useState<Record<string, string>>(() => ({
    "Learning environment": "Students settled quickly and routines were clear.",
    "Lesson structure and clarity": "Learning intention and success criteria were visible and referenced during the lesson.",
    "Student engagement": "Most students participated actively in guided and independent practice.",
    "Questioning and formative assessment": "Mini-whiteboards were used, but the hinge question did not yet change the next teaching step.",
    "Differentiation and support": "Scaffolded coordinate grids supported students who needed additional structure.",
    "Subject knowledge": "Explanations of gradient and rate of change were accurate and well connected to examples.",
  }));
  const [strengths, setStrengths] = useState("Clear mathematical explanations, strong routines and purposeful guided practice.");
  const [development, setDevelopment] = useState("Use formative checks to decide whether to reteach, extend or move on before independent practice.");
  const [reflection, setReflection] = useState("The mini-whiteboards gave me useful information, but I moved on too quickly. Next time I will pause after the hinge question and adapt the next task based on the responses.");
  const [goal, setGoal] = useState("Use formative evidence to adapt the next teaching step before independent practice.");

  return <div className="page">
    <header className="page-head">
      <div><span className="eyebrow">Connected evaluation record</span><h1>{teacher.name} · Observation 2</h1><p>Grade 10 IGCSE Mathematics · 18 September 2026 · Period 3 · Evaluator: Cathryn Gao</p></div>
      <button className="button primary" onClick={() => setSaved(true)}><Save size={15}/>{saved ? "Saved for demo" : "Save record"}</button>
    </header>

    <section className="record-progress">
      <div className="done"><CheckCircle2/><span>Scheduled</span></div><div className="done"><CheckCircle2/><span>Lesson plan</span></div><div className="active"><ClipboardCheck/><span>Observation</span></div><div><MessageSquareText/><span>Feedback</span></div><div><CheckCircle2/><span>Reflection</span></div><div><Goal/><span>Development</span></div>
    </section>

    <section className="grid evaluation-layout">
      <div className="stack">
        <article className="card">
          <div className="card-title"><div><h2>Preparation</h2><p>The evaluator sees the teacher's plan and previous development target before the lesson.</p></div><BookOpenCheck/></div>
          <div className="attached-plan"><div><span>Attached lesson plan</span><strong>Understanding gradient in straight-line graphs</strong><small>IGCSE Mathematics · 70 minutes · 3 selected outcomes</small></div><Link className="button secondary" href="/lesson-planning">Open lesson plan</Link></div>
          <div className="goal-box"><span>Previous development priority</span><strong>Questioning & formative assessment</strong><p>Use whole-class checks for understanding before moving into independent practice.</p><div className="goal-meta">Follow-up required in this observation</div></div>
        </article>

        <article className="card">
          <div className="card-title"><div><h2>Observation rubric & evidence</h2><p>{canEvaluate ? "Rate each area and record evidence during the lesson." : "The teacher can view the completed evidence once feedback is released."}</p></div><ClipboardCheck/></div>
          <div className="rubric-list">{criteria.map((criterion) => <div className="rubric-row" key={criterion}><div><strong>{criterion}</strong><select value={ratings[criterion]} disabled={!canEvaluate} onChange={(e) => setRatings(v => ({...v,[criterion]:e.target.value}))}><option>Developing</option><option>Secure</option><option>Strong</option><option>Exceptional</option></select></div><textarea value={evidence[criterion]} readOnly={!canEvaluate} onChange={(e) => setEvidence(v => ({...v,[criterion]:e.target.value}))}/></div>)}</div>
        </article>

        <article className="card form-card">
          <div className="card-title"><div><h2>Feedback</h2><p>Written feedback stays connected to the observation instead of becoming a separate document.</p></div><MessageSquareText/></div>
          <div className="form-grid"><label className="wide">Key strengths<textarea value={strengths} readOnly={!canEvaluate} onChange={(e)=>setStrengths(e.target.value)}/></label><label className="wide">Development area<textarea value={development} readOnly={!canEvaluate} onChange={(e)=>setDevelopment(e.target.value)}/></label></div>
        </article>

        <article className="card form-card">
          <div className="card-title"><div><h2>Teacher reflection</h2><p>Teachers acknowledge the feedback and record what they will change next.</p></div><CheckCircle2/></div>
          <div className="form-grid"><label className="wide">Reflection<textarea value={reflection} readOnly={!canReflect} onChange={(e)=>setReflection(e.target.value)}/></label></div>
        </article>

        <article className="card form-card">
          <div className="card-title"><div><h2>Development goal & follow-up</h2><p>This target automatically follows into the next observation until it is closed.</p></div><Goal/></div>
          <div className="form-grid"><label className="wide">Agreed development goal<textarea value={goal} readOnly={!canEvaluate} onChange={(e)=>setGoal(e.target.value)}/></label><label>Review date<input defaultValue="20 October 2026" readOnly={!canEvaluate}/></label><label>Status<input value="Active · follow-up required" readOnly/></label></div>
        </article>
      </div>

      <aside className="card record-sidebar">
        <span className="eyebrow">Record status</span><h2>Observation in progress</h2><div className="record-meta"><span>Teacher</span><strong>{teacher.name}</strong></div><div className="record-meta"><span>Evaluator</span><strong>郜慧婷 Cathryn Gao</strong></div><div className="record-meta"><span>Class</span><strong>Grade 10 Mathematics</strong></div><div className="record-meta"><span>Lesson plan</span><strong>Submitted</strong></div><div className="record-meta"><span>Feedback deadline</span><strong>23 September</strong></div><div className="record-meta"><span>Reflection deadline</span><strong>25 September</strong></div><div className="record-note">In the production system, every change to this record will be timestamped in the audit history and stored in D1.</div>
      </aside>
    </section>
  </div>;
}
