"use client";

import { Check, Copy, KeyRound, RefreshCw, ShieldCheck, UserPlus, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { STAFF } from "@/lib/demo-data";
import { apiPath } from "@/lib/paths";
import { useAppSession } from "@/components/AppShell";

type Account = {
  id: string;
  staff_id: string;
  email: string;
  active: number;
  must_change_password: number;
  is_system_admin: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  name: string;
  position: string;
  division: string;
  department: string;
  system_role: string;
};

export function UserManagement() {
  const { user } = useAppSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staffId, setStaffId] = useState("");
  const [email, setEmail] = useState("");
  const [systemAdmin, setSystemAdmin] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const availableStaff = useMemo(() => {
    const used = new Set(accounts.map((account) => account.staff_id));
    return STAFF.filter((person) => person.status === "Active" && !used.has(person.id));
  }, [accounts]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(apiPath("/api/admin/users"), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load accounts");
      setAccounts(data.users ?? []);
      if (!staffId && data.users) {
        const used = new Set((data.users as Account[]).map((account) => account.staff_id));
        const first = STAFF.find((person) => person.status === "Active" && !used.has(person.id));
        if (first) setStaffId(first.id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load accounts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    setTemporaryPassword("");
    try {
      const response = await fetch(apiPath("/api/admin/users"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ staffId, email, isSystemAdmin: systemAdmin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create account");
      setTemporaryPassword(data.temporaryPassword);
      setMessage("Account created. Copy the temporary password now; it will not be shown again.");
      setEmail("");
      setSystemAdmin(false);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create account");
    } finally {
      setSaving(false);
    }
  }

  async function accountAction(account: Account, action: string, extra: Record<string, unknown> = {}) {
    setError("");
    setMessage("");
    setTemporaryPassword("");
    try {
      const response = await fetch(apiPath("/api/admin/users"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: account.id, action, ...extra }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to update account");
      if (data.temporaryPassword) {
        setTemporaryPassword(data.temporaryPassword);
        setMessage(`Temporary password generated for ${account.name}. Copy it now; it will not be shown again.`);
      } else {
        setMessage("Account updated.");
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update account");
    }
  }

  async function copyTemporaryPassword() {
    await navigator.clipboard.writeText(temporaryPassword);
    setMessage("Temporary password copied to clipboard.");
  }

  return <div className="page">
    <header className="page-head"><div><span className="eyebrow">Master Management</span><h1>Staff accounts</h1><p>Create staff access, reset temporary passwords and disable accounts without changing the organisation hierarchy.</p></div><button className="button secondary" onClick={() => void load()}><RefreshCw size={15}/>Refresh</button></header>

    {(message || temporaryPassword) && <section className="credential-banner"><Check/><div><strong>{message}</strong>{temporaryPassword && <code>{temporaryPassword}</code>}</div>{temporaryPassword && <button className="button secondary" onClick={copyTemporaryPassword}><Copy size={14}/>Copy</button>}</section>}
    {error && <div className="login-error page-error">{error}</div>}

    <section className="grid account-grid">
      <form className="card form-card" onSubmit={createAccount}>
        <div className="card-title"><div><h2>Create account</h2><p>The account inherits its school role and scope from the linked staff profile.</p></div><UserPlus/></div>
        <div className="form-grid">
          <label className="wide">Staff member<select value={staffId} onChange={(event) => setStaffId(event.target.value)} required><option value="">Select staff member</option>{availableStaff.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.position}</option>)}</select></label>
          <label className="wide">School email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@kcschengdu.com" required/></label>
          {user?.isSystemAdmin && <label className="wide checkbox-row"><input type="checkbox" checked={systemAdmin} onChange={(event) => setSystemAdmin(event.target.checked)}/><span><strong>Technical system administrator</strong><small>Full maintenance access independent of the reporting hierarchy.</small></span></label>}
        </div>
        <button className="button primary" type="submit" disabled={saving || !staffId}>{saving ? "Creating…" : "Create account & temporary password"}</button>
      </form>

      <article className="card account-help"><ShieldCheck/><h2>How access works</h2><p>Login identity and organisational permissions are separate. If a teacher becomes a HoD, or a reporting line changes, their account stays the same while their access updates automatically.</p><ul><li>Head of School / Master: whole-school system control</li><li>Head of Division: reporting hierarchy below their profile</li><li>HoD / Manager: their reporting team</li><li>Teacher: their own records</li></ul></article>
    </section>

    <section className="card">
      <div className="card-title"><div><h2>Active and disabled accounts</h2><p>{loading ? "Loading…" : `${accounts.length} accounts configured`}</p></div></div>
      <div className="account-table account-table-head"><span>Staff member</span><span>Access</span><span>Status</span><span>Last sign-in</span><span>Actions</span></div>
      {accounts.map((account) => <div className="account-table" key={account.id}>
        <span><strong>{account.name}</strong><small>{account.email}</small><small>{account.position}</small></span>
        <span><strong>{account.is_system_admin ? "System administrator" : account.system_role}</strong><small>{account.department}</small></span>
        <span><b className={`account-status ${account.active ? "active" : "disabled"}`}>{account.active ? (account.must_change_password ? "Password change required" : "Active") : "Disabled"}</b>{account.locked_until && <small>Locked until {new Date(account.locked_until).toLocaleString()}</small>}</span>
        <span>{account.last_login_at ? <><strong>{new Date(account.last_login_at).toLocaleDateString()}</strong><small>{new Date(account.last_login_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></> : <small>Never</small>}</span>
        <span className="account-row-actions"><button onClick={() => void accountAction(account, "reset-password")}><KeyRound size={14}/>Reset</button><button onClick={() => void accountAction(account, "set-active", { active: !Boolean(account.active) })}><UserX size={14}/>{account.active ? "Disable" : "Enable"}</button>{user?.isSystemAdmin && account.id !== user.userId && <button onClick={() => void accountAction(account, "set-system-admin", { isSystemAdmin: !Boolean(account.is_system_admin) })}><ShieldCheck size={14}/>{account.is_system_admin ? "Remove admin" : "Make admin"}</button>}</span>
      </div>)}
    </section>
  </div>;
}
