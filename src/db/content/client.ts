import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

export function createContentDb(connectionString = process.env.CONTENT_DATABASE_URL) {
  if (!connectionString) throw new Error("CONTENT_DATABASE_URL is not configured");
  return drizzle(neon(connectionString), { schema });
}

export type ContentDb = ReturnType<typeof createContentDb>;
