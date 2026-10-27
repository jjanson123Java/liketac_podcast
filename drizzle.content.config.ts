import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/content/schema.ts",
  out: "./migrations/content",
  dbCredentials: { url: process.env.CONTENT_DATABASE_URL ?? "postgresql://placeholder/content" },
});
