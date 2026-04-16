import type { EODimension } from "./game.js";

/**
 * A choice archetype — the EO-valid structure of a choice without player-specific text.
 * The Narrator AI reads this and generates personalised choice text for each player.
 */
export interface ChoiceArchetype {
  /** Which EO pole this choice reveals (e.g., "risk-tolerant", "people-first") */
  eoPoleSignal: string;
  /** Short description of what this choice type represents — guides the Narrator AI */
  archetypeDescription: string;
  /** The structural tension this choice embodies */
  tensionAxis: string;
}

/**
 * A scenario skeleton — the pre-written, EO-valid structure of a game scenario.
 * Contains no player-specific narrative. The Narrator AI skins this with
 * playerContext to produce a ScenarioNode for the client.
 */
export interface ScenarioSkeleton {
  id: string;
  layer: number;
  /** Thematic category — used by Director AI for world-state affinity scoring */
  theme: string;
  /** Base selection weight for Director AI weighted draw */
  baseWeight: number;
  /** Which EO dimensions this scenario is designed to test */
  eoTargetDimensions: EODimension[];
  /** Abstract scenario situation — guides the Narrator AI without player-specific detail */
  situationSeed: string;
  /** The three choice archetypes — Narrator AI generates player-specific text for each */
  choiceArchetypes: [ChoiceArchetype, ChoiceArchetype, ChoiceArchetype];
  /** Hard eligibility conditions checked before the Director AI can select this skeleton */
  conditions?: {
    capitalMin?: number;
    capitalMax?: number;
    reputationMin?: number;
    reputationMax?: number;
    debtMin?: number;
    debtMax?: number;
    requiresMentorAccess?: boolean;
    requiresPremises?: boolean;
    employeeCountMin?: number;
  };
}

/**
 * The AI-generated narrative skin for a specific player.
 * Produced by the Narrator AI from a ScenarioSkeleton + PlayerContext.
 */
export interface NarrativeSkin {
  /** The full narrative paragraph shown to the player */
  narrative: string;
  /** Three player-specific choice texts */
  choices: [string, string, string];
  /** Three tension hints — describe the dilemma without labelling EO dimensions */
  tensionHints: [string, string, string];
}
