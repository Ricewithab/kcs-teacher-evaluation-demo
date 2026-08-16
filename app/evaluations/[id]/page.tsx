import { ProductionEvaluationRecord } from "@/components/ProductionEvaluationRecord";

export default async function EvaluationPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <ProductionEvaluationRecord evaluationId={id}/>;
}
