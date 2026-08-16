"use client";

import Link from "next/link";
import { RefreshCw, UsersRound } from "lucide-react";
import { useState } from "react";
import { apiPath } from "@/lib/paths";
import { useAppSession, useDemoRole } from "@/components/AppShell";
import { usePersistedDemoState } from "@/lib/use-demo-state";

export function CycleSyncPanel() {
  const { role } = useDemoRole();
  const { mode } = useAppSession();
  const { state, refresh } = usePersistedDemoState();
  const frameworkId = mode === "production" ? state?.framework?.id : "framework-2026-27";
  const eligibleStaff = (state?.staff ?? []).filter((person: any) => person.evaluation_eligible && person.active).length;
  const perTeacher = (state?.framework?.windows ?? []).reduce((sum: number, window: any) => sum + Number(window.requiredCount ?? 1), 0);
  const expected = eligibleStaff * perTeacher;
  const requirements = (state?.requirements ?? []).filter((item: any) => !frameworkId || item.framework_id === frameworkId).length;
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  async function sync() {
    if (!frameworkId) return setMessage("Activate an academic year before publishing requirements.");
    setSyncing(true);
    setMessage("");
    try {
      const response = await fetch(apiPath("/api/cycle/sync"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ frameworkId, actorId: "s1" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to generate requirements");
      setMessage(`${data.requirements} annual requirements are now active for ${data.eligibleStaff} staff.`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate requirements");
    } finally {
      setSyncing(false);
    }
  }

  if (role !== "master") return null;
  return <div className="page cycle-sync-page">
    <section className="card cycle-sync-card">
      <div className="card-title"><div><h2>Publish annual evaluation requirements</h2><p>Turn the active academic-year framework into individual observation obligations for every evaluation-eligible member of staff.</p></div><UsersRound/></div>
      <div className="cycle-sync-stats"><div><span>Eligible staff</span><strong>{eligibleStaff}</strong></div><div><span>Expected slots</span><strong>{expected}</strong></div><div><span>Generated slots</span><strong>{requirements}</strong></div></div>
      <p className="source-note">Regenerating is safe: existing scheduled/completed evaluations remain linked. New requirements are added and unused obsolete slots are removed.</p>
      {message && <div className="cycle-message">{message}</div>}
      <div className="button-row"><button className="button primary" onClick={sync} disabled={syncing || !frameworkId}><RefreshCw size={15}/>{syncing ? "Generating…" : requirements ? "Re-sync annual requirements" : "Generate annual requirements"}</button>{mode === "production" && <Link className="button secondary" href="/admin/users">Manage staff accounts</Link>}</div>
    </section>
  </div>;
}
