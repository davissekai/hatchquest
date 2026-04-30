/**
 * Skeleton registry — replaces scenario-registry.ts.
 *
 * A RegisteredSkeleton pairs the EO-valid skeleton structure with its
 * pre-written mechanical effects. Effects are fixed (not AI-generated)
 * because they define the game mechanics; only the narrative is skinned.
 *
 * Layer modules (layer-1.ts, layer-2.ts, etc.) call registerSkeleton
 * at module load time. The registry is populated by importing layer modules
 * at app startup before any routes are registered.
 */
import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

/** A skeleton paired with its three pre-written mechanical effects. */
export interface RegisteredSkeleton {
  skeleton: ScenarioSkeleton;
  effects: [ChoiceEffect, ChoiceEffect, ChoiceEffect];
}

// Master registry — keyed by skeleton id
const REGISTRY = new Map<string, RegisteredSkeleton>();

/**
 * Registers a skeleton. Throws if the id is already taken.
 * Called by layer modules at import time.
 */
export function registerSkeleton(entry: RegisteredSkeleton): void {
  if (REGISTRY.has(entry.skeleton.id)) {
    throw new Error(`Duplicate skeleton id: ${entry.skeleton.id}`);
  }
  REGISTRY.set(entry.skeleton.id, entry);
}

/** Returns a registered skeleton by id, or null if not found. */
export function getSkeleton(id: string): RegisteredSkeleton | null {
  return REGISTRY.get(id) ?? null;
}

/** Returns the ChoiceEffect for a given skeleton id and choice index, or null if not found. */
export function getSkeletonEffect(
  id: string,
  choiceIndex: 0 | 1 | 2
): ChoiceEffect | null {
  const entry = REGISTRY.get(id);
  if (!entry) return null;
  return entry.effects[choiceIndex] ?? null;
}

/** Returns all registered skeletons. */
export function getAllSkeletons(): RegisteredSkeleton[] {
  return Array.from(REGISTRY.values());
}

/** Returns all skeletons for a given layer. */
export function getSkeletonsForLayer(layer: number): RegisteredSkeleton[] {
  return getAllSkeletons().filter((e) => e.skeleton.layer === layer);
}
