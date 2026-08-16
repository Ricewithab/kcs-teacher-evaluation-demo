import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import "./globals.css";
import "./evaluation-record.css";
import "./persistence.css";
import "./production.css";
import "./production-workflow.css";
import "./master-admin.css";
import "./print.css";
import "./attachments.css";

export const metadata = {
  title: "KCS Teacher Evaluation",
  description: "Connected teacher evaluation, development and lesson planning for KCS Chengdu.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
