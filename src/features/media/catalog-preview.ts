import type { EpisodeAccessInput } from "./access";

type CatalogMedia = {
  id: string;
  episodeId: string;
  kind: "video" | "teaser";
};

export function selectCatalogPreview(episode: EpisodeAccessInput & { id?: string }, media: CatalogMedia[]) {
  const episodeMedia = episode.id ? media.filter((item) => item.episodeId === episode.id) : media;
  const isFree = episode.accessLevel === "public" || episode.isStartHere || episode.isCurrent;
  if (!isFree) return episodeMedia.find((item) => item.kind === "teaser") ?? null;
  return episodeMedia.find((item) => item.kind === "video") ?? episodeMedia.find((item) => item.kind === "teaser") ?? null;
}
