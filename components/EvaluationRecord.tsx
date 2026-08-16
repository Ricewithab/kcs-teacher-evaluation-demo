"use client";

import Link from "next/link";
import { BookOpenCheck, CheckCircle2, ClipboardCheck, Goal, MessageSquareText, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { ROLE_USERS } from "@/lib/demo-data";
import { apiPath } from "@/lib/paths";
import { useDemoRole } from "./AppShell";

const EVALUATION_ID="demo-eval-yidi-observation-2";
const GOAL_ID="demo-goal-yidi";
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
  const actor = ROLE_USERS[role];
  const canEvaluate = role === "manager" || role === "master";
  const canReflect = role === "teacher";
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedFromD1,setLoadedFromD1]=useState(false);
  const [evaluatorName,setEvaluatorName]=useState("郜慧婷 Cathryn Gao");
  const [planTitle,setPlanTitle]=useState("Understanding gradient in straight-line graphs");
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
  const [nextSteps,setNextSteps]=useState("Pause after the hinge question and select the next task based on whole-class responses.");
  const [goal, setGoal] = useState("Use formative evidence to adapt the next teaching step before independent practice.");
  const [reviewDate,setReviewDate]=useState("2026-10-20");

  useEffect(()=>{
    let active=true;
    fetch(apiPath("/api/state"),{cache:"no-store"}).then(async response=>{if(!response.ok)throw new Error("Unable to load evaluation record");return response.json()}).then(data=>{
      if(!active)return;
      const evaluation=Array.isArray(data.evaluations)?data.evaluations.find((item:any)=>item.id===EVALUATION_ID):null;
      if(evaluation){
        if(evaluation.ratings)setRatings(evaluation.ratings);
        if(evaluation.evidence)setEvidence(evaluation.evidence);
        const evaluator=Array.isArray(data.staff)?data.staff.find((item:any)=>item.id===evaluation.evaluator_id):null;
        if(evaluator?.name)setEvaluatorName(evaluator.name);
      }
      const plan=Array.isArray(data.lessonPlans)?data.lessonPlans.find((item:any)=>item.evaluation_id===EVALUATION_ID):null;
      if(plan?.lesson_title)setPlanTitle(plan.lesson_title);
      const feedback=Array.isArray(data.feedback)?data.feedback.find((item:any)=>item.evaluation_id===EVALUATION_ID):null;
      if(feedback){if(feedback.strengths!=null)setStrengths(feedback.strengths);if(feedback.development_areas!=null)setDevelopment(feedback.development_areas)}
      const storedReflection=Array.isArray(data.reflections)?data.reflections.find((item:any)=>item.evaluation_id===EVALUATION_ID):null;
      if(storedReflection){if(storedReflection.reflection!=null)setReflection(storedReflection.reflection);if(storedReflection.next_steps!=null)setNextSteps(storedReflection.next_steps)}
      const storedGoal=Array.isArray(data.developmentGoals)?data.developmentGoals.find((item:any)=>item.id===GOAL_ID):null;
      if(storedGoal){if(storedGoal.action!=null)setGoal(storedGoal.action);if(storedGoal.review_on)setReviewDate(storedGoal.review_on)}
      setLoadedFromD1(true);
    }).catch(error=>console.error(error));
    return()=>{active=false};
  },[]);

  async function saveRecord(){
    if(!canEvaluate&&!canReflect)return;
    setSaving(true);setSaved(false);
    try{
      if(canEvaluate){
        const responses=await Promise.all([
          fetch(apiPath("/api/evaluations"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({actorId:actor.id,id:EVALUATION_ID,ratings,evidence,status:"observation"})}),
          fetch(apiPath("/api/feedback"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({actorId:actor.id,evaluationId:EVALUATION_ID,strengths,developmentAreas:development,summary:"Observation feedback stored in the connected record."})}),
          fetch(apiPath("/api/development-goals"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({actorId:actor.id,id:GOAL_ID,teacherId:teacher.id,sourceEvaluationId:EVALUATION_ID,title:"Questioning & formative assessment",action:goal,reviewOn:reviewDate,status:"active"})}),
        ]);
        if(responses.some(response=>!response.ok))throw new Error("One or more evaluator records could not be saved");
      }
      if(canReflect){
        const response=await fetch(apiPath("/api/reflections"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({actorId:teacher.id,evaluationId:EVALUATION_ID,teacherId:teacher.id,reflection,nextSteps})});
        if(!response.ok)throw new Error("Reflection could not be saved");
      }
      setSaved(true);
    }catch(error){console.error(error);window.alert("The evaluation record could not be saved.")}
    finally{setSaving(false)}
  }

  return <div className="page">
    <header className="page-head">
      <div><span className="eyebrow">Connected evaluation record</span><h1>{teacher.name} · Observation 2</h1><p>Grade 10 IGCSE Mathematics · 18 September 2026 · Period 3 · Evaluator: {evaluatorName}</p></div>
      <button className="button primary" onClick={saveRecord} disabled={saving||(!canEvaluate&&!canReflect)}><Save size={15}/>{saving?"Saving…":saved?"Saved online":canReflect?"Save reflection":"Save record"}</button>
    </header>

    <section className="planner-banner"><CheckCircle2/><div><strong>{loadedFromD1?"Connected record · Cloudflare D1":"Loading connected record…"}</strong><span>Observation evidence, feedback, reflection and development actions are stored as linked records with audit entries.</span></div><b>{canEvaluate?"Evaluator access":canReflect?"Teacher reflection":"Read-only"}</b></section>

    <section className="record-progress">
      <div className="done"><CheckCircle2/><span>Scheduled</span></div><div className="done"><CheckCircle2/><span>Lesson plan</span></div><div className="active"><ClipboardCheck/><span>Observation</span></div><div><MessageSquareText/><span>Feedback</span></div><div><CheckCircle2/><span>Reflection</span></div><div><Goal/><span>Development</span></div>
    </section>

    <section className="grid evaluation-layout">
      <div className="stack">
        <article className="card">
          <div className="card-title"><div><h2>Preparation</h2><p>The evaluator sees the teacher's plan and previous development target before the lesson.</p></div><BookOpenCheck/></div>
          <div className="attached-plan"><div><span>Attached lesson plan</span><strong>{planTitle}</strong><small>IGCSE Mathematics · 70 minutes · 3 selected outcomes</small></div><Link className="button secondary" href="/lesson-planning">Open lesson plan</Link></div>
          <div className="goal-box"><span>Previous development priority</span><strong>Questioning & formative assessment</strong><p>Use whole-class checks for understanding before moving into independent practice.</p><div className="goal-meta">Follow-up required in this observation</div></div>
        </article>

        <article className="card">
          <div className="card-title"><div><h2>Observation rubric & evidence</h2><p>{canEvaluate ? "Rate each area and record evidence during the lesson." : "The teacher can view the completed evidence once feedback is released."}</p></div><ClipboardCheck/></div>
          <div className="rubric-list">{criteria.map((criterion) => <div className="rubric-row" key={criterion}><div><strong>{criterion}</strong><select value={ratings[criterion]??"Secure"} disabled={!canEvaluate} onChange={(e) => setRatings(v => ({...v,[criterion]:e.target.value}))}><option>Developing</option><option>Secure</option><option>Strong</option><option>Exceptional</option></select></div><textarea value={evidence[criterion]??""} readOnly={!canEvaluate} onChange={(e) => setEvidence(v => ({...v,[criterion]:e.target.value}))}/></div>)}</div>
        </article>

        <article className="card form-card">
          <div className="card-title"><div><h2>Feedback</h2><p>Written feedback stays connected to the observation instead of becoming a separate document.</p></div><MessageSquareText/></div>
          <div className="form-grid"><label className="wide">Key strengths<textarea value={strengths} readOnly={!canEvaluate} onChange={(e)=>setStrengths(e.target.value)}/></label><label className="wide">Development area<textarea value={development} readOnly={!canEvaluate} onChange={(e)=>setDevelopment(e.target.value)}/></label></div>
        </article>

        <article className="card form-card">
          <div className="card-title"><div><h2>Teacher reflection</h2><p>Teachers acknowledge the feedback and record what they will change next.</p></div><CheckCircle2/></div>
          <div className="form-grid"><label className="wide">Reflection<textarea value={reflection} readOnly={!canReflect} onChange={(e)=>setReflection(e.target.value)}/></label><label className="wide">Next steps<textarea value={nextSteps} readOnly={!canReflect} onChange={(e)=>setNextSteps(e.target.value)}/></label></div>
        </article>

        <article className="card form-card">
          <div className="card-title"><div><h2>Development goal & follow-up</h2><p>This target automatically follows into the next observation until it is closed.</p></div><Goal/></div>
          <div className="form-grid"><label className="wide">Agreed development goal<textarea value={goal} readOnly={!canEvaluate} onChange={(e)=>setGoal(e.target.value)}/></label><label>Review date<input type="date" value={reviewDate} onChange={e=>setReviewDate(e.target.value)} readOnly={!canEvaluate}/></label><label>Status<input value="Active · follow-up required" readOnly/></label></div>
        </article>
      </div>

      <aside className="card record-sidebar">
        <span className="eyebrow">Record status</span><h2>Observation in progress</h2><div className="record-meta"><span>Teacher</span><strong>{teacher.name}</strong></div><div className="record-meta"><span>Evaluator</span><strong>{evaluatorName}</strong></div><div className="record-meta"><span>Class</span><strong>Grade 10 Mathematics</strong></div><div className="record-meta"><span>Lesson plan</span><strong>Stored online</strong></div><div className="record-meta"><span>Feedback deadline</span><strong>23 September</strong></div><div className="record-meta"><span>Reflection deadline</span><strong>25 September</strong></div><div className="record-note">Every save is timestamped in the audit history and stored in D1. The demo still uses fictional evaluation content.</div>
      </aside>
    </section>
  </div>;
}
