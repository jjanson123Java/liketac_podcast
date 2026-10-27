import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { categories, episodes, mediaVariants } from "./schema";

describe("content database schema", () => {
  it("models categories and publishable episodes without identity foreign keys", () => {
    expect(getTableConfig(categories).columns.map((column) => column.name)).toEqual(
      expect.arrayContaining(["name", "slug", "sort_order", "deleted_at"]),
    );
    expect(getTableConfig(episodes).columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        "category_id",
        "slug",
        "published_at",
        "is_start_here",
        "is_current",
        "access_level",
        "deleted_at",
      ]),
    );
  });

  it("stores only media metadata and object keys", () => {
    const columns = getTableConfig(mediaVariants).columns.map((column) => column.name);
    expect(columns).toEqual(
      expect.arrayContaining(["episode_id", "kind", "object_key", "mime_type", "duration_seconds"]),
    );
    expect(columns).not.toContain("media_bytes");
  });
});
