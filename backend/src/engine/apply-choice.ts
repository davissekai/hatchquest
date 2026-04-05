import type { EODimension, WorldState } from "@hatchquest/shared";

// Defines how a single choice modifies the world state.
// Each scenario node's choices carry one of these.
export interface ChoiceEffect {
  capital: number; // Delta to capital (can be negative)
  revenue: number; // Delta to monthly revenue
  debt: number; // Delta to debt
  monthlyBurn: number; // Delta to monthly burn
  reputation: number; // Delta to reputation [0–100]
  networkStrength: number; // Delta to network strength [0–100]
  eoDeltas: Partial<Record<EODimension, number>>; // EO dimension shifts
  flags?: Partial<{
    hasBackupPower: boolean;
    hasPremises: boolean;
    susuMember: boolean;
    mentorAccess: boolean;
  }>;
}

// Clamp a number to [min, max]
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Applies a choice's effects to the current world state.
// Returns a new WorldState — never mutates the input.
export function applyChoice(
  state: WorldState,
  effect: ChoiceEffect,
  nextNodeId: string
): WorldState {
  // Apply EO deltas with [0, 10] clamping
  const eoProfile = { ...state.eoProfile };
  for (const [dim, delta] of Object.entries(effect.eoDeltas)) {
    const key = dim as EODimension;
    eoProfile[key] = clamp(eoProfile[key] + delta, 0, 10);
  }

  return {
    ...state,

    // Meta
    currentNodeId: nextNodeId,
    turnsElapsed: state.turnsElapsed + 1,

    // Financial
    capital: state.capital + effect.capital,
    revenue: state.revenue + effect.revenue,
    debt: state.debt + effect.debt,
    monthlyBurn: state.monthlyBurn + effect.monthlyBurn,

    // Social
    reputation: clamp(state.reputation + effect.reputation, 0, 100),
    networkStrength: clamp(state.networkStrength + effect.networkStrength, 0, 100),

    // Boolean flags — only override if explicitly set
    hasBackupPower: effect.flags?.hasBackupPower ?? state.hasBackupPower,
    hasPremises: effect.flags?.hasPremises ?? state.hasPremises,
    susuMember: effect.flags?.susuMember ?? state.susuMember,
    mentorAccess: effect.flags?.mentorAccess ?? state.mentorAccess,

    // EO
    eoProfile,
  };
}
