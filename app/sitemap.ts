import type { MetadataRoute } from "next";
import { getPublicPortfolio } from "@/lib/content/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const data = await getPublicPortfolio();
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    ...data.projects.map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
