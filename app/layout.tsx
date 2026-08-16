import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata = {
  title: "KCS Teacher Evaluation Demo",
  description: "Teacher evaluation, development and lesson-planning prototype for KCS Chengdu.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
