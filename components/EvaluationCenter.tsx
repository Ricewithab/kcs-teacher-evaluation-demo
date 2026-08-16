"use client";

import { useAppSession } from "@/components/AppShell";
import { DemoEvaluationCenter } from "@/components/DemoEvaluationCenter";
import { ProductionEvaluationCenter } from "@/components/ProductionEvaluationCenter";

export function EvaluationCenter() {
  const { mode } = useAppSession();
  return mode === "production" ? <ProductionEvaluationCenter/> : <DemoEvaluationCenter/>;
}
