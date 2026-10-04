import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getPublicPortfolio } from "@/lib/content/repository";

export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
// JPEG keeps the preview small enough for WhatsApp, which skips large images.
export const contentType = "image/jpeg";
export const alt = "Omar Mehawed — IT Developer";

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

async function loadImage(url: string | null, width: number, height: number) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) return null;
    const response = await fetch(parsed, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_SOURCE_BYTES) return null;
    const jpeg = await sharp(bytes).rotate().resize(width, height, { fit: "cover" }).jpeg({ quality: 85 }).toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const { profile } = await getPublicPortfolio();
  const [cover, photo] = await Promise.all([
    loadImage(profile.cover_url, size.width, size.height),
    loadImage(profile.photo_url, 336, 336),
  ]);

  const png = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#1a1214",
          color: "#f6efe9",
        }}
      >
        {cover ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img
            src={cover}
            width={size.width}
            height={size.height}
            style={{ position: "absolute", top: 0, left: 0, width: size.width, height: size.height }}
          />
        ) : null}
        {cover ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: size.width,
              height: size.height,
              background:
                "linear-gradient(to top, rgba(20,12,14,0.92) 0%, rgba(20,12,14,0.6) 40%, rgba(20,12,14,0) 75%)",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            bottom: 64,
            display: "flex",
            alignItems: "center",
          }}
        >
          {photo ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img
              src={photo}
              width={168}
              height={168}
              style={{ borderRadius: 9999, border: "6px solid #f6efe9", marginRight: 36 }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, letterSpacing: 4, color: "#e58a9d" }}>{profile.title.toUpperCase()}</div>
            <div style={{ fontSize: 76, fontWeight: 700, marginTop: 8 }}>{profile.full_name}</div>
            {profile.location ? (
              <div style={{ fontSize: 30, marginTop: 10, color: "#e8dfd9" }}>{profile.location}</div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    size,
  );

  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": contentType } });
}
