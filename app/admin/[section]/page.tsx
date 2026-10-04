import { notFound } from "next/navigation";
import { EntityManager } from "@/components/admin/entity-manager";
import { routeSections, type AdminRoute } from "@/lib/admin/sections";
import { getAdminPortfolio } from "@/lib/content/repository";
import type { ContentSection } from "@/lib/types";

export function generateStaticParams() {
  return Object.keys(routeSections).map((section) => ({ section }));
}

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!(section in routeSections)) notFound();
  const key = routeSections[section as AdminRoute];
  const data = await getAdminPortfolio();
  const records: Record<ContentSection, { id: string }[]> = {
    experience: data.experiences,
    education: data.education,
    project: data.projects,
    skill: data.skills,
    certification: data.certifications,
    course: data.courses,
    achievement: data.achievements,
  };

  return (
    <EntityManager
      section={key}
      records={records[key] as Array<{ id: string } & Record<string, unknown>>}
    />
  );
}
