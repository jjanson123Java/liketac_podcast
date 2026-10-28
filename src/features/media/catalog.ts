import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { createContentDb } from "@/db/content/client";
import { categories, episodes, mediaVariants } from "@/db/content/schema";
import { selectCatalogPreview } from "./catalog-preview";

export async function getCatalog() {
  if (!process.env.CONTENT_DATABASE_URL) return sampleCatalog;
  const db = createContentDb();
  const categoryRows = await db.select().from(categories).where(isNull(categories.deletedAt)).orderBy(asc(categories.sortOrder), asc(categories.name));
  const episodeRows = await db.select().from(episodes).where(and(eq(episodes.status, "published"), isNull(episodes.deletedAt))).orderBy(desc(episodes.publishedAt));
  const mediaRows = episodeRows.length
    ? await db.select({ id: mediaVariants.id, episodeId: mediaVariants.episodeId, kind: mediaVariants.kind }).from(mediaVariants).where(and(inArray(mediaVariants.episodeId, episodeRows.map((episode) => episode.id)), inArray(mediaVariants.kind, ["audio", "video", "teaser"]), isNull(mediaVariants.deletedAt)))
    : [];
  const episodeIdsWithMedia = new Set(mediaRows.map((media) => media.episodeId));
  const previewRows = mediaRows.filter((media): media is typeof media & { kind: "video" | "teaser" } => media.kind === "video" || media.kind === "teaser");
  return categoryRows.map((category) => ({ ...category, episodes: episodeRows.filter((episode) => episode.categoryId === category.id).map((episode) => ({ ...episode, hasMedia: episodeIdsWithMedia.has(episode.id), previewMediaId: selectCatalogPreview(episode, previewRows)?.id ?? null })) }));
}

export async function getEpisodeBySlug(slug: string) {
  if (!process.env.CONTENT_DATABASE_URL) { for (const category of sampleCatalog) { const episode = category.episodes.find((item) => item.slug === slug); if (episode) return { episode, category, media: [] }; } return null; }
  const db = createContentDb(); const [episode] = await db.select().from(episodes).where(and(eq(episodes.slug, slug), eq(episodes.status, "published"), isNull(episodes.deletedAt))).limit(1); if (!episode) return null;
  const [category] = await db.select().from(categories).where(eq(categories.id, episode.categoryId)).limit(1); const media = await db.select().from(mediaVariants).where(and(eq(mediaVariants.episodeId, episode.id), isNull(mediaVariants.deletedAt))); return { episode, category, media };
}

const now = new Date();
const sampleCatalog = [{ id: "sample-category-1", name: "AI without the headache", slug: "ai-without-the-headache", description: "Useful AI ideas explained in plain language.", sortOrder: 1, createdAt: now, updatedAt: now, deletedAt: null, episodes: [{ id: "sample-episode-1", categoryId: "sample-category-1", title: "AI: useful coworker or confident liar?", slug: "ai-useful-coworker", summary: "A lively, practical conversation about where AI helps—and where it absolutely does not.", status: "published" as const, accessLevel: "public" as const, isStartHere: false, isCurrent: true, hasMedia: false, previewMediaId: null, publishedAt: new Date("2026-10-27T12:00:00Z"), createdAt: now, updatedAt: now, deletedAt: null }, { id: "sample-episode-2", categoryId: "sample-category-1", title: "Tech explained like you’re at lunch", slug: "tech-at-lunch", summary: "Plain language, real examples, and no shame in asking the obvious question.", status: "published" as const, accessLevel: "public" as const, isStartHere: true, isCurrent: false, hasMedia: false, previewMediaId: null, publishedAt: new Date("2026-10-20T12:00:00Z"), createdAt: now, updatedAt: now, deletedAt: null }] }, { id: "sample-category-2", name: "Deploying and Configuring Expressway", slug: "expressway", description: "Practical Expressway deployment and configuration conversations.", sortOrder: 2, createdAt: now, updatedAt: now, deletedAt: null, episodes: [] }];
