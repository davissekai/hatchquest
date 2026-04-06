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
    sector: worldState.sector,
    employeeCount: worldState.employeeCount,
    businessFormality: worldState.businessFormality,
    hasBackupPower: worldState.hasBackupPower,
    hasPremises: worldState.hasPremises,
    susuMember: worldState.susuMember,
    mentorAccess: worldState.mentorAccess,
  };
}
