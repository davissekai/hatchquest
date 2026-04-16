import { registerLayer1 } from "./layer-1.js";

let _initialized = false;

/**
 * Registers all skeleton layers into the global registry.
 * Called once at app startup and idempotent — safe to call multiple times
 * (e.g., from repeated buildApp calls in tests).
 *
 * Add registerLayer2(), registerLayer3(), etc. as content layers are written.
 */
export function initSkeletonRegistry(): void {
  if (_initialized) return;
  _initialized = true;
  registerLayer1();
  // registerLayer2();
  // registerLayer3();
  // registerLayer4();
  // registerLayer5();
}
