import Link from "next/link";
import { getAdminPortfolio } from "@/lib/content/repository";

export default async function AdminHome() {
  const data = await getAdminPortfolio();
  const counts = [
    ["Links", data.socialLinks.length, "/admin/socials"],
    ["Experience", data.experiences.length, "/admin/experience"],
    ["Education", data.education.length, "/admin/education"],
    ["Projects", data.projects.length, "/admin/projects"],
    ["Skills", data.skills.length, "/admin/skills"],
    ["Certifications", data.certifications.length, "/admin/certifications"],
    ["Courses", data.courses.length, "/admin/courses"],
    ["Achievements", data.achievements.length, "/admin/achievements"],
  ] as const;

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Dashboard</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Public contact links: {data.socialLinks.filter((link) => link.visible).length}. Upload a new CV under{" "}
        <Link href="/admin/cv" className="text-primary">
          CV updates
        </Link>{" "}
        to review AI-suggested changes before anything is saved.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(([label, count, href]) => (
          <li key={label}>
            <Link href={href} className="block rounded-2xl border border-border p-4 hover:border-primary">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="font-heading text-3xl font-semibold">{count}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
