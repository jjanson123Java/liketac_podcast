import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createContentDb } from "@/db/content/client";
import { categories, episodes, mediaVariants } from "@/db/content/schema";
import { createIdentityDb } from "@/db/identity/client";
import { requireAdmin } from "@/features/admin/authorization";
import { recordAudit } from "@/features/admin/audit";
import { requestIp } from "@/features/auth/rate-limit";
import { hasPublishableFullMedia } from "@/features/media/upload";

export async function POST(request: Request) {
  let admin; try { admin = await requireAdmin(); } catch { return Response.json({ error: "Administrator authentication required." }, { status: 401 }); }
  const form = await request.formData(); const action = String(form.get("action") ?? ""); const db = createContentDb();
  if (action === "create") { const title = String(form.get("title") ?? "").trim(); const slug = slugify(title); if (!title || !slug) return Response.json({ error: "Enter an episode title." }, { status: 400 }); await db.insert(episodes).values({ categoryId: String(form.get("categoryId")), title, slug: `${slug}-${Date.now().toString(36)}`, summary: String(form.get("summary") ?? "").trim(), accessLevel: form.get("accessLevel") === "public" ? "public" : "subscriber", isStartHere: form.get("isStartHere") === "yes", isCurrent: form.get("isCurrent") === "yes", status: "draft" }); }
  else { const id = String(form.get("id") ?? ""); if (action === "move") { const categoryId = String(form.get("categoryId") ?? ""); const [category] = await db.select().from(categories).where(and(eq(categories.id, categoryId), isNull(categories.deletedAt))).limit(1); if (!category) return Response.json({ error: "Choose an active category." }, { status: 400 }); await db.update(episodes).set({ categoryId, updatedAt: new Date() }).where(and(eq(episodes.id, id), isNull(episodes.deletedAt))); }
    else if (action === "publish") { const [episode] = await db.select().from(episodes).where(and(eq(episodes.id, id), isNull(episodes.deletedAt))).limit(1); if (!episode) return Response.json({ error: "Episode not found." }, { status: 404 }); const media = await db.select().from(mediaVariants).where(and(eq(mediaVariants.episodeId, id), isNull(mediaVariants.deletedAt))); if (!hasPublishableFullMedia(media)) return Response.json({ error: "Upload full audio or video before publishing." }, { status: 400 }); await db.update(episodes).set({ status: "published", publishedAt: episode.publishedAt ?? new Date(), updatedAt: new Date() }).where(eq(episodes.id, id)); }
    else if (action === "unpublish") await db.update(episodes).set({ status: "unpublished", updatedAt: new Date() }).where(eq(episodes.id, id));
    else if (action === "delete") { await db.update(episodes).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(episodes.id, id)); await db.update(mediaVariants).set({ deletedAt: new Date() }).where(eq(mediaVariants.episodeId, id)); }
    else if (action === "restore") await db.transaction(async (tx) => { await tx.update(episodes).set({ deletedAt: null, status: "draft", updatedAt: new Date() }).where(eq(episodes.id, id)); await tx.update(mediaVariants).set({ deletedAt: null }).where(eq(mediaVariants.episodeId, id)); });
    else return Response.json({ error: "Unsupported episode action." }, { status: 400 }); }
  await recordAudit(createIdentityDb(), { actorUserId: admin.userId, action: `admin.episode.${action}`, targetType: "episode", targetId: String(form.get("id") ?? "new"), ipAddress: requestIp(request) });
  return NextResponse.redirect(new URL("/admin/podcasts", request.url), 303);
}
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70); }
