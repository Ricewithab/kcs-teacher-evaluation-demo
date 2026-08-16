"use client";

import Link from "next/link";
import { AlertTriangle, BookOpenCheck, CheckCircle2, ClipboardCheck, Goal, MessageSquareText, Save, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppSession } from "@/components/AppShell";
import { apiPath } from "@/lib/paths";
import { usePersistedDemoState } from "@/lib/use-demo-state";

const defaultCriteria=["Learning environment","Lesson structure and clarity","Student engagement","Questioning and formative assessment","Differentiation and support","Subject knowledge"];
const ratingScale=["Developing","Secure","Strong","Exceptional"];

function formatDate(value?:string|null){if(!value)return "—";const date=new Date(value);return Number.isNaN(date.getTime())?value:date.toLocaleString(undefined,{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}

export function ProductionEvaluationRecord({evaluationId}:{evaluationId:string}){
 const {user}=useAppSession();
 const {state,loading,error,refresh}=usePersistedDemoState();
 const evaluation=state?.evaluations.find((item:any)=>item.id===evaluationId);
 const teacher=state?.staff.find((item:any)=>item.id===evaluation?.teacher_id);
 const evaluator=state?.staff.find((item:any)=>item.id===evaluation?.evaluator_id);
 const plan=state?.lessonPlans.find((item:any)=>item.evaluation_id===evaluationId);
 const storedFeedback=state?.feedback.find((item:any)=>item.evaluation_id===evaluationId);
 const storedReflection=state?.reflections.find((item:any)=>item.evaluation_id===evaluationId);
 const storedGoal=state?.developmentGoals.find((item:any)=>item.source_evaluation_id===evaluationId&&item.status==="active");
 const visibleIds=new Set(state?.access?.staffIds??[]);
 const leader=Boolean(user&&(["master","division","manager"].includes(user.systemRole)||user.isSystemAdmin));
 const canEvaluate=Boolean(user&&evaluation&&leader&&(user.staffId===evaluation.evaluator_id||visibleIds.has(evaluation.teacher_id)));
 const canReflect=Boolean(user&&evaluation&&user.staffId===evaluation.teacher_id);
 const [ratings,setRatings]=useState<Record<string,string>>({});
 const [evidence,setEvidence]=useState<Record<string,string>>({});
 const [strengths,setStrengths]=useState("");
 const [development,setDevelopment]=useState("");
 const [feedbackSummary,setFeedbackSummary]=useState("");
 const [reflection,setReflection]=useState("");
 const [nextSteps,setNextSteps]=useState("");
 const [goalTitle,setGoalTitle]=useState("Professional development goal");
 const [goalAction,setGoalAction]=useState("");
 const [reviewOn,setReviewOn]=useState("");
 const [saving,setSaving]=useState("");
 const [message,setMessage]=useState("");
 const criteria=useMemo(()=>defaultCriteria,[]);

 useEffect(()=>{
  if(!evaluation)return;
  setRatings(Object.fromEntries(criteria.map(item=>[item,evaluation.ratings?.[item]??"Secure"])));
  setEvidence(Object.fromEntries(criteria.map(item=>[item,evaluation.evidence?.[item]??""])));
 },[evaluation?.id]);
 useEffect(()=>{if(storedFeedback){setStrengths(storedFeedback.strengths??"");setDevelopment(storedFeedback.development_areas??"");setFeedbackSummary(storedFeedback.summary??"")}},[storedFeedback?.id]);
 useEffect(()=>{if(storedReflection){setReflection(storedReflection.reflection??"");setNextSteps(storedReflection.next_steps??"")}},[storedReflection?.id]);
 useEffect(()=>{if(storedGoal){setGoalTitle(storedGoal.title??"Professional development goal");setGoalAction(storedGoal.action??"");setReviewOn(storedGoal.review_on??"")}},[storedGoal?.id]);

 async function saveObservation(submit=false){
  setSaving(submit?"submit-observation":"observation");setMessage("");
  try{const response=await fetch(apiPath("/api/evaluations"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({id:evaluationId,ratings,evidence,submit})});const data=await response.json();if(!response.ok)throw new Error(data.error??"Unable to save observation");setMessage(submit?"Observation submitted. Feedback is now due.":"Observation draft saved.");await refresh()}catch(caught){setMessage(caught instanceof Error?caught.message:"Unable to save observation")}finally{setSaving("")}
 }
 async function releaseFeedback(){
  setSaving("feedback");setMessage("");
  try{const response=await fetch(apiPath("/api/feedback"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({evaluationId,strengths,developmentAreas:development,summary:feedbackSummary,submit:true})});const data=await response.json();if(!response.ok)throw new Error(data.error??"Unable to release feedback");setMessage("Feedback released to the teacher. Reflection is now due.");await refresh()}catch(caught){setMessage(caught instanceof Error?caught.message:"Unable to release feedback")}finally{setSaving("")}
 }
 async function submitReflection(){
  if(!teacher)return;setSaving("reflection");setMessage("");
  try{const response=await fetch(apiPath("/api/reflections"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({evaluationId,teacherId:teacher.id,reflection,nextSteps})});const data=await response.json();if(!response.ok)throw new Error(data.error??"Unable to submit reflection");setMessage("Reflection submitted.");await refresh()}catch(caught){setMessage(caught instanceof Error?caught.message:"Unable to submit reflection")}finally{setSaving("")}
 }
 async function saveGoal(){
  if(!teacher)return;setSaving("goal");setMessage("");
  try{const response=await fetch(apiPath("/api/development-goals"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({id:storedGoal?.id??`goal-${evaluationId}`,teacherId:teacher.id,sourceEvaluationId:evaluationId,title:goalTitle,action:goalAction,reviewOn,status:"active"})});const data=await response.json();if(!response.ok)throw new Error(data.error??"Unable to save development goal");setMessage("Development goal saved and linked to this evaluation.");await refresh()}catch(caught){setMessage(caught instanceof Error?caught.message:"Unable to save development goal")}finally{setSaving("")}
 }

 if(loading)return <div className="page"><div className="card empty-state">Loading evaluation record…</div></div>;
 if(error||!state||!evaluation||!teacher)return <div className="page"><div className="card locked"><AlertTriangle/><h2>Evaluation unavailable</h2><p>This record does not exist or is outside your permitted reporting scope.</p><Link className="button secondary" href="/evaluations">Back to evaluations</Link></div></div>;
 const observationSubmitted=Boolean(evaluation.completed_at);
 const feedbackReleased=Boolean(storedFeedback?.submitted_at);
 const reflectionSubmitted=Boolean(storedReflection?.acknowledged_at);
 const complete=evaluation.status==="complete";
 return <div className="page">
  <header className="page-head"><div><span className="eyebrow">Connected evaluation record</span><h1>{teacher.name}</h1><p>{evaluation.class_name??"Class not specified"} · {evaluation.subject??"Subject not specified"} · {formatDate(evaluation.scheduled_at)} · Evaluator: {evaluator?.name??evaluation.evaluator_id}</p></div><Link className="button secondary" href="/evaluations">Back to centre</Link></header>
  <section className="record-progress"><Progress done label="Scheduled"/><Progress done={Boolean(plan)} active={!plan} label="Lesson plan"/><Progress done={observationSubmitted} active={!observationSubmitted} label="Observation"/><Progress done={feedbackReleased} active={observationSubmitted&&!feedbackReleased} label="Feedback"/><Progress done={reflectionSubmitted} active={feedbackReleased&&!reflectionSubmitted} label="Reflection"/><Progress done={complete} active={reflectionSubmitted&&!complete} label="Development"/></section>
  {message&&<div className="credential-banner record-message"><CheckCircle2/><strong>{message}</strong></div>}
  <section className="grid evaluation-layout"><div className="stack">
   <article className="card"><div className="card-title"><div><h2>Preparation</h2><p>Lesson planning is linked directly to the observation.</p></div><BookOpenCheck/></div>{plan?<div className="attached-plan"><div><span>Attached lesson plan</span><strong>{plan.lesson_title}</strong><small>{plan.subject} · {plan.class_name}</small></div><Link className="button secondary" href={`/lesson-planning?evaluation=${evaluationId}`}>Open lesson plan</Link></div>:<div className="empty-state">{canReflect?<><p>No lesson plan is attached yet.</p><Link className="button primary" href={`/lesson-planning?evaluation=${evaluationId}`}>Create lesson plan</Link></>:"The teacher has not attached a lesson plan yet."}</div>}</article>
   <article className="card"><div className="card-title"><div><h2>Observation rubric & evidence</h2><p>{canEvaluate?"Save during the lesson, then submit when the observation is complete.":"Observation evidence is read-only for your account."}</p></div><ClipboardCheck/></div><div className="rubric-list">{criteria.map(criterion=><div className="rubric-row" key={criterion}><div><strong>{criterion}</strong><select value={ratings[criterion]??"Secure"} disabled={!canEvaluate||observationSubmitted} onChange={event=>setRatings(current=>({...current,[criterion]:event.target.value}))}>{ratingScale.map(item=><option key={item}>{item}</option>)}</select></div><textarea value={evidence[criterion]??""} readOnly={!canEvaluate||observationSubmitted} onChange={event=>setEvidence(current=>({...current,[criterion]:event.target.value}))} placeholder="Record observable evidence…"/></div>)}</div>{canEvaluate&&!observationSubmitted&&<div className="button-row"><button className="button secondary" onClick={()=>void saveObservation(false)} disabled={Boolean(saving)}><Save size={15}/>{saving==="observation"?"Saving…":"Save draft"}</button><button className="button primary" onClick={()=>void saveObservation(true)} disabled={Boolean(saving)}><Send size={15}/>{saving==="submit-observation"?"Submitting…":"Submit observation"}</button></div>}</article>
   <article className="card form-card"><div className="card-title"><div><h2>Feedback</h2><p>Feedback becomes visible as part of the permanent connected record.</p></div><MessageSquareText/></div><div className="form-grid"><label className="wide">Key strengths<textarea value={strengths} readOnly={!canEvaluate||feedbackReleased} onChange={event=>setStrengths(event.target.value)}/></label><label className="wide">Development area<textarea value={development} readOnly={!canEvaluate||feedbackReleased} onChange={event=>setDevelopment(event.target.value)}/></label><label className="wide">Feedback summary<textarea value={feedbackSummary} readOnly={!canEvaluate||feedbackReleased} onChange={event=>setFeedbackSummary(event.target.value)}/></label></div>{canEvaluate&&observationSubmitted&&!feedbackReleased&&<button className="button primary" onClick={()=>void releaseFeedback()} disabled={Boolean(saving)}><Send size={15}/>{saving==="feedback"?"Releasing…":"Release feedback"}</button>}</article>
   <article className="card form-card"><div className="card-title"><div><h2>Teacher reflection</h2><p>The observed teacher records their response and intended next steps.</p></div><CheckCircle2/></div><div className="form-grid"><label className="wide">Reflection<textarea value={reflection} readOnly={!canReflect||reflectionSubmitted} onChange={event=>setReflection(event.target.value)}/></label><label className="wide">Next steps<textarea value={nextSteps} readOnly={!canReflect||reflectionSubmitted} onChange={event=>setNextSteps(event.target.value)}/></label></div>{canReflect&&feedbackReleased&&!reflectionSubmitted&&<button className="button primary" onClick={()=>void submitReflection()} disabled={Boolean(saving)}><Send size={15}/>{saving==="reflection"?"Submitting…":"Submit reflection"}</button>}</article>
   <article className="card form-card"><div className="card-title"><div><h2>Development goal & follow-up</h2><p>The target carries forward into subsequent evaluations until reviewed and closed.</p></div><Goal/></div><div className="form-grid"><label className="wide">Goal title<input value={goalTitle} readOnly={!canEvaluate} onChange={event=>setGoalTitle(event.target.value)}/></label><label className="wide">Agreed action<textarea value={goalAction} readOnly={!canEvaluate} onChange={event=>setGoalAction(event.target.value)}/></label><label>Review date<input type="date" value={reviewOn} readOnly={!canEvaluate} onChange={event=>setReviewOn(event.target.value)}/></label><label>Status<input value={storedGoal?.status??"Not yet set"} readOnly/></label></div>{canEvaluate&&reflectionSubmitted&&!complete&&<button className="button primary" onClick={()=>void saveGoal()} disabled={Boolean(saving)||!goalAction.trim()}><Save size={15}/>{saving==="goal"?"Saving…":"Save development goal"}</button>}</article>
  </div><aside className="card record-sidebar"><span className="eyebrow">Record status</span><h2>{complete?"Evaluation complete":String(evaluation.status).replaceAll("_"," ")}</h2><Meta label="Teacher" value={teacher.name}/><Meta label="Evaluator" value={evaluator?.name??evaluation.evaluator_id}/><Meta label="Class" value={evaluation.class_name??"—"}/><Meta label="Lesson plan" value={plan?"Attached":"Missing"}/><Meta label="Observation" value={observationSubmitted?"Submitted":"In progress"}/><Meta label="Feedback" value={feedbackReleased?"Released":"Pending"}/><Meta label="Reflection" value={reflectionSubmitted?"Submitted":"Pending"}/><Meta label="Development" value={storedGoal?"Active goal":"Pending"}/></aside></section>
 </div>
}
function Progress({done=false,active=false,label}:{done?:boolean;active?:boolean;label:string}){return <div className={done?"done":active?"active":""}>{done?<CheckCircle2/>:<ClipboardCheck/>}<span>{label}</span></div>}
function Meta({label,value}:{label:string;value:string}){return <div className="record-meta"><span>{label}</span><strong>{value}</strong></div>}
