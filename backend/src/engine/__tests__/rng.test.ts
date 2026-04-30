import { describe, it, expect } from "vitest";
import { createPRNG } from "../rng.js";

// rng.ts is a thin re-export of createPRNG from prng.ts.
// Tests here verify the re-export is callable and produces the same behavior
// as documented in prng.test.ts.

describe("createPRNG (re-exported from rng.ts)", () => {
  it("is importable from rng.ts", () => {
    expect(typeof createPRNG).toBe("function");
  });

  it("returns a function that produces numbers in [0, 1)", () => {
    const rng = createPRNG(42);
    for (let i = 0; i < 20; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("is deterministic — same seed produces same sequence", () => {
    const rng1 = createPRNG(99);
    const rng2 = createPRNG(99);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("different seeds produce different sequences", () => {
    const rng1 = createPRNG(1);
    const rng2 = createPRNG(2);
    const results1 = Array.from({ length: 5 }, () => rng1());
    const results2 = Array.from({ length: 5 }, () => rng2());
    expect(results1).not.toEqual(results2);
  });
});
