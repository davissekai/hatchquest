/**
 * Project HatchQuest: Global Type Definitions
 * Single source of truth for all game state shapes.
 * Used by engine, narrative, analytics, and frontend.
 *
 * PRIVATE: ChoiceImpact lives in the backend only (choice_impacts table).
 * NEVER expose impact deltas in API responses to the client.
 */

// ─── Base Types (API Contract) ────────────────────────────────────────────────

export interface GlobalState {
  session: {
    currentNarrativeId: string;
    isStoryComplete: boolean;
  };
  resources: {
    v_capital: number;
    momentumMultiplier: number;
    reputation: number;
    network: number;
  };
  dimensions: {
    autonomy: number;
    innovativeness: number;
    proactiveness: number;
    riskTaking: number;
    competitiveAggressiveness: number;
  };
  flags: {
    hasDebt: boolean;
    hiredTeam: boolean;
    [key: string]: boolean;
  };
  history: ChoiceRecord[];
}

export interface ChoiceRecord {
  narrativeId: string;
  choiceId: string;
  capitalBefore: number;
  capitalAfter: number;
  timestamp: number;
}

export interface NarrativeBeat {
  id: string;           // e.g. "N_005"
  title: string;
  storyText: string;
  choices: PublicChoice[];
}

export interface PublicChoice {
  choiceId: string;     // e.g. "C_05A"
  label: string;
  immediateFeedback: string;
}

// ─── API Endpoints (Responses) ────────────────────────────────────────────────

export interface StartSessionResponse {
  sessionId: string;
  state: GlobalState;        // initial state with v_capital: 10000
  narrative: NarrativeBeat;  // always N_001
}

export interface SessionResponse {
  sessionId: string;
  state: GlobalState;
  narrative: NarrativeBeat;  // the current beat based on state.session.currentNarrativeId
}

export interface ChoiceResponse {
  state: GlobalState;        // updated state after applying the choice
  narrative: NarrativeBeat | null;  // the next beat to render (or null if isStoryComplete = true)
  feedback: string;          // the immediateFeedback string for the chosen option
}

export interface ResultsResponse {
  sessionId: string;
  state: GlobalState;    // final state, state.session.isStoryComplete === true
  completedAt: string;   // ISO 8601 timestamp
}

// ─── Backend / Internal Types ─────────────────────────────────────────────────

// For backwards compatibility and backend operations
export type GameState = GlobalState;
export type Dimensions = GlobalState["dimensions"];
export type Resources = GlobalState["resources"];
export type NarrativeId = string;
export type ChoiceId = string;
export type HistoryEntry = ChoiceRecord; // Used in some engine files

export interface ChoiceImpact {
  choiceId: ChoiceId;
  resourceDeltas: Partial<{
    v_capital: number;
    reputation: number;
    network: number;
    momentumMultiplier: number;
  }>;
  dimensionDeltas: Partial<Dimensions>;
  flagUpdates: Record<string, boolean>;
}

export interface Choice {
  id: ChoiceId; // In DB it's "id"
  label: string;
  immediateFeedback: string;
  nextBeatId?: NarrativeId | null;
}
