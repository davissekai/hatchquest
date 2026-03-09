import { GameState, Dimensions } from "@/types/game";

// Maximum possible raw score per dimension.
// Based on highest single delta (0.7) × 29 choice beats ≈ 20.
// Realistically players hit 3–12. Ceiling of 20 maps cleanly to 0–100.
const MAX_DIMENSION_SCORE = 20;

// ─── calculateEOScores ────────────────────────────────────────────────────────

/**
 * Normalizes raw EO dimension scores to a 0–100 scale.
 * Formula: normalized = clamp((raw / MAX) * 100, 0, 100)
 *
 * Called at end of game to produce Radar Chart data.
 */
export function calculateEOScores(state: GameState): Dimensions {
  const normalize = (raw: number): number =>
    Math.min(100, Math.max(0, (raw / MAX_DIMENSION_SCORE) * 100));

  return {
    autonomy: normalize(state.dimensions.autonomy),
    innovativeness: normalize(state.dimensions.innovativeness),
    proactiveness: normalize(state.dimensions.proactiveness),
    riskTaking: normalize(state.dimensions.riskTaking),
    competitiveAggressiveness: normalize(state.dimensions.competitiveAggressiveness),
  };
}

// ─── calculateAcumenScore ─────────────────────────────────────────────────────

/**
 * Calculates the aggregate Entrepreneurial Acumen Score.
 * Simple average of the 5 normalized EO dimension scores.
 * Formula: acumen = (sum of all 5 dimensions) / 5
 *
 * @param dimensions - Already normalized Dimensions (0–100 scale)
 * @returns A number between 0 and 100
 */
export function calculateAcumenScore(dimensions: Dimensions): number {
  const sum =
    dimensions.autonomy +
    dimensions.innovativeness +
    dimensions.proactiveness +
    dimensions.riskTaking +
    dimensions.competitiveAggressiveness;

  return Math.round((sum / 5) * 100) / 100;
}
