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
import { useMemo, useState } from "react";
import { SocialLinks } from "@/components/social-links";
import { deleteSocial, reorderSocials, saveSocial } from "@/lib/actions/content";
import { platforms, type Platform, type SocialLink } from "@/lib/types";
import { socialLabel } from "@/lib/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const platformLabels: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  github: "GitHub",
  whatsapp: "WhatsApp",
  phone: "Phone",
  email: "Email",
  other: "Other",
};

function emptyDraft(): Omit<SocialLink, "id" | "sort_order"> & { id?: string } {
  return { platform: "linkedin", label: "", value: "", visible: true };
}

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
    >
      <button type="button" className="mt-1 cursor-grab text-muted-foreground" aria-label="Drag to reorder" {...attributes} {...listeners}>
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

export function SocialsManager({ links }: { links: SocialLink[] }) {
  const router = useRouter();
  const [items, setItems] = useState(links);
  const [source, setSource] = useState(links);
  if (source !== links) {
    setSource(links);
    setItems(links);
  }
  const [draft, setDraft] = useState(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const preview = useMemo(() => {
    const base = items.map((item) => ({ ...item }));
    if (!open) return base;
    const next: SocialLink = {
      id: editingId ?? "draft",
      platform: draft.platform,
      label: draft.label || null,
      value: draft.value,
      sort_order: editingId ? (base.find((item) => item.id === editingId)?.sort_order ?? base.length) : base.length,
      visible: draft.visible,
    };
    if (editingId) return base.map((item) => (item.id === editingId ? next : item));
    return [...base, next];
  }, [draft, editingId, items, open]);

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setOpen(true);
    setError(null);
  }

  function startEdit(link: SocialLink) {
    setEditingId(link.id);
    setDraft({ platform: link.platform, label: link.label ?? "", value: link.value, visible: link.visible });
    setOpen(true);
    setError(null);
  }

  async function onSubmit() {
    setPending(true);
    setError(null);
    const result = await saveSocial({
      id: editingId ?? undefined,
      platform: draft.platform,
      label: draft.label,
      value: draft.value,
      visible: draft.visible,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    const result = await reorderSocials(next.map((item) => item.id));
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this link?")) return;
    const result = await deleteSocial(id);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function onToggle(link: SocialLink) {
    const result = await saveSocial({ ...link, label: link.label ?? "", visible: !link.visible });
    if (result.error) setError(result.error);
    else router.refresh();
  }

  const placeholder =
    draft.platform === "email"
      ? "name@example.com"
      : draft.platform === "phone" || draft.platform === "whatsapp"
        ? "+20 1XX XXX XXXX"
        : "https://";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Links and contact</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hidden items stay off the public site. Phone and WhatsApp appear only when you add them and turn visibility on.
          </p>
        </div>
        <Button type="button" onClick={startCreate}>
          Add
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="rounded-2xl border border-dashed border-border p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">Live preview</p>
        <SocialLinks links={preview} variant="icons" />
        {preview.filter((link) => link.visible && link.value.trim()).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing visible yet. The public social row stays hidden.</p>
        ) : null}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {items.map((link) => (
              <SortableRow key={link.id} id={link.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{socialLabel(link)}</p>
                    <p className="truncate text-sm text-muted-foreground">{link.value}</p>
                    {!link.visible ? <p className="text-xs text-primary">Hidden</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => onToggle(link)}>
                      {link.visible ? "Hide" : "Show"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(link)}>
                      Edit
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(link.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </SortableRow>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">No links yet.</p> : null}
      {open ? (
        <form
          className="space-y-4 rounded-2xl border border-border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <select
              id="platform"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={draft.platform}
              onChange={(event) => setDraft((current) => ({ ...current, platform: event.target.value as Platform }))}
            >
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platformLabels[platform]}
                </option>
              ))}
            </select>
          </div>
          {draft.platform === "other" ? (
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={draft.label ?? ""}
                onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="value">{draft.platform === "email" ? "Email" : draft.platform === "phone" || draft.platform === "whatsapp" ? "Number" : "URL"}</Label>
            <Input
              id="value"
              placeholder={placeholder}
              value={draft.value}
              onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.visible}
              onChange={(event) => setDraft((current) => ({ ...current, visible: event.target.checked }))}
            />
            Visible on the site
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
