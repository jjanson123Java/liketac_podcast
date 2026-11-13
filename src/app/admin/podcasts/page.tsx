import { asc, desc } from "drizzle-orm";
import { redirect } from "next/navigation";

import { AdminMediaUpload } from "@/components/admin-media-upload";
import { AdminShell } from "@/components/admin-shell";
import { CompanionMediaUpload } from "@/components/companion-media-upload";
import { TrashRestoreCard } from "@/components/trash-restore-card";
import { createContentDb } from "@/db/content/client";
import { categories, episodes, mediaVariants } from "@/db/content/schema";
import { getSession } from "@/features/auth/session";

export const dynamic = "force-dynamic";

export default async function PodcastsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/sign-in");
  if (session.mustChangePassword) redirect("/admin/change-password");
  const db = createContentDb();
  const [allCategories, allEpisodes, allMedia] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(episodes).orderBy(desc(episodes.createdAt)),
    db.select().from(mediaVariants).orderBy(desc(mediaVariants.createdAt)),
  ]);
  const categoryRows = allCategories.filter((category) => !category.deletedAt);
  const episodeRows = allEpisodes.filter((episode) => !episode.deletedAt);
  const deletedEpisodes = allEpisodes.filter((episode) => episode.deletedAt);

  return <AdminShell current="/admin/podcasts"><main className="audience"><p className="eyebrow">Admin podcast content</p><h1>Create, upload, and publish episodes</h1><form action="/api/admin/podcasts" method="post" className="stackedForm card"><input type="hidden" name="action" value="create" /><label>Title<input name="title" required /></label><label>Categories<select name="categoryId" required>{categoryRows.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Summary<textarea name="summary" required rows={4} /></label><label>Access<select name="accessLevel"><option value="subscriber">Subscriber archive</option><option value="public">Free public episode</option></select></label><ClassificationFields /><label className="checkField"><input type="checkbox" name="isStartHere" value="yes" /> Start Here episode</label><label className="checkField"><input type="checkbox" name="isCurrent" value="yes" /> Current/New Episode</label><button className="button primary" type="submit">Save draft</button></form><div className="adminEpisodeList">{episodeRows.map((episode) => {
    const media = allMedia.filter((item) => item.episodeId === episode.id && !item.deletedAt);
    const hasFull = media.some((item) => item.kind === "audio" || item.kind === "video");
    const hasPreview = media.some((item) => item.kind === "teaser");
    return <article className="card adminEpisode" key={episode.id}><span className="tag">{episode.status}</span><h2>{episode.title}</h2><p>{episode.summary}</p><form action="/api/admin/podcasts" method="post" className="stackedForm episodeCategoryForm"><input type="hidden" name="id" value={episode.id} /><input type="hidden" name="action" value="move" /><label>Category<select name="categoryId" defaultValue={episode.categoryId} required>{categoryRows.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><button className="button outline" type="submit">Move episode</button></form><form action="/api/admin/podcasts" method="post" className="stackedForm episodeClassificationForm"><input type="hidden" name="id" value={episode.id} /><input type="hidden" name="action" value="classify" /><ClassificationFields episode={episode} /><button className="button outline" type="submit">Update classifications</button></form><CompanionMediaUpload episodeId={episode.id} hasFull={hasFull} hasPreview={hasPreview} /><details><summary>Website-only fallback and supporting files</summary><AdminMediaUpload episodeId={episode.id} /></details><div className="buttonRow"><form action="/api/admin/podcasts" method="post"><input type="hidden" name="id" value={episode.id} /><input type="hidden" name="action" value={episode.status === "published" ? "unpublish" : "publish"} /><button className="button primary" type="submit">{episode.status === "published" ? "Unpublish" : "Publish"}</button></form><form action="/api/admin/podcasts" method="post"><input type="hidden" name="id" value={episode.id} /><input type="hidden" name="action" value="delete" /><button className="button outline" type="submit">Move to trash</button></form></div></article>;
  })}</div>{deletedEpisodes.length ? <section><h2>Podcast trash</h2><div className="cardGrid">{deletedEpisodes.map((episode) => <TrashRestoreCard endpoint="/api/admin/podcasts" id={episode.id} key={episode.id} title={episode.title} />)}</div></section> : null}</main></AdminShell>;
}

function ClassificationFields({ episode }: { episode?: typeof episodes.$inferSelect }) {
  return <fieldset className="classificationFields"><legend>Episode classifications</legend>
    <label className="checkField"><input type="checkbox" name="isFreeClassification" value="yes" defaultChecked={episode?.isFreeClassification} /> Free</label>
    <label className="checkField"><input type="checkbox" name="isNonTechnical" value="yes" defaultChecked={episode?.isNonTechnical} /> Non-Technical</label>
    <label className="checkField"><input type="checkbox" name="isBeginner" value="yes" defaultChecked={episode?.isBeginner} /> Beginner</label>
    <label className="checkField"><input type="checkbox" name="isSeriously" value="yes" defaultChecked={episode?.isSeriously} /> Seriously</label>
  </fieldset>;
}
