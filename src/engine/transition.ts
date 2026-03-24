import {
  GameState,
  ChoiceImpact,
  NarrativeId,
  ChoiceId,
  Resources,
  Dimensions,
} from "@/types/game";

// ─── createInitialState ───────────────────────────────────────────────────────

export function createInitialState(playerId: string): GameState {
  return {
    session: {
      playerId,
      currentNarrativeId: "beat_00",
      isStoryComplete: false,
      history: [],
    },
    resources: {
      capital: 10000,
      reputation: 0,
      network: 0,
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
  return state.session.history.some(
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
    if (key === "capital") {
      newResources.capital = clampCapital(
        state.resources.capital + delta * momentumMultiplier
      );
    } else {
      (newResources[key] as number) = Math.min(80, Math.max(0, (state.resources[key] as number) + delta));
    }
  }

  // Apply dimension deltas
  const newDimensions: Dimensions = { ...state.dimensions };
  for (const key of Object.keys(impact.dimensionDeltas) as (keyof Dimensions)[]) {
    const delta = impact.dimensionDeltas[key] ?? 0;
    newDimensions[key] = Math.min(10, Math.max(0, state.dimensions[key] + delta));
  }

  // Apply flag updates, then set hasDebt if capital was clamped to 0
  const newFlags = { ...state.flags, ...impact.flagUpdates };
  if (newResources.capital === 0 && state.resources.capital > 0) {
    newFlags.hasDebt = true;
  }

  return {
    session: {
      ...state.session,
      currentNarrativeId: nextNarrativeId,
      history: [
        ...state.session.history,
        { narrativeId: state.session.currentNarrativeId, choiceId: impact.choiceId },
      ],
    },
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
