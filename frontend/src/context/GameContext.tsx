"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import type {
  ClientWorldState,
  ScenarioNode,
  EOProfile,
  ResultsResponse,
} from "@hatchquest/shared";

// ── State shape ───────────────────────────────────────────────────────────────

interface GameState {
  playerName: string | null;
  sessionId: string | null;
  layer0Question: string | null;
  clientState: ClientWorldState | null;
  currentNode: ScenarioNode | null;
  eoProfile: EOProfile | null;
  isComplete: boolean;
  results: ResultsResponse | null;
}

interface GameContextType {
  state: GameState;
  isLoading: boolean;
  error: string | null;
  /** Create a new session. Stores sessionId in localStorage, sets layer0Question. */
  startGame: (playerName: string, email: string, password: string) => Promise<void>;
  /** Submit the Layer 0 free-text response. Updates state; caller handles navigation. */
  classifyLayer0: (response: string) => Promise<void>;
  /** Submit a choice by index. Returns clientState + nextNode. */
  makeChoice: (nodeId: string, choiceIndex: 0 | 1 | 2) => Promise<void>;
  /** Hydrate state from an existing sessionId (resume flow). */
  resumeSession: (sessionId?: string) => Promise<boolean>;
  /** Fetch and store results for a completed session. */
  loadResults: (sessionId: string) => Promise<ResultsResponse>;
  resetGame: () => void;
  hasActiveSession: () => boolean;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const SESSION_ID_KEY = "hq-session-id";

const initialState: GameState = {
  playerName: null,
  sessionId: null,
  layer0Question: null,
  clientState: null,
  currentNode: null,
  eoProfile: null,
  isComplete: false,
  results: null,
};

// ── Context ───────────────────────────────────────────────────────────────────

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GameState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (updates: Partial<GameState>) =>
    setState((prev) => ({ ...prev, ...updates }));

  // ── startGame ────────────────────────────────────────────────────────────────

  const startGame = async (playerName: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.start({ playerName, email, password });
      localStorage.setItem(SESSION_ID_KEY, res.sessionId);
      patch({
        playerName,
        sessionId: res.sessionId,
        layer0Question: res.layer0Question,
        clientState: null,
        currentNode: null,
        eoProfile: null,
        isComplete: false,
        results: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start game";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── classifyLayer0 ────────────────────────────────────────────────────────────

  const classifyLayer0 = async (response: string): Promise<void> => {
    if (!state.sessionId) throw new Error("No active session");
    setIsLoading(true);
    setError(null);
    try {
      // classify() returns { sessionId, layer1NodeId } — the next node is fetched
      // by the play page on mount via resumeSession, so we just stash the sessionId
      // (already stored). The caller navigates to /layer0/loading → /play.
      await api.classify({ sessionId: state.sessionId, response });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Classification failed";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── makeChoice ────────────────────────────────────────────────────────────────

  const makeChoice = async (
    nodeId: string,
    choiceIndex: 0 | 1 | 2
  ): Promise<void> => {
    if (!state.sessionId) throw new Error("No active session");
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.choice({
        sessionId: state.sessionId,
        nodeId,
        choiceIndex,
      });
      patch({
        clientState: res.clientState,
        currentNode: res.nextNode,
        isComplete: res.clientState.isComplete,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit choice";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── resumeSession ──────────────────────────────────────────────────────────────

  const resumeSession = async (explicitId?: string): Promise<boolean> => {
    const sessionId = explicitId ?? localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) return false;

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.session(sessionId);
      localStorage.setItem(SESSION_ID_KEY, sessionId);
      patch({
        sessionId,
        clientState: res.clientState,
        currentNode: res.currentNode,
        isComplete: res.clientState.isComplete,
      });
      return true;
    } catch {
      // Session not found or expired — clean up
      localStorage.removeItem(SESSION_ID_KEY);
      setState(initialState);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ── loadResults ───────────────────────────────────────────────────────────────

  const loadResults = async (sessionId: string): Promise<ResultsResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.results(sessionId);
      patch({
        eoProfile: res.eoProfile,
        clientState: res.clientState,
        isComplete: true,
        results: res,
      });
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load results";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── resetGame ─────────────────────────────────────────────────────────────────

  const resetGame = () => {
    localStorage.removeItem(SESSION_ID_KEY);
    setState(initialState);
  };

  const hasActiveSession = (): boolean => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(SESSION_ID_KEY);
  };

  return (
    <GameContext.Provider
      value={{
        state,
        isLoading,
        error,
        startGame,
        classifyLayer0,
        makeChoice,
        resumeSession,
        loadResults,
        resetGame,
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
