// Player context — extracted from Layer 0 responses into a clean, display-safe
// identity that can safely flow through gameplay narration.

export interface PlayerContext {
  /** Short, display-safe label for the business (e.g., "Makola Logistics Hub") */
  businessLabel: string;
  /** Clean one-line summary of the venture */
  businessSummary: string;
  /** Slightly richer display-safe description used by fallback narration */
  businessDescription: string;
  /** Why the founder is building this venture */
  motivation: string;
  /** The founder's distinctive edge or operating strength */
  founderEdge?: string;
  /** Optional internal-only trace of the raw Q1 answer. Omit when persisting clean context. */
  rawQ1Response?: string;
  /** Optional internal-only trace of the raw Q2 answer. Omit when persisting clean context. */
  rawQ2Response?: string;
  /** Optional internal-only trace of the raw Q2 prompt. Omit when persisting clean context. */
  q2Prompt?: string;
}
