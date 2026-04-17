import type { ClientWorldState, WorldState } from "@hatchquest/shared";

/**
 * Builds up to 2 short, human-readable secondary signals from active world flags.
 * Selection is deterministic on turnsElapsed so successive polls within a turn
 * return the same strip (no flicker), but the order rotates turn-over-turn so
 * the player sees different context over a full run.
 */
export function pickSecondarySignals(state: WorldState): string[] {
  const active: string[] = [];
  if (state.capitalAccessOpen) active.push("Capital access open");
  if (state.underAudit) active.push("Under audit");
  if (state.vcWindowOpen) active.push("VC window open");
  if (state.hiringDifficulty > 60) active.push("Hiring market tight");
  if (state.debt > 5_000) active.push("Debt pressure");

  // Rotate deterministically by turnsElapsed so the strip is stable per-turn
  // but the order cycles across turns — no RNG needed.
  const offset = state.turnsElapsed % Math.max(1, active.length);
  const rotated = [...active.slice(offset), ...active.slice(0, offset)];
  return rotated.slice(0, 2);
}

/**
 * Strips server-only fields from a WorldState to produce a ClientWorldState.
 * eoProfile is revealed only on the results page — never during gameplay.
 * Environment variables (marketDemand, infrastructureReliability, etc.) are
 * Director AI internals and must not be exposed to the client.
 */
export function toClientState(worldState: WorldState): ClientWorldState {
  return {
    capital: worldState.capital,
    monthlyBurn: worldState.monthlyBurn,
    revenue: worldState.revenue,
    debt: worldState.debt,
    reputation: worldState.reputation,
    networkStrength: worldState.networkStrength,
    layer: worldState.layer,
    turnsElapsed: worldState.turnsElapsed,
    isComplete: worldState.isComplete,
    // playerBusinessName surfaces the player's business label for the HUD.
    // Full playerContext (motivation, raw responses) stays server-side.
    playerBusinessName: worldState.playerContext?.businessLabel ?? null,
    employeeCount: worldState.employeeCount,
    businessFormality: worldState.businessFormality,
    hasBackupPower: worldState.hasBackupPower,
    hasPremises: worldState.hasPremises,
    susuMember: worldState.susuMember,
    mentorAccess: worldState.mentorAccess,
    worldSignals: {
      marketHeat: worldState.marketDemand,
      competitorThreat: worldState.competitorAggression,
      infrastructureStability: worldState.infrastructureReliability,
      lastEventLabel:
        worldState.worldEventHistory.length > 0
          ? worldState.worldEventHistory[worldState.worldEventHistory.length - 1]?.label ?? null
          : null,
      secondarySignals: pickSecondarySignals(worldState),
    },
  };
}
