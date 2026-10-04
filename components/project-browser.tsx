"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PlatformIcon } from "@/components/social-links";
import { formatPeriod } from "@/lib/format";
import type { Project } from "@/lib/types";

const filters = [
  ["all", "All"],
  ["software", "Software"],
  ["hardware", "Hardware"],
] as const;

export function ProjectBrowser({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number][0]>("all");
  const shown = useMemo(
    () => (filter === "all" ? projects : projects.filter((project) => project.kind === filter)),
    [filter, projects],
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Project type">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              filter === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {shown.map((project) => {
          const period = formatPeriod(project.start_date, project.end_date, false);
          return (
            <li key={project.id}>
              <Link
                href={`/projects/${project.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                {project.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.cover_url}
                    alt=""
                    className="mb-4 aspect-[16/9] w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="mb-4 aspect-[16/9] rounded-xl bg-[linear-gradient(135deg,var(--primary),transparent)] opacity-80" />
                )}
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <span>{project.kind}</span>
                  {period ? <span>{period}</span> : null}
                  {project.is_private ? <span className="text-primary">Client project</span> : null}
                  {project.github_repo || project.live_url ? (
                    <span className="ml-auto flex items-center gap-2 text-foreground/70">
                      {project.github_repo ? (
                        <span title="Source on GitHub">
                          <PlatformIcon platform="github" />
                          <span className="sr-only">Source on GitHub</span>
                        </span>
                      ) : null}
                      {project.live_url ? (
                        <span title="Live site">
                          <ExternalLink className="size-4" aria-hidden />
                          <span className="sr-only">Live site</span>
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </div>
                <h3 className="font-heading text-xl font-semibold tracking-tight group-hover:text-primary">
                  {project.title}
                </h3>
                {project.brief ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.brief}</p> : null}
                {project.tech.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {project.tech.map((item) => (
                      <li key={item} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
