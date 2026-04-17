import { describe, it, expect, beforeEach } from "vitest";
import { recordTurn, getTrace } from "../trace.js";
import type { TurnTrace } from "../trace.js";
import type { WorldState } from "@hatchquest/shared";

// Minimal WorldState — only fields required by the interface
const BASE_WORLD_STATE: WorldState = {
  seed: 1,
  layer: 1,
  currentNodeId: null,
  turnsElapsed: 0,
  isComplete: false,
  capital: 10000,
  monthlyBurn: 1000,
  revenue: 0,
  debt: 0,
  sector: "other",
  businessDescription: "",
  choiceHistory: [],
  recentPatterns: [],
  playerContext: null,
  employeeCount: 0,
  businessFormality: "unregistered",
  hasBackupPower: false,
  hasPremises: false,
  reputation: 0,
  networkStrength: 0,
  susuMember: false,
  mentorAccess: false,
  marketDemand: 50,
  infrastructureReliability: 50,
  regulatoryPressure: 30,
  competitorAggression: 50,
  eoProfile: {
    autonomy: 5,
    innovativeness: 5,
    riskTaking: 5,
    proactiveness: 5,
    competitiveAggressiveness: 5,
  },
  capitalAccessOpen: false,
  underAudit: false,
  vcWindowOpen: false,
  hiringDifficulty: 0,
  worldEventHistory: [],
};

// Build a minimal valid TurnTrace for a given turn number
function makeTurnTrace(turn: number): TurnTrace {
  return {
    turn,
    layer: 1,
    nodeId: `node-${turn}`,
    worldStateBefore: BASE_WORLD_STATE,
    worldStateAfter: BASE_WORLD_STATE,
    eventsFired: [],
    choiceIndex: 0,
    difficulty: 0.3,
    eoUpdates: {
      autonomy: { priorMean: 5, posteriorMean: 5.1, priorVar: 2, posteriorVar: 1.8 },
      innovativeness: { priorMean: 5, posteriorMean: 5, priorVar: 2, posteriorVar: 2 },
      riskTaking: { priorMean: 5, posteriorMean: 5, priorVar: 2, posteriorVar: 2 },
      proactiveness: { priorMean: 5, posteriorMean: 5, priorVar: 2, posteriorVar: 2 },
      competitiveAggressiveness: { priorMean: 5, posteriorMean: 5, priorVar: 2, posteriorVar: 2 },
    },
    narrationSource: "fallback",
    narrationLatencyMs: 0,
  };
}

// Use unique session IDs per test to avoid cross-test contamination from shared Map
let sessionCounter = 0;
function freshSessionId(): string {
  return `test-session-${++sessionCounter}`;
}

// ─── getTrace ─────────────────────────────────────────────────────────────────

describe("getTrace", () => {
  it("returns an empty array for an unknown session", () => {
    expect(getTrace("nonexistent-session-xyz")).toEqual([]);
  });

  it("returns recorded traces for a known session", () => {
    const id = freshSessionId();
    const trace = makeTurnTrace(1);
    recordTurn(id, trace);
    const result = getTrace(id);
    expect(result).toHaveLength(1);
    expect(result[0].nodeId).toBe("node-1");
  });
});

// ─── recordTurn ───────────────────────────────────────────────────────────────

describe("recordTurn", () => {
  it("records a single trace", () => {
    const id = freshSessionId();
    recordTurn(id, makeTurnTrace(1));
    expect(getTrace(id)).toHaveLength(1);
  });

  it("appends multiple traces in order", () => {
    const id = freshSessionId();
    recordTurn(id, makeTurnTrace(1));
    recordTurn(id, makeTurnTrace(2));
    recordTurn(id, makeTurnTrace(3));
    const result = getTrace(id);
    expect(result).toHaveLength(3);
    expect(result[0].turn).toBe(1);
    expect(result[1].turn).toBe(2);
    expect(result[2].turn).toBe(3);
  });

  it("does not mix traces across different sessions", () => {
    const idA = freshSessionId();
    const idB = freshSessionId();
    recordTurn(idA, makeTurnTrace(10));
    recordTurn(idB, makeTurnTrace(20));
    expect(getTrace(idA)[0].turn).toBe(10);
    expect(getTrace(idB)[0].turn).toBe(20);
  });
});

// ─── Ring buffer behavior ─────────────────────────────────────────────────────

describe("ring buffer (MAX_TRACES = 50)", () => {
  it("stores up to 50 traces without eviction", () => {
    const id = freshSessionId();
    for (let i = 1; i <= 50; i++) {
      recordTurn(id, makeTurnTrace(i));
    }
    expect(getTrace(id)).toHaveLength(50);
  });

  it("evicts the oldest trace when a 51st is added", () => {
    const id = freshSessionId();
    for (let i = 1; i <= 51; i++) {
      recordTurn(id, makeTurnTrace(i));
    }
    const result = getTrace(id);
    expect(result).toHaveLength(50);
    // Turn 1 (oldest) should be evicted; turns 2–51 should remain
    expect(result[0].turn).toBe(2);
    expect(result[49].turn).toBe(51);
  });

  it("continues evicting oldest on further additions past 50", () => {
    const id = freshSessionId();
    for (let i = 1; i <= 55; i++) {
      recordTurn(id, makeTurnTrace(i));
    }
    const result = getTrace(id);
    expect(result).toHaveLength(50);
    // Turns 1–5 should be evicted; turns 6–55 remain
    expect(result[0].turn).toBe(6);
    expect(result[49].turn).toBe(55);
  });
});
