import { ShowsCatalog } from "@/components/shows-catalog";
import { getSession } from "@/features/auth/session";
import { resolveEpisodeAccess } from "@/features/media/access";
import { getCatalog } from "@/features/media/catalog";

export const dynamic = "force-dynamic";
export default async function ShowsPage() {
  const [catalog, session] = await Promise.all([getCatalog(), getSession()]); const viewer = session ? { role: session.role, status: session.status } : null;
  const classifiedCatalog = catalog.map((category) => ({ ...category, episodes: category.episodes.map((episode) => ({ ...episode, access: resolveEpisodeAccess(episode, viewer) })) }));
  return <main className="audience"><p className="eyebrow">Browse all shows</p><h1>Simple conversations. Serious topics.</h1><p>Browse by subject and publish date. Sign in or subscribe free to unlock the complete archive and downloads.</p><ShowsCatalog catalog={classifiedCatalog} isSubscriber={session?.role === "subscriber" || session?.role === "admin"} /></main>;
}
