/**
 * Project HatchQuest: Global Type Definitions
 * These interfaces define the "Contract" for the State Machine and UI.
 */

export type NarrativeId = string;

export interface Dimensions {
  autonomy: number;
  innovativeness: number;
  proactiveness: number;
  riskTaking: number;
  competitiveAggressiveness: number;
}

export interface Resources {
  v_capital: number;     // Baseline: GHS 100,000.00
  reputation: number;    // Scale: 0-100
  network: number;       // Scale: 0-100
  momentumMultiplier: number;
}

export interface GameState {
  session: {
    currentNarrativeId: NarrativeId;
    isStoryComplete: boolean;
    history: string[];   // Array of Choice IDs made by the player
  };
  resources: Resources;
  dimensions: Dimensions;
  flags: {
    hasDebt: boolean;
    hiredTeam: boolean;
    [key: string]: boolean; // Allows for dynamic story flags
  };
}

export interface Choice {
  choiceId: string;
  label: string;
  immediateFeedback: string;
  impact: {
    resources?: Partial<Resources>;
    dimensions?: Partial<Dimensions>;
    flags?: Record<string, boolean>;
  };
  nextNarrativeId?: NarrativeId; // Overrides default progression if present
}

export interface NarrativeBeat {
  id: NarrativeId;
  title: string;
  storyText: string;
  choices: Choice[];
}
