import { GameState, Dimensions, Resources } from "@/types/game";

// Realistic ceiling per dimension.
// 29 choice beats × avg delta ~0.3 = ~8.7 raw max. Set to 10 for headroom.
const MAX_DIMENSION_SCORE = 10;

/**
 * Normalizes raw EO dimension scores to a 0–100 scale.
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

/**
 * Composite Entrepreneurial Acumen Score (0–100).
 * Blends EO behavior (50%) with business outcomes (50%).
 * Capital-weighted within resources — reflects Ghanaian entrepreneurial context
 * where profit optimization is the primary mark of a good entrepreneur.
 *
 * @param dimensions - Already normalized EO dimensions (0–100 scale)
 * @param resources  - Final game resources
 */
export function calculateAcumenScore(dimensions: Dimensions, resources: Resources): number {
  // EO score: simple average of 5 normalized dimensions
  const eoScore =
    (dimensions.autonomy +
      dimensions.innovativeness +
      dimensions.proactiveness +
      dimensions.riskTaking +
      dimensions.competitiveAggressiveness) /
    5;

  // Resource scores
  const capitalScore = Math.min(100, (resources.capital / 50000) * 100);  // 50K GHS = ceiling
  const repScore = Math.min(100, (resources.reputation / 80) * 100);      // 80 = realistic max
  const networkScore = Math.min(100, (resources.network / 80) * 100);     // 80 = realistic max

  // Capital carries 60% of resource weight (profit is the primary signal)
  const resourceScore = capitalScore * 0.6 + repScore * 0.2 + networkScore * 0.2;

  // Composite: equal weight EO behavior vs business outcomes
  const composite = eoScore * 0.5 + resourceScore * 0.5;
  return Math.round(composite * 100) / 100;
}
