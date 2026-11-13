ALTER TABLE "episodes" ADD COLUMN "is_free_classification" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "episodes" ADD COLUMN "is_non_technical" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "episodes" ADD COLUMN "is_beginner" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "episodes" ADD COLUMN "is_seriously" boolean DEFAULT false NOT NULL;