"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/env";
import {
  achievementSchema,
  certificationSchema,
  courseSchema,
  educationSchema,
  experienceSchema,
  firstError,
  profileSchema,
  projectSchema,
  reorderSchema,
  skillSchema,
  socialSchema,
} from "@/lib/validators";
import type { ContentSection } from "@/lib/types";

export type ActionResult = { ok?: boolean; error?: string; url?: string };

const sections = {
  experience: { table: "experiences", schema: experienceSchema },
  education: { table: "education", schema: educationSchema },
  project: { table: "projects", schema: projectSchema },
  skill: { table: "skills", schema: skillSchema },
  certification: { table: "certifications", schema: certificationSchema },
  course: { table: "courses", schema: courseSchema },
  achievement: { table: "achievements", schema: achievementSchema },
} as const;

function refresh() {
  updateTag("portfolio");
  revalidatePath("/", "layout");
}

function dbError(message: string) {
  if (message.includes("duplicate key") || message.includes("projects_slug")) {
    return "That slug is already used.";
  }
  return message;
}

async function adminOrError() {
  await requireAdmin();
  if (!hasServiceRole()) return { error: "Database is not configured." as const };
  return { admin: createAdminClient() };
}

export async function saveProfile(input: unknown): Promise<ActionResult> {
  const gate = await adminOrError();
  if ("error" in gate) return gate;
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { data: existing, error: readError } = await gate.admin
    .from("profile")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (readError) return { error: readError.message };
  if (!existing) return { error: "Profile row is missing." };
  const { error } = await gate.admin
    .from("profile")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", existing.id);
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}

export async function saveSocial(input: unknown): Promise<ActionResult> {
  const gate = await adminOrError();
  if ("error" in gate) return gate;
  const parsed = socialSchema.safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { id, ...values } = parsed.data;
  const payload = {
    ...values,
    label: values.platform === "other" ? values.label : values.label,
  };
  if (id) {
    const { error } = await gate.admin.from("social_links").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data: last } = await gate.admin
      .from("social_links")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await gate.admin.from("social_links").insert({
      ...payload,
      sort_order: (last?.sort_order ?? -1) + 1,
    });
    if (error) return { error: error.message };
  }
  refresh();
  return { ok: true };
}

export async function deleteSocial(id: string): Promise<ActionResult> {
  const gate = await adminOrError();
  if ("error" in gate) return gate;
  const { error } = await gate.admin.from("social_links").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}

export async function reorderSocials(ids: string[]): Promise<ActionResult> {
  const gate = await adminOrError();
  if ("error" in gate) return gate;
  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { error: firstError(parsed.error) };
  for (const [index, id] of parsed.data.ids.entries()) {
    const { error } = await gate.admin.from("social_links").update({ sort_order: index }).eq("id", id);
    if (error) return { error: error.message };
  }
  refresh();
  return { ok: true };
}

export async function saveSection(section: ContentSection, input: unknown): Promise<ActionResult> {
  const gate = await adminOrError();
  if ("error" in gate) return gate;
  const config = sections[section];
  const parsed = config.schema.safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { id, ...values } = parsed.data as { id?: string };
  const payload = { ...values } as Record<string, unknown>;
  if (section === "experience" && payload.is_current === true) payload.end_date = null;
  if (id) {
    const { error } = await gate.admin.from(config.table).update(payload).eq("id", id);
    if (error) return { error: dbError(error.message) };
  } else {
    const { data: last } = await gate.admin
      .from(config.table)
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await gate.admin.from(config.table).insert({
      ...payload,
      sort_order: ((last?.sort_order as number | undefined) ?? -1) + 1,
    });
    if (error) return { error: dbError(error.message) };
  }
  refresh();
  return { ok: true };
}

export async function deleteSection(section: ContentSection, id: string): Promise<ActionResult> {
  const gate = await adminOrError();
  if ("error" in gate) return gate;
  const { error } = await gate.admin.from(sections[section].table).delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}

export async function reorderSection(section: ContentSection, ids: string[]): Promise<ActionResult> {
  const gate = await adminOrError();
  if ("error" in gate) return gate;
  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { error: firstError(parsed.error) };
  for (const [index, id] of parsed.data.ids.entries()) {
    const { error } = await gate.admin
      .from(sections[section].table)
      .update({ sort_order: index })
      .eq("id", id);
    if (error) return { error: error.message };
  }
  refresh();
  return { ok: true };
}

const MAX_BYTES = 10 * 1024 * 1024;

function detectImage(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length > 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function isPdf(bytes: Uint8Array) {
  return bytes.length > 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
}

export async function uploadMedia(formData: FormData): Promise<ActionResult> {
  const gate = await adminOrError();
  if ("error" in gate) return gate;
  const file = formData.get("file");
  const kind = formData.get("kind");
  if (!(file instanceof File) || (kind !== "photo" && kind !== "cv" && kind !== "cover")) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_BYTES) return { error: "Files must be 10 MB or smaller." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  let contentType: string;
  let extension: string;
  if (kind === "cv") {
    if (file.type !== "application/pdf" || !isPdf(bytes)) return { error: "Upload a PDF file." };
    contentType = "application/pdf";
    extension = "pdf";
  } else {
    const imageType = detectImage(bytes);
    if (!imageType || (file.type && file.type !== imageType)) {
      return { error: "Upload a JPEG, PNG, or WebP image." };
    }
    contentType = imageType;
    extension = imageType === "image/png" ? "png" : imageType === "image/webp" ? "webp" : "jpg";
  }
  const folder = kind === "cv" ? "cv" : "images";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await gate.admin.storage.from("media").upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (error) return { error: error.message };
  const { data } = gate.admin.storage.from("media").getPublicUrl(path);
  refresh();
  return { ok: true, url: data.publicUrl };
}
