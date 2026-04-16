import type { WorldState } from "@hatchquest/shared";
import { WORLD_EVENT_POOL } from "../content/world-events.js";

// Clamp helper
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Sigmoid-bounded update: moves x toward target with drift, bounded by [0,100]
function sigmoidStep(x: number, drift: number): number {
  const raw = x + drift;
  // Soft boundary: pull toward midpoint when near extremes
  const pull = (50 - raw) * 0.05;
  return clamp(raw + pull, 0, 100);
}

/**
 * Propagates world stocks each turn: marketDemand, competitorAggression, infrastructureReliability.
 * Small random drift keeps the world alive without destabilising the game.
 */
export function propagateWorldStocks(
  state: WorldState,
  rng: () => number
): WorldState {
  const drift = () => (rng() - 0.5) * 6; // [-3, +3] drift per stock per turn

  return {
    ...state,
    marketDemand: sigmoidStep(state.marketDemand, drift()),
    competitorAggression: sigmoidStep(state.competitorAggression, drift()),
    infrastructureReliability: sigmoidStep(state.infrastructureReliability, drift()),
  };
}

/**
 * Weighted draw from the eligible world event pool. Returns null if no events are eligible.
 * At most 1 event fires per turn. Base weight is 1.0 for all events.
 */
export function drawWorldEvent(
  state: WorldState,
  rng: () => number
): { eventId: string; label: string; narrativeHook: string } | null {
  const eligible = WORLD_EVENT_POOL.filter((e) => e.eligible(state));
  if (eligible.length === 0) return null;

  // Uniform weight — all eligible events equally likely
  const total = eligible.length;
  const pick = Math.floor(rng() * total);
  const chosen = eligible[pick];
  if (!chosen) return null;

  return {
    eventId: chosen.event.id,
    label: chosen.event.label,
    narrativeHook: chosen.event.narrativeHook,
  };
}

/**
 * Applies the mechanical effects of a fired world event to the world state.
 * Each event has defined numeric deltas — applied here, not in the event definition.
 */
export function applyWorldEvent(
  state: WorldState,
  eventId: string
): WorldState {
  switch (eventId) {
    case "ecg_outage":
      return { ...state, infrastructureReliability: clamp(state.infrastructureReliability - 15, 0, 100) };
    case "competitor_funded":
      return { ...state, competitorAggression: clamp(state.competitorAggression + 25, 0, 100) };
    case "cedi_weakened":
      return { ...state, monthlyBurn: state.monthlyBurn + 200 };
    case "bog_rate_cut":
      return { ...state, capitalAccessOpen: true };
    case "supplier_strike":
      return {
        ...state,
        monthlyBurn: state.monthlyBurn + 300,
        infrastructureReliability: clamp(state.infrastructureReliability - 10, 0, 100),
      };
    case "tech_talent_shortage":
      return {
        ...state,
        reputation: clamp(state.reputation - 5, 0, 100),
        hiringDifficulty: clamp(state.hiringDifficulty + 20, 0, 100),
      };
    case "viral_customer_post":
      return { ...state, marketDemand: clamp(state.marketDemand + 15, 0, 100) };
    case "regulatory_audit":
      return { ...state, monthlyBurn: state.monthlyBurn + 400, underAudit: true };
    case "competitor_scandal":
      return { ...state, competitorAggression: clamp(state.competitorAggression - 20, 0, 100) };
    case "vc_roadshow_season":
      return { ...state, vcWindowOpen: true };
    default:
      return state;
  }
}
