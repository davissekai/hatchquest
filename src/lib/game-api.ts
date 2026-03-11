import {
  StartSessionResponse,
  SessionResponse,
  ChoiceResponse,
  ResultsResponse,
  GlobalState
} from "../types/game";
import { getMockSessionResponse, playMockChoice } from "../__mocks__/api";

const USE_MOCKS = true;

let mockCurrentState: GlobalState | null = null;

export async function startGame(token: string): Promise<StartSessionResponse> {
  if (USE_MOCKS) {
    await new Promise(resolve => setTimeout(resolve, 800));
    const res = getMockSessionResponse();
    mockCurrentState = res.state;
    return {
      sessionId: res.sessionId,
      state: res.state,
      narrative: res.narrative
    };
  }

  const response = await fetch("/api/game/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to start game: ${response.statusText}`);
  }

  return response.json();
}

export async function getCurrentSession(token: string): Promise<SessionResponse> {
  if (USE_MOCKS) {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (!mockCurrentState) {
      const res = getMockSessionResponse();
      mockCurrentState = res.state;
    }
    // We ideally should return the narrative corresponding to mockCurrentState.session.currentNarrativeId,
    // but the getMockSessionResponse returns N_001. We would need a more robust loader here if we paused mid-game.
    // Assuming simple behavior since it's a mock.
    return getMockSessionResponse();
  }

  const response = await fetch("/api/game/session", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get session: ${response.statusText}`);
  }

  return response.json();
}

export async function submitChoice(token: string, payload: { choiceId: string }): Promise<ChoiceResponse> {
  if (USE_MOCKS) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    if (!mockCurrentState) {
      throw new Error("No active mock session");
    }
    const res = playMockChoice(mockCurrentState, payload.choiceId);
    mockCurrentState = res.state;
    return res;
  }

  const response = await fetch("/api/game/choice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to submit choice: ${response.statusText}`);
  }

  return response.json();
}

export async function getSessionResults(token: string, sessionId: string): Promise<ResultsResponse> {
  if (USE_MOCKS) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      sessionId,
      state: mockCurrentState || getMockSessionResponse().state,
      completedAt: new Date().toISOString()
    };
  }

  const response = await fetch(`/api/game/results/${sessionId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get results: ${response.statusText}`);
  }

  return response.json();
}
