import { env } from "cloudflare:workers";

export function database() {
  const binding = (env as unknown as Record<string, any>).kcs_teacher_evaluation_demo_db;
  if (!binding) throw new Error("D1 binding kcs_teacher_evaluation_demo_db is not configured");
  return binding;
}
