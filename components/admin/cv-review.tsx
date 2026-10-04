"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { decideAll, decideProposal, deleteUpload, editProposal } from "@/lib/actions/cv";
import { sectionFields, type FieldDef } from "@/lib/admin/sections";
import { cvEntities, type CvEntity, type FieldChange } from "@/lib/ai/proposals";
import { FieldControl, valuesFromRow, type FormValues } from "@/components/admin/field-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Upload = {
  id: string;
  status: "pending" | "parsed" | "reviewed" | "applied" | "failed";
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  error: string | null;
  notes: string | null;
  created_at: string;
  applied_at: string | null;
};

export type Proposal = {
  id: string;
  entity: CvEntity;
  action: "add" | "update";
  target_id: string | null;
  payload: Record<string, unknown>;
  diff: FieldChange[] | null;
  decision: "pending" | "approved" | "rejected";
};

const profileFields: FieldDef[] = [
  { name: "full_name", label: "Full name", kind: "text" },
  { name: "title", label: "Title", kind: "text" },
  { name: "summary", label: "Summary", kind: "textarea" },
  { name: "location", label: "Location", kind: "text" },
];

const timeFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

function fieldsFor(entity: CvEntity) {
  return entity === "profile" ? profileFields : sectionFields[entity].fields;
}

function titleFor(entity: CvEntity) {
  return entity === "profile" ? "Profile" : sectionFields[entity].title;
}

function labelFor(entity: CvEntity, field: string) {
  return fieldsFor(entity).find((item) => item.name === field)?.label ?? field;
}

function Value({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">—</span>;
    return (
      <ul className="list-disc space-y-1 pl-4">
        {value.map((item, index) => (
          <li key={index}>{String(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  return <span className="whitespace-pre-wrap">{String(value)}</span>;
}

function StatusBadge({ status }: { status: Upload["status"] }) {
  const variant = status === "failed" ? "destructive" : status === "applied" ? "default" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

function ProposalCard({
  proposal,
  targetLabel,
  editable,
  onDone,
}: {
  proposal: Proposal;
  targetLabel: string | null;
  editable: boolean;
  onDone: (error?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const fields =
    proposal.action === "update"
      ? fieldsFor(proposal.entity).filter((field) => field.name in proposal.payload)
      : fieldsFor(proposal.entity);
  const [values, setValues] = useState<FormValues>(() => valuesFromRow(proposal.payload, fields));
  const primary = proposal.entity === "profile" ? "full_name" : sectionFields[proposal.entity].primary;
  const name =
    proposal.action === "update" ? (targetLabel ?? "Existing item") : String(proposal.payload[primary] ?? "New item");

  async function decide(decision: Proposal["decision"]) {
    setBusy(true);
    const result = await decideProposal(proposal.id, decision);
    setBusy(false);
    onDone(result.error);
  }

  async function save() {
    setBusy(true);
    const result = await editProposal(proposal.id, values);
    setBusy(false);
    if (!result.error) setEditing(false);
    onDone(result.error);
  }

  const shown = Object.entries(proposal.payload).filter(
    ([field, value]) => field !== "visible" && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0),
  );

  return (
    <li
      className={`rounded-xl border p-4 ${
        proposal.decision === "approved"
          ? "border-primary/60"
          : proposal.decision === "rejected"
            ? "border-border opacity-60"
            : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={proposal.action === "add" ? "default" : "outline"}>
              {proposal.action === "add" ? "New" : "Update"}
            </Badge>
            <p className="font-medium">{name}</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Decision: {proposal.decision}</p>
        </div>
        {editable ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={proposal.decision === "approved" ? "default" : "outline"}
              disabled={busy}
              onClick={() => void decide(proposal.decision === "approved" ? "pending" : "approved")}
            >
              {proposal.decision === "approved" ? "Approved" : "Approve"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void decide(proposal.decision === "rejected" ? "pending" : "rejected")}
            >
              {proposal.decision === "rejected" ? "Rejected" : "Reject"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                if (!editing) setValues(valuesFromRow(proposal.payload, fields));
                setEditing(!editing);
              }}
            >
              {editing ? "Close" : "Edit"}
            </Button>
          </div>
        ) : null}
      </div>

      {editing ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          {fields.map((field) => (
            <FieldControl
              key={field.name}
              field={field.kind === "image" ? { ...field, kind: "url" } : field}
              value={values[field.name]}
              onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))}
            />
          ))}
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? "Saving…" : "Save and approve"}
          </Button>
        </form>
      ) : proposal.action === "update" && proposal.diff ? (
        <table className="mt-4 w-full table-fixed text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-1/5 pb-2 font-medium">Field</th>
              <th className="pb-2 font-medium">Before</th>
              <th className="pb-2 font-medium">After</th>
            </tr>
          </thead>
          <tbody className="align-top">
            {proposal.diff.map((change) => (
              <tr key={change.field} className="border-t border-border">
                <td className="py-2 pr-3 text-muted-foreground">{labelFor(proposal.entity, change.field)}</td>
                <td className="py-2 pr-3 text-muted-foreground">
                  <Value value={change.before} />
                </td>
                <td className="py-2">
                  <Value value={change.after} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
          {shown.map(([field, value]) => (
            <div key={field} className="contents">
              <dt className="text-muted-foreground">{labelFor(proposal.entity, field)}</dt>
              <dd>
                <Value value={value} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

export function CvReview({
  uploads,
  selectedId,
  proposals,
  targets,
  geminiReady,
}: {
  uploads: Upload[];
  selectedId: string | null;
  proposals: Proposal[];
  targets: Record<string, string>;
  geminiReady: boolean;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selected = uploads.find((upload) => upload.id === selectedId) ?? null;
  const editable = selected?.status === "parsed" || selected?.status === "reviewed";
  const approved = proposals.filter((proposal) => proposal.decision === "approved").length;

  function done(result?: string) {
    if (result) setError(result);
    else {
      setError(null);
      router.refresh();
    }
  }

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a PDF to upload.");
      return;
    }
    setUploading(true);
    setError(null);
    setMessage(null);
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch("/api/cv/upload", { method: "POST", body });
      const result = (await response.json().catch(() => ({}))) as {
        uploadId?: string;
        proposals?: number;
        skipped?: number;
        error?: string;
      };
      if (!response.ok) setError(result.error ?? `Upload failed (${response.status}).`);
      else {
        form.reset();
        setMessage(
          result.proposals
            ? `${result.proposals} suggested change(s) ready for review.`
            : "The CV matches the site; nothing to change.",
        );
      }
      if (result.uploadId) router.push(`/admin/cv?upload=${result.uploadId}`);
      router.refresh();
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  async function onApply() {
    if (!selected || !window.confirm(`Apply ${approved} approved change(s) to the site?`)) return;
    setApplying(true);
    setError(null);
    try {
      const response = await fetch("/api/cv/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: selected.id }),
      });
      const result = (await response.json().catch(() => ({}))) as { applied?: number; error?: string };
      if (!response.ok) setError(result.error ?? `Apply failed (${response.status}).`);
      else setMessage(`Applied ${result.applied ?? approved} change(s). The public site is updated.`);
      router.refresh();
    } catch {
      setError("Apply failed. Check your connection and try again.");
    } finally {
      setApplying(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this upload and its suggestions? The site content is not affected.")) return;
    const result = await deleteUpload(id);
    if (result.error) setError(result.error);
    else router.push("/admin/cv");
    router.refresh();
  }

  async function onAll(decision: Proposal["decision"]) {
    if (!selected) return;
    done((await decideAll(selected.id, decision)).error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">CV updates</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Upload your latest CV as a PDF. Gemini suggests additions and updates; nothing changes on the site until you
          approve it and press Apply. Items missing from the CV are never deleted.
        </p>
      </div>

      <form onSubmit={onUpload} className="space-y-3 rounded-2xl border border-border p-4">
        <Input type="file" name="file" accept="application/pdf" disabled={!geminiReady || uploading} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!geminiReady || uploading}>
            {uploading ? "Reading CV… this can take a minute" : "Upload and analyse"}
          </Button>
          <p className="text-xs text-muted-foreground">PDF only, up to 10 MB and 8 pages, 10 uploads per hour.</p>
        </div>
        {!geminiReady ? (
          <p className="text-sm text-destructive">Set GEMINI_API_KEY on the server to enable CV analysis.</p>
        ) : null}
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      {uploads.length > 0 ? (
        <section>
          <h2 className="font-heading text-xl">History</h2>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
            {uploads.map((upload) => (
              <li
                key={upload.id}
                className={`flex flex-wrap items-center justify-between gap-3 p-3 text-sm ${
                  upload.id === selectedId ? "bg-muted/50" : ""
                }`}
              >
                <Link href={`/admin/cv?upload=${upload.id}`} className="flex min-w-0 flex-wrap items-center gap-3">
                  <StatusBadge status={upload.status} />
                  <span>{timeFormat.format(new Date(upload.created_at))} UTC</span>
                  {upload.model ? (
                    <span className="text-muted-foreground">
                      {upload.model} · {upload.input_tokens ?? 0} in / {upload.output_tokens ?? 0} out tokens
                    </span>
                  ) : null}
                </Link>
                <Button type="button" size="sm" variant="ghost" onClick={() => void onDelete(upload.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {selected ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl">Suggested changes</h2>
              <p className="text-sm text-muted-foreground">
                {proposals.length} suggestion(s), {approved} approved.
              </p>
            </div>
            {editable && proposals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void onAll("approved")}>
                  Approve all
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => void onAll("rejected")}>
                  Reject all
                </Button>
                <Button type="button" size="sm" disabled={approved === 0 || applying} onClick={() => void onApply()}>
                  {applying ? "Applying…" : `Apply ${approved} approved`}
                </Button>
              </div>
            ) : null}
          </div>

          {selected.status === "failed" ? (
            <p className="whitespace-pre-wrap rounded-xl border border-destructive/40 p-3 text-sm text-destructive">
              Analysis failed: {selected.error ?? "unknown error"}
            </p>
          ) : null}
          {selected.status === "applied" ? (
            <p className="text-sm text-muted-foreground">
              Applied{selected.applied_at ? ` on ${timeFormat.format(new Date(selected.applied_at))} UTC` : ""}. This
              upload is read-only.
            </p>
          ) : null}
          {selected.notes ? (
            <p className="whitespace-pre-wrap rounded-xl border border-border p-3 text-xs text-muted-foreground">
              {selected.notes}
            </p>
          ) : null}

          {cvEntities.map((entity) => {
            const group = proposals.filter((proposal) => proposal.entity === entity);
            if (group.length === 0) return null;
            return (
              <div key={entity}>
                <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {titleFor(entity)}
                </h3>
                <ul className="space-y-3">
                  {group.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      targetLabel={proposal.target_id ? (targets[proposal.target_id] ?? null) : null}
                      editable={editable}
                      onDone={done}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
