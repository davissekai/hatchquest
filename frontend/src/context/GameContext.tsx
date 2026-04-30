"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { api } from "@/lib/api";
import type {
  ClientWorldState,
  ScenarioNode,
  EOProfile,
  ResultsResponse,
} from "@hatchquest/shared";

export type SessionPhase = 'idle' | 'layer0' | 'active' | 'complete';

// ── State shape ───────────────────────────────────────────────────────────────

interface GameState {
  playerName: string | null;
  sessionId: string | null;
  preamble: string | null;
  layer0Question: string | null;
  clientState: ClientWorldState | null;
  currentNode: ScenarioNode | null;
  eoProfile: EOProfile | null;
  isComplete: boolean;
  results: ResultsResponse | null;
}

interface GameContextType {
  state: GameState;
  phase: SessionPhase;
  isLoading: boolean;
  error: string | null;
  /** Create a new session. Stores session meta in localStorage, sets preamble + layer0Question. */
  startGame: (playerName: string, email: string, password: string) => Promise<void>;
  /** Submit Q1 response. Returns the AI-generated Q2 prompt. */
  submitQ1: (q1Response: string) => Promise<string>;
  /** Submit Q2 response. Advances session to Layer 1. */
  submitQ2: (q2Response: string) => Promise<void>;
  /** Submit a choice by index and the displayed choice text. Returns isComplete flag. */
  makeChoice: (nodeId: string, choiceIndex: 0 | 1 | 2, chosenText?: string) => Promise<boolean>;
  /** Hydrate state from an existing sessionId (resume flow). Returns the phase. */
  resumeSession: (explicitId?: string) => Promise<SessionPhase>;
  /** Fetch and store results for a completed session. */
  loadResults: (sessionId: string) => Promise<ResultsResponse>;
  resetGame: () => void;
  hasActiveSession: () => boolean;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const SESSION_META_KEY = "hq-session-meta";

interface SessionMeta {
  sessionId: string;
  layer0Question?: string | null;
}

const initialState: GameState = {
  playerName: null,
  sessionId: null,
  preamble: null,
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

  const phase: SessionPhase = useMemo(() => {
    if (!state.sessionId) return "idle";
    if (state.isComplete) return "complete";
    if (!state.currentNode && (!state.clientState || state.clientState.layer <= 0)) return "layer0";
    return "active";
  }, [state]);

  const patch = (updates: Partial<GameState>) =>
    setState((prev) => ({ ...prev, ...updates }));

  // ── startGame ────────────────────────────────────────────────────────────────

  const startGame = async (playerName: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.start({ playerName, email, password });
      
      const meta: SessionMeta = {
        sessionId: res.sessionId,
        layer0Question: res.layer0Question,
      };
      localStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
      
      patch({
        playerName,
        sessionId: res.sessionId,
        preamble: res.preamble,
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

  // ── submitQ1 — submit Q1, receive AI-generated Q2 prompt ─────────────────────

  const submitQ1 = async (q1Response: string): Promise<string> => {
    if (!state.sessionId) throw new Error("No active session");
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.classifyQ1({ sessionId: state.sessionId, q1Response });
      return res.q2Prompt;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit Q1";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── submitQ2 — submit Q2, advance to Layer 1, then hydrate session ───────────
  // Immediately fetches the session after classification so /play gets the first
  // node without requiring a separate loading round-trip.

  const submitQ2 = async (q2Response: string): Promise<void> => {
    if (!state.sessionId) throw new Error("No active session");
    setIsLoading(true);
    setError(null);
    try {
      await api.classifyQ2({ sessionId: state.sessionId, q2Response });
      // Hydrate session immediately so /play gets the first node without a loading page
      const session = await api.session(state.sessionId);
      patch({
        clientState: session.clientState,
        currentNode: session.currentNode,
        isComplete: session.clientState.isComplete,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit Q2";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── makeChoice ────────────────────────────────────────────────────────────────

  const makeChoice = async (
    nodeId: string,
    choiceIndex: 0 | 1 | 2,
    chosenText?: string
  ): Promise<boolean> => {
    if (!state.sessionId) throw new Error("No active session");
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.choice({
        sessionId: state.sessionId,
        nodeId,
        choiceIndex,
        chosenText,
      });
      patch({
        clientState: res.clientState,
        currentNode: res.nextNode,
        isComplete: res.clientState.isComplete,
      });
      return res.clientState.isComplete;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit choice";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── resumeSession ──────────────────────────────────────────────────────────────

  const resumeSession = async (explicitId?: string): Promise<SessionPhase> => {
    let sessionId = explicitId;
    let layer0Question = null;
    
    if (!sessionId) {
      const metaStr = localStorage.getItem(SESSION_META_KEY);
      if (metaStr) {
        try {
          const meta: SessionMeta = JSON.parse(metaStr);
          sessionId = meta.sessionId;
          layer0Question = meta.layer0Question || null;
        } catch {
          // invalid json
        }
      }
    }
    // Fallback for migration
    if (!sessionId) {
      sessionId = localStorage.getItem("hq-session-id") || undefined;
    }

    if (!sessionId) return "idle";

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.session(sessionId);
      
      const meta: SessionMeta = { sessionId, layer0Question };
      localStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
      
      const isComplete = res.clientState.isComplete;
      const isLayer0 = !res.currentNode && (!res.clientState || res.clientState.layer <= 0) && !isComplete;
      
      patch({
        sessionId,
        layer0Question,
        clientState: res.clientState,
        currentNode: res.currentNode,
        isComplete,
      });
      
      if (isComplete) return "complete";
      if (isLayer0) return "layer0";
      return "active";
    } catch {
      localStorage.removeItem(SESSION_META_KEY);
      localStorage.removeItem("hq-session-id");
      setState(initialState);
      return "idle";
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
    localStorage.removeItem(SESSION_META_KEY);
    localStorage.removeItem("hq-session-id");
    setState(initialState);
  };

  const hasActiveSession = (): boolean => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(SESSION_META_KEY) || !!localStorage.getItem("hq-session-id");
  };

  return (
    <GameContext.Provider
      value={{
        state,
        phase,
        isLoading,
        error,
        startGame,
        submitQ1,
        submitQ2,
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
