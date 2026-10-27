import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

const pools = new Map<string, Pool>();

export function createContentDb(connectionString = process.env.CONTENT_DATABASE_URL) {
  if (!connectionString) throw new Error("CONTENT_DATABASE_URL is not configured");
  let pool = pools.get(connectionString);
  if (!pool) {
    pool = new Pool({ connectionString });
    pools.set(connectionString, pool);
  }
  return drizzle(pool, { schema });
}

export type ContentDb = ReturnType<typeof createContentDb>;
