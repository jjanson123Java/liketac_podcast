import { and, eq, isNull } from "drizzle-orm";

import { createContentDb } from "@/db/content/client";
import { episodes } from "@/db/content/schema";

export async function episodeExists(id: string) {
  const [episode] = await createContentDb()
    .select({ id: episodes.id })
    .from(episodes)
    .where(and(eq(episodes.id, id), isNull(episodes.deletedAt)))
    .limit(1);
  return Boolean(episode);
}
