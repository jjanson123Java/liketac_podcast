import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaPlayer } from "@/components/media-player";
import { getSession } from "@/features/auth/session";
import { resolveEpisodeAccess } from "@/features/media/access";
import { getEpisodeBySlug } from "@/features/media/catalog";

export const dynamic = "force-dynamic";
export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const [data, session] = await Promise.all([getEpisodeBySlug(slug), getSession()]); if (!data) notFound(); const access = resolveEpisodeAccess(data.episode, session ? { role: session.role, status: session.status } : null); const media = data.media.find((item) => item.kind === (access === "teaser" ? "teaser" : "video")) ?? data.media.find((item) => item.kind === (access === "teaser" ? "teaser" : "audio"));
  return <main className="audience"><p className="eyebrow">{data.category?.name}</p><h1>{data.episode.title}</h1><p className="formIntro">{data.episode.summary}</p>{media ? <MediaPlayer src={`/api/media/${media.id}`} kind={media.mimeType.startsWith("video/") ? "video" : "audio"} title={data.episode.title} teaser={access === "teaser"} /> : <div className="card"><h2>Media coming soon</h2><p>The episode listing is ready, but its recording has not been published yet.</p></div>}{access === "teaser" ? <div className="subscribeCallout"><h2>Enjoying the preview?</h2><p>Subscribe free or sign in to watch the complete episode and download it.</p><div className="buttonRow"><Link className="button primary" href={`/signup?returnTo=/shows/${slug}`}>Subscribe free</Link><Link className="button outline" href={`/sign-in?returnTo=/shows/${slug}`}>Sign in</Link></div></div> : session && media ? <a className="button primary" href={`/api/media/${media.id}?download=1`}>Download episode</a> : null}</main>;
}
