import type { SocialLink } from "@/lib/types";
import { socialLabel, visibleLinks } from "@/lib/social";

export function PlatformIcon({ platform }: { platform: SocialLink["platform"] }) {
  const common = { viewBox: "0 0 24 24", className: "size-4", "aria-hidden": true as const, fill: "currentColor" };
  switch (platform) {
    case "facebook":
      return (
        <svg {...common}>
          <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2zM17.4 6.6a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M14 3h2.1a5.2 5.2 0 0 0 3.4 3.2v2.2a7.3 7.3 0 0 1-3.4-1.1v6.4a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.3a3.4 3.4 0 1 0 2.3 3.2V3z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <path d="M6.5 9H4V20h2.5zM5.2 4A1.6 1.6 0 1 0 5.2 7.2 1.6 1.6 0 0 0 5.2 4zM20 20h-2.5v-5.6c0-1.6-.6-2.6-2-2.6a2.1 2.1 0 0 0-2 1.4 2.7 2.7 0 0 0-.1 1v5.8H11V9h2.4v1.5a3.4 3.4 0 0 1 3-1.7c2.2 0 3.6 1.4 3.6 4.4z" />
        </svg>
      );
    case "github":
      return (
        <svg {...common}>
          <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.6s.8-.3 2.8 1a9.6 9.6 0 0 1 5 0c2-1.3 2.8-1 2.8-1a3.6 3.6 0 0 1 .1 2.6 3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M12 3a8.7 8.7 0 0 0-7.5 13.1L3.6 21l5-1.3A8.7 8.7 0 1 0 12 3zm4.8 12.3c-.2.6-1.1 1-1.6 1.1-.4 0-.9.2-3.1-.7-2.6-1-4.2-3.6-4.3-3.8-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.2.5-.3.7-.3h.5c.2 0 .4 0 .5.4.2.6.7 2 .7 2.1s.1.3 0 .5-.2.4-.3.6-.3.3-.1.6.9 1.5 2 2.4c1.4 1.1 2.4 1.5 2.7 1.6s.4.1.6-.1.6-.7.8-.9.3-.2.5-.1 1.4.7 1.6.8.4.2.5.3.1.5 0 1.1z" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M8 3h2l1 4-2 1a12 12 0 0 0 6 6l1-2 4 1v2a2 2 0 0 1-2 2A15 15 0 0 1 6 5a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "email":
      return (
        <svg {...common}>
          <path d="M3 6h18v12H3zm2 1.2V8l7 4.2L19 8v-.8z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1 1.4 1.4 1.1-1.1a3 3 0 0 1 4.2 4.2l-2 2a3 3 0 0 1-4.2 0zM14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 1 0 7.1 7.1l1.1-1.1-1.4-1.4-1.1 1.1a3 3 0 0 1-4.2-4.2l2-2a3 3 0 0 1 4.2 0z" />
        </svg>
      );
  }
}

export function SocialLinks({
  links,
  variant,
}: {
  links: SocialLink[];
  variant: "icons" | "list";
}) {
  const items = visibleLinks(links);
  if (items.length === 0) return null;

  if (variant === "list") {
    return (
      <ul className="flex flex-col gap-2">
        {items.map((link) => (
          <li key={link.id}>
            <a
              href={link.href}
              className="inline-flex items-center gap-3 text-sm hover:text-primary"
              {...(link.href.startsWith("http")
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
            >
              <PlatformIcon platform={link.platform} />
              <span>{socialLabel(link)}</span>
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {items.map((link) => (
        <li key={link.id}>
          <a
            href={link.href}
            aria-label={socialLabel(link)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
            {...(link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            <PlatformIcon platform={link.platform} />
          </a>
        </li>
      ))}
    </ul>
  );
}
