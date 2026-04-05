/**
 * Project HatchQuest: Global Type Definitions
 * Single source of truth for all game state shapes.
 * Used by engine, narrative, analytics, and frontend.
 *
 * PRIVATE: ChoiceImpact lives in the backend only (choice_impacts table).
 * NEVER expose impact deltas in API responses to the client.
 */

// ─── Primitives ───────────────────────────────────────────────────────────────

export type NarrativeId = string;
export type ChoiceId = string;

// ─── EO Dimensions ────────────────────────────────────────────────────────────

export interface Dimensions {
  autonomy: number;
  innovativeness: number;
  proactiveness: number;
  riskTaking: number;
  competitiveAggressiveness: number;
}

// ─── Resources ────────────────────────────────────────────────────────────────

export interface Resources {
  capital: number;           // Starting: GHS 10,000
  reputation: number;        // Scale: 0–100
  network: number;           // Scale: 0–100
  momentumMultiplier: number; // Compounds resource changes
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  narrativeId: NarrativeId;
  choiceId: ChoiceId;
}

// ─── Game State ───────────────────────────────────────────────────────────────

export interface GameState {
  session: {
    playerId: string;
    currentNarrativeId: NarrativeId;
    isStoryComplete: boolean;
    history: HistoryEntry[];  // Full path: every beat visited + choice made
  };
  resources: Resources;
  dimensions: Dimensions;
  flags: {
    hasDebt: boolean;
    hiredTeam: boolean;
    [key: string]: boolean;   // Dynamic story flags
  };
}

// ─── Narrative (Public) ───────────────────────────────────────────────────────

export interface Choice {
  choiceId: ChoiceId;
  label: string;
  immediateFeedback: string;
  nextNarrativeId?: NarrativeId; // Overrides default progression if set
}

export interface NarrativeBeat {
  id: NarrativeId;
  title: string;
  storyText: string;
  choices: Choice[];
}

// ─── Private (Backend Only — never sent to client) ────────────────────────────

export interface ChoiceImpact {
  choiceId: ChoiceId;
  resourceDeltas: Partial<Resources>;    // e.g. { capital: -2000, reputation: 1 }
  dimensionDeltas: Partial<Dimensions>;  // e.g. { innovativeness: 0.2 }
  flagUpdates: Record<string, boolean>;  // e.g. { hired_first_employee: true }
}

// ─── API Response Shapes (what the client actually receives) ──────────────────

export interface SessionResponse {
  beat: NarrativeBeat;
  state: Omit<GameState, 'dimensions'>; // EO scores hidden during gameplay
}

export interface ChoiceResponse {
  nextBeat: NarrativeBeat;
  updatedState: Omit<GameState, 'dimensions'>;
  feedback: string;
}

export interface ResultsResponse {
  finalState: GameState; // dimensions revealed only on results page
  summary: string;
}
