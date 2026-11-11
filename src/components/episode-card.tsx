import Link from "next/link";
import { CatalogPreview } from "./catalog-preview";

type EpisodeCardEpisode = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: Date | null;
  isStartHere: boolean;
  isCurrent: boolean;
  access: "full" | "teaser";
  hasMedia: boolean;
  previewMediaId: string | null;
  previewMediaKind?: "audio" | "video";
};

export function EpisodeCard({ episode }: { episode: EpisodeCardEpisode }) {
  const locked = episode.access === "teaser" && !episode.previewMediaId;
  const previewSource = episode.previewMediaId ? `/api/media/${episode.previewMediaId}` : "/media/podcast-opener/like-tac-podcast-opener.mp4";

  return <article className="card episodeCard">
    <span className="tag">{episode.isStartHere ? "Start Here" : episode.isCurrent ? "New Episode" : episode.access === "teaser" ? "45-sec preview" : "Episode"}</span>
    {locked
      ? <div className="lockedEpisode" aria-label={`${episode.title} locked for subscribers`}><img src="/brand/studio-cover.svg" alt="" width="720" height="660" /><strong>Preview being prepared</strong><p>Subscribe free to watch the complete episode when it is ready.</p></div>
      : <CatalogPreview title={episode.title} src={previewSource} kind={episode.previewMediaKind ?? "video"} hasPodcast={Boolean(episode.previewMediaId)} />}
    <h3>{episode.title}</h3>
    <p>{episode.summary}</p>
    <p><time>{episode.publishedAt?.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) ?? "Coming soon"}</time></p>
    <Link className="button primary" href={locked ? "/signup" : `/shows/${episode.slug}`}>{locked ? "Subscribe Free to Watch" : episode.access === "teaser" ? "Watch 45-second preview" : "Play episode"}</Link>
  </article>;
}
