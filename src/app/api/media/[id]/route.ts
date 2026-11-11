import { get } from "@vercel/blob";
import { and, eq, isNull } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { createContentDb } from "@/db/content/client";
import { episodes, mediaVariants } from "@/db/content/schema";
import { SESSION_COOKIE_NAME, getSessionFromToken } from "@/features/auth/session";
import { resolveEpisodeAccess } from "@/features/media/access";
import { mediaResponseStatus, readableBlobStatus } from "@/features/media/blob-response";

export async function GET(request: NextRequest, context: RouteContext<"/api/media/[id]">) {
  const { id } = await context.params; const db = createContentDb();
  const [record] = await db.select({ media: mediaVariants, episode: episodes }).from(mediaVariants).innerJoin(episodes, eq(episodes.id, mediaVariants.episodeId)).where(and(eq(mediaVariants.id, id), eq(episodes.status, "published"), isNull(mediaVariants.deletedAt), isNull(episodes.deletedAt))).limit(1);
  if (!record) return new Response("Not found", { status: 404 });
  const session = await getSessionFromToken(request.cookies.get(SESSION_COOKIE_NAME)?.value); const viewer = session ? { role: session.role, status: session.status } : null;
  const access = resolveEpisodeAccess(record.episode, viewer); const isTeaser = record.media.kind === "teaser";
  if (access === "teaser" && !isTeaser) return Response.json({ error: "Subscribe free or sign in to play this episode." }, { status: 403 });
  const wantsDownload = request.nextUrl.searchParams.get("download") === "1";
  if (wantsDownload && !session) return Response.json({ error: "Sign in to download episodes." }, { status: 401 });
  const range = request.headers.get("range"); const blob = await get(record.media.objectKey, { access: "private", headers: range ? { Range: range } : undefined });
  if (!blob || !readableBlobStatus(blob.statusCode) || !blob.stream) return new Response("Media not found", { status: 404 });
  const headers = new Headers(); blob.headers.forEach((value, key) => headers.set(key, value)); headers.set("Content-Type", record.media.mimeType); headers.set("Accept-Ranges", "bytes"); headers.set("Cache-Control", "private, no-store");
  if (wantsDownload) headers.set("Content-Disposition", `attachment; filename="${safeFilename(record.media.originalFilename ?? `${record.episode.slug}.${extensionFor(record.media.mimeType)}`)}"`);
  return new Response(blob.stream, { status: mediaResponseStatus(Boolean(range), blob.statusCode), headers });
}

function extensionFor(mimeType: string) { if (mimeType === "video/mp4") return "mp4"; if (mimeType === "audio/mpeg") return "mp3"; if (mimeType === "audio/mp4") return "m4a"; return "bin"; }
function safeFilename(filename: string) { return filename.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120); }
