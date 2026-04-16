import type {
  StartRequest,
  StartResponse,
  ClassifyQ1Request,
  ClassifyQ1Response,
  ClassifyQ2Request,
  ClassifyQ2Response,
  ChoiceRequest,
  ChoiceResponse,
  SessionResponse,
  ResultsResponse,
} from "@hatchquest/shared";

// All requests go through Next.js rewrites → Fastify backend.
// In dev: Next.js proxies /api/game/* to localhost:3001.
// In prod: Next.js proxies to NEXT_PUBLIC_BACKEND_URL (Railway URL).
// No CORS issues — browser always talks to the same origin.
const BASE_URL = "";

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

  /** POST /api/game/classify-q1 — submit Q1 response, receive AI-generated Q2 prompt. */
  classifyQ1: (body: ClassifyQ1Request): Promise<ClassifyQ1Response> =>
    request<ClassifyQ1Response>("/api/game/classify-q1", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** POST /api/game/classify-q2 — submit Q2 response, route to Layer 1 node. */
  classifyQ2: (body: ClassifyQ2Request): Promise<ClassifyQ2Response> =>
    request<ClassifyQ2Response>("/api/game/classify-q2", {
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
