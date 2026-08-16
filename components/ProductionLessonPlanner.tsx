"use client";

import { BookOpenCheck, ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppSession } from "@/components/AppShell";
import { apiPath } from "@/lib/paths";
import { usePersistedDemoState } from "@/lib/use-demo-state";

type Phase={id:string;name:string;minutes:number;teacher:string;students:string;assessment:string};
type PlanForm={title:string;subject:string;className:string;durationMinutes:number;outcomes:string;priorLearning:string;successCriteria:string;vocabulary:string;keyQuestions:string;differentiation:string;misconceptions:string;resources:string;phases:Phase[]};
const blankPhases:Phase[]=[{id:"phase-1",name:"Opening / retrieval",minutes:10,teacher:"",students:"",assessment:""},{id:"phase-2",name:"Teaching & guided practice",minutes:25,teacher:"",students:"",assessment:""},{id:"phase-3",name:"Independent / collaborative learning",minutes:25,teacher:"",students:"",assessment:""},{id:"phase-4",name:"Plenary / exit check",minutes:10,teacher:"",students:"",assessment:""}];
const blankForm:PlanForm={title:"",subject:"",className:"",durationMinutes:70,outcomes:"",priorLearning:"",successCriteria:"",vocabulary:"",keyQuestions:"",differentiation:"",misconceptions:"",resources:"",phases:blankPhases};

function fromStored(plan:any):PlanForm{
 const payload=plan?.payload??{};
 return {title:plan?.lesson_title??"",subject:plan?.subject??"",className:plan?.class_name??"",durationMinutes:Number(payload.durationMinutes??70),outcomes:Array.isArray(payload.outcomes)?payload.outcomes.join("\n"):String(payload.outcomes??""),priorLearning:String(payload.priorLearning??""),successCriteria:String(payload.successCriteria??""),vocabulary:String(payload.keyVocabulary??payload.vocabulary??""),keyQuestions:String(payload.keyQuestions??""),differentiation:String(payload.differentiation??""),misconceptions:String(payload.misconceptions??""),resources:String(payload.resources??""),phases:Array.isArray(payload.phases)&&payload.phases.length?payload.phases:blankPhases};
}

export function ProductionLessonPlanner(){
 const {user}=useAppSession();
 const params=useSearchParams();
 const requestedEvaluation=params.get("evaluation");
 const {state,loading,error,refresh}=usePersistedDemoState();
 const initialPlanId=useRef(`plan-${crypto.randomUUID()}`);
 const [context,setContext]=useState("");
 const [planId,setPlanId]=useState(initialPlanId.current);
 const [form,setForm]=useState<PlanForm>(blankForm);
 const [status,setStatus]=useState<"draft"|"complete">("draft");
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 const evaluations=state?.evaluations??[];
 const plans=state?.lessonPlans??[];
 const contexts=useMemo(()=>{
  const result:any[]=[];
  for(const evaluation of evaluations){const teacher=state?.staff.find((person:any)=>person.id===evaluation.teacher_id);result.push({key:`eval:${evaluation.id}`,evaluationId:evaluation.id,teacherId:evaluation.teacher_id,label:`${teacher?.name??evaluation.teacher_id} · ${evaluation.class_name??evaluation.subject??"Evaluation"}`,evaluation,plan:plans.find((plan:any)=>plan.evaluation_id===evaluation.id)})}
  for(const plan of plans.filter((item:any)=>!item.evaluation_id)){const teacher=state?.staff.find((person:any)=>person.id===plan.teacher_id);result.push({key:`plan:${plan.id}`,evaluationId:null,teacherId:plan.teacher_id,label:`${teacher?.name??plan.teacher_id} · ${plan.lesson_title}`,plan})}
  if(user)result.push({key:"new",evaluationId:null,teacherId:user.staffId,label:"New general lesson plan",plan:null});
  return result;
 },[evaluations,plans,state?.staff,user?.staffId]);

 useEffect(()=>{
  if(!state||!user||context)return;
  const requested=requestedEvaluation?contexts.find(item=>item.evaluationId===requestedEvaluation):null;
  const ownEvaluation=contexts.find(item=>item.teacherId===user.staffId&&item.evaluationId);
  const ownPlan=contexts.find(item=>item.teacherId===user.staffId&&item.plan);
  const selected=requested??ownEvaluation??ownPlan??contexts.find(item=>item.key==="new")??contexts[0];
  if(selected)setContext(selected.key);
 },[state,user,requestedEvaluation,contexts,context]);

 const selected=contexts.find(item=>item.key===context);
 const teacherId=selected?.teacherId??user?.staffId??"";
 const teacher=state?.staff.find((person:any)=>person.id===teacherId);
 const evaluation=selected?.evaluation;
 const storedPlan=selected?.plan;
 const canEdit=Boolean(user&&(user.isSystemAdmin||user.staffId===teacherId));

 useEffect(()=>{
  if(!selected)return;
  if(storedPlan){setPlanId(storedPlan.id);setForm(fromStored(storedPlan));setStatus(storedPlan.status==="complete"?"complete":"draft");return}
  setPlanId(initialPlanId.current);
  setStatus("draft");
  setForm({...blankForm,subject:evaluation?.subject??"",className:evaluation?.class_name??"",phases:blankPhases.map(item=>({...item}))});
 },[selected?.key,storedPlan?.id]);

 function patch<K extends keyof PlanForm>(key:K,value:PlanForm[K]){setForm(current=>({...current,[key]:value}))}
 function updatePhase(id:string,updates:Partial<Phase>){patch("phases",form.phases.map(item=>item.id===id?{...item,...updates}:item))}
 function move(index:number,direction:number){const next=[...form.phases];const other=index+direction;if(other<0||other>=next.length)return;[next[index],next[other]]=[next[other],next[index]];patch("phases",next)}
 async function save(nextStatus:"draft"|"complete"){
  if(!user||!teacherId||!form.title.trim())return setMessage("Add a lesson title before saving.");
  setSaving(true);setMessage("");
  try{
   const response=await fetch(apiPath("/api/lesson-plans"),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({id:planId,teacherId,evaluationId:selected?.evaluationId??null,subject:form.subject.trim()||"General",className:form.className.trim()||"Class not specified",lessonTitle:form.title.trim(),status:nextStatus,payload:{durationMinutes:form.durationMinutes,outcomes:form.outcomes.split("\n").map(item=>item.trim()).filter(Boolean),priorLearning:form.priorLearning,successCriteria:form.successCriteria,keyVocabulary:form.vocabulary,keyQuestions:form.keyQuestions,differentiation:form.differentiation,misconceptions:form.misconceptions,resources:form.resources,phases:form.phases}})});
   const data=await response.json();if(!response.ok)throw new Error(data.error??"Unable to save lesson plan");setStatus(nextStatus);setMessage(nextStatus==="complete"?"Lesson plan marked complete and stored online.":"Draft saved online.");await refresh();
  }catch(caught){setMessage(caught instanceof Error?caught.message:"Unable to save lesson plan")}finally{setSaving(false)}
 }

 if(loading)return <div className="page"><div className="card empty-state">Loading lesson plans…</div></div>;
 if(error||!state||!user)return <div className="page"><div className="card locked"><h2>Lesson planning unavailable</h2><p>Refresh the page or contact the system administrator.</p></div></div>;
 return <div className="page"><header className="page-head"><div><span className="eyebrow">Lesson planning</span><h1>{canEdit?"Create & manage lesson plans":"Lesson-plan review"}</h1><p>Structured planning stays online and can be attached directly to a scheduled evaluation.</p></div>{canEdit&&<div className="button-row"><button className="button secondary" onClick={()=>void save("draft")} disabled={saving}><Save size={15}/>Save draft</button><button className="button primary" onClick={()=>void save("complete")} disabled={saving}><BookOpenCheck size={15}/>{saving?"Saving…":"Mark complete"}</button></div>}</header>
  {message&&<div className="credential-banner"><BookOpenCheck/><strong>{message}</strong></div>}
  <section className="planner-banner"><BookOpenCheck/><div><strong>{evaluation?"Evaluation-linked lesson plan":"Lesson plan"}</strong><span>{evaluation?`${evaluation.class_name??"Class"} · ${new Date(evaluation.scheduled_at).toLocaleDateString()}`:"Not linked to an observation"}</span></div><b>{status==="complete"?"Complete":"Draft"}</b></section>
  <section className="card form-card"><div className="card-title"><div><h2>Planning context</h2><p>Select an evaluation, an existing plan, or start a new lesson plan for yourself.</p></div></div><div className="form-grid"><label className="wide">Plan / evaluation<select value={context} onChange={event=>setContext(event.target.value)}>{contexts.map(item=><option key={item.key} value={item.key}>{item.label}</option>)}</select></label><label>Teacher<input value={teacher?.name??teacherId} readOnly/></label><label>Subject<input value={form.subject} readOnly={!canEdit} onChange={event=>patch("subject",event.target.value)}/></label><label>Class<input value={form.className} readOnly={!canEdit} onChange={event=>patch("className",event.target.value)}/></label><label>Duration (minutes)<input type="number" min="1" value={form.durationMinutes} readOnly={!canEdit} onChange={event=>patch("durationMinutes",Number(event.target.value))}/></label><label className="wide">Lesson title<input value={form.title} readOnly={!canEdit} onChange={event=>patch("title",event.target.value)}/></label></div></section>
  <section className="grid two"><article className="card form-card"><div className="card-title"><div><h2>Learning</h2><p>Subject-neutral prompts for intended learning and evidence of success.</p></div></div><div className="form-grid"><label className="wide">Learning outcomes <small>One per line</small><textarea value={form.outcomes} readOnly={!canEdit} onChange={event=>patch("outcomes",event.target.value)}/></label><label className="wide">Success criteria<textarea value={form.successCriteria} readOnly={!canEdit} onChange={event=>patch("successCriteria",event.target.value)}/></label><label>Prior learning<textarea value={form.priorLearning} readOnly={!canEdit} onChange={event=>patch("priorLearning",event.target.value)}/></label><label>Key vocabulary<textarea value={form.vocabulary} readOnly={!canEdit} onChange={event=>patch("vocabulary",event.target.value)}/></label></div></article><article className="card form-card"><div className="card-title"><div><h2>Responsive teaching</h2><p>Make assessment for learning and adaptations explicit before the lesson.</p></div></div><div className="form-grid"><label className="wide">Key questions / checks for understanding<textarea value={form.keyQuestions} readOnly={!canEdit} onChange={event=>patch("keyQuestions",event.target.value)}/></label><label>Differentiation / adaptations<textarea value={form.differentiation} readOnly={!canEdit} onChange={event=>patch("differentiation",event.target.value)}/></label><label>Anticipated misconceptions<textarea value={form.misconceptions} readOnly={!canEdit} onChange={event=>patch("misconceptions",event.target.value)}/></label><label className="wide">Resources<textarea value={form.resources} readOnly={!canEdit} onChange={event=>patch("resources",event.target.value)}/></label></div></article></section>
  <section className="card"><div className="card-title split"><div><h2>Lesson sequence</h2><p>Flexible phases work across subjects and teaching approaches.</p></div>{canEdit&&<button className="button secondary" onClick={()=>patch("phases",[...form.phases,{id:crypto.randomUUID(),name:"New phase",minutes:10,teacher:"",students:"",assessment:""}])}><Plus size={15}/>Add phase</button>}</div><div className="phase-list">{form.phases.map((phase,index)=><article key={phase.id}><div className="phase-top"><input value={phase.name} readOnly={!canEdit} onChange={event=>updatePhase(phase.id,{name:event.target.value})}/><label><input type="number" value={phase.minutes} readOnly={!canEdit} onChange={event=>updatePhase(phase.id,{minutes:Number(event.target.value)})}/> min</label>{canEdit&&<><button onClick={()=>move(index,-1)} disabled={index===0}><ChevronUp/></button><button onClick={()=>move(index,1)} disabled={index===form.phases.length-1}><ChevronDown/></button><button onClick={()=>patch("phases",form.phases.filter(item=>item.id!==phase.id))}><Trash2/></button></>}</div><div className="phase-fields"><label>Teacher activity<textarea value={phase.teacher} readOnly={!canEdit} onChange={event=>updatePhase(phase.id,{teacher:event.target.value})}/></label><label>Student activity<textarea value={phase.students} readOnly={!canEdit} onChange={event=>updatePhase(phase.id,{students:event.target.value})}/></label><label>Assessment / check<textarea value={phase.assessment} readOnly={!canEdit} onChange={event=>updatePhase(phase.id,{assessment:event.target.value})}/></label></div></article>)}</div></section>
 </div>
}
