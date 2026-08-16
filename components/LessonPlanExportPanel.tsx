"use client";

import Link from "next/link";
import { FileDown } from "lucide-react";
import { usePersistedDemoState } from "@/lib/use-demo-state";

export function LessonPlanExportPanel({evaluationId}:{evaluationId:string}){
 const {state}=usePersistedDemoState();const plan=state?.lessonPlans.find((item:any)=>item.evaluation_id===evaluationId);if(!plan)return null;
 return <div className="page export-panel"><section className="card export-card"><div><FileDown/><span><strong>Lesson-plan document</strong><small>Open the A4 print view to print or save a PDF copy.</small></span></div><Link className="button secondary" href={`/lesson-planning/print?plan=${encodeURIComponent(plan.id)}`}>Print / Save as PDF</Link></section></div>
}
