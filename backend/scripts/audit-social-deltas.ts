/**
 * Audit cumulative Network + Reputation deltas across a greedy
 * max-network (and max-reputation) playthrough over layers 1-10.
 *
 * Not a test. Run with:
 *   npx tsx backend/scripts/audit-social-deltas.ts
 */
import { initSkeletonRegistry } from "../src/skeletons/init.js";
import { getSkeletonsForLayer } from "../src/skeletons/registry.js";
import type { ChoiceEffect } from "../src/engine/apply-choice.js";

interface Pick {
  nodeId: string;
  layer: number;
  choiceIndex: number;
  net: number;
  rep: number;
}

function pickGreedy(
  field: "networkStrength" | "reputation"
): { total: number; path: Pick[] } {
  initSkeletonRegistry();
  let total = 0;
  let repTotal = 0;
  const path: Pick[] = [];

  for (let layer = 1; layer <= 10; layer++) {
    const entries = getSkeletonsForLayer(layer);
    if (entries.length === 0) continue;

    // For each layer, the player sees exactly one skeleton and picks one
    // choice. To get the true ceiling we pretend the player always gets
    // offered the skeleton whose max-delta choice is the largest.
    let best: {
      nodeId: string;
      choiceIndex: number;
      effect: ChoiceEffect;
    } | null = null;

    for (const e of entries) {
      for (let i = 0; i < 3; i++) {
        const eff = e.effects[i];
        if (!eff) continue;
        const candidate = eff[field];
        const currentBest = best ? best.effect[field] : -Infinity;
        if (candidate > currentBest) {
          best = { nodeId: e.skeleton.id, choiceIndex: i, effect: eff };
        }
      }
    }

    if (!best) continue;
    total += best.effect[field];
    repTotal += best.effect.reputation;
    path.push({
      nodeId: best.nodeId,
      layer,
      choiceIndex: best.choiceIndex,
      net: best.effect.networkStrength,
      rep: best.effect.reputation,
    });
  }

  // When auditing networkStrength, "total" is the greedy network sum.
  // When auditing reputation, swap meanings — caller picks which.
  return { total: field === "networkStrength" ? total : repTotal, path };
}

function main(): void {
  const net = pickGreedy("networkStrength");
  const rep = pickGreedy("reputation");

  console.log("=== Max-Network Greedy Path ===");
  console.log(`Cumulative network delta (starts at 0, ceiling 100): ${net.total}`);
  for (const p of net.path) {
    console.log(
      `  L${p.layer}  ${p.nodeId}  choice ${p.choiceIndex}  net=+${p.net}  rep=${p.rep >= 0 ? "+" : ""}${p.rep}`
    );
  }

  console.log("\n=== Max-Reputation Greedy Path ===");
  console.log(`Cumulative reputation delta (starts at 0, ceiling 100): ${rep.total}`);
  for (const p of rep.path) {
    console.log(
      `  L${p.layer}  ${p.nodeId}  choice ${p.choiceIndex}  rep=+${p.rep}  net=${p.net >= 0 ? "+" : ""}${p.net}`
    );
  }
}

main();
