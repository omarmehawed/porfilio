import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { cvEntities, validateProposal } from "@/lib/ai/proposals";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/env";

export const runtime = "nodejs";

const bodySchema = z.object({ uploadId: z.uuid() });

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Forbidden", 403);
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  if (!hasServiceRole()) return fail("Database is not configured.", 503);

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail("Invalid request.", 400);
  const { uploadId } = body.data;

  const admin = createAdminClient();
  const { data: proposals, error } = await admin
    .from("cv_proposals")
    .select("id, entity, action, payload")
    .eq("upload_id", uploadId)
    .eq("decision", "approved");
  if (error) return fail(error.message, 500);
  if (!proposals || proposals.length === 0) return fail("Approve at least one change first.", 400);

  for (const proposal of proposals) {
    const entity = cvEntities.find((item) => item === proposal.entity);
    const action = proposal.action === "add" || proposal.action === "update" ? proposal.action : null;
    const checked = entity && action ? validateProposal(entity, action, proposal.payload) : { error: "Unknown change." };
    if ("error" in checked) return fail(`A ${proposal.entity} change is invalid: ${checked.error}`, 422);
  }

  const { data: applied, error: applyError } = await admin.rpc("apply_cv_upload", { p_upload: uploadId });
  if (applyError) {
    const message = applyError.message.includes("projects_slug")
      ? "A project slug is already used. Edit the slug and try again."
      : applyError.message;
    return fail(message, 409);
  }

  revalidateTag("portfolio", { expire: 0 });
  revalidatePath("/", "layout");
  return NextResponse.json({ applied });
}
