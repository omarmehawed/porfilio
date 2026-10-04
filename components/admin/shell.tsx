import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { adminNav } from "@/lib/admin/sections";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-border md:border-e md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <p className="font-heading text-sm font-semibold">Admin</p>
          <form action={signOut} className="md:mt-3">
            <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3 md:pb-6" aria-label="Admin">
          {adminNav.map(([label, href]) => (
            <Link key={href} href={href} className="shrink-0 rounded-lg px-3 py-2 text-sm hover:bg-muted">
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="px-5 py-8">{children}</div>
    </div>
  );
}
