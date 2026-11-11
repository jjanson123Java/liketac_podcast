import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const episodeAccess = pgEnum("episode_access", ["public", "subscriber"]);
export const episodeStatus = pgEnum("episode_status", ["draft", "published", "unpublished"]);
export const mediaKind = pgEnum("media_kind", ["audio", "video", "teaser", "captions", "transcript"]);

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const episodes = pgTable("episodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").notNull().references(() => categories.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  status: episodeStatus("status").notNull().default("draft"),
  accessLevel: episodeAccess("access_level").notNull().default("subscriber"),
  isStartHere: boolean("is_start_here").notNull().default(false),
  isCurrent: boolean("is_current").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [index("episodes_category_idx").on(table.categoryId)]);

export const mediaVariants = pgTable("media_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id),
  kind: mediaKind("kind").notNull(),
  objectKey: text("object_key").notNull(),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  durationSeconds: integer("duration_seconds"),
  originalFilename: text("original_filename"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("media_variants_episode_idx").on(table.episodeId),
  uniqueIndex("media_variants_object_key_idx").on(table.objectKey),
]);

export const companionUploadHandoffs = pgTable("companion_upload_handoffs", {
  id: uuid("id").defaultRandom().primaryKey(),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id),
  adminUserId: uuid("admin_user_id").notNull(),
  secretHash: text("secret_hash").notNull().unique(),
  fullRole: text("full_role"),
  fullClaimedAt: timestamp("full_claimed_at", { withTimezone: true }),
  fullCompletedAt: timestamp("full_completed_at", { withTimezone: true }),
  teaserClaimedAt: timestamp("teaser_claimed_at", { withTimezone: true }),
  teaserCompletedAt: timestamp("teaser_completed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("companion_upload_handoffs_episode_idx").on(table.episodeId),
  index("companion_upload_handoffs_expiry_idx").on(table.expiresAt),
]);
