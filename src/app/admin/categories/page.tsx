import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createContentDb } from "@/db/content/client";
import { categories } from "@/db/content/schema";
import { getSession } from "@/features/auth/session";
import { TrashRestoreCard } from "@/components/trash-restore-card";

export const dynamic = "force-dynamic";
export default async function CategoriesPage() {
  const session = await getSession(); if (!session || session.role !== "admin") redirect("/admin/sign-in"); if (session.mustChangePassword) redirect("/admin/change-password");
  const allRows = await createContentDb().select().from(categories).orderBy(asc(categories.sortOrder));
  const rows = allRows.filter((category) => !category.deletedAt); const deletedRows = allRows.filter((category) => category.deletedAt);
  return <main className="audience"><p className="eyebrow">Admin categories</p><h1>Organize podcast subjects</h1><form action="/api/admin/categories" method="post" className="stackedForm card"><input type="hidden" name="action" value="create" /><label>Category name<input name="name" required /></label><label>Short description<input name="description" required /></label><label>Display order<input name="sortOrder" type="number" min="0" defaultValue="0" /></label><button className="button primary" type="submit">Create category</button></form><div className="cardGrid">{rows.map((category) => <article className="card" key={category.id}><h2>{category.name}</h2><p>{category.description}</p><form action="/api/admin/categories" method="post" className="stackedForm"><input type="hidden" name="action" value="reorder" /><input type="hidden" name="id" value={category.id} /><label>Display order<input name="sortOrder" type="number" min="0" defaultValue={category.sortOrder} /></label><button className="button quiet" type="submit">Update order</button></form><form action="/api/admin/categories" method="post"><input type="hidden" name="action" value="delete" /><input type="hidden" name="id" value={category.id} /><button className="button outline" type="submit">Move to trash</button></form></article>)}</div>{deletedRows.length ? <section><h2>Category trash</h2><div className="cardGrid">{deletedRows.map((category) => <TrashRestoreCard endpoint="/api/admin/categories" id={category.id} key={category.id} title={category.name} />)}</div></section> : null}</main>;
}
