import type { EpisodeAccessInput } from "./access";

type CatalogMedia = {
  id: string;
  episodeId: string;
  kind: "audio" | "video" | "teaser";
  mimeType: string;
  createdAt: Date;
};

export function selectNewestMediaPair(media: CatalogMedia[]) {
  const newestFirst = [...media].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  return {
    full: newestFirst.find((item) => item.kind === "video" || item.kind === "audio") ?? null,
    teaser: newestFirst.find((item) => item.kind === "teaser") ?? null,
  };
}

export function catalogPreviewKind(mimeType?: string): "audio" | "video" {
  return mimeType?.startsWith("audio/") ? "audio" : "video";
}

export function selectCatalogPreview(episode: EpisodeAccessInput & { id?: string }, media: CatalogMedia[]) {
  const episodeMedia = episode.id ? media.filter((item) => item.episodeId === episode.id) : media;
  const pair = selectNewestMediaPair(episodeMedia);
  const isFree = episode.accessLevel === "public" || episode.isStartHere;
  return isFree ? pair.full ?? pair.teaser : pair.teaser;
}
