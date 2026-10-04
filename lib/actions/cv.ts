"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cvEntities, validateProposal, type FieldChange } from "@/lib/ai/proposals";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/env";

type Result = { ok?: boolean; error?: string };

const id = z.uuid();
const decision = z.enum(["pending", "approved", "rejected"]);

async function gate() {
  await requireAdmin();
  if (!hasServiceRole()) return null;
  return createAdminClient();
}

async function openUpload(admin: ReturnType<typeof createAdminClient>, uploadId: string) {
  const { data } = await admin.from("cv_uploads").select("status").eq("id", uploadId).maybeSingle();
  if (!data) return { error: "Upload not found." };
  if (data.status !== "parsed" && data.status !== "reviewed") return { error: "This upload can no longer be changed." };
  if (data.status === "parsed") await admin.from("cv_uploads").update({ status: "reviewed" }).eq("id", uploadId);
  return {};
}

export async function decideProposal(proposalId: string, value: string): Promise<Result> {
  const admin = await gate();
  if (!admin) return { error: "Database is not configured." };
  if (!id.safeParse(proposalId).success || !decision.safeParse(value).success) return { error: "Invalid request." };
  const { data: proposal } = await admin.from("cv_proposals").select("upload_id").eq("id", proposalId).maybeSingle();
  if (!proposal?.upload_id) return { error: "Change not found." };
  const open = await openUpload(admin, proposal.upload_id);
  if (open.error) return open;
  const { error } = await admin.from("cv_proposals").update({ decision: value }).eq("id", proposalId);
  if (error) return { error: error.message };
  revalidatePath("/admin/cv");
  return { ok: true };
}

export async function decideAll(uploadId: string, value: string): Promise<Result> {
  const admin = await gate();
  if (!admin) return { error: "Database is not configured." };
  if (!id.safeParse(uploadId).success || !decision.safeParse(value).success) return { error: "Invalid request." };
  const open = await openUpload(admin, uploadId);
  if (open.error) return open;
  const { error } = await admin.from("cv_proposals").update({ decision: value }).eq("upload_id", uploadId);
  if (error) return { error: error.message };
  revalidatePath("/admin/cv");
  return { ok: true };
}

/** Saving an edit also approves the change, since the admin has now written it. */
export async function editProposal(proposalId: string, input: Record<string, unknown>): Promise<Result> {
  const admin = await gate();
  if (!admin) return { error: "Database is not configured." };
  if (!id.safeParse(proposalId).success || !input || typeof input !== "object") return { error: "Invalid request." };
  const { data: proposal } = await admin
    .from("cv_proposals")
    .select("upload_id, entity, action, payload, diff")
    .eq("id", proposalId)
    .maybeSingle();
  if (!proposal?.upload_id) return { error: "Change not found." };
  const entity = cvEntities.find((item) => item === proposal.entity);
  if (!entity || (proposal.action !== "add" && proposal.action !== "update")) return { error: "Unknown change." };
  const open = await openUpload(admin, proposal.upload_id);
  if (open.error) return open;

  const original = (proposal.payload ?? {}) as Record<string, unknown>;
  let candidate: Record<string, unknown>;
  if (proposal.action === "update") {
    candidate = Object.fromEntries(Object.keys(original).filter((key) => key in input).map((key) => [key, input[key]]));
  } else {
    candidate = { ...input };
    if (entity === "project" && !String(candidate.slug ?? "").trim()) candidate.slug = slugify(String(candidate.title ?? ""));
  }
  const checked = validateProposal(entity, proposal.action, candidate);
  if ("error" in checked) return { error: checked.error };

  const diff = Array.isArray(proposal.diff)
    ? (proposal.diff as FieldChange[]).map((change) =>
        change.field in checked.data ? { ...change, after: checked.data[change.field] } : change,
      )
    : proposal.diff;
  const { error } = await admin
    .from("cv_proposals")
    .update({ payload: checked.data, diff, decision: "approved" })
    .eq("id", proposalId);
  if (error) return { error: error.message };
  revalidatePath("/admin/cv");
  return { ok: true };
}

export async function deleteUpload(uploadId: string): Promise<Result> {
  const admin = await gate();
  if (!admin) return { error: "Database is not configured." };
  if (!id.safeParse(uploadId).success) return { error: "Invalid request." };
  const { data: upload } = await admin.from("cv_uploads").select("file_path").eq("id", uploadId).maybeSingle();
  if (!upload) return { error: "Upload not found." };
  await admin.storage.from("cv-private").remove([upload.file_path]);
  const { error } = await admin.from("cv_uploads").delete().eq("id", uploadId);
  if (error) return { error: error.message };
  revalidatePath("/admin/cv");
  return { ok: true };
}
