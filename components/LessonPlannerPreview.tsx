"use client";

import { useAppSession } from "@/components/AppShell";
import { DemoLessonPlanner } from "@/components/DemoLessonPlanner";
import { ProductionLessonPlanner } from "@/components/ProductionLessonPlanner";

export function LessonPlannerPreview() {
  const { mode } = useAppSession();
  return mode === "production" ? <ProductionLessonPlanner/> : <DemoLessonPlanner/>;
}
