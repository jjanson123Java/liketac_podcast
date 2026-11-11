CREATE TABLE "companion_upload_handoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_id" uuid NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"secret_hash" text NOT NULL,
	"full_role" text,
	"full_claimed_at" timestamp with time zone,
	"full_completed_at" timestamp with time zone,
	"teaser_claimed_at" timestamp with time zone,
	"teaser_completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companion_upload_handoffs_secret_hash_unique" UNIQUE("secret_hash")
);
--> statement-breakpoint
ALTER TABLE "companion_upload_handoffs" ADD CONSTRAINT "companion_upload_handoffs_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "companion_upload_handoffs_episode_idx" ON "companion_upload_handoffs" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "companion_upload_handoffs_expiry_idx" ON "companion_upload_handoffs" USING btree ("expires_at");