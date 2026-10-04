import "server-only";
import { cache } from "react";
import { seedPortfolio } from "@/lib/content/seed";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, hasServiceRole } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Achievement,
  Certification,
  Course,
  Education,
  Experience,
  Portfolio,
  Profile,
  Project,
  Skill,
  SocialLink,
} from "@/lib/types";

const profileColumns = "id, full_name, title, summary, location, photo_url, cover_url, cv_public_url, updated_at";

function byOrder<T extends { sort_order: number }>(rows: T[]) {
  return rows.slice().sort((a, b) => a.sort_order - b.sort_order);
}

function visible<T extends { visible: boolean }>(rows: T[]) {
  return rows.filter((row) => row.visible);
}

export function toPublic(data: Portfolio): Portfolio {
  return {
    profile: data.profile,
    socialLinks: byOrder(visible(data.socialLinks)),
    experiences: byOrder(visible(data.experiences)),
    education: byOrder(visible(data.education)),
    projects: byOrder(visible(data.projects)),
    skills: byOrder(visible(data.skills)),
    certifications: byOrder(visible(data.certifications)),
    courses: byOrder(visible(data.courses)),
    achievements: byOrder(visible(data.achievements)),
  };
}

async function fromSupabase(includeHidden: boolean): Promise<Portfolio> {
  const supabase = includeHidden ? createAdminClient() : createPublicClient();
  const [
    profile,
    socialLinks,
    experiences,
    education,
    projects,
    skills,
    certifications,
    courses,
    achievements,
  ] = await Promise.all([
    supabase.from("profile").select(profileColumns).limit(1).maybeSingle(),
    supabase.from("social_links").select("*").order("sort_order"),
    supabase.from("experiences").select("*").order("sort_order"),
    supabase.from("education").select("*").order("sort_order"),
    supabase.from("projects").select("*").order("sort_order"),
    supabase.from("skills").select("*").order("sort_order"),
    supabase.from("certifications").select("*").order("sort_order"),
    supabase.from("courses").select("*").order("sort_order"),
    supabase.from("achievements").select("*").order("sort_order"),
  ]);

  const error =
    profile.error ||
    socialLinks.error ||
    experiences.error ||
    education.error ||
    projects.error ||
    skills.error ||
    certifications.error ||
    courses.error ||
    achievements.error;
  if (error) throw new Error(error.message);
  if (!profile.data) throw new Error("Profile row is missing.");

  return {
    profile: profile.data as Profile,
    socialLinks: (socialLinks.data ?? []) as SocialLink[],
    experiences: (experiences.data ?? []) as Experience[],
    education: (education.data ?? []) as Education[],
    projects: (projects.data ?? []) as Project[],
    skills: (skills.data ?? []) as Skill[],
    certifications: (certifications.data ?? []) as Certification[],
    courses: (courses.data ?? []) as Course[],
    achievements: (achievements.data ?? []) as Achievement[],
  };
}

export const getPublicPortfolio = cache(async () => {
  if (!isSupabaseConfigured()) return toPublic(seedPortfolio());
  return toPublic(await fromSupabase(false));
});

export async function getAdminPortfolio() {
  if (!hasServiceRole()) {
    throw new Error("Supabase service role is not configured.");
  }
  const data = await fromSupabase(true);
  return {
    ...data,
    socialLinks: byOrder(data.socialLinks),
    experiences: byOrder(data.experiences),
    education: byOrder(data.education),
    projects: byOrder(data.projects),
    skills: byOrder(data.skills),
    certifications: byOrder(data.certifications),
    courses: byOrder(data.courses),
    achievements: byOrder(data.achievements),
  };
}
