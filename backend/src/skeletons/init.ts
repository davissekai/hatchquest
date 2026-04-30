import { registerLayer1 } from "./layer-1.js";
import { registerLayer2 } from "./layer-2.js";
import { registerLayer3 } from "./layer-3.js";
import { registerLayer4 } from "./layer-4.js";
import { registerLayer5 } from "./layer-5.js";
import { registerLayer6 } from "./layer-6.js";
import { registerLayer7 } from "./layer-7.js";
import { registerLayer8 } from "./layer-8.js";
import { registerLayer9 } from "./layer-9.js";
import { registerLayer10 } from "./layer-10.js";

let _initialized = false;

/**
 * Registers all skeleton layers into the global registry.
 * Idempotent — safe to call multiple times (e.g., from repeated buildApp calls in tests).
 */
export function initSkeletonRegistry(): void {
  if (_initialized) return;
  _initialized = true;
  registerLayer1();
  registerLayer2();
  registerLayer3();
  registerLayer4();
  registerLayer5();
  registerLayer6();
  registerLayer7();
  registerLayer8();
  registerLayer9();
  registerLayer10();
}
