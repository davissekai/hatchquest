"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// ── Types from API contract ─────────────────────────────────────────────────

export interface Beat {
  id: string;
  round: number;
  title: string;
  storyText: string;
  orderIndex: number;
  choices: Choice[];
}

export interface Choice {
  id: string;
  beatId: string;
  label: string;
  immediateFeedback: string;
  nextBeatId: string | null;
}

interface Player {
  name: string;
  email: string;
}

interface GameState {
  player: Player | null;
  sessionId: string | null;
  currentBeat: Beat | null;
  currentScene: number;
  currentRound: number;
  choices: string[];
  score: number;
  dimensions: {
    autonomy: number;
    innovativeness: number;
    proactiveness: number;
    riskTaking: number;
    competitiveAggressiveness: number;
  };
  resources: {
    capital: number;
    reputation: number;
    network: number;
    momentumMultiplier: number;
  };
  isComplete: boolean;
}

interface GameContextType {
  state: GameState;
  isLoading: boolean;
  error: string | null;
  startGame: (player: Player) => Promise<void>;
  makeChoice: (
    choiceId: string
  ) => Promise<{ feedback: string; deltas: { capital: number; reputation: number; network: number } }>;
  resumeSession: () => Promise<boolean>;
  loadResults: () => Promise<void>;
  resetGame: () => void;
  clearSession: () => void;
  hasActiveSession: () => boolean;
}

// ── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "hatchquest-session";
const SESSION_ID_KEY = "sessionId";

const initialState: GameState = {
  player: null,
  sessionId: null,
  currentBeat: null,
  currentScene: 0,
  currentRound: 0,
  choices: [],
  score: 0,
  dimensions: {
    autonomy: 0,
    innovativeness: 0,
    proactiveness: 0,
    riskTaking: 0,
    competitiveAggressiveness: 0,
  },
  resources: {
    capital: 10000,
    reputation: 50,
    network: 10,
    momentumMultiplier: 1.0,
  },
  isComplete: false,
};

function loadSession(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

function saveSession(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ── Context ──────────────────────────────────────────────────────────────────

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window === "undefined") return initialState;
    const saved = loadSession();
    return saved ?? initialState;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateState = (updates: Partial<GameState> | ((prev: GameState) => Partial<GameState>)) => {
    setState((prev) => {
      const patch = typeof updates === "function" ? updates(prev) : updates;
      const next = { ...prev, ...patch };
      saveSession(next);
      return next;
    });
  };

  // ── startGame ──────────────────────────────────────────────────────────────
  const startGame = async (player: Player) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: player.email, name: player.name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Server error ${res.status}`);
      }

      const data = await res.json() as {
        sessionId: string;
        beat: Beat;
        state: {
          session: { playerId: string; currentNarrativeId: string; isStoryComplete: boolean; history: unknown[] };
          resources: { capital: number; reputation: number; network: number; momentumMultiplier: number };
          flags: Record<string, boolean>;
        };
      };

      localStorage.setItem(SESSION_ID_KEY, data.sessionId);

      updateState({
        player,
        sessionId: data.sessionId,
        currentBeat: data.beat,
        currentScene: data.beat.orderIndex,
        currentRound: data.beat.round,
        choices: [],
        score: 0,
        dimensions: { autonomy: 0, innovativeness: 0, proactiveness: 0, riskTaking: 0, competitiveAggressiveness: 0 },
        resources: {
          capital: data.state.resources.capital,
          reputation: data.state.resources.reputation,
          network: data.state.resources.network,
          momentumMultiplier: data.state.resources.momentumMultiplier,
        },
        isComplete: data.state.session.isStoryComplete,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start game";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── makeChoice ─────────────────────────────────────────────────────────────
  const makeChoice = async (
    choiceId: string
  ): Promise<{ feedback: string; deltas: { capital: number; reputation: number; network: number } }> => {
    if (!state.sessionId) throw new Error("No active session");
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/game/choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: state.sessionId, choiceId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Server error ${res.status}`);
      }

      const data = await res.json() as {
        nextBeat: Beat;
        updatedState: {
          session: { playerId: string; currentNarrativeId: string; isStoryComplete: boolean; history: unknown[] };
          resources: { capital: number; reputation: number; network: number; momentumMultiplier: number };
          flags: Record<string, boolean>;
        };
        feedback: string;
      };

      const prevResources = state.resources;
      const newResources = {
        capital: data.updatedState.resources.capital,
        reputation: data.updatedState.resources.reputation,
        network: data.updatedState.resources.network,
        momentumMultiplier: data.updatedState.resources.momentumMultiplier,
      };

      const deltas = {
        capital: newResources.capital - prevResources.capital,
        reputation: newResources.reputation - prevResources.reputation,
        network: newResources.network - prevResources.network,
      };

      updateState((prev) => ({
        currentBeat: data.nextBeat,
        currentScene: data.nextBeat.orderIndex,
        currentRound: data.nextBeat.round,
        choices: [...prev.choices, choiceId],
        resources: newResources,
        isComplete: data.updatedState.session.isStoryComplete,
      }));

      return { feedback: data.feedback, deltas };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit choice";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── resumeSession ──────────────────────────────────────────────────────────
  const resumeSession = async (): Promise<boolean> => {
    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) return false;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/game/session?sessionId=${encodeURIComponent(sessionId)}`);

      if (!res.ok) {
        localStorage.removeItem(SESSION_ID_KEY);
        localStorage.removeItem(STORAGE_KEY);
        setState(initialState);
        return false;
      }

      const data = await res.json() as {
        beat: Beat;
        state: {
          session: { playerId: string; currentNarrativeId: string; isStoryComplete: boolean; history: unknown[] };
          resources: { capital: number; reputation: number; network: number; momentumMultiplier: number };
          flags: Record<string, boolean>;
        };
      };

      updateState({
        sessionId,
        currentBeat: data.beat,
        currentScene: data.beat.orderIndex,
        currentRound: data.beat.round,
        resources: {
          capital: data.state.resources.capital,
          reputation: data.state.resources.reputation,
          network: data.state.resources.network,
          momentumMultiplier: data.state.resources.momentumMultiplier,
        },
        isComplete: data.state.session.isStoryComplete,
      });

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to resume session";
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ── loadResults ────────────────────────────────────────────────────────────
  const loadResults = async () => {
    if (!state.sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/game/results?sessionId=${encodeURIComponent(state.sessionId)}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Server error ${res.status}`);
      }

      const data = await res.json() as {
        finalState: {
          session: { playerId: string; currentNarrativeId: string; isStoryComplete: boolean; history: unknown[] };
          resources: { capital: number; reputation: number; network: number; momentumMultiplier: number };
          dimensions: {
            autonomy: number;
            innovativeness: number;
            proactiveness: number;
            riskTaking: number;
            competitiveAggressiveness: number;
          };
          flags: Record<string, boolean>;
        };
        acumenScore: number | null;
      };

      updateState({
        score: data.acumenScore ?? 0,
        dimensions: data.finalState.dimensions,
        resources: {
          capital: data.finalState.resources.capital,
          reputation: data.finalState.resources.reputation,
          network: data.finalState.resources.network,
          momentumMultiplier: data.finalState.resources.momentumMultiplier,
        },
        isComplete: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load results";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── clearSession / resetGame ───────────────────────────────────────────────
  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
    setState(initialState);
  };

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
    setState(initialState);
  };

  const hasActiveSession = () => {
    if (typeof window === "undefined") return false;
    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    return !!(sessionId && state.sessionId && !state.isComplete);
  };

  return (
    <GameContext.Provider
      value={{
        state,
        isLoading,
        error,
        startGame,
        makeChoice,
        resumeSession,
        loadResults,
        resetGame,
        clearSession,
        hasActiveSession,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
};
