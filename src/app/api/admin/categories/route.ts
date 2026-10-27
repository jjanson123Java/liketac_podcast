import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createContentDb } from "@/db/content/client";
import { categories } from "@/db/content/schema";
import { createIdentityDb } from "@/db/identity/client";
import { requireAdmin } from "@/features/admin/authorization";
import { recordAudit } from "@/features/admin/audit";
import { requestIp } from "@/features/auth/rate-limit";

export async function POST(request: Request) {
  let admin; try { admin = await requireAdmin(); } catch { return Response.json({ error: "Administrator authentication required." }, { status: 401 }); }
  const form = await request.formData(); const action = String(form.get("action") ?? ""); const db = createContentDb();
  if (action === "create") { const name = String(form.get("name") ?? "").trim(); const slug = slugify(name); if (!name || !slug) return Response.json({ error: "Enter a category name." }, { status: 400 }); try { await db.insert(categories).values({ name, slug, description: String(form.get("description") ?? "").trim(), sortOrder: Number(form.get("sortOrder") ?? 0) }); } catch { return Response.json({ error: "That category already exists." }, { status: 409 }); } }
  else if (action === "delete") await db.update(categories).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(categories.id, String(form.get("id") ?? "")));
  else if (action === "restore") await db.update(categories).set({ deletedAt: null, updatedAt: new Date() }).where(eq(categories.id, String(form.get("id") ?? "")));
  else return Response.json({ error: "Unsupported category action." }, { status: 400 });
  await recordAudit(createIdentityDb(), { actorUserId: admin.userId, action: `admin.category.${action}`, targetType: "category", targetId: String(form.get("id") ?? "new"), ipAddress: requestIp(request) });
  return NextResponse.redirect(new URL("/admin/categories", request.url), 303);
}
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80); }
