"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, ClipboardCheck, KeyRound, LayoutDashboard, LogOut, Settings2, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ROLE_USERS, type SystemRole } from "@/lib/demo-data";
import type { AppMode, SessionIdentity, SessionResponse } from "@/lib/auth-types";
import { apiPath, BASE_PATH } from "@/lib/paths";

const RoleContext = createContext<{ role: SystemRole; setRole: (role: SystemRole) => void } | null>(null);
const SessionContext = createContext<{ mode: AppMode | null; user: SessionIdentity | null; loading: boolean; refresh: () => Promise<void> } | null>(null);

export function useDemoRole() {
  const value = useContext(RoleContext);
  if (!value) throw new Error("useDemoRole must be used inside AppShell");
  return value;
}

export function useAppSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useAppSession must be used inside AppShell");
  return value;
}

const labels: Record<SystemRole, string> = {
  master: "Head of School · Master",
  division: "Head of Division",
  manager: "Head of Department",
  teacher: "Teacher",
};

function roleForIdentity(user: SessionIdentity | null): SystemRole {
  if (!user) return "teacher";
  if (user.isSystemAdmin || user.systemRole === "master") return "master";
  if (user.systemRole === "division") return "division";
  if (user.systemRole === "manager") return "manager";
  return "teacher";
}

function stripBasePath(path: string) {
  if (path.startsWith(BASE_PATH)) return path.slice(BASE_PATH.length) || "/";
  return path || "/";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = stripBasePath(pathname);
  const publicPage = path === "/login" || path === "/setup";
  const passwordPage = path === "/account/password";
  const [demoRole, setDemoRole] = useState<SystemRole>("division");
  const [mode, setMode] = useState<AppMode | null>(null);
  const [identity, setIdentity] = useState<SessionIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("kcs-demo-role") as SystemRole | null;
    if (saved && ROLE_USERS[saved]) setDemoRole(saved);
  }, []);

  async function refreshSession() {
    try {
      const response = await fetch(apiPath("/api/auth/session"), { cache: "no-store" });
      const data = await response.json() as SessionResponse;
      setMode(data.mode ?? "demo");
      setIdentity(data.user ?? null);
    } catch {
      setMode("demo");
      setIdentity(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refreshSession(); }, []);

  useEffect(() => {
    if (loading || mode !== "production" || publicPage) return;
    if (!identity) {
      const returnTo = encodeURIComponent(pathname);
      window.location.replace(`${apiPath("/login")}?returnTo=${returnTo}`);
      return;
    }
    if (identity.mustChangePassword && !passwordPage) window.location.replace(apiPath("/account/password"));
  }, [identity, loading, mode, passwordPage, pathname, publicPage]);

  function setRole(next: SystemRole) {
    if (mode === "production") return;
    setDemoRole(next);
    window.localStorage.setItem("kcs-demo-role", next);
  }

  async function logout() {
    await fetch(apiPath("/api/auth/logout"), { method: "POST" });
    window.location.replace(apiPath("/login"));
  }

  const role = mode === "production" ? roleForIdentity(identity) : demoRole;
  const demoUser = ROLE_USERS[role];
  const userName = identity?.name ?? demoUser.name;
  const userPosition = identity?.position ?? demoUser.position;
  const isMaster = role === "master";

  const nav = useMemo(() => {
    const items = [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/evaluations", label: "Evaluations", icon: ClipboardCheck },
      { href: "/lesson-planning", label: "Lesson Planning", icon: BookOpenCheck },
    ];
    if (isMaster || (mode === "demo" && (role === "manager" || role === "division"))) {
      items.push({ href: "/master", label: isMaster ? "Master Management" : "System Preview", icon: Settings2 });
    }
    if (mode === "production" && isMaster) items.push({ href: "/admin/users", label: "Accounts", icon: UserCog });
    return items;
  }, [isMaster, mode, role]);

  const providers = (content: React.ReactNode) => <SessionContext.Provider value={{ mode, user: identity, loading, refresh: refreshSession }}>
    <RoleContext.Provider value={{ role, setRole }}>{content}</RoleContext.Provider>
  </SessionContext.Provider>;

  if (publicPage) return providers(<div className="auth-shell">{children}</div>);
  if (loading || (mode === "production" && (!identity || (identity.mustChangePassword && !passwordPage)))) {
    return providers(<div className="app-loading"><div className="brand-mark">KCS</div><strong>Teacher Evaluation</strong><span>Loading secure workspace…</span></div>);
  }

  return providers(
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">KCS</div><div><strong>Teacher Evaluation</strong><span>{mode === "production" ? "Teaching & Learning" : "Teaching & Learning Demo"}</span></div></div>
        {mode === "demo" && <div className="demo-badge"><ShieldCheck size={14}/> Public demo · fictional evaluation data</div>}
        {identity?.isSystemAdmin && <div className="demo-badge admin-badge"><ShieldCheck size={14}/> System administrator</div>}
        <nav>{nav.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={active ? "active" : ""}><Icon size={18}/>{item.label}</Link>;
        })}</nav>
        <div className="sidebar-spacer" />
        <div className="role-card">
          <span className="eyebrow">{mode === "production" ? "Signed in as" : "Demo role"}</span>
          {mode === "demo" && <select value={role} onChange={(event) => setRole(event.target.value as SystemRole)}>
            {(Object.keys(labels) as SystemRole[]).map((key) => <option key={key} value={key}>{labels[key]}</option>)}
          </select>}
          {mode === "production" && <strong className="role-label">{identity?.isSystemAdmin ? "System administrator" : labels[role]}</strong>}
          <div className="person"><div className="avatar">{userName.replace(/[^A-Za-z]/g, "").slice(0,2).toUpperCase() || "KC"}</div><div><strong>{userName}</strong><span>{userPosition}</span></div></div>
          {mode === "production" && <div className="account-actions"><Link href="/account/password"><KeyRound size={14}/>Password</Link><button onClick={logout}><LogOut size={14}/>Sign out</button></div>}
        </div>
      </aside>
      <main className="main">
        {mode === "demo" && <div className="mobile-role"><UsersRound size={16}/><strong>{labels[role]}</strong><select value={role} onChange={(event) => setRole(event.target.value as SystemRole)}>{(Object.keys(labels) as SystemRole[]).map((key) => <option key={key} value={key}>{labels[key]}</option>)}</select></div>}
        {children}
      </main>
    </div>,
  );
}
