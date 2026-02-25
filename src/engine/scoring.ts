import { GameState, Dimensions } from "@/types/game";

/**
 * Calculates the final Entrepreneurial Orientation (EO) score per dimension.
 * Called at end of game to produce the Radar Chart data.
 *
 * @param state - The completed GameState
 * @returns Dimensions object with normalized scores (0-100)
 */
export function calculateEOScores(state: GameState): Dimensions {
    // TODO: Implement EO scoring logic
    // Normalize raw dimension values to a 0-100 scale
    throw new Error("calculateEOScores() not yet implemented");
}

/**
 * Calculates the aggregate Entrepreneurial Acumen Score.
 * A single number summarizing overall EO performance.
 *
 * @param dimensions - The normalized EO dimension scores
 * @returns A number between 0 and 100
 */
export function calculateAcumenScore(dimensions: Dimensions): number {
    // TODO: Implement weighted aggregate scoring
    throw new Error("calculateAcumenScore() not yet implemented");
}
