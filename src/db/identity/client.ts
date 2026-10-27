import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

export function createIdentityDb(connectionString = process.env.IDENTITY_DATABASE_URL) {
  if (!connectionString) throw new Error("IDENTITY_DATABASE_URL is not configured");
  return drizzle(neon(connectionString), { schema });
}

export type IdentityDb = ReturnType<typeof createIdentityDb>;
