"use client";

import { CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { STAFF } from "@/lib/demo-data";
import { apiPath } from "@/lib/paths";

export function SetupForm() {
  const [hasAccounts, setHasAccounts] = useState<boolean | null>(null);
  const [staffId, setStaffId] = useState("s75");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(apiPath("/api/auth/bootstrap"), { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setHasAccounts(Boolean(data.hasAccounts)))
      .catch(() => setHasAccounts(false));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirm) return setError("Passwords do not match");
    setSubmitting(true);
    try {
      const response = await fetch(apiPath("/api/auth/bootstrap"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, staffId, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to complete setup");
      setComplete(true);
      setHasAccounts(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to complete setup");
    } finally {
      setSubmitting(false);
    }
  }

  if (complete) return <div className="setup-page"><section className="setup-card success-card"><CheckCircle2/><span className="eyebrow">Initial account created</span><h1>Production identity is ready</h1><p>The first account has technical system-administrator access. Switch <code>APP_MODE</code> to <code>production</code> and redeploy when you are ready to require staff sign-in.</p></section></div>;

  if (hasAccounts) return <div className="setup-page"><section className="setup-card"><ShieldCheck/><span className="eyebrow">Setup complete</span><h1>Initial setup has already been completed</h1><p>Further staff accounts are created from Master Management → Accounts after signing in.</p></section></div>;

  return <div className="setup-page"><form className="setup-card" onSubmit={submit}>
    <div className="login-icon"><KeyRound size={22}/></div><span className="eyebrow">First-run setup</span><h1>Create the system administrator</h1><p>This route works only while the user table is empty and requires the private Cloudflare bootstrap secret.</p>
    <label>Link account to staff profile<select value={staffId} onChange={(event) => setStaffId(event.target.value)}>{STAFF.filter((person) => person.status === "Active").map((person) => <option key={person.id} value={person.id}>{person.name} · {person.position}</option>)}</select></label>
    <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required/></label>
    <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required/><small>At least 12 characters.</small></label>
    <label>Confirm password<input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} minLength={12} required/></label>
    <label>Bootstrap token<input type="password" value={token} onChange={(event) => setToken(event.target.value)} required/><small>This is the secret configured with Wrangler, not a staff password.</small></label>
    {error && <div className="login-error">{error}</div>}
    <button className="button primary" type="submit" disabled={submitting}>{submitting ? "Creating account…" : "Create initial administrator"}</button>
  </form></div>;
}
