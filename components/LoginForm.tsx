"use client";

import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiPath, BASE_PATH } from "@/lib/paths";

export function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(apiPath("/api/auth/login"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to sign in");
      const requested = params.get("returnTo");
      const safeReturn = requested?.startsWith(BASE_PATH) && !requested.includes("//") ? requested : null;
      const destination = data.user?.mustChangePassword ? apiPath("/account/password") : safeReturn ?? apiPath("/");
      window.location.replace(destination);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="login-page">
    <section className="login-brand-panel">
      <div className="login-brand-lockup"><div className="login-kcs-mark">KCS</div><span>Dipont KCS Chengdu</span></div>
      <div className="login-message"><span className="eyebrow">Teaching & Learning</span><h1>Teacher Evaluation</h1><p>Scheduling, lesson preparation, observation evidence, feedback, reflection and professional development in one connected record.</p></div>
      <div className="login-security"><ShieldCheck size={18}/><span>Access is limited to approved staff accounts. Permissions follow the school's reporting hierarchy.</span></div>
    </section>
    <main className="login-form-panel">
      <form className="login-form" onSubmit={submit}>
        <div className="login-icon"><LockKeyhole size={22}/></div>
        <span className="eyebrow">KCS staff</span>
        <h2>Sign in</h2>
        <p>Use the account created for your staff profile.</p>
        <label>School email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@kcschengdu.com" required/></label>
        <label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required/><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
        {error && <div className="login-error">{error}</div>}
        <button className="button primary login-submit" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}<ArrowRight size={16}/></button>
        <small>Contact your line manager or system administrator if you cannot access your account.</small>
      </form>
    </main>
  </div>;
}
