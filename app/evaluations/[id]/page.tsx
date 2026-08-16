import { FollowUpPanel } from "@/components/FollowUpPanel";
import { ProductionEvaluationRecord } from "@/components/ProductionEvaluationRecord";

export default async function EvaluationPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <><ProductionEvaluationRecord evaluationId={id}/><FollowUpPanel evaluationId={id}/></>;
}
