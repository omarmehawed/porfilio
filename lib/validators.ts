import { z } from "zod";
import { platforms, type Platform } from "@/lib/types";

const emptyToNull = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().max(max).nullable());

const optionalDate = z.preprocess(emptyToNull, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable());

const lineList = z.preprocess((value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}, z.array(z.string().min(1).max(400)).max(30));

export const socialSchema = z
  .object({
    id: z.string().uuid().optional(),
    platform: z.enum(platforms),
    label: z.preprocess(emptyToNull, z.string().max(40).nullable()),
    value: z.string().trim().min(1).max(500),
    visible: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.platform === "other" && !data.label) {
      ctx.addIssue({ code: "custom", path: ["label"], message: "A custom label is required." });
    }
    if (data.platform === "email" && !z.email().safeParse(data.value).success) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Enter a valid email address." });
    }
    if (data.platform === "phone" || data.platform === "whatsapp") {
      const digits = data.value.replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 15) {
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message: "Enter a phone number with 8 to 15 digits.",
        });
      }
    }
    if (isUrlPlatform(data.platform)) {
      const parsed = z.url().safeParse(data.value);
      if (!parsed.success || !/^https?:\/\//i.test(data.value)) {
        ctx.addIssue({ code: "custom", path: ["value"], message: "Enter an http or https URL." });
      }
    }
  });

export function isUrlPlatform(platform: Platform) {
  return (
    platform === "facebook" ||
    platform === "instagram" ||
    platform === "tiktok" ||
    platform === "linkedin" ||
    platform === "github" ||
    platform === "other"
  );
}

export const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(120),
  summary: optionalText(2000),
  location: optionalText(160),
  photo_url: optionalText(1000),
  cover_url: optionalText(1000),
  cv_public_url: optionalText(1000),
});

export const experienceSchema = z.object({
  id: z.string().uuid().optional(),
  role: z.string().trim().min(1).max(160),
  organization: z.string().trim().min(1).max(160),
  location: optionalText(160),
  start_date: optionalDate,
  end_date: optionalDate,
  is_current: z.boolean().default(false),
  bullets: lineList,
  visible: z.boolean().default(true),
});

export const educationSchema = z.object({
  id: z.string().uuid().optional(),
  degree: z.string().trim().min(1).max(200),
  institution: z.string().trim().min(1).max(200),
  start_date: optionalDate,
  end_date: optionalDate,
  details: optionalText(2000),
  visible: z.boolean().default(true),
});

export const projectSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  title: z.string().trim().min(1).max(160),
  kind: z.enum(["software", "hardware"]),
  brief: optionalText(400),
  description: optionalText(8000),
  start_date: optionalDate,
  end_date: optionalDate,
  tech: lineList,
  github_repo: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^[\w.-]+\/[\w.-]+$/, "Use owner/repo.")
      .nullable(),
  ),
  live_url: z.preprocess(emptyToNull, z.url().nullable()),
  cover_url: optionalText(1000),
  is_private: z.boolean().default(false),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
});

export const skillSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  category: z.enum(["technical", "soft", "language", "tool"]),
  level: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
    z.number().int().min(1).max(5).nullable(),
  ),
  visible: z.boolean().default(true),
});

export const certificationSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  issuer: optionalText(160),
  issued_on: optionalDate,
  credential_url: z.preprocess(emptyToNull, z.url().nullable()),
  visible: z.boolean().default(true),
});

export const courseSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  provider: optionalText(160),
  start_date: optionalDate,
  end_date: optionalDate,
  status: z.enum(["completed", "in_progress"]).default("completed"),
  description: optionalText(2000),
  visible: z.boolean().default(true),
});

export const achievementSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  event: optionalText(160),
  achieved_on: optionalDate,
  details: optionalText(2000),
  visible: z.boolean().default(true),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}
