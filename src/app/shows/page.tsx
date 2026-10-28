import { EpisodeCard } from "@/components/episode-card";
import { PodcastPlaceholder } from "@/components/podcast-placeholder";
import { getSession } from "@/features/auth/session";
import { resolveEpisodeAccess } from "@/features/media/access";
import { getCatalog } from "@/features/media/catalog";

export const dynamic = "force-dynamic";
export default async function ShowsPage() {
  const [catalog, session] = await Promise.all([getCatalog(), getSession()]); const viewer = session ? { role: session.role, status: session.status } : null;
  return <main className="audience"><p className="eyebrow">Browse all shows</p><h1>Simple conversations. Serious topics.</h1><p>Browse by subject and publish date. Sign in or subscribe free to unlock the complete archive and downloads.</p>{catalog.map((category) => <section className="catalogSection" key={category.id}><div className="sectionHeading"><div><h2>{category.name}</h2><p>{category.description}</p></div><span className="tag">{category.episodes.length ? `${category.episodes.length} episode${category.episodes.length === 1 ? "" : "s"}` : "Coming Soon"}</span></div>{category.episodes.length ? <div className="cardGrid">{category.episodes.map((episode) => <EpisodeCard key={episode.id} episode={{ ...episode, access: resolveEpisodeAccess(episode, viewer) }} />)}</div> : <PodcastPlaceholder subject={category.name} catalogPreview />}</section>)}</main>;
}
