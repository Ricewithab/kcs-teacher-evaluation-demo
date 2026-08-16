"use client";

import { AcademicYearManagement } from "@/components/AcademicYearManagement";
import { CycleSyncPanel } from "@/components/CycleSyncPanel";
import { MasterAdminLinks } from "@/components/MasterAdminLinks";
import { MasterConfiguration } from "@/components/MasterConfiguration";
import { ProductionMasterConfiguration } from "@/components/ProductionMasterConfiguration";
import { RubricConfiguration } from "@/components/RubricConfiguration";
import { useAppSession } from "@/components/AppShell";

export function MasterWorkspace() {
  const { mode } = useAppSession();
  if (mode === "production") {
    return <>
      <MasterAdminLinks/>
      <AcademicYearManagement/>
      <ProductionMasterConfiguration/>
      <RubricConfiguration/>
      <CycleSyncPanel/>
    </>;
  }
  return <>
    <MasterConfiguration/>
    <RubricConfiguration/>
    <CycleSyncPanel/>
  </>;
}
