import Link from "next/link";

export type EpisodeCardData = { slug: string; title: string; summary: string; publishedAt: Date | null; isStartHere: boolean; isCurrent: boolean; access: "full" | "teaser" };

export function EpisodeCard({ episode }: { episode: EpisodeCardData }) {
  const label = episode.isStartHere ? "Start Here" : episode.isCurrent ? "New Episode" : episode.access === "teaser" ? "45-sec teaser" : "Members";
  return <article className="card episodeCard"><span className="tag">{label}</span><h3>{episode.title}</h3><p>{episode.summary}</p><p><time>{episode.publishedAt?.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) ?? "Coming soon"}</time></p><Link className="button primary" href={`/shows/${episode.slug}`}>{episode.access === "teaser" ? "Watch teaser" : "Play episode"}</Link></article>;
}
