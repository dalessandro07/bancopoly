CREATE TABLE "player" (
	"id" text PRIMARY KEY NOT NULL,
	"tablero_id" text NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"balance" integer DEFAULT 1500 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"tablero_id" text NOT NULL,
	"from_player_id" text,
	"to_player_id" text,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tablero" ADD COLUMN "free_parking_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tablero" ADD COLUMN "is_closed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tablero" ADD COLUMN "is_ended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_tablero_id_tablero_id_fk" FOREIGN KEY ("tablero_id") REFERENCES "public"."tablero"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_tablero_id_tablero_id_fk" FOREIGN KEY ("tablero_id") REFERENCES "public"."tablero"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_from_player_id_player_id_fk" FOREIGN KEY ("from_player_id") REFERENCES "public"."player"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_to_player_id_player_id_fk" FOREIGN KEY ("to_player_id") REFERENCES "public"."player"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_tableroId_idx" ON "player" USING btree ("tablero_id");--> statement-breakpoint
CREATE INDEX "player_userId_idx" ON "player" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transaction_tableroId_idx" ON "transaction" USING btree ("tablero_id");--> statement-breakpoint
CREATE INDEX "transaction_fromPlayerId_idx" ON "transaction" USING btree ("from_player_id");--> statement-breakpoint
CREATE INDEX "transaction_toPlayerId_idx" ON "transaction" USING btree ("to_player_id");--> statement-breakpoint
CREATE INDEX "transaction_createdAt_idx" ON "transaction" USING btree ("created_at");