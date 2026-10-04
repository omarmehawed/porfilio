import type { Platform, SocialLink } from "@/lib/types";

export function socialHref(link: Pick<SocialLink, "platform" | "value">): string | null {
  const value = link.value.trim();
  if (!value) return null;

  if (link.platform === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : null;
  }

  if (link.platform === "phone") {
    const compact = value.replace(/[^\d+]/g, "");
    return compact.replace(/\D/g, "").length >= 8 ? `tel:${compact}` : null;
  }

  if (link.platform === "whatsapp") {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 ? `https://wa.me/${digits}` : null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function socialLabel(link: Pick<SocialLink, "platform" | "label">) {
  if (link.platform === "other") return link.label?.trim() || "Link";
  const labels: Record<Platform, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    github: "GitHub",
    whatsapp: "WhatsApp",
    phone: "Phone",
    email: "Email",
    other: "Link",
  };
  return labels[link.platform];
}

export function visibleLinks(links: SocialLink[]) {
  return links
    .filter((link) => link.visible)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((link) => ({ ...link, href: socialHref(link) }))
    .filter((link): link is SocialLink & { href: string } => Boolean(link.href));
}
