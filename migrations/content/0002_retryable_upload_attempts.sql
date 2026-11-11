ALTER TABLE "media_variants" ALTER COLUMN "byte_size" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "companion_upload_handoffs" ADD COLUMN "full_attempt_id" uuid;--> statement-breakpoint
ALTER TABLE "companion_upload_handoffs" ADD COLUMN "teaser_attempt_id" uuid;