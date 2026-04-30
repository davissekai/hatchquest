/**
 * Skeleton content validation — structural correctness of all registered skeletons.
 *
 * These tests catch authoring errors (wrong EO dimension names, missing fields,
 * all-positive effects) that type-checking alone cannot catch.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getAllSkeletons, getSkeletonEffect } from "../registry.js";
import { initSkeletonRegistry } from "../init.js";

// Use initSkeletonRegistry rather than registerLayer1 directly — idempotent across
// test files that share module state in Vitest's single-process run.
beforeAll(() => {
  initSkeletonRegistry();
});

const VALID_EO_DIMS = new Set([
  "autonomy",
  "innovativeness",
  "riskTaking",
  "proactiveness",
  "competitiveAggressiveness",
]);

describe("Layer 1 skeleton content validation", () => {
  it("has exactly 5 Layer 1 skeletons", () => {
    const l1 = getAllSkeletons().filter((e) => e.skeleton.layer === 1);
    expect(l1).toHaveLength(5);
  });

  it("every skeleton has exactly 3 choice archetypes", () => {
    for (const entry of getAllSkeletons()) {
      expect(entry.skeleton.choiceArchetypes).toHaveLength(3);
    }
  });

  it("every skeleton has exactly 3 effects", () => {
    for (const entry of getAllSkeletons()) {
      expect(entry.effects).toHaveLength(3);
    }
  });

  it("every skeleton has a non-empty situationSeed (>20 chars)", () => {
    for (const entry of getAllSkeletons()) {
      expect(entry.skeleton.situationSeed.length).toBeGreaterThan(20);
    }
  });

  it("every choice archetype has non-empty required fields", () => {
    for (const entry of getAllSkeletons()) {
      for (const arch of entry.skeleton.choiceArchetypes) {
        expect(arch.eoPoleSignal.length).toBeGreaterThan(0);
        expect(arch.archetypeDescription.length).toBeGreaterThan(10);
        expect(arch.tensionAxis.length).toBeGreaterThan(0);
      }
    }
  });

  it("every effect has valid eoDeltas keys (no typos)", () => {
    for (const entry of getAllSkeletons()) {
      for (const effect of entry.effects) {
        for (const key of Object.keys(effect.eoDeltas)) {
          expect(VALID_EO_DIMS.has(key), `Invalid EO dimension: "${key}" in ${entry.skeleton.id}`).toBe(true);
        }
      }
    }
  });

  it("no L1–L4 choice has all-positive effects (every choice must have a cost)", () => {
    for (const entry of getAllSkeletons()) {
      if (entry.skeleton.layer >= 1 && entry.skeleton.layer <= 4) {
        for (const effect of entry.effects) {
          const worldValues = [
            effect.capital,
            effect.revenue,
            effect.debt,
            effect.monthlyBurn,
            effect.reputation,
            effect.networkStrength,
          ];
          const eoDeltaValues = Object.values(effect.eoDeltas);
          const allPositive =
            worldValues.every((v) => v >= 0) && eoDeltaValues.every((v) => v >= 0);
          expect(allPositive, `${entry.skeleton.id} has an all-positive effect`).toBe(false);
        }
      }
    }
  });

  it("getSkeletonEffect returns the correct effect for each choice index", () => {
    for (const entry of getAllSkeletons()) {
      for (const idx of [0, 1, 2] as const) {
        const effect = getSkeletonEffect(entry.skeleton.id, idx);
        expect(effect).toEqual(entry.effects[idx]);
      }
    }
  });

  it("all Layer 1 skeleton ids are L1-node-{1..5}", () => {
    const l1Ids = getAllSkeletons()
      .filter((e) => e.skeleton.layer === 1)
      .map((e) => e.skeleton.id)
      .sort();
    expect(l1Ids).toEqual(["L1-node-1", "L1-node-2", "L1-node-3", "L1-node-4", "L1-node-5"]);
  });
});
