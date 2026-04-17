import {
  pgTable,
  uuid,
  text,
  jsonb,
  integer,
  smallint,
  real,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type {
  Choice,
  NarrationSource,
  NarrativeSkin,
  PlayerContext,
  SessionStatus,
  StoryMemory,
  WorldState,
} from "@hatchquest/shared";

// Players — one row per registered user. player_id FK in game_sessions.
export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  playerName: text("player_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Game sessions — one row per play-through. world_state is the full WorldState blob.
export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable: auth not wired for demo phase — service role bypasses RLS anyway
  playerId: uuid("player_id").references(() => players.id, { onDelete: "cascade" }),
  worldState: jsonb("world_state").$type<WorldState>().notNull(),
  status: text("status").$type<SessionStatus>().notNull().default("active"),
  layer0Q1Response: text("layer0_q1_response"),
  layer0Q2Prompt: text("layer0_q2_prompt"),
  layer0Q2Response: text("layer0_q2_response"),
  playerContext: jsonb("player_context").$type<PlayerContext>(),
  storyMemory: jsonb("story_memory").$type<StoryMemory>(),
  generatedCurrentNode: jsonb("generated_current_node").$type<NarrativeSkin>(),
  generatedCurrentNodeId: text("generated_current_node_id"),
  generatedCurrentNodeCreatedAt: timestamp("generated_current_node_created_at", {
    withTimezone: true,
  }),
  narrationSource: text("narration_source").$type<NarrationSource>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// Scenario nodes — read-only from the app; populated via seed scripts.
export const scenarioNodes = pgTable("scenario_nodes", {
  id: text("id").primaryKey(),
  layer: integer("layer").notNull(),
  narrative: text("narrative").notNull(),
  choices: jsonb("choices").$type<Choice[]>().notNull(),
  theme: text("theme").notNull(),
  baseWeight: real("base_weight").notNull().default(1.0),
  // text[] — Drizzle represents as string[] in TypeScript
  eoTargetDimensions: text("eo_target_dimensions")
    .array()
    .notNull()
    .default(sql`'{}'`),
  conditions: jsonb("conditions"),
});

// Choice effects — server-side only, no public RLS. EO scoring data stays hidden.
export const choiceEffects = pgTable(
  "choice_effects",
  {
    nodeId: text("node_id")
      .notNull()
      .references(() => scenarioNodes.id, { onDelete: "cascade" }),
    choiceIndex: smallint("choice_index").notNull(),
    capital: integer("capital").notNull().default(0),
    revenue: integer("revenue").notNull().default(0),
    debt: integer("debt").notNull().default(0),
    monthlyBurn: integer("monthly_burn").notNull().default(0),
    reputation: integer("reputation").notNull().default(0),
    networkStrength: integer("network_strength").notNull().default(0),
    eoDeltas: jsonb("eo_deltas").$type<Record<string, number>>().notNull().default(sql`'{}'`),
    flags: jsonb("flags").$type<Record<string, boolean>>(),
  },
  (table) => [primaryKey({ columns: [table.nodeId, table.choiceIndex] })]
);
