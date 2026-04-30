CREATE TABLE "choice_effects" (
	"node_id" text NOT NULL,
	"choice_index" smallint NOT NULL,
	"capital" integer DEFAULT 0 NOT NULL,
	"revenue" integer DEFAULT 0 NOT NULL,
	"debt" integer DEFAULT 0 NOT NULL,
	"monthly_burn" integer DEFAULT 0 NOT NULL,
	"reputation" integer DEFAULT 0 NOT NULL,
	"network_strength" integer DEFAULT 0 NOT NULL,
	"eo_deltas" jsonb DEFAULT '{}' NOT NULL,
	"flags" jsonb,
	CONSTRAINT "choice_effects_node_id_choice_index_pk" PRIMARY KEY("node_id","choice_index")
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid,
	"world_state" jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"layer0_q1_response" text,
	"layer0_q2_prompt" text,
	"layer0_q2_response" text,
	"player_context" jsonb,
	"story_memory" jsonb,
	"generated_current_node" jsonb,
	"generated_current_node_id" text,
	"generated_current_node_created_at" timestamp with time zone,
	"narration_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"player_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "scenario_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"layer" integer NOT NULL,
	"narrative" text NOT NULL,
	"choices" jsonb NOT NULL,
	"theme" text NOT NULL,
	"base_weight" real DEFAULT 1 NOT NULL,
	"eo_target_dimensions" text[] DEFAULT '{}' NOT NULL,
	"conditions" jsonb
);
--> statement-breakpoint
ALTER TABLE "choice_effects" ADD CONSTRAINT "choice_effects_node_id_scenario_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."scenario_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;