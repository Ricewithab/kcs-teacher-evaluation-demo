import { CycleSyncPanel } from "@/components/CycleSyncPanel";
import { MasterConfiguration } from "@/components/MasterConfiguration";
import { RubricConfiguration } from "@/components/RubricConfiguration";

export default function MasterPage() {
  return <><MasterConfiguration/><RubricConfiguration/><CycleSyncPanel/></>;
}
