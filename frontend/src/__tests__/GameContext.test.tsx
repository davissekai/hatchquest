import { renderHook, act } from '@testing-library/react';
import { GameProvider, useGame } from '../context/GameContext';
import { api } from '../lib/api';
import type { ClientWorldState, ScenarioNode } from '@hatchquest/shared';
import React from 'react';
import { vi, describe, it, expect, beforeEach, Mocked } from 'vitest';

const mockClientState: ClientWorldState = {
  layer: 0,
  capital: 0,
  networkStrength: 0,
  reputation: 0,
  isComplete: false,
  turnsElapsed: 0,
  monthlyBurn: 0,
  revenue: 0,
  debt: 0,
  playerBusinessName: null,
  employeeCount: 0,
  businessFormality: "unregistered",
  hasBackupPower: false,
  hasPremises: false,
  susuMember: false,
  mentorAccess: false,
};

// Mock the API calls
vi.mock('../lib/api', () => ({
  api: {
    start: vi.fn(),
    classify: vi.fn(),
    choice: vi.fn(),
    session: vi.fn(),
    results: vi.fn(),
  }
}));

const mockApi = api as Mocked<typeof api>;

describe('GameContext State Machine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GameProvider>{children}</GameProvider>
  );

  it('startGame persists sessionId and layer0Question', async () => {
    mockApi.start.mockResolvedValueOnce({
      sessionId: 'sess-123',
      preamble: 'Test preamble', layer0Question: 'What is your goal?',
    });

    const { result } = renderHook(() => useGame(), { wrapper });

    await act(async () => {
      await result.current.startGame('Player1', 'test@test.com', 'password');
    });

    expect(result.current.state.sessionId).toBe('sess-123');
    expect(result.current.state.layer0Question).toBe('What is your goal?');

    const metaStr = localStorage.getItem('hq-session-meta');
    expect(metaStr).not.toBeNull();
    const meta = JSON.parse(metaStr!);
    expect(meta.sessionId).toBe('sess-123');
    expect(meta.layer0Question).toBe('What is your goal?');
  });

  it('resumeSession correctly restores phase to layer0', async () => {
    localStorage.setItem('hq-session-meta', JSON.stringify({
      sessionId: 'sess-456',
      layer0Question: 'A question?'
    }));

    // Before classification, currentNode is null and layer <= 0
    mockApi.session.mockResolvedValueOnce({
      sessionId: 'sess-456',
      clientState: { ...mockClientState },
      currentNode: null,
    });

    const { result } = renderHook(() => useGame(), { wrapper });

    let phase;
    await act(async () => {
      phase = await result.current.resumeSession();
    });

    expect(phase).toBe('layer0');
    expect(result.current.phase).toBe('layer0');
    expect(result.current.state.sessionId).toBe('sess-456');
    expect(result.current.state.layer0Question).toBe('A question?');
  });

  it('resumeSession correctly restores phase to active', async () => {
    localStorage.setItem('hq-session-meta', JSON.stringify({
      sessionId: 'sess-789',
    }));

    const node: ScenarioNode = { id: 'node-1', layer: 1, narrative: 'Text', choices: [] };
    mockApi.session.mockResolvedValueOnce({
      sessionId: 'sess-789',
      clientState: { ...mockClientState, layer: 1, capital: 1000, networkStrength: 10, reputation: 10, turnsElapsed: 1 },
      currentNode: node,
    });

    const { result } = renderHook(() => useGame(), { wrapper });

    let phase;
    await act(async () => {
      phase = await result.current.resumeSession();
    });

    expect(phase).toBe('active');
    expect(result.current.phase).toBe('active');
  });

  it('resumeSession correctly restores phase to complete', async () => {
    localStorage.setItem('hq-session-meta', JSON.stringify({
      sessionId: 'sess-999',
    }));

    mockApi.session.mockResolvedValueOnce({
      sessionId: 'sess-999',
      clientState: { ...mockClientState, layer: 5, capital: 50000, networkStrength: 80, reputation: 80, isComplete: true, turnsElapsed: 15 },
      currentNode: null,
    });

    const { result } = renderHook(() => useGame(), { wrapper });

    let phase;
    await act(async () => {
      phase = await result.current.resumeSession();
    });

    expect(phase).toBe('complete');
    expect(result.current.phase).toBe('complete');
  });
});
