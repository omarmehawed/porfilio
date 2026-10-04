import { HomePage } from "@/components/home-page";
import { getPublicPortfolio } from "@/lib/content/repository";
import { visibleLinks } from "@/lib/social";

export const revalidate = 3600;

export default async function Page() {
  const data = await getPublicPortfolio();
  const links = visibleLinks(data.socialLinks);
  const email = links.find((link) => link.platform === "email");
  const sameAs = links
    .filter((link) => ["facebook", "instagram", "tiktok", "linkedin", "github", "other"].includes(link.platform))
    .map((link) => link.href);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.profile.full_name,
    jobTitle: data.profile.title,
    description: data.profile.summary,
    homeLocation: data.profile.location,
    url: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    email: email?.value,
    sameAs,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomePage data={data} />
    </>
  );
}
