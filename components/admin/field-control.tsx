"use client";

import type { FieldDef } from "@/lib/admin/sections";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type FormValues = Record<string, string | boolean>;

export function blankValues(fields: FieldDef[]) {
  const values: FormValues = {};
  for (const field of fields) {
    if (field.kind === "checkbox") values[field.name] = field.name === "visible";
    else if (field.kind === "select") values[field.name] = field.options?.[0]?.value ?? "";
    else values[field.name] = "";
  }
  return values;
}

export function valuesFromRow(row: Record<string, unknown>, fields: FieldDef[]) {
  const values = blankValues(fields);
  for (const field of fields) {
    const raw = row[field.name];
    if (field.kind === "checkbox") values[field.name] = Boolean(raw);
    else if (field.kind === "lines") values[field.name] = Array.isArray(raw) ? raw.join("\n") : "";
    else if (raw === null || raw === undefined) values[field.name] = "";
    else values[field.name] = String(raw);
  }
  return values;
}

export function FieldControl({
  field,
  value,
  onChange,
  children,
}: {
  field: FieldDef;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
  children?: React.ReactNode;
}) {
  if (field.kind === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        {field.label}
      </label>
    );
  }
  const text = String(value ?? "");
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{field.label}</Label>
      {field.kind === "textarea" || field.kind === "lines" ? (
        <Textarea
          id={field.name}
          rows={field.kind === "lines" ? 4 : 3}
          placeholder={field.placeholder}
          value={text}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.kind === "select" ? (
        <select
          id={field.name}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={text}
          onChange={(event) => onChange(event.target.value)}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={field.name}
          type={field.kind === "date" ? "date" : field.kind === "url" ? "url" : "text"}
          placeholder={field.placeholder}
          value={text}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {children}
    </div>
  );
}
