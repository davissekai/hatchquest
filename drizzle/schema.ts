import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

// --- Narratives Table ---
// Stores all 30 NarrativeBeat definitions for the simulation
export const narratives = pgTable("narratives", {
    id: text("id").primaryKey(),           // e.g. "N_001"
    title: text("title").notNull(),
    storyText: text("story_text").notNull(),
    choices: jsonb("choices").notNull(),   // Choice[] serialized as JSON
});

// --- Sessions Table ---
// Stores each player's full game state (persisted between sessions)
export const sessions = pgTable("sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    gameState: jsonb("game_state").notNull(), // Full GameState object
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
