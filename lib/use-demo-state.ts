"use client";

import { useCallback, useEffect, useState } from "react";
import { apiPath } from "@/lib/paths";

export type PersistedDemoState = {
  framework: any | null;
  academicYears?: any[];
  staff: any[];
  reportingLines: any[];
  evaluations: any[];
  lessonPlans: any[];
  feedback: any[];
  reflections: any[];
  developmentGoals: any[];
  auditLog: any[];
  requirements: any[];
  access?: { staffIds: string[]; operationalStaffIds?: string[]; systemRole: string; isSystemAdmin: boolean };
};

export function usePersistedDemoState() {
  const [state,setState]=useState<PersistedDemoState|null>(null);
  const [error,setError]=useState<Error|null>(null);
  const [loading,setLoading]=useState(true);
  const refresh=useCallback(async()=>{
    setLoading(true);
    try{
      const response=await fetch(apiPath("/api/state"),{cache:"no-store"});
      if(!response.ok)throw new Error("Unable to load application state");
      setState(await response.json());
      setError(null);
    }catch(cause){
      setError(cause instanceof Error?cause:new Error(String(cause)));
    }finally{
      setLoading(false);
    }
  },[]);
  useEffect(()=>{void refresh()},[refresh]);
  return {state,error,loading,refresh};
}
