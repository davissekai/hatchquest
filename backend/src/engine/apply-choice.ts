import type { EODimension, RecentChoice, WorldState } from "@hatchquest/shared";

// Defines how a single choice modifies the world state.
export interface ChoiceEffect {
  capital: number;
  revenue: number;
  debt: number;
  monthlyBurn: number;
  reputation: number;
  networkStrength: number;
  eoDeltas: Partial<Record<EODimension, number>>;
  flags?: Partial<{
    hasBackupPower: boolean;
    hasPremises: boolean;
    susuMember: boolean;
    mentorAccess: boolean;
  }>;
}

// Clamps a number to [min, max].
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Max length of choiceHistory kept on WorldState.
const MAX_CHOICE_HISTORY = 3;
// Max length of recentPatterns kept on WorldState.
const MAX_RECENT_PATTERNS = 2;

/**
 * Builds a short human-readable summary of a choice's effect deltas.
 * Shown back to the Narrator AI as a continuity callback on the next turn,
 * so the grammar is natural ("-2k capital, +6 rep") rather than structured JSON.
 */
export function buildEffectSummary(effect: ChoiceEffect): string {
  const parts: string[] = [];
  const fmtK = (n: number): string => {
    if (Math.abs(n) >= 1000) {
      const k = n / 1000;
      return `${k > 0 ? "+" : ""}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
    }
    return `${n > 0 ? "+" : ""}${n}`;
  };
  if (effect.capital !== 0) parts.push(`${fmtK(effect.capital)} capital`);
  if (effect.revenue !== 0) parts.push(`${fmtK(effect.revenue)} revenue`);
  if (effect.debt !== 0) parts.push(`${fmtK(effect.debt)} debt`);
  if (effect.reputation !== 0) {
    parts.push(`${effect.reputation > 0 ? "+" : ""}${effect.reputation} rep`);
  }
  if (effect.networkStrength !== 0) {
    parts.push(
      `${effect.networkStrength > 0 ? "+" : ""}${effect.networkStrength} network`
    );
  }
  return parts.length > 0 ? parts.join(", ") : "no material change";
}

/**
 * Metadata about the choice the player just made — used to update
 * choiceHistory and recentPatterns on the world state.
 */
export interface ChoiceMeta {
  nodeId: string;
  choiceLabel: string;
  narrativePattern?: string;
}

/**
 * Applies a choice's effects to the world state — financial, social, EO, and boolean flags.
 * Does NOT update currentNodeId or turnsElapsed; those are routing concerns set by applyChoice.
 * Returns a new WorldState — never mutates the input.
 */
export function applyEffect(state: WorldState, effect: ChoiceEffect): WorldState {
  const eoProfile = { ...state.eoProfile };
  for (const [dim, delta] of Object.entries(effect.eoDeltas)) {
    const key = dim as EODimension;
    eoProfile[key] = clamp(eoProfile[key] + delta, 0, 10);
  }

  return {
    ...state,
    capital: state.capital + effect.capital,
    revenue: state.revenue + effect.revenue,
    debt: state.debt + effect.debt,
    monthlyBurn: state.monthlyBurn + effect.monthlyBurn,
    reputation: clamp(state.reputation + effect.reputation, 0, 100),
    networkStrength: clamp(state.networkStrength + effect.networkStrength, 0, 100),
    hasBackupPower: effect.flags?.hasBackupPower ?? state.hasBackupPower,
    hasPremises: effect.flags?.hasPremises ?? state.hasPremises,
    susuMember: effect.flags?.susuMember ?? state.susuMember,
    mentorAccess: effect.flags?.mentorAccess ?? state.mentorAccess,
    eoProfile,
  };
}

/**
 * Applies a choice and advances the routing meta (currentNodeId, turnsElapsed).
 * Calls applyEffect internally — the only function that needs nextNodeId.
 * Returns a new WorldState — never mutates the input.
 */
export function applyChoice(
  state: WorldState,
  effect: ChoiceEffect,
  nextNodeId: string
): WorldState {
  return {
    ...applyEffect(state, effect),
    currentNodeId: nextNodeId,
    turnsElapsed: state.turnsElapsed + 1,
  };
}

/**
 * Records a played choice onto WorldState — prepends a RecentChoice to
 * choiceHistory (trimmed to MAX_CHOICE_HISTORY) and the narrativePattern
 * (if defined) to recentPatterns (trimmed to MAX_RECENT_PATTERNS).
 * Never mutates the input; returns a new WorldState.
 *
 * Called after applyEffect so the effectSummary reflects what actually shifted.
 */
export function recordChoiceOnState(
  state: WorldState,
  effect: ChoiceEffect,
  meta: ChoiceMeta
): WorldState {
  const entry: RecentChoice = {
    nodeId: meta.nodeId,
    choiceLabel: meta.choiceLabel,
    effectSummary: buildEffectSummary(effect),
  };
  const choiceHistory = [entry, ...state.choiceHistory].slice(
    0,
    MAX_CHOICE_HISTORY
  );
  const recentPatterns = meta.narrativePattern
    ? [meta.narrativePattern, ...state.recentPatterns].slice(
        0,
        MAX_RECENT_PATTERNS
      )
    : state.recentPatterns;
  return { ...state, choiceHistory, recentPatterns };
}
