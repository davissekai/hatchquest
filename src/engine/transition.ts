import {
  GameState,
  ChoiceImpact,
  NarrativeId,
  ChoiceId,
  Resources,
  Dimensions,
} from "@/types/game";

// ─── createInitialState ───────────────────────────────────────────────────────

export function createInitialState(_playerId?: string): GameState {
  return {
    session: {
      currentNarrativeId: "beat_00",
      isStoryComplete: false,
    },
    history: [],
    resources: {
      v_capital: 10000,
      reputation: 50,
      network: 10,
      momentumMultiplier: 1.0,
    },
    dimensions: {
      autonomy: 0,
      innovativeness: 0,
      proactiveness: 0,
      riskTaking: 0,
      competitiveAggressiveness: 0,
    },
    flags: {
      hasDebt: false,
      hiredTeam: false,
    },
  };
}

// ─── clampCapital ─────────────────────────────────────────────────────────────

export function clampCapital(value: number): number {
  return Math.max(0, value);
}

// ─── isDuplicateSubmission ────────────────────────────────────────────────────

export function isDuplicateSubmission(
  state: GameState,
  narrativeId: NarrativeId,
  choiceId: ChoiceId
): boolean {
  return state.history.some(
    (entry) => entry.narrativeId === narrativeId && entry.choiceId === choiceId
  );
}

// ─── applyChoiceToState ───────────────────────────────────────────────────────

export function applyChoiceToState(
  state: GameState,
  impact: ChoiceImpact,
  nextNarrativeId: NarrativeId
): GameState {
  const { momentumMultiplier } = state.resources;

  // Apply resource deltas
  const newResources: Resources = { ...state.resources };
  for (const key of Object.keys(impact.resourceDeltas) as (keyof Resources)[]) {
    const delta = impact.resourceDeltas[key] ?? 0;
    if (key === "v_capital") {
      newResources.v_capital = clampCapital(
        state.resources.v_capital + delta * momentumMultiplier
      );
    } else {
      (newResources[key] as number) = (state.resources[key] as number) + delta;
    }
  }

  // Apply dimension deltas
  const newDimensions: Dimensions = { ...state.dimensions };
  for (const key of Object.keys(impact.dimensionDeltas) as (keyof Dimensions)[]) {
    const delta = impact.dimensionDeltas[key] ?? 0;
    newDimensions[key] = state.dimensions[key] + delta;
  }

  // Apply flag updates, then set hasDebt if capital was clamped to 0
  const newFlags = { ...state.flags, ...impact.flagUpdates };
  if (newResources.v_capital === 0 && state.resources.v_capital > 0) {
    newFlags.hasDebt = true;
  }

  return {
    session: {
      ...state.session,
      currentNarrativeId: nextNarrativeId,
    },
    history: [
      ...state.history,
      {
        narrativeId: state.session.currentNarrativeId,
        choiceId: impact.choiceId,
        capitalBefore: state.resources.v_capital,
        capitalAfter: newResources.v_capital,
        timestamp: Date.now(),
      },
    ],
    resources: newResources,
    dimensions: newDimensions,
    flags: newFlags,
  };
}

// ─── processChoice ────────────────────────────────────────────────────────────

export function processChoice(
  state: GameState,
  choiceId: ChoiceId,
  impact: ChoiceImpact,
  nextNarrativeId: NarrativeId
): GameState {
  if (state.session.isStoryComplete) return state;
  if (isDuplicateSubmission(state, state.session.currentNarrativeId, choiceId)) return state;
  if (!isFinite(state.resources.momentumMultiplier) || isNaN(state.resources.momentumMultiplier)) {
    return state;
  }
  return applyChoiceToState(state, impact, nextNarrativeId);
}

// ─── completeStory ────────────────────────────────────────────────────────────

export function completeStory(state: GameState): GameState {
  return {
    ...state,
    session: { ...state.session, isStoryComplete: true },
  };
}
