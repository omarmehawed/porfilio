import { CvReview, type Proposal, type Upload } from "@/components/admin/cv-review";
import { sectionFields } from "@/lib/admin/sections";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { getAdminPortfolio } from "@/lib/content/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentSection } from "@/lib/types";

export default async function CvPage({ searchParams }: { searchParams: Promise<{ upload?: string }> }) {
  const { upload: requested } = await searchParams;
  const admin = createAdminClient();
  const { data: uploads, error } = await admin
    .from("cv_uploads")
    .select("id, status, model, input_tokens, output_tokens, error, notes, created_at, applied_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);

  const list = (uploads ?? []) as Upload[];
  const selected = list.find((item) => item.id === requested) ?? list[0] ?? null;
  let proposals: Proposal[] = [];
  if (selected) {
    const { data, error: proposalError } = await admin
      .from("cv_proposals")
      .select("id, entity, action, target_id, payload, diff, decision")
      .eq("upload_id", selected.id)
      .order("created_at")
      .order("id");
    if (proposalError) throw new Error(proposalError.message);
    proposals = (data ?? []) as Proposal[];
  }

  const targets: Record<string, string> = {};
  if (proposals.some((proposal) => proposal.target_id)) {
    const content = await getAdminPortfolio();
    targets[content.profile.id] = "Profile";
    const groups: [ContentSection, Record<string, unknown>[]][] = [
      ["experience", content.experiences],
      ["education", content.education],
      ["project", content.projects],
      ["skill", content.skills],
      ["certification", content.certifications],
      ["course", content.courses],
      ["achievement", content.achievements],
    ];
    for (const [section, rows] of groups) {
      const { primary, secondary } = sectionFields[section];
      for (const row of rows) {
        const extra = secondary && row[secondary] ? ` · ${String(row[secondary])}` : "";
        targets[String(row.id)] = `${String(row[primary] ?? "")}${extra}`;
      }
    }
  }

  return (
    <CvReview
      uploads={list}
      selectedId={selected?.id ?? null}
      proposals={proposals}
      targets={targets}
      geminiReady={isGeminiConfigured()}
    />
  );
}
