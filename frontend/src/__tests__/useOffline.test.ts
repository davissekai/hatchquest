import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useOffline } from "@/hooks/useOffline";

describe("useOffline", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when navigator.onLine is true", () => {
    const { result } = renderHook(() => useOffline());
    expect(result.current).toBe(false);
  });

  it("returns true when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", { writable: true, value: false });
    const { result } = renderHook(() => useOffline());
    expect(result.current).toBe(true);
  });

  it("updates to true when offline event fires", () => {
    const { result } = renderHook(() => useOffline());
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(true);
  });

  it("updates back to false when online event fires", () => {
    Object.defineProperty(navigator, "onLine", { writable: true, value: false });
    const { result } = renderHook(() => useOffline());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(false);
  });
});
