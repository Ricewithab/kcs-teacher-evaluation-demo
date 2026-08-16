import { AttachmentPanel } from "@/components/AttachmentPanel";
import { EvaluationScheduleActions } from "@/components/EvaluationScheduleActions";
import { FollowUpPanel } from "@/components/FollowUpPanel";
import { LessonPlanExportPanel } from "@/components/LessonPlanExportPanel";
import { ProductionEvaluationRecord } from "@/components/ProductionEvaluationRecord";

export default async function EvaluationPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <><ProductionEvaluationRecord evaluationId={id}/><EvaluationScheduleActions evaluationId={id}/><AttachmentPanel evaluationId={id}/><LessonPlanExportPanel evaluationId={id}/><FollowUpPanel evaluationId={id}/></>;
}
