// Player context — extracted from Layer 0 free-text responses.
// Persists through all 5 game layers to give the AI narrator
// personalised business identity for narrative skin generation.

export interface PlayerContext {
  /** What business the player described (extracted from Q1) */
  businessDescription: string;
  /** Why they want to build it — their stated motivation (extracted from Q1) */
  motivation: string;
  /** The raw Q1 response, preserved for re-classification if needed */
  rawQ1Response: string;
  /** The raw Q2 response */
  rawQ2Response: string;
  /** AI-generated Q2 text (stored so it can be shown in session resume) */
  q2Prompt: string;
}
