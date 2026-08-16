"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, ClipboardCheck, LayoutDashboard, Settings2, ShieldCheck, UsersRound } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ROLE_USERS, type SystemRole } from "@/lib/demo-data";

const RoleContext = createContext<{ role: SystemRole; setRole: (role: SystemRole) => void } | null>(null);
export function useDemoRole() {
  const value = useContext(RoleContext);
  if (!value) throw new Error("useDemoRole must be used inside AppShell");
  return value;
}

const labels: Record<SystemRole, string> = {
  master: "Head of School · Master",
  division: "Head of Division",
  manager: "Head of Department",
  teacher: "Teacher",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [role, setRoleState] = useState<SystemRole>("division");
  useEffect(() => {
    const saved = window.localStorage.getItem("kcs-demo-role") as SystemRole | null;
    if (saved && ROLE_USERS[saved]) setRoleState(saved);
  }, []);
  function setRole(next: SystemRole) {
    setRoleState(next);
    window.localStorage.setItem("kcs-demo-role", next);
  }
  const user = ROLE_USERS[role];
  const nav = useMemo(() => {
    const items = [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/evaluations", label: "Evaluations", icon: ClipboardCheck },
      { href: "/lesson-planning", label: "Lesson Planning", icon: BookOpenCheck },
    ];
    if (role === "manager" || role === "division" || role === "master") items.push({ href: "/master", label: role === "master" ? "Master Management" : "System Preview", icon: Settings2 });
    return items;
  }, [role]);

  return <RoleContext.Provider value={{ role, setRole }}>
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">KCS</div><div><strong>Teacher Evaluation</strong><span>Teaching & Learning Demo</span></div></div>
        <div className="demo-badge"><ShieldCheck size={14}/> Public demo · fictional evaluation data</div>
        <nav>{nav.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? path === "/apps/teacher-evaluation" || path === "/" : path.endsWith(item.href);
          return <Link key={item.href} href={item.href} className={active ? "active" : ""}><Icon size={18}/>{item.label}</Link>;
        })}</nav>
        <div className="sidebar-spacer" />
        <div className="role-card">
          <span className="eyebrow">Demo role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as SystemRole)}>
            {(Object.keys(labels) as SystemRole[]).map((key) => <option key={key} value={key}>{labels[key]}</option>)}
          </select>
          <div className="person"><div className="avatar">{user.name.replace(/[^A-Za-z]/g, "").slice(0,2).toUpperCase() || "KC"}</div><div><strong>{user.name}</strong><span>{user.position}</span></div></div>
        </div>
      </aside>
      <main className="main"><div className="mobile-role"><UsersRound size={16}/><strong>{labels[role]}</strong><select value={role} onChange={(e) => setRole(e.target.value as SystemRole)}>{(Object.keys(labels) as SystemRole[]).map((key) => <option key={key} value={key}>{labels[key]}</option>)}</select></div>{children}</main>
    </div>
  </RoleContext.Provider>;
}
