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
  worldSignals: {
    marketHeat: 50,
    competitorThreat: 50,
    infrastructureStability: 50,
    lastEventLabel: null,
  },
};

// Mock the API calls
vi.mock('../lib/api', () => ({
  api: {
    start: vi.fn(),
    classifyQ1: vi.fn(),
    classifyQ2: vi.fn(),
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
      preamble: 'Test preamble',
      layer0Question: 'What is your goal?',
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

  it('submitQ1 returns q2Prompt and submitQ2 completes classification', async () => {
    mockApi.start.mockResolvedValueOnce({
      sessionId: 'sess-234',
      preamble: 'Accra, 2026.',
      layer0Question: 'What are you building?',
    });
    mockApi.classifyQ1.mockResolvedValueOnce({
      sessionId: 'sess-234',
      q2Prompt: 'Your supplier just backed out. What do you do?',
    });
    mockApi.classifyQ2.mockResolvedValueOnce({
      sessionId: 'sess-234',
      layer1NodeId: 'L1-node-1',
    });
    mockApi.session.mockResolvedValueOnce({
      sessionId: 'sess-234',
      clientState: { ...mockClientState, layer: 1 },
      currentNode: {
        id: 'L1-node-1',
        layer: 1,
        narrative: 'Test scenario',
        choices: [
          { index: 0, text: 'Choice A', tensionHint: 'hint A' },
          { index: 1, text: 'Choice B', tensionHint: 'hint B' },
          { index: 2, text: 'Choice C', tensionHint: 'hint C' },
        ],
      },
    });

    const { result } = renderHook(() => useGame(), { wrapper });

    await act(async () => {
      await result.current.startGame('Player1', 'test@test.com', 'password');
    });

    let q2Prompt: string | undefined;
    await act(async () => {
      q2Prompt = await result.current.submitQ1('I am building a fintech app.');
    });
    expect(q2Prompt).toBe('Your supplier just backed out. What do you do?');

    await act(async () => {
      await result.current.submitQ2('I would call my backup vendor.');
    });

    expect(mockApi.classifyQ1).toHaveBeenCalledWith({
      sessionId: 'sess-234',
      q1Response: 'I am building a fintech app.',
    });
    expect(mockApi.classifyQ2).toHaveBeenCalledWith({
      sessionId: 'sess-234',
      q2Response: 'I would call my backup vendor.',
    });
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
