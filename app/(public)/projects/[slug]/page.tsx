import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicPortfolio } from "@/lib/content/repository";
import { ExternalLink, Star } from "lucide-react";
import { PlatformIcon } from "@/components/social-links";
import { formatPeriod } from "@/lib/format";
import { getRepoInfo, isValidRepo } from "@/lib/github";

export const revalidate = 3600;

const updatedFormat = new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" });

export async function generateStaticParams() {
  const data = await getPublicPortfolio();
  return data.projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicPortfolio();
  const project = data.projects.find((item) => item.slug === slug);
  if (!project) return { title: "Project" };
  return {
    title: project.title,
    description: project.brief ?? project.description ?? undefined,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicPortfolio();
  const project = data.projects.find((item) => item.slug === slug);
  if (!project) notFound();
  const period = formatPeriod(project.start_date, project.end_date, false);
  const repo = await getRepoInfo(project.github_repo);

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-16">
      <Link href="/#projects" className="text-sm text-muted-foreground hover:text-foreground">
        All projects
      </Link>
      <p className="mt-6 text-xs uppercase tracking-[0.16em] text-primary">
        {project.kind}
        {period ? ` · ${period}` : ""}
        {project.is_private ? " · Client project" : ""}
      </p>
      <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{project.title}</h1>
      {project.brief ? <p className="mt-4 text-lg leading-8 text-muted-foreground">{project.brief}</p> : null}
      {project.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={project.cover_url} alt="" className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />
      ) : null}
      {project.description ? <p className="mt-8 leading-8">{project.description}</p> : null}
      {project.tech.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-2">
          {project.tech.map((item) => (
            <li key={item} className="rounded-full border border-border px-3 py-1 text-sm">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      {repo ? (
        <dl className="mt-8 grid gap-4 rounded-2xl border border-border p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Stars</dt>
            <dd className="mt-1 flex items-center gap-1.5 font-medium">
              <Star className="size-4 text-primary" aria-hidden />
              {repo.stars}
            </dd>
          </div>
          {repo.languages.length > 0 ? (
            <div>
              <dt className="text-muted-foreground">Languages</dt>
              <dd className="mt-1 font-medium">{repo.languages.join(", ")}</dd>
            </div>
          ) : null}
          {repo.pushedAt ? (
            <div>
              <dt className="text-muted-foreground">Last update</dt>
              <dd className="mt-1 font-medium">
                <time dateTime={repo.pushedAt}>{updatedFormat.format(new Date(repo.pushedAt))}</time>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        {isValidRepo(project.github_repo) ? (
          <a
            className="inline-flex items-center gap-1.5 text-primary"
            href={repo?.url ?? `https://github.com/${project.github_repo}`}
            target="_blank"
            rel="noreferrer"
          >
            <PlatformIcon platform="github" />
            GitHub
          </a>
        ) : null}
        {project.live_url ? (
          <a
            className="inline-flex items-center gap-1.5 text-primary"
            href={project.live_url}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="size-4" aria-hidden />
            Live site
          </a>
        ) : null}
      </div>
    </article>
  );
}
