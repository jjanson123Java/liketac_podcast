import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/identity/schema.ts",
  out: "./migrations/identity",
  dbCredentials: { url: process.env.IDENTITY_DATABASE_URL ?? "postgresql://placeholder/identity" },
});
