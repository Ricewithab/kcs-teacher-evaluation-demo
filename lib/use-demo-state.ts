"use client";

import { useEffect, useState } from "react";
import { apiPath } from "@/lib/paths";

export type PersistedDemoState = {
  framework: any | null;
  staff: any[];
  reportingLines: any[];
  evaluations: any[];
  lessonPlans: any[];
  feedback: any[];
  reflections: any[];
  developmentGoals: any[];
};

export function usePersistedDemoState() {
  const [state,setState]=useState<PersistedDemoState|null>(null);
  const [error,setError]=useState<Error|null>(null);
  useEffect(()=>{
    let active=true;
    fetch(apiPath("/api/state"),{cache:"no-store"})
      .then(async response=>{if(!response.ok)throw new Error("Unable to load persisted demo state");return response.json()})
      .then(data=>{if(active)setState(data)})
      .catch(cause=>{if(active)setError(cause instanceof Error?cause:new Error(String(cause))) });
    return()=>{active=false};
  },[]);
  return {state,error};
}
