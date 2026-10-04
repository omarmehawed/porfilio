"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveProfile, uploadMedia } from "@/lib/actions/content";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [values, setValues] = useState({
    full_name: profile.full_name,
    title: profile.title,
    summary: profile.summary ?? "",
    location: profile.location ?? "",
    photo_url: profile.photo_url ?? "",
    cover_url: profile.cover_url ?? "",
    cv_public_url: profile.cv_public_url ?? "",
  });
  const fieldFor = { photo: "photo_url", cover: "cover_url", cv: "cv_public_url" } as const;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setPending(true);
    setError(null);
    const result = await saveProfile(values);
    setPending(false);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function persist(next: typeof values) {
    setValues(next);
    const saved = await saveProfile(next);
    if (saved.error) setError(saved.error);
    else router.refresh();
  }

  async function onFile(kind: keyof typeof fieldFor, file: File) {
    setError(null);
    const body = new FormData();
    body.set("file", file);
    body.set("kind", kind);
    const result = await uploadMedia(body);
    if (result.error || !result.url) {
      setError(result.error ?? "Upload failed.");
      return;
    }
    await persist({ ...values, [fieldFor[kind]]: result.url });
  }

  function onRemove(kind: keyof typeof fieldFor) {
    void persist({ ...values, [fieldFor[kind]]: "" });
  }

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div>
        <h1 className="font-heading text-3xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Photos, summary, and the public CV file. Contact details are managed under Links and contact.
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="full_name">Name</Label>
        <Input id="full_name" value={values.full_name} onChange={(event) => setValues({ ...values, full_name: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" value={values.location} onChange={(event) => setValues({ ...values, location: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea id="summary" rows={6} value={values.summary} onChange={(event) => setValues({ ...values, summary: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="photo">Profile photo</Label>
        <p className="text-xs text-muted-foreground">Square works best. Shown on the site and in link previews.</p>
        {values.photo_url ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={values.photo_url} alt="" className="size-20 rounded-full object-cover" />
            <Button type="button" variant="outline" size="sm" onClick={() => onRemove("photo")}>
              Remove
            </Button>
          </div>
        ) : null}
        <Input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFile("photo", file);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cover">Cover photo</Label>
        <p className="text-xs text-muted-foreground">
          Wide image, ideally 1200 × 630 or larger. Shown as the banner on the home page and as the picture when
          you share the link, with your photo and name on top.
        </p>
        {values.cover_url ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={values.cover_url} alt="" className="aspect-[1200/630] w-full rounded-xl object-cover" />
            <Button type="button" variant="outline" size="sm" onClick={() => onRemove("cover")}>
              Remove
            </Button>
          </div>
        ) : null}
        <Input
          id="cover"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFile("cover", file);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cv">Public CV (PDF)</Label>
        {values.cv_public_url ? (
          <a href={values.cv_public_url} className="block text-sm text-primary">
            Current file
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">No public CV yet. The download button stays hidden.</p>
        )}
        <Input
          id="cv"
          type="file"
          accept="application/pdf"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFile("cv", file);
          }}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
