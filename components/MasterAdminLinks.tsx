"use client";

import Link from "next/link";
import { KeyRound, Network, ShieldCheck } from "lucide-react";
import { useAppSession, useDemoRole } from "@/components/AppShell";

export function MasterAdminLinks(){
 const {mode}=useAppSession();const {role}=useDemoRole();
 if(mode!=="production"||role!=="master")return null;
 return <div className="page master-admin-links"><section className="grid two"><Link className="card admin-link-card" href="/admin/staff"><Network/><div><span className="eyebrow">Organisation</span><h2>Staff & hierarchy</h2><p>Add and update staff, reporting lines, evaluation eligibility and organisational placement.</p></div></Link><Link className="card admin-link-card" href="/admin/users"><KeyRound/><div><span className="eyebrow">Access</span><h2>Staff accounts</h2><p>Create accounts, reset temporary passwords, disable access and manage technical administrators.</p></div></Link></section><div className="source-note"><ShieldCheck size={13}/> These tools are available only to authenticated Master/System Administrator accounts.</div></div>
}
