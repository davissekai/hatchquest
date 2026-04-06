import type { EODimension, WorldState } from "@hatchquest/shared";

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
