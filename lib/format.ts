export function formatMonth(iso: string | null) {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
}

export function formatPeriod(start: string | null, end: string | null, current = false) {
  if (!start && !end) return current ? "Present" : null;
  const startLabel = formatMonth(start);
  const endLabel = current || !end ? "Present" : formatMonth(end);
  if (!startLabel) return endLabel;
  if (!end && !current) return startLabel;
  return `${startLabel} – ${endLabel}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
