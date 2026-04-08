import type {
  StartRequest,
  StartResponse,
  ClassifyRequest,
  ClassifyResponse,
  ChoiceRequest,
  ChoiceResponse,
  SessionResponse,
  ResultsResponse,
} from "@hatchquest/shared";

// Base URL for the Fastify backend.
// Set NEXT_PUBLIC_BACKEND_URL in Vercel env vars to the Railway deployment URL.
// Falls back to localhost:3001 for local dev.
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

/** Generic request helper — throws with server error message on non-2xx. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** Typed API client for the HatchQuest Fastify backend. */
export const api = {
  /** POST /api/game/start — create a new session, receive the Layer 0 question. */
  start: (body: StartRequest): Promise<StartResponse> =>
    request<StartResponse>("/api/game/start", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** POST /api/game/classify — submit free-text Layer 0 response, route to Layer 1 node. */
  classify: (body: ClassifyRequest): Promise<ClassifyResponse> =>
    request<ClassifyResponse>("/api/game/classify", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** POST /api/game/choice — submit choice index for the current node. */
  choice: (body: ChoiceRequest): Promise<ChoiceResponse> =>
    request<ChoiceResponse>("/api/game/choice", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** GET /api/game/session/:sessionId — load current state (resume / reconnect). */
  session: (sessionId: string): Promise<SessionResponse> =>
    request<SessionResponse>(
      `/api/game/session/${encodeURIComponent(sessionId)}`
    ),

  /** GET /api/game/results/:sessionId — load final EO profile (only when isComplete). */
  results: (sessionId: string): Promise<ResultsResponse> =>
    request<ResultsResponse>(
      `/api/game/results/${encodeURIComponent(sessionId)}`
    ),
};
