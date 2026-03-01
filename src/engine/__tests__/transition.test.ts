import { describe, it, expect } from "vitest";
import {
  createInitialState,
  isDuplicateSubmission,
  clampCapital,
  applyChoiceToState,
  processChoice,
  completeStory,
} from "../transition";
import { GameState, ChoiceImpact } from "@/types/game";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState("player_test"),
    ...overrides,
  };
}

const noOpImpact: ChoiceImpact = {
  choiceId: "choice_01",
  resourceDeltas: {},
  dimensionDeltas: {},
  flagUpdates: {},
};

// ─── createInitialState ───────────────────────────────────────────────────────

describe("createInitialState()", () => {
  it("sets capital to 10000", () => {
    const state = createInitialState("player_1");
    expect(state.resources.capital).toBe(10000);
  });

  it("sets reputation to 50", () => {
    expect(createInitialState("p").resources.reputation).toBe(50);
  });

  it("sets network to 10", () => {
    expect(createInitialState("p").resources.network).toBe(10);
  });

  it("sets momentumMultiplier to 1.0", () => {
    expect(createInitialState("p").resources.momentumMultiplier).toBe(1.0);
  });

  it("sets all dimensions to 0", () => {
    const { dimensions } = createInitialState("p");
    expect(dimensions.autonomy).toBe(0);
    expect(dimensions.innovativeness).toBe(0);
    expect(dimensions.proactiveness).toBe(0);
    expect(dimensions.riskTaking).toBe(0);
    expect(dimensions.competitiveAggressiveness).toBe(0);
  });

  it("sets hasDebt and hiredTeam to false", () => {
    const { flags } = createInitialState("p");
    expect(flags.hasDebt).toBe(false);
    expect(flags.hiredTeam).toBe(false);
  });

  it("starts with empty history", () => {
    expect(createInitialState("p").session.history).toEqual([]);
  });

  it("sets currentNarrativeId to beat_00", () => {
    expect(createInitialState("p").session.currentNarrativeId).toBe("beat_00");
  });

  it("sets isStoryComplete to false", () => {
    expect(createInitialState("p").session.isStoryComplete).toBe(false);
  });

  it("stores the playerId", () => {
    expect(createInitialState("player_abc").session.playerId).toBe("player_abc");
  });
});

// ─── clampCapital ─────────────────────────────────────────────────────────────

describe("clampCapital()", () => {
  it("returns value when positive", () => {
    expect(clampCapital(5000)).toBe(5000);
  });

  it("returns 0 when value is 0", () => {
    expect(clampCapital(0)).toBe(0);
  });

  it("returns 0 when value is negative", () => {
    expect(clampCapital(-1)).toBe(0);
    expect(clampCapital(-9999)).toBe(0);
  });
});

// ─── isDuplicateSubmission ────────────────────────────────────────────────────

describe("isDuplicateSubmission()", () => {
  it("returns false when history is empty", () => {
    const state = createInitialState("p");
    expect(isDuplicateSubmission(state, "beat_01", "choice_01")).toBe(false);
  });

  it("returns false when pair not in history", () => {
    const state = makeState({
      session: {
        ...createInitialState("p").session,
        history: [{ narrativeId: "beat_01", choiceId: "choice_02" }],
      },
    });
    expect(isDuplicateSubmission(state, "beat_01", "choice_01")).toBe(false);
  });

  it("returns true when exact narrativeId + choiceId pair exists in history", () => {
    const state = makeState({
      session: {
        ...createInitialState("p").session,
        history: [{ narrativeId: "beat_01", choiceId: "choice_01" }],
      },
    });
    expect(isDuplicateSubmission(state, "beat_01", "choice_01")).toBe(true);
  });
});

// ─── applyChoiceToState ───────────────────────────────────────────────────────

describe("applyChoiceToState()", () => {
  it("applies capital delta with momentumMultiplier", () => {
    const state = createInitialState("p");
    const impact: ChoiceImpact = { ...noOpImpact, resourceDeltas: { capital: -2000 } };
    const next = applyChoiceToState(state, impact, "beat_01");
    // 10000 + (-2000 * 1.0) = 8000
    expect(next.resources.capital).toBe(8000);
  });

  it("clamps capital to 0 when delta exceeds available capital", () => {
    const state = createInitialState("p");
    const impact: ChoiceImpact = { ...noOpImpact, resourceDeltas: { capital: -99999 } };
    const next = applyChoiceToState(state, impact, "beat_01");
    expect(next.resources.capital).toBe(0);
  });

  it("sets hasDebt to true when capital is clamped", () => {
    const state = createInitialState("p");
    const impact: ChoiceImpact = { ...noOpImpact, resourceDeltas: { capital: -99999 } };
    const next = applyChoiceToState(state, impact, "beat_01");
    expect(next.flags.hasDebt).toBe(true);
  });

  it("applies dimension deltas", () => {
    const state = createInitialState("p");
    const impact: ChoiceImpact = { ...noOpImpact, dimensionDeltas: { innovativeness: 0.2 } };
    const next = applyChoiceToState(state, impact, "beat_01");
    expect(next.dimensions.innovativeness).toBe(0.2);
  });

  it("applies flag updates", () => {
    const state = createInitialState("p");
    const impact: ChoiceImpact = { ...noOpImpact, flagUpdates: { hiredTeam: true } };
    const next = applyChoiceToState(state, impact, "beat_01");
    expect(next.flags.hiredTeam).toBe(true);
  });

  it("appends to history", () => {
    const state = createInitialState("p");
    const impact: ChoiceImpact = { ...noOpImpact, choiceId: "choice_01" };
    const next = applyChoiceToState(state, impact, "beat_01");
    expect(next.session.history).toHaveLength(1);
    expect(next.session.history[0]).toEqual({ narrativeId: "beat_00", choiceId: "choice_01" });
  });

  it("updates currentNarrativeId to nextNarrativeId", () => {
    const state = createInitialState("p");
    const next = applyChoiceToState(state, noOpImpact, "beat_05");
    expect(next.session.currentNarrativeId).toBe("beat_05");
  });

  it("does not mutate the original state", () => {
    const state = createInitialState("p");
    const originalCapital = state.resources.capital;
    const impact: ChoiceImpact = { ...noOpImpact, resourceDeltas: { capital: -500 } };
    applyChoiceToState(state, impact, "beat_01");
    expect(state.resources.capital).toBe(originalCapital);
  });

  it("compounds capital delta with momentumMultiplier > 1", () => {
    const state = makeState({
      resources: { ...createInitialState("p").resources, momentumMultiplier: 2.0 },
    });
    const impact: ChoiceImpact = { ...noOpImpact, resourceDeltas: { capital: 1000 } };
    const next = applyChoiceToState(state, impact, "beat_01");
    // 10000 + (1000 * 2.0) = 12000
    expect(next.resources.capital).toBe(12000);
  });
});

// ─── processChoice ────────────────────────────────────────────────────────────

describe("processChoice()", () => {
  it("returns state unchanged when story is complete", () => {
    const state = makeState({
      session: { ...createInitialState("p").session, isStoryComplete: true },
    });
    const next = processChoice(state, "choice_01", noOpImpact, "beat_01");
    expect(next).toBe(state);
  });

  it("returns state unchanged on duplicate submission", () => {
    const state = makeState({
      session: {
        ...createInitialState("p").session,
        history: [{ narrativeId: "beat_00", choiceId: "choice_01" }],
      },
    });
    const next = processChoice(state, "choice_01", noOpImpact, "beat_01");
    expect(next).toBe(state);
  });

  it("returns state unchanged when momentumMultiplier is NaN", () => {
    const state = makeState({
      resources: { ...createInitialState("p").resources, momentumMultiplier: NaN },
    });
    const next = processChoice(state, "choice_01", noOpImpact, "beat_01");
    expect(next).toBe(state);
  });

  it("returns state unchanged when momentumMultiplier is Infinity", () => {
    const state = makeState({
      resources: { ...createInitialState("p").resources, momentumMultiplier: Infinity },
    });
    const next = processChoice(state, "choice_01", noOpImpact, "beat_01");
    expect(next).toBe(state);
  });

  it("applies choice when all guards pass", () => {
    const state = createInitialState("p");
    const impact: ChoiceImpact = { ...noOpImpact, resourceDeltas: { capital: -500 } };
    const next = processChoice(state, "choice_01", impact, "beat_01");
    expect(next.resources.capital).toBe(9500);
  });
});

// ─── completeStory ────────────────────────────────────────────────────────────

describe("completeStory()", () => {
  it("sets isStoryComplete to true", () => {
    const state = createInitialState("p");
    const next = completeStory(state);
    expect(next.session.isStoryComplete).toBe(true);
  });

  it("does not mutate original state", () => {
    const state = createInitialState("p");
    completeStory(state);
    expect(state.session.isStoryComplete).toBe(false);
  });
});
