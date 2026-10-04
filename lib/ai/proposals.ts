import type { z } from "zod";
import type { ContentSection } from "@/lib/types";
import {
  achievementSchema,
  certificationSchema,
  courseSchema,
  educationSchema,
  experienceSchema,
  profileSchema,
  projectSchema,
  skillSchema,
} from "@/lib/validators";

export const cvEntities = [
  "profile",
  "experience",
  "education",
  "project",
  "skill",
  "certification",
  "course",
  "achievement",
] as const;

export type CvEntity = (typeof cvEntities)[number];
export type ProposalAction = "add" | "update";
export type FieldChange = { field: string; before: unknown; after: unknown };

const sectionSchemas: Record<ContentSection, z.ZodObject> = {
  experience: experienceSchema,
  education: educationSchema,
  project: projectSchema,
  skill: skillSchema,
  certification: certificationSchema,
  course: courseSchema,
  achievement: achievementSchema,
};

const profileFromCv = profileSchema.pick({ full_name: true, title: true, summary: true, location: true });

function describe(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Invalid data.";
  return issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message;
}

function pick(data: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(keys.filter((key) => key in data).map((key) => [key, data[key]]));
}

/**
 * The single gate for AI-produced rows: used when proposals are created, edited, and applied.
 * `add` payloads come back as complete rows; `update` payloads keep only the keys they were given.
 */
export function validateProposal(
  entity: CvEntity,
  action: ProposalAction,
  payload: unknown,
): { data: Record<string, unknown> } | { error: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { error: "Invalid payload." };
  const input = payload as Record<string, unknown>;
  const keys = Object.keys(input).filter((key) => key !== "id" && key !== "sort_order");

  if (entity === "profile") {
    if (action !== "update") return { error: "The profile can only be updated." };
    const allowed = keys.filter((key) => key in profileFromCv.shape);
    if (allowed.length === 0) return { error: "Nothing to update." };
    const parsed = profileFromCv.partial().safeParse(pick(input, allowed));
    if (!parsed.success) return { error: describe(parsed.error) };
    return { data: pick(parsed.data, allowed) };
  }

  const schema = sectionSchemas[entity];
  if (!schema) return { error: "Unknown section." };
  if (action === "add") {
    const parsed = schema.safeParse(pick(input, keys));
    if (!parsed.success) return { error: describe(parsed.error) };
    const row = { ...(parsed.data as Record<string, unknown>) };
    delete row.id;
    return { data: row };
  }

  const allowed = keys.filter((key) => key in schema.shape);
  if (allowed.length === 0) return { error: "Nothing to update." };
  const parsed = schema.partial().safeParse(pick(input, allowed));
  if (!parsed.success) return { error: describe(parsed.error) };
  return { data: pick(parsed.data as Record<string, unknown>, allowed) };
}
