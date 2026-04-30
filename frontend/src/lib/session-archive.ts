/**
 * localStorage ring buffer storing the last 2 completed sessions.
 * Used by the results page to render a dual-run comparison panel.
 * Capped at MAX_SESSIONS to avoid unbounded storage growth.
 */
import type { EOProfile, ClientWorldState } from "@hatchquest/shared";

export interface ArchivedSession {
  sessionId: string;
  completedAt: string; // ISO timestamp
  eoProfile: EOProfile;
  capital: number;
  reputation: number;
  networkStrength: number;
  score: number; // mean EO * 10
}

const ARCHIVE_KEY = "hq-session-archive";
const MAX_SESSIONS = 2;

/**
 * Persist a completed session into the ring buffer.
 * Deduplicates by sessionId so a page re-render never duplicates an entry.
 */
export function archiveSession(
  sessionId: string,
  eoProfile: EOProfile,
  clientState: ClientWorldState
): void {
  const score = (Object.values(eoProfile).reduce((a, b) => a + b, 0) / 5) * 10;
  const entry: ArchivedSession = {
    sessionId,
    completedAt: new Date().toISOString(),
    eoProfile,
    capital: clientState.capital,
    reputation: clientState.reputation,
    networkStrength: clientState.networkStrength,
    score,
  };

  const existing = loadArchive();
  const updated = [entry, ...existing.filter((s) => s.sessionId !== sessionId)].slice(0, MAX_SESSIONS);
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
  } catch {
    // Storage quota — skip silently
  }
}

/**
 * Read the ring buffer from localStorage.
 * Returns an empty array if storage is unavailable or data is corrupt.
 */
export function loadArchive(): ArchivedSession[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ArchivedSession[];
  } catch {
    return [];
  }
}
