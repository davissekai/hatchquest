import React from "react";
import { render, screen, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import Layer0LoadingPage from "../app/layer0/loading/page";
import { useGame } from "../context/GameContext";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("../context/GameContext", () => ({
  useGame: vi.fn(),
}));

// Mock the RetroTransition to just call onComplete immediately for testing
vi.mock("@/components/RetroTransition", () => ({
  default: ({ onComplete }: any) => {
    // We can manually trigger it to test the callback
    return <div data-testid="retro-transition" onClick={onComplete} />;
  },
}));

describe("Layer0LoadingPage", () => {
  const mockReplace = vi.fn();
  const mockHasActiveSession = vi.fn();
  const mockResumeSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({ replace: mockReplace });
    (useGame as Mock).mockReturnValue({
      hasActiveSession: mockHasActiveSession,
      resumeSession: mockResumeSession,
    });
  });

  it("redirects to /create if no active session", () => {
    mockHasActiveSession.mockReturnValue(false);
    render(<Layer0LoadingPage />);
    expect(mockReplace).toHaveBeenCalledWith("/create");
    expect(mockResumeSession).not.toHaveBeenCalled();
  });

  it("hydrates session and replaces to /play when transition completes", () => {
    mockHasActiveSession.mockReturnValue(true);
    render(<Layer0LoadingPage />);
    expect(mockResumeSession).toHaveBeenCalled();

    // Trigger onComplete
    const transition = screen.getByTestId("retro-transition");
    act(() => {
      transition.click();
    });

    expect(mockReplace).toHaveBeenCalledWith("/play");
  });
});
