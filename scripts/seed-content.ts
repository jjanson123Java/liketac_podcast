import { eq } from "drizzle-orm";
import { categories, episodes } from "../src/db/content/schema";
import { createContentDb } from "../src/db/content/client";

const seeds = [
  { name: "Start Here", slug: "start-here", description: "Friendly first episodes for anyone new to Like TAC.", sortOrder: 0 },
  { name: "AI without the headache", slug: "ai-without-the-headache", description: "Useful AI ideas explained in plain language.", sortOrder: 10 },
  { name: "Deploying and Configuring Expressway", slug: "deploying-and-configuring-expressway", description: "Practical Expressway deployment and configuration conversations.", sortOrder: 20 },
  { name: "Collaboration", slug: "collaboration", description: "People, tools, and workflows that help teams communicate.", sortOrder: 30 },
];

const db = createContentDb();
for (const seed of seeds) await db.insert(categories).values(seed).onConflictDoUpdate({ target: categories.slug, set: { name: seed.name, description: seed.description, sortOrder: seed.sortOrder, updatedAt: new Date(), deletedAt: null } });
const [startHere] = await db.select().from(categories).where(eq(categories.slug, "start-here")).limit(1);
const [ai] = await db.select().from(categories).where(eq(categories.slug, "ai-without-the-headache")).limit(1);
await db.insert(episodes).values({ categoryId: startHere.id, title: "Tech explained like you’re at lunch", slug: "tech-at-lunch", summary: "Plain language, real examples, and no shame in asking the obvious question.", status: "published", accessLevel: "public", isStartHere: true, publishedAt: new Date("2026-10-20T12:00:00Z") }).onConflictDoUpdate({ target: episodes.slug, set: { categoryId: startHere.id, status: "published", accessLevel: "public", isStartHere: true, deletedAt: null } });
await db.insert(episodes).values({ categoryId: ai.id, title: "AI: useful coworker or confident liar?", slug: "ai-useful-coworker", summary: "A lively, practical conversation about where AI helps—and where it absolutely does not.", status: "published", accessLevel: "public", isCurrent: true, publishedAt: new Date("2026-10-27T12:00:00Z") }).onConflictDoUpdate({ target: episodes.slug, set: { categoryId: ai.id, status: "published", accessLevel: "public", isCurrent: true, deletedAt: null } });
console.log(`Seeded ${seeds.length} Like TAC categories and 2 free episode listings.`);
