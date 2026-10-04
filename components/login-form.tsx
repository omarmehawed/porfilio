"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, verifyTotp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Challenge = {
  factorId: string;
  challengeId: string;
  setup?: { qrCode: string; secret: string };
};

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  async function onPassword(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signIn(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if ("enroll" in result) {
      setChallenge({
        factorId: result.factorId,
        challengeId: result.challengeId,
        setup: { qrCode: result.qrCode, secret: result.secret },
      });
      return;
    }
    if ("mfa" in result) {
      setChallenge({ factorId: result.factorId, challengeId: result.challengeId });
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  async function onCode(formData: FormData) {
    if (!challenge) return;
    setPending(true);
    setError(null);
    const result = await verifyTotp(challenge.factorId, challenge.challengeId, String(formData.get("code") ?? ""));
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={challenge ? onCode : onPassword} className="space-y-4">
      {challenge?.setup ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm">
            Set up two-factor authentication. Scan this code with an authenticator app, then enter the 6-digit code it shows.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={challenge.setup.qrCode} alt="Authenticator QR code" className="mx-auto size-44 rounded-lg bg-white p-2" />
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer">Can&apos;t scan? Enter the key manually</summary>
            <code className="mt-2 block break-all rounded bg-muted p-2 text-xs">{challenge.setup.secret}</code>
          </details>
        </div>
      ) : null}
      {challenge ? (
        <div className="space-y-2">
          <Label htmlFor="code">Authentication code</Label>
          <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            </div>
          </div>
        </>
      )}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Checking…" : challenge ? "Verify" : "Continue"}
      </Button>
    </form>
  );
}
