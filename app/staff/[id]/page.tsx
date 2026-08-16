import { StaffEvaluationProfile } from "@/components/StaffEvaluationProfile";

export default async function StaffProfilePage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <StaffEvaluationProfile staffId={id}/>;
}
