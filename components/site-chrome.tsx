import Link from "next/link";
import { SocialLinks } from "@/components/social-links";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Profile, SocialLink } from "@/lib/types";

const nav = [
  ["About", "/#about"],
  ["Experience", "/#experience"],
  ["Projects", "/#projects"],
  ["Skills", "/#skills"],
  ["Contact", "/#contact"],
] as const;

export function SiteHeader({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="font-heading text-sm font-semibold tracking-tight">
          {profile.full_name}
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex" aria-label="Sections">
          {nav.map(([label, href]) => (
            <a key={href} href={href} className="hover:text-foreground">
              {label}
            </a>
          ))}
        </nav>
        <ThemeToggle />
      </div>
      <nav className="flex gap-4 overflow-x-auto px-5 pb-3 text-sm text-muted-foreground md:hidden" aria-label="Sections">
        {nav.map(([label, href]) => (
          <a key={href} href={href} className="shrink-0 hover:text-foreground">
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter({
  profile,
  links,
}: {
  profile: Profile;
  links: SocialLink[];
}) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-sm font-semibold">{profile.full_name}</p>
          {profile.location ? <p className="text-sm text-muted-foreground">{profile.location}</p> : null}
        </div>
        <SocialLinks links={links} variant="icons" />
      </div>
    </footer>
  );
}
