import type { ClientWorldState, WorldState } from "@hatchquest/shared";

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
    // playerBusinessName surfaces the player's business description for the HUD.
    // Full playerContext (motivation, raw responses) stays server-side.
    playerBusinessName: worldState.playerContext?.businessDescription ?? null,
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
    },
  };
}
