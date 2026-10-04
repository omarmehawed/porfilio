"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSection, reorderSection, saveSection, uploadMedia } from "@/lib/actions/content";
import { generateBrief, syncGithub } from "@/lib/actions/github";
import { sectionFields } from "@/lib/admin/sections";
import { slugify } from "@/lib/format";
import type { ContentSection } from "@/lib/types";
import {
  FieldControl,
  blankValues as blank,
  valuesFromRow as fromRow,
  type FormValues,
} from "@/components/admin/field-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = { id: string; visible?: boolean } & Record<string, unknown>;

function SortableItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
    >
      <button
        type="button"
        className="mt-1 cursor-grab text-muted-foreground"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

export function EntityManager({
  section,
  records,
}: {
  section: ContentSection;
  records: Row[];
}) {
  const meta = sectionFields[section];
  const router = useRouter();
  const [items, setItems] = useState(records);
  const [source, setSource] = useState(records);
  if (source !== records) {
    setSource(records);
    setItems(records);
  }
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [values, setValues] = useState<FormValues>(blank(meta.fields));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [briefing, setBriefing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function openCreate() {
    setCreating(true);
    setEditing(null);
    setValues(blank(meta.fields));
    setError(null);
  }

  function openEdit(row: Row) {
    setCreating(false);
    setEditing(row);
    setValues(fromRow(row, meta.fields));
    setError(null);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    const result = await reorderSection(section, next.map((item) => item.id));
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function onSubmit() {
    setPending(true);
    setError(null);
    const payload: Record<string, unknown> = { ...values };
    if (section === "project") {
      const title = String(values.title ?? "");
      const slug = String(values.slug ?? "").trim();
      payload.slug = slug || slugify(title);
    }
    if (editing) payload.id = editing.id;
    const result = await saveSection(section, payload);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    closeForm();
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this item?")) return;
    const result = await deleteSection(section, id);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function onToggle(row: Row) {
    const result = await saveSection(section, { ...row, visible: !row.visible });
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function onSync() {
    setSyncing(true);
    setError(null);
    const result = await syncGithub();
    setSyncing(false);
    if (result.error) setError(result.error);
    else setNotice("GitHub data will refresh on the next page view.");
  }

  async function onGenerateBrief() {
    setBriefing(true);
    setError(null);
    const result = await generateBrief(String(values.github_repo ?? "").trim());
    setBriefing(false);
    if (result.error || !result.brief) {
      setError(result.error ?? "No brief was generated.");
      return;
    }
    setValues((current) => ({ ...current, brief: result.brief! }));
  }

  async function onImage(file: File) {
    const body = new FormData();
    body.set("file", file);
    body.set("kind", "cover");
    const result = await uploadMedia(body);
    if (result.error || !result.url) {
      setError(result.error ?? "Upload failed.");
      return;
    }
    setValues((current) => ({ ...current, cover_url: result.url! }));
  }

  const formOpen = creating || editing;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">{meta.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
        </div>
        <div className="flex gap-2">
          {section === "project" ? (
            <Button type="button" variant="outline" disabled={syncing} onClick={() => void onSync()}>
              {syncing ? "Syncing…" : "Sync GitHub"}
            </Button>
          ) : null}
          <Button type="button" onClick={openCreate}>
            Add
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{String(item[meta.primary] ?? "")}</p>
                    {meta.secondary ? (
                      <p className="text-sm text-muted-foreground">{String(item[meta.secondary] ?? "")}</p>
                    ) : null}
                    {item.visible === false ? <p className="text-xs text-primary">Hidden</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => onToggle(item)}>
                      {item.visible === false ? "Show" : "Hide"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </SortableItem>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {formOpen ? (
        <form
          className="space-y-4 rounded-2xl border border-border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <h2 className="font-heading text-xl">{editing ? "Edit" : "Add"}</h2>
          {meta.fields.map((field) => (
            <FieldControl
              key={field.name}
              field={field}
              value={values[field.name]}
              onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))}
            >
              {section === "project" && field.name === "brief" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={briefing || !String(values.github_repo ?? "").trim()}
                  onClick={() => void onGenerateBrief()}
                >
                  {briefing ? "Reading README…" : "Generate from README"}
                </Button>
              ) : null}
              {field.kind === "image" ? (
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void onImage(file);
                  }}
                />
              ) : null}
            </FieldControl>
          ))}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
