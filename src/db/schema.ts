import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  boolean,
  jsonb,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { GameState } from "@/types/game";

// ─── players ──────────────────────────────────────────────────────────────────

export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── game_sessions ────────────────────────────────────────────────────────────
// state is stored as a JSON blob — one read/write per turn, no joins needed.

export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  state: jsonb("state").$type<GameState>().notNull(),
  isComplete: boolean("is_complete").default(false).notNull(),
  acumenScore: real("acumen_score"),         // null until game ends
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ─── narrative_beats ──────────────────────────────────────────────────────────
// Seeded by narrative-agent. Read-only at runtime.

export const narrativeBeats = pgTable("narrative_beats", {
  id: text("id").primaryKey(),              // e.g. "beat_00", "beat_01"
  round: integer("round").notNull(),         // 0 = preamble, 1-3 = rounds
  title: text("title").notNull(),
  storyText: text("story_text").notNull(),
  orderIndex: integer("order_index").notNull(), // position within round
});

// ─── narrative_choices ────────────────────────────────────────────────────────
// The public-facing choices for each beat. Safe to expose to client.

export const narrativeChoices = pgTable("narrative_choices", {
  id: text("id").primaryKey(),              // e.g. "choice_01a"
  beatId: text("beat_id")
    .notNull()
    .references(() => narrativeBeats.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  immediateFeedback: text("immediate_feedback").notNull(),
  nextBeatId: text("next_beat_id"),         // null = default progression
});

// ─── choice_impacts ───────────────────────────────────────────────────────────
// PRIVATE — backend only. Never exposed in API responses to client.
// RLS: no public access.

export const choiceImpacts = pgTable("choice_impacts", {
  choiceId: text("choice_id")
    .primaryKey()
    .references(() => narrativeChoices.id, { onDelete: "cascade" }),
  capitalDelta: real("capital_delta").default(0).notNull(),
  reputationDelta: real("reputation_delta").default(0).notNull(),
  networkDelta: real("network_delta").default(0).notNull(),
  momentumDelta: real("momentum_delta").default(0).notNull(),
  autonomyDelta: real("autonomy_delta").default(0).notNull(),
  innovativenessDelta: real("innovativeness_delta").default(0).notNull(),
  proactivenessDelta: real("proactiveness_delta").default(0).notNull(),
  riskTakingDelta: real("risk_taking_delta").default(0).notNull(),
  competitiveAggressivenessDelta: real("competitive_aggressiveness_delta").default(0).notNull(),
  flagUpdates: jsonb("flag_updates").$type<Record<string, boolean>>().default({}).notNull(),
});
