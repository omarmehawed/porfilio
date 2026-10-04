"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { clientIp, failedAttempts, isLockedOut, logAttempt } from "@/lib/ratelimit";

export type SignInResult =
  | { error: string }
  | { mfa: true; factorId: string; challengeId: string }
  | { enroll: true; factorId: string; challengeId: string; qrCode: string; secret: string }
  | { ok: true };

const genericError = "Invalid email or password.";

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const ip = await clientIp();
  if (isLockedOut(await failedAttempts(ip))) {
    await logAttempt(ip, false);
    return { error: "Too many attempts. Try again later." };
  }
  if (!isSupabaseConfigured()) {
    await logAttempt(ip, false);
    return { error: genericError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  await logAttempt(ip, !error);
  if (error) return { error: genericError };

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel === "aal2") return { ok: true };
  const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
  if (factorError || !factors) return { error: "Two-factor authentication is required." };
  const factor = factors.totp[0];
  if (!factor) return startEnrollment(supabase, factors.all);
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: factor.id,
  });
  if (challengeError || !challenge) return { error: "Two-factor authentication is required." };
  return { mfa: true, factorId: factor.id, challengeId: challenge.id };
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function startEnrollment(
  supabase: ServerClient,
  existing: { id: string; status: string }[],
): Promise<SignInResult> {
  // Only reached when the account has no verified factor; leftover unverified ones block a new enrollment.
  for (const stale of existing.filter((factor) => factor.status !== "verified")) {
    await supabase.auth.mfa.unenroll({ factorId: stale.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Portfolio admin ${new Date().toISOString().slice(0, 10)}`,
  });
  if (error || !data) return { error: "Two-factor setup failed. Try again." };
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: data.id,
  });
  if (challengeError || !challenge) return { error: "Two-factor setup failed. Try again." };
  const qr = data.totp.qr_code;
  return {
    enroll: true,
    factorId: data.id,
    challengeId: challenge.id,
    qrCode: qr.startsWith("data:") ? qr : `data:image/svg+xml;utf-8,${encodeURIComponent(qr)}`,
    secret: data.totp.secret,
  };
}

export async function verifyTotp(factorId: string, challengeId: string, code: string) {
  const ip = await clientIp();
  if (isLockedOut(await failedAttempts(ip))) {
    await logAttempt(ip, false);
    return { error: "Too many attempts. Try again later." };
  }
  if (!isSupabaseConfigured()) {
    await logAttempt(ip, false);
    return { error: "Invalid authentication code." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code: code.replace(/\s/g, ""),
  });
  await logAttempt(ip, !error);
  if (error) return { error: "Invalid authentication code." };
  redirect("/admin");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
