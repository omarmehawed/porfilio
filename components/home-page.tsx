import Link from "next/link";
import { ProjectBrowser } from "@/components/project-browser";
import { Reveal } from "@/components/reveal";
import { SocialLinks } from "@/components/social-links";
import { formatMonth, formatPeriod } from "@/lib/format";
import type { Portfolio } from "@/lib/types";

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <section id={id} className="scroll-mt-24 border-t border-border py-16 sm:py-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        </div>
        {children}
      </section>
    </Reveal>
  );
}

export function HomePage({ data }: { data: Portfolio }) {
  const { profile } = data;
  const pitch = profile.summary?.split(". ")[0];
  const skillGroups = [
    ["soft", "Soft skills"],
    ["technical", "IT"],
    ["tool", "Technologies"],
    ["language", "Languages"],
  ] as const;

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-5 pt-6 pb-16 sm:pb-20">
        <div className="relative flex flex-col overflow-hidden rounded-3xl bg-[#1a1214] text-[#f6efe9] sm:aspect-[1200/630]">
          <div className="relative aspect-[1200/630] w-full overflow-hidden bg-[linear-gradient(135deg,#2b6cb0,#7b2d3b)] sm:absolute sm:inset-0 sm:aspect-auto">
            {profile.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.cover_url} alt="" className="size-full object-cover" fetchPriority="high" />
            ) : (
              <div
                aria-hidden
                className="absolute right-[12%] top-[6%] aspect-square w-[28%] rounded-full bg-white/35"
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(to_top,#1a1214_0%,rgba(26,18,20,0)_60%)] sm:bg-[linear-gradient(to_top,rgba(20,12,14,0.92)_0%,rgba(20,12,14,0.6)_40%,rgba(20,12,14,0)_75%)]"
            />
          </div>
          <div className="relative -mt-12 flex w-full flex-col items-start gap-4 px-5 pb-6 sm:mt-auto sm:flex-row sm:items-center sm:gap-9 sm:p-12 lg:p-16">
            <div className="size-24 shrink-0 overflow-hidden rounded-full border-4 border-[#f6efe9] bg-[#1a1214] sm:size-36 lg:size-40">
              {profile.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photo_url} alt={profile.full_name} className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center bg-[linear-gradient(135deg,#f6ad55,#9b2c2c)] font-heading text-4xl">
                  {profile.full_name.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#e58a9d] sm:text-sm">{profile.title}</p>
              <h1 className="mt-2 break-words font-heading text-[clamp(2rem,9vw,2.5rem)] font-semibold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
                {profile.full_name}
              </h1>
              {profile.location ? <p className="mt-2 text-base text-[#e8dfd9] sm:text-xl">{profile.location}</p> : null}
            </div>
          </div>
        </div>
        <div className="mt-8">
          {pitch ? <p className="max-w-2xl text-lg leading-8">{pitch}.</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#projects" className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
              View projects
            </a>
            {profile.cv_public_url ? (
              <a
                href={profile.cv_public_url}
                className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-medium"
              >
                Download CV
              </a>
            ) : null}
            <a href="#contact" className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-medium">
              Contact
            </a>
          </div>
          <div className="mt-6">
            <SocialLinks links={data.socialLinks} variant="icons" />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-5">
        <Section id="about" eyebrow="About" title="Building systems people actually use">
          {profile.summary ? <p className="max-w-3xl text-base leading-8 text-muted-foreground">{profile.summary}</p> : null}
        </Section>

        <Section id="experience" eyebrow="Experience" title="Roles and training">
          <ol className="relative space-y-8 border-s border-border ps-6">
            {data.experiences.map((item) => (
              <li key={item.id}>
                <span className="absolute -start-1.5 mt-1.5 size-3 rounded-full bg-primary" />
                <p className="text-sm text-muted-foreground">
                  {formatPeriod(item.start_date, item.end_date, item.is_current)}
                  {item.location ? ` · ${item.location}` : ""}
                </p>
                <h3 className="mt-1 font-heading text-xl font-semibold">{item.role}</h3>
                <p className="text-primary">{item.organization}</p>
                {item.bullets.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 ps-5 text-sm leading-6 text-muted-foreground">
                    {item.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        </Section>

        <Section id="projects" eyebrow="Projects" title="Software and hardware">
          <ProjectBrowser projects={data.projects} />
        </Section>

        <Section id="skills" eyebrow="Skills" title="What I work with">
          <div className="grid gap-6 sm:grid-cols-2">
            {skillGroups.map(([category, label]) => {
              const items = data.skills.filter((skill) => skill.category === category);
              if (items.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {items.map((skill) => (
                      <li key={skill.id} className="rounded-full border border-border px-3 py-1.5 text-sm">
                        {skill.name}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="credentials" eyebrow="Credentials" title="Certifications and courses">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="mb-4 font-heading text-xl">Certifications</h3>
              <ul className="space-y-3">
                {data.certifications.map((item) => (
                  <li key={item.id}>
                    <p className="font-medium">{item.title}</p>
                    {item.issuer ? <p className="text-sm text-muted-foreground">{item.issuer}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-heading text-xl">Courses</h3>
              <ul className="space-y-3">
                {data.courses.map((item) => (
                  <li key={item.id}>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {[item.provider, formatPeriod(item.start_date, item.end_date, item.status === "in_progress" && !item.end_date), item.status === "in_progress" ? "In progress" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="achievements" eyebrow="Achievements" title="Competitions">
          <ul className="space-y-4">
            {data.achievements.map((item) => (
              <li key={item.id} className="rounded-2xl border border-border p-5">
                <p className="font-heading text-xl font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[item.event, formatMonth(item.achieved_on)].filter(Boolean).join(" · ")}
                </p>
                {item.details ? <p className="mt-2 text-sm leading-6">{item.details}</p> : null}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="education" eyebrow="Education" title="Studies">
          <ul className="space-y-4">
            {data.education.map((item) => (
              <li key={item.id}>
                <h3 className="font-heading text-xl font-semibold">{item.degree}</h3>
                <p className="text-primary">{item.institution}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPeriod(item.start_date, item.end_date, false)}
                  {item.details ? ` · ${item.details}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="contact" eyebrow="Contact" title="Get in touch">
          {profile.location ? <p className="text-muted-foreground">{profile.location}</p> : null}
          <div className="mt-4">
            <SocialLinks links={data.socialLinks} variant="list" />
          </div>
          {profile.cv_public_url ? (
            <Link href={profile.cv_public_url} className="mt-6 inline-flex text-sm font-medium text-primary">
              Download CV
            </Link>
          ) : null}
        </Section>
      </div>
    </>
  );
}
