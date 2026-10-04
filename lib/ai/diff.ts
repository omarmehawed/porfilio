import { slugify } from "@/lib/format";
import type { ContentSection, Portfolio } from "@/lib/types";
import type { CvData } from "@/lib/ai/cv-schema";
import { validateProposal, type CvEntity, type FieldChange, type ProposalAction } from "@/lib/ai/proposals";

export type ProposalDraft = {
  entity: CvEntity;
  action: ProposalAction;
  target_id: string | null;
  payload: Record<string, unknown>;
  diff: FieldChange[] | null;
};

type Row = Record<string, unknown>;

type SectionSpec = {
  entity: ContentSection;
  incoming: Row[];
  existing: Row[];
  key: (row: Row) => string;
  /** Fields a CV may change on an existing item. Anything else is left to the admin. */
  updatable: string[];
  label: (row: Row) => string;
};

export function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function monthToDate(value: string | null | undefined) {
  if (!value) return null;
  const match = /^(\d{4})(?:-(\d{1,2}))?/.exec(value.trim());
  if (!match) return null;
  const month = match[2] ? Number(match[2]) : 1;
  if (month < 1 || month > 12) return null;
  return `${match[1]}-${String(month).padStart(2, "0")}-01`;
}

function monthOf(value: unknown) {
  return typeof value === "string" ? value.slice(0, 7) : "";
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function isDateField(field: string) {
  return field.endsWith("_date") || field.endsWith("_on");
}

function sameValue(field: string, before: unknown, after: unknown) {
  if (isDateField(field)) return monthOf(before) === monthOf(after);
  if (Array.isArray(before) || Array.isArray(after)) {
    const left = Array.isArray(before) ? before.map((item) => String(item).trim()) : [];
    const right = Array.isArray(after) ? after.map((item) => String(item).trim()) : [];
    return left.length === right.length && left.every((item, index) => item === right[index]);
  }
  if (typeof before === "string" || typeof after === "string") {
    const clean = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");
    return clean(before) === clean(after);
  }
  return before === after;
}

function changedFields(fields: string[], current: Row, incoming: Row) {
  const changes: FieldChange[] = [];
  for (const field of fields) {
    const after = incoming[field];
    if (!hasValue(after)) continue;
    if (!sameValue(field, current[field], after)) changes.push({ field, before: current[field] ?? null, after });
  }
  return changes;
}

function trimmed(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

function cleanList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

export function buildProposals(cv: CvData, current: Portfolio) {
  const proposals: ProposalDraft[] = [];
  const skipped: string[] = [];

  function push(entity: CvEntity, action: ProposalAction, targetId: string | null, payload: Row, label: string, diff: FieldChange[] | null) {
    const checked = validateProposal(entity, action, payload);
    if ("error" in checked) {
      const name = label.length > 60 ? `${label.slice(0, 57)}…` : label;
      skipped.push(`${entity} "${name}": ${checked.error}`);
      return;
    }
    proposals.push({ entity, action, target_id: targetId, payload: checked.data, diff });
  }

  const profileIncoming: Row = {
    full_name: trimmed(cv.profile.full_name),
    title: trimmed(cv.profile.title),
    summary: trimmed(cv.profile.summary),
    location: trimmed(cv.profile.location),
  };
  const profileChanges = changedFields(
    ["full_name", "title", "summary", "location"],
    current.profile as unknown as Row,
    profileIncoming,
  );
  if (profileChanges.length > 0) {
    push(
      "profile",
      "update",
      current.profile.id,
      Object.fromEntries(profileChanges.map((change) => [change.field, change.after])),
      "profile",
      profileChanges,
    );
  }

  const usedSlugs = new Set(current.projects.map((project) => project.slug));
  function uniqueSlug(title: string) {
    const base = slugify(title) || "project";
    let slug = base;
    for (let n = 2; usedSlugs.has(slug); n += 1) slug = `${base.slice(0, 75)}-${n}`;
    usedSlugs.add(slug);
    return slug;
  }

  const specs: SectionSpec[] = [
    {
      entity: "experience",
      incoming: cv.experiences.map((item) => ({
        role: item.role.trim(),
        organization: item.organization.trim(),
        location: trimmed(item.location),
        start_date: monthToDate(item.start),
        end_date: item.is_current ? null : monthToDate(item.end),
        is_current: item.is_current,
        bullets: cleanList(item.bullets),
        visible: true,
      })),
      existing: current.experiences as unknown as Row[],
      key: (row) => [normalizeText(row.role), normalizeText(row.organization), monthOf(row.start_date)].join("|"),
      updatable: ["location", "start_date", "end_date", "bullets"],
      label: (row) => `${row.role} at ${row.organization}`,
    },
    {
      entity: "education",
      incoming: cv.education.map((item) => ({
        degree: item.degree.trim(),
        institution: item.institution.trim(),
        start_date: monthToDate(item.start),
        end_date: monthToDate(item.end),
        details: trimmed(item.details),
        visible: true,
      })),
      existing: current.education as unknown as Row[],
      key: (row) => [normalizeText(row.degree), normalizeText(row.institution)].join("|"),
      updatable: ["start_date", "end_date", "details"],
      label: (row) => String(row.degree),
    },
    {
      entity: "project",
      incoming: cv.projects.map((item) => {
        const description = trimmed(item.description);
        return {
          title: item.title.trim(),
          kind: item.kind,
          brief: description && description.length <= 400 ? description : null,
          description,
          start_date: monthToDate(item.start),
          end_date: monthToDate(item.end),
          tech: cleanList(item.tech),
          github_repo: null,
          live_url: null,
          cover_url: null,
          is_private: false,
          featured: false,
          visible: true,
        };
      }),
      existing: current.projects as unknown as Row[],
      key: (row) => normalizeText(row.title),
      updatable: ["description", "start_date", "end_date", "tech"],
      label: (row) => String(row.title),
    },
    {
      entity: "skill",
      incoming: cv.skills.map((item) => ({ name: item.name.trim(), category: item.category, level: null, visible: true })),
      existing: current.skills as unknown as Row[],
      key: (row) => normalizeText(row.name),
      updatable: [],
      label: (row) => String(row.name),
    },
    {
      entity: "certification",
      incoming: cv.certifications.map((item) => ({
        title: item.title.trim(),
        issuer: trimmed(item.issuer),
        issued_on: monthToDate(item.issued),
        credential_url: null,
        visible: true,
      })),
      existing: current.certifications as unknown as Row[],
      key: (row) => normalizeText(row.title),
      updatable: ["issuer", "issued_on"],
      label: (row) => String(row.title),
    },
    {
      entity: "course",
      incoming: cv.courses.map((item) => ({
        title: item.title.trim(),
        provider: trimmed(item.provider),
        start_date: monthToDate(item.start),
        end_date: monthToDate(item.end),
        status: item.status,
        description: trimmed(item.description),
        visible: true,
      })),
      existing: current.courses as unknown as Row[],
      key: (row) => [normalizeText(row.title), normalizeText(row.provider)].join("|"),
      updatable: ["start_date", "end_date", "status", "description"],
      label: (row) => String(row.title),
    },
    {
      entity: "achievement",
      incoming: cv.achievements.map((item) => ({
        title: item.title.trim(),
        event: trimmed(item.event),
        achieved_on: monthToDate(item.date),
        details: trimmed(item.details),
        visible: true,
      })),
      existing: current.achievements as unknown as Row[],
      key: (row) => normalizeText(row.title),
      updatable: ["event", "achieved_on", "details"],
      label: (row) => String(row.title),
    },
  ];

  for (const spec of specs) {
    const byKey = new Map(spec.existing.map((row) => [spec.key(row), row]));
    const seen = new Set<string>();
    for (const row of spec.incoming) {
      const key = spec.key(row);
      if (!key.replace(/\|/g, "").trim() || seen.has(key)) continue;
      seen.add(key);
      const match = byKey.get(key);

      if (!match) {
        const payload = spec.entity === "project" ? { ...row, slug: uniqueSlug(String(row.title)) } : row;
        push(spec.entity, "add", null, payload, spec.label(row), null);
        continue;
      }

      const changes = changedFields(spec.updatable, match, row);
      if (spec.entity === "experience") {
        if (row.is_current === true && match.is_current !== true) {
          changes.push({ field: "is_current", before: match.is_current ?? false, after: true });
          if (hasValue(match.end_date)) changes.push({ field: "end_date", before: match.end_date, after: null });
        } else if (row.is_current === false && hasValue(row.end_date) && match.is_current === true) {
          changes.push({ field: "is_current", before: true, after: false });
        }
      }
      if (changes.length === 0) continue;
      push(
        spec.entity,
        "update",
        String(match.id),
        Object.fromEntries(changes.map((change) => [change.field, change.after])),
        spec.label(row),
        changes,
      );
    }
  }

  return { proposals, skipped };
}
