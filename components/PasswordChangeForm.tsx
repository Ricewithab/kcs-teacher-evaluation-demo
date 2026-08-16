"use client";

import { KeyRound, Save } from "lucide-react";
import { useState } from "react";
import { apiPath } from "@/lib/paths";
import { useAppSession } from "@/components/AppShell";

export function PasswordChangeForm() {
  const { user } = useAppSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (nextPassword !== confirm) return setError("New passwords do not match");
    setSaving(true);
    try {
      const response = await fetch(apiPath("/api/auth/password"), {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, nextPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to change password");
      window.location.replace(apiPath("/"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to change password");
    } finally {
      setSaving(false);
    }
  }

  return <div className="page narrow-page">
    <header className="page-head"><div><span className="eyebrow">Account security</span><h1>{user?.mustChangePassword ? "Choose your password" : "Change password"}</h1><p>{user?.mustChangePassword ? "Your temporary password must be replaced before you can use the system." : "Update the password for your KCS Teacher Evaluation account."}</p></div></header>
    <form className="card form-card password-change-card" onSubmit={submit}>
      <div className="card-title"><div><h2>Secure sign-in</h2><p>Use a long passphrase or password that you do not reuse elsewhere.</p></div><KeyRound/></div>
      <div className="form-grid">
        <label className="wide">Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required/></label>
        <label>New password<input type="password" autoComplete="new-password" minLength={12} value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} required/><small>Minimum 12 characters.</small></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" minLength={12} value={confirm} onChange={(event) => setConfirm(event.target.value)} required/></label>
      </div>
      {error && <div className="login-error">{error}</div>}
      <div className="button-row"><button className="button primary" type="submit" disabled={saving}><Save size={15}/>{saving ? "Saving…" : "Save new password"}</button></div>
    </form>
  </div>;
}
