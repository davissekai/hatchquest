import { describe, it, expect } from "vitest";
import { createPRNG } from "../prng.js";

describe("createPRNG", () => {
  it("returns a function", () => {
    const rng = createPRNG(42);
    expect(typeof rng).toBe("function");
  });

  it("produces deterministic output for the same seed", () => {
    const rng1 = createPRNG(12345);
    const rng2 = createPRNG(12345);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it("produces different output for different seeds", () => {
    const rng1 = createPRNG(1);
    const rng2 = createPRNG(2);
    const val1 = rng1();
    const val2 = rng2();
    expect(val1).not.toBe(val2);
  });

  it("returns values in [0, 1)", () => {
    const rng = createPRNG(999);
    for (let i = 0; i < 1000; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("produces reasonable distribution (not stuck at one value)", () => {
    const rng = createPRNG(42);
    const values = Array.from({ length: 100 }, () => rng());
    const unique = new Set(values.map((v) => Math.floor(v * 10)));
    // Should hit at least 5 of the 10 buckets
    expect(unique.size).toBeGreaterThanOrEqual(5);
  });
});
