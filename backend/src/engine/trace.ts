import type { WorldState, EODimension } from "@hatchquest/shared";

export interface EODimensionUpdate {
  priorMean: number;
  posteriorMean: number;
  priorVar: number;
  posteriorVar: number;
}

export interface TurnTrace {
  turn: number;
  layer: number;
  nodeId: string;
  worldStateBefore: WorldState;
  worldStateAfter: WorldState;
  eventsFired: Array<{ id: string; weight: number }>;
  choiceIndex: number;
  difficulty: number;
  eoUpdates: Record<EODimension, EODimensionUpdate>;
  narrationSource: "llm" | "fallback" | "validator-rejected";
  narrationLatencyMs: number;
}

// In-memory ring buffer: max 50 traces per session
const traceStore = new Map<string, TurnTrace[]>();
const MAX_TRACES = 50;

export function recordTurn(sessionId: string, trace: TurnTrace): void {
  const existing = traceStore.get(sessionId) ?? [];
  if (existing.length >= MAX_TRACES) existing.shift();
  existing.push(trace);
  traceStore.set(sessionId, existing);
}

export function getTrace(sessionId: string): TurnTrace[] {
  return traceStore.get(sessionId) ?? [];
}
