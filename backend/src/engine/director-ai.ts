import type { EODimension, WorldState } from "@hatchquest/shared";
import type { RegisteredSkeleton } from "../skeletons/registry.js";

/**
 * Scenario theme — used to compute context-sensitive weight multipliers.
 * Kept here (not in skeleton types) because it is a Director AI concern.
 */
export type NodeTheme =
  | "financing"
  | "competition"
  | "crisis"
  | "branding"
  | "hiring"
  | "networking"
  | "operations"
  | "general";

/**
 * Full scenario node shape — used by selectNextNode (legacy weighted selector).
 * Kept for backward compat with director-ai tests while selectNextSkeleton is the
 * production path. Removed when old content is fully migrated.
 */
export interface ScenarioNodeFull {
  id: string;
  layer: number;
  theme: NodeTheme;
  baseWeight: number;
  eoTargetDimensions: EODimension[];
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
 * Returns true if the world state satisfies all hard eligibility conditions on the node.
 * A node with no conditions is always eligible.
 */
export function passesConditions(
  node: ScenarioNodeFull,
  state: WorldState
): boolean {
  const c = node.conditions;
  if (!c) return true;
  if (c.capitalMin !== undefined && state.capital < c.capitalMin) return false;
  if (c.capitalMax !== undefined && state.capital > c.capitalMax) return false;
  if (c.reputationMin !== undefined && state.reputation < c.reputationMin) return false;
  if (c.reputationMax !== undefined && state.reputation > c.reputationMax) return false;
  if (c.debtMin !== undefined && state.debt < c.debtMin) return false;
  if (c.debtMax !== undefined && state.debt > c.debtMax) return false;
  if (c.requiresMentorAccess && !state.mentorAccess) return false;
  if (c.requiresPremises && !state.hasPremises) return false;
  if (c.employeeCountMin !== undefined && state.employeeCount < c.employeeCountMin) return false;
  return true;
}

/**
 * Returns the theme multiplier for a node given the current world state.
 * Centralizes all world-state-to-theme mappings — nodes only carry a tag.
 * Capped at 4.0 to prevent runaway weights making draws deterministic.
 */
export function computeThemeAffinity(theme: NodeTheme, state: WorldState): number {
  let multiplier = 1.0;

  switch (theme) {
    case "financing":
      if (state.capital < 3_000) multiplier = 3.0;
      else if (state.capital < 6_000) multiplier = 1.5;
      break;
    case "competition":
      if (state.competitorAggression > 60) multiplier = 2.0;
      break;
    case "crisis":
      if (state.debt > 5_000) multiplier = 2.5;
      break;
    case "branding":
      if (state.reputation < 20) multiplier = 1.5;
      break;
    case "hiring":
      if (state.revenue > 500 && state.employeeCount < 2) multiplier = 2.0;
      break;
    case "networking":
      if (state.networkStrength < 20) multiplier = 1.5;
      break;
    case "operations":
      if (state.hasPremises) multiplier = 1.5;
      break;
    case "general":
    default:
      multiplier = 1.0;
  }

  return Math.min(multiplier, 4.0);
}

/**
 * Returns the EO affinity multiplier for a node given the current world state.
 * Layers 1–2: match — strong EO dimensions score higher (divergence phase).
 * Layers 3–5: challenge — weak EO dimensions score higher (assessment phase).
 * Returns a value in [1.0, 2.0].
 */
export function computeEOAffinity(
  node: ScenarioNodeFull,
  state: WorldState
): number {
  if (node.eoTargetDimensions.length === 0) return 1.0;

  const isLateGame = state.layer >= 3;

  const scores = node.eoTargetDimensions.map((dim) => {
    const playerValue = state.eoProfile[dim]; // [0, 10]
    return isLateGame
      ? (10 - playerValue) / 10  // challenge: weak dims score higher
      : playerValue / 10;         // match: strong dims score higher
  });

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  return 1.0 + mean; // [1.0, 2.0]
}

/**
 * Performs a weighted random draw from a list of scored items.
 * All weights must be > 0. Caller ensures this.
 */
export function weightedDraw<T>(
  items: { item: T; weight: number }[],
  rng: () => number
): T {
  const total = items.reduce((sum, { weight }) => sum + weight, 0);
  let cursor = rng() * total;

  for (const { item, weight } of items) {
    cursor -= weight;
    if (cursor <= 0) return item;
  }

  // Rounding fallback — should not be reached with valid weights
  return items[items.length - 1].item;
}

/**
 * Selects the next scenario node from the candidate pool based on world state.
 * 1. Filters to nodes in the correct next layer
 * 2. Filters by hard eligibility conditions
 * 3. Scores each: baseWeight × themeAffinity × eoAffinity
 * 4. Weighted random draw using provided PRNG
 * Falls back to full layer pool if all candidates fail conditions.
 * Returns null only if no nodes exist for the next layer.
 */
export function selectNextNode(
  state: WorldState,
  allNodes: ScenarioNodeFull[],
  rng: () => number
): ScenarioNodeFull | null {
  const nextLayer = state.layer + 1;
  if (nextLayer > 10) return null;

  const layerNodes = allNodes.filter((n) => n.layer === nextLayer);
  if (layerNodes.length === 0) return null;

  const candidates = layerNodes.filter((n) => passesConditions(n, state));

  // Fallback: if all nodes fail conditions, use the full layer pool
  const pool = candidates.length > 0 ? candidates : layerNodes;

  const scored = pool.map((node) => ({
    item: node,
    weight:
      node.baseWeight *
      computeThemeAffinity(node.theme, state) *
      computeEOAffinity(node, state),
  }));

  return weightedDraw(scored, rng);
}

// ─── Skeleton-based selection (Task 10) ──────────────────────────────────────

/**
 * EO affinity calculation that works directly with EODimension arrays.
 * Extracted so selectNextSkeleton doesn't need a ScenarioNodeFull.
 */
function computeEOAffinityFromDimensions(
  dims: EODimension[],
  state: WorldState
): number {
  if (dims.length === 0) return 1.0;
  const isLateGame = state.layer >= 3;
  const scores = dims.map((dim) => {
    const playerValue = state.eoProfile[dim];
    return isLateGame ? (10 - playerValue) / 10 : playerValue / 10;
  });
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  return 1.0 + mean;
}

/**
 * Checks hard eligibility conditions on a skeleton — same logic as passesConditions
 * but operates on ScenarioSkeleton.conditions rather than ScenarioNodeFull.conditions.
 */
function skeletonPassesConditions(
  entry: RegisteredSkeleton,
  state: WorldState
): boolean {
  const c = entry.skeleton.conditions;
  if (!c) return true;
  if (c.capitalMin !== undefined && state.capital < c.capitalMin) return false;
  if (c.capitalMax !== undefined && state.capital > c.capitalMax) return false;
  if (c.reputationMin !== undefined && state.reputation < c.reputationMin) return false;
  if (c.reputationMax !== undefined && state.reputation > c.reputationMax) return false;
  if (c.debtMin !== undefined && state.debt < c.debtMin) return false;
  if (c.debtMax !== undefined && state.debt > c.debtMax) return false;
  if (c.requiresMentorAccess && !state.mentorAccess) return false;
  if (c.requiresPremises && !state.hasPremises) return false;
  if (c.employeeCountMin !== undefined && state.employeeCount < c.employeeCountMin) return false;
  return true;
}

/**
 * Selects the next scenario skeleton from the pool based on world state.
 * Same algorithm as selectNextNode but operates on RegisteredSkeleton[] directly.
 * Falls back to full layer pool if all candidates fail conditions.
 * Returns null if no skeletons exist for the next layer.
 */
export function selectNextSkeleton(
  state: WorldState,
  allEntries: RegisteredSkeleton[],
  rng: () => number
): RegisteredSkeleton | null {
  const nextLayer = state.layer + 1;
  if (nextLayer > 10) return null;

  const layerEntries = allEntries.filter((e) => e.skeleton.layer === nextLayer);
  if (layerEntries.length === 0) return null;

  const eligible = layerEntries.filter((e) => skeletonPassesConditions(e, state));
  const pool = eligible.length > 0 ? eligible : layerEntries;

  const scored = pool.map((entry) => ({
    item: entry,
    weight:
      entry.skeleton.baseWeight *
      computeThemeAffinity(entry.skeleton.theme as NodeTheme, state) *
      computeEOAffinityFromDimensions(entry.skeleton.eoTargetDimensions, state),
  }));

  return weightedDraw(scored, rng);
}
