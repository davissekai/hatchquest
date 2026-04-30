import type { WorldState } from "@hatchquest/shared";
import type { WorldEvent } from "@hatchquest/shared";

// Apply function signature: takes state, returns partial WorldState mutation
export interface WorldEventEffect {
  event: WorldEvent;
  apply: (state: WorldState) => Partial<WorldState>;
  // Gating: event only eligible if this returns true
  eligible: (state: WorldState) => boolean;
}

export const WORLD_EVENT_POOL: WorldEventEffect[] = [
  {
    event: {
      id: "ecg_outage",
      label: "ECG Outage",
      narrativeHook: "A sustained ECG blackout is disrupting operations across Accra.",
      minLayer: 1,
    },
    eligible: (s) => s.layer >= 1,
    apply: () => ({ infrastructureReliability: undefined }), // handled via delta in world-engine
  },
  {
    event: {
      id: "competitor_funded",
      label: "Competitor Gets Funded",
      narrativeHook: "A well-funded rival just raised capital and is expanding aggressively.",
      minLayer: 2,
    },
    eligible: (s) => s.layer >= 2 && s.competitorAggression < 70,
    apply: () => ({}),
  },
  {
    event: {
      id: "cedi_weakened",
      label: "Cedi Weakens",
      narrativeHook: "The Ghana Cedi has weakened against the dollar, raising import costs.",
      minLayer: 2,
    },
    eligible: (s) => s.layer >= 2,
    apply: () => ({}),
  },
  {
    event: {
      id: "bog_rate_cut",
      label: "BoG Rate Cut",
      narrativeHook: "The Bank of Ghana cut lending rates — cheaper capital is accessible.",
      minLayer: 3,
    },
    eligible: (s) => s.layer >= 3,
    apply: () => ({ capitalAccessOpen: true }),
  },
  {
    event: {
      id: "supplier_strike",
      label: "Supplier Strike",
      narrativeHook: "A supplier strike is disrupting supply chains across multiple sectors.",
      minLayer: 3,
    },
    eligible: (s) => s.layer >= 3,
    apply: () => ({}),
  },
  {
    event: {
      id: "tech_talent_shortage",
      label: "Tech Talent Shortage",
      narrativeHook: "Tech talent is scarce — every startup is competing for the same pool.",
      minLayer: 4,
    },
    eligible: (s) => s.layer >= 4,
    apply: () => ({ hiringDifficulty: undefined }), // handled as additive in world-engine
  },
  {
    event: {
      id: "viral_customer_post",
      label: "Viral Customer Post",
      narrativeHook: "A customer's post about a local business is going viral on social media.",
      minLayer: 4,
    },
    eligible: (s) => s.layer >= 4 && s.reputation > 55,
    apply: () => ({}),
  },
  {
    event: {
      id: "regulatory_audit",
      label: "Regulatory Audit Wave",
      narrativeHook: "Tax authorities are auditing informal and semi-formal businesses across the city.",
      minLayer: 5,
    },
    eligible: (s) => s.layer >= 5,
    apply: () => ({ underAudit: true }),
  },
  {
    event: {
      id: "competitor_scandal",
      label: "Competitor Scandal",
      narrativeHook: "A major competitor is embroiled in a public scandal — their customers are looking elsewhere.",
      minLayer: 6,
    },
    eligible: (s) => s.layer >= 6 && s.competitorAggression > 60,
    apply: () => ({}),
  },
  {
    event: {
      id: "vc_roadshow_season",
      label: "VC Roadshow Season",
      narrativeHook: "International VC firms are in Accra this month — deal flow is open.",
      minLayer: 7,
    },
    eligible: (s) => s.layer >= 7,
    apply: () => ({ vcWindowOpen: true }),
  },
];
