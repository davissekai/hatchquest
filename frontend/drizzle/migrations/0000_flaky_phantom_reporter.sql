CREATE TABLE "choice_impacts" (
	"choice_id" text PRIMARY KEY NOT NULL,
	"capital_delta" real DEFAULT 0 NOT NULL,
	"reputation_delta" real DEFAULT 0 NOT NULL,
	"network_delta" real DEFAULT 0 NOT NULL,
	"momentum_delta" real DEFAULT 0 NOT NULL,
	"autonomy_delta" real DEFAULT 0 NOT NULL,
	"innovativeness_delta" real DEFAULT 0 NOT NULL,
	"proactiveness_delta" real DEFAULT 0 NOT NULL,
	"risk_taking_delta" real DEFAULT 0 NOT NULL,
	"competitive_aggressiveness_delta" real DEFAULT 0 NOT NULL,
	"flag_updates" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"state" jsonb NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"acumen_score" real,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "narrative_beats" (
	"id" text PRIMARY KEY NOT NULL,
	"round" integer NOT NULL,
	"title" text NOT NULL,
	"story_text" text NOT NULL,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "narrative_choices" (
	"id" text PRIMARY KEY NOT NULL,
	"beat_id" text NOT NULL,
	"label" text NOT NULL,
	"immediate_feedback" text NOT NULL,
	"next_beat_id" text
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "players_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "choice_impacts" ADD CONSTRAINT "choice_impacts_choice_id_narrative_choices_id_fk" FOREIGN KEY ("choice_id") REFERENCES "public"."narrative_choices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "narrative_choices" ADD CONSTRAINT "narrative_choices_beat_id_narrative_beats_id_fk" FOREIGN KEY ("beat_id") REFERENCES "public"."narrative_beats"("id") ON DELETE cascade ON UPDATE no action;