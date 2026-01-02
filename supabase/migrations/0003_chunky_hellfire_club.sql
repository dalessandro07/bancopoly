ALTER TABLE "player" ADD COLUMN "is_system_player" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "system_player_type" text;