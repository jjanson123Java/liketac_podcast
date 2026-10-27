import { asc, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createContentDb } from "@/db/content/client";
import { categories } from "@/db/content/schema";
import { getSession } from "@/features/auth/session";

export const dynamic = "force-dynamic";
export default async function CategoriesPage() {
  const session = await getSession(); if (!session || session.role !== "admin") redirect("/admin/sign-in");
  const rows = await createContentDb().select().from(categories).where(isNull(categories.deletedAt)).orderBy(asc(categories.sortOrder));
  return <main className="audience"><p className="eyebrow">Admin categories</p><h1>Organize podcast subjects</h1><form action="/api/admin/categories" method="post" className="stackedForm card"><input type="hidden" name="action" value="create" /><label>Category name<input name="name" required /></label><label>Short description<input name="description" required /></label><label>Display order<input name="sortOrder" type="number" min="0" defaultValue="0" /></label><button className="button primary" type="submit">Create category</button></form><div className="cardGrid">{rows.map((category) => <article className="card" key={category.id}><h2>{category.name}</h2><p>{category.description}</p><p className="tag">Order {category.sortOrder}</p><form action="/api/admin/categories" method="post"><input type="hidden" name="action" value="delete" /><input type="hidden" name="id" value={category.id} /><button className="button outline" type="submit">Move to trash</button></form></article>)}</div></main>;
}
