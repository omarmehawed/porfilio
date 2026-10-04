import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/env";

const WINDOW_MS = 15 * 60 * 1000;
const FAILURE_LIMIT = 5;

type MemoryAttempt = { ip: string; success: boolean; at: number };

function memoryAttempts() {
  const store = globalThis as typeof globalThis & { __loginAttempts?: MemoryAttempt[] };
  if (!store.__loginAttempts) store.__loginAttempts = [];
  return store.__loginAttempts;
}

export function isLockedOut(failedAttempts: number) {
  return failedAttempts >= FAILURE_LIMIT;
}

export async function clientIp() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headerList.get("x-real-ip") ?? "unknown";
}

export async function failedAttempts(ip: string) {
  const since = Date.now() - WINDOW_MS;
  if (hasServiceRole()) {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("success", false)
      .gte("created_at", new Date(since).toISOString());
    if (error) throw new Error(error.message);
    return count ?? 0;
  }
  return memoryAttempts().filter((attempt) => attempt.ip === ip && !attempt.success && attempt.at >= since)
    .length;
}

export async function logAttempt(ip: string, success: boolean) {
  if (hasServiceRole()) {
    const admin = createAdminClient();
    const { error } = await admin.from("login_attempts").insert({ ip, success });
    if (error) throw new Error(error.message);
    return;
  }
  memoryAttempts().push({ ip, success, at: Date.now() });
}
