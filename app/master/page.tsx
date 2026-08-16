import { CycleSyncPanel } from "@/components/CycleSyncPanel";
import { MasterAdminLinks } from "@/components/MasterAdminLinks";
import { MasterConfiguration } from "@/components/MasterConfiguration";
import { RubricConfiguration } from "@/components/RubricConfiguration";

export default function MasterPage() {
  return <><MasterAdminLinks/><MasterConfiguration/><RubricConfiguration/><CycleSyncPanel/></>;
}
