import { env } from "cloudflare:workers";
import type { AppMode } from "@/lib/auth-types";

export function getAppMode(): AppMode {
  const value = String((env as unknown as Record<string, unknown>).APP_MODE ?? "demo").toLowerCase();
  return value === "production" ? "production" : "demo";
}

export function isProductionMode() {
  return getAppMode() === "production";
}
