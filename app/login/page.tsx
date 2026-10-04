import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-5">
      <p className="text-xs uppercase tracking-[0.16em] text-primary">Admin</p>
      <h1 className="mt-2 font-heading text-3xl font-semibold">Sign in</h1>
      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  );
}
