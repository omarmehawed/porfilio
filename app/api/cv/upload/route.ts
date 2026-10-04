import { NextResponse } from "next/server";
import { buildProposals } from "@/lib/ai/diff";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { CvParseError, MAX_CV_PAGES, inspectPdf, parseCv, type PdfInfo } from "@/lib/ai/parse-cv";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import { getAdminPortfolio } from "@/lib/content/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 10 * 1024 * 1024;
const UPLOADS_PER_HOUR = 10;

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Forbidden", 403);
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  if (!hasServiceRole()) return fail("Database is not configured.", 503);
  if (!isGeminiConfigured()) return fail("GEMINI_API_KEY is not set.", 503);

  const admin = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("cv_uploads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if (countError) return fail(countError.message, 500);
  if ((count ?? 0) >= UPLOADS_PER_HOUR) return fail("Upload limit reached (10 per hour). Try again later.", 429);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Send the CV as a file upload.", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Choose a PDF to upload.", 400);
  if (file.size > MAX_BYTES) return fail("The PDF must be 10 MB or smaller.", 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length < 5 || String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") {
    return fail("Upload a PDF file.", 415);
  }

  let info: PdfInfo;
  try {
    info = await inspectPdf(bytes);
  } catch {
    return fail("That PDF could not be read.", 422);
  }
  if (info.pages > MAX_CV_PAGES) return fail(`The CV can have at most ${MAX_CV_PAGES} pages.`, 422);

  const path = `uploads/${crypto.randomUUID()}.pdf`;
  const { error: storageError } = await admin.storage
    .from("cv-private")
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (storageError) return fail(storageError.message, 500);

  const { data: upload, error: insertError } = await admin
    .from("cv_uploads")
    .insert({ file_path: path, status: "pending" })
    .select("id")
    .single();
  if (insertError || !upload) {
    await admin.storage.from("cv-private").remove([path]);
    return fail(insertError?.message ?? "Could not record the upload.", 500);
  }

  try {
    const { data, usage } = await parseCv(bytes, info);
    const { proposals, skipped } = buildProposals(data, await getAdminPortfolio());
    if (proposals.length > 0) {
      const { error } = await admin
        .from("cv_proposals")
        .insert(proposals.map((proposal) => ({ ...proposal, upload_id: upload.id })));
      if (error) throw new Error(error.message);
    }
    await admin
      .from("cv_uploads")
      .update({
        status: "parsed",
        parsed_json: data,
        model: usage.model,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        notes: skipped.length > 0 ? `Skipped ${skipped.length} invalid item(s):\n${skipped.join("\n")}` : null,
      })
      .eq("id", upload.id);
    return NextResponse.json({ uploadId: upload.id, proposals: proposals.length, skipped: skipped.length });
  } catch (error) {
    const usage = error instanceof CvParseError ? error.usage : null;
    const message = error instanceof Error ? error.message : "Parsing failed.";
    await admin
      .from("cv_uploads")
      .update({
        status: "failed",
        error: message,
        model: usage?.model ?? null,
        input_tokens: usage?.inputTokens ?? null,
        output_tokens: usage?.outputTokens ?? null,
      })
      .eq("id", upload.id);
    return NextResponse.json({ uploadId: upload.id, error: message }, { status: 502 });
  }
}
