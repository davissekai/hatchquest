# Hybrid Narrative Demo Hardening Plan

**Date:** 2026-04-16
**Goal:** Ship the strongest demo-ready HatchQuest flow by tightening Layer 0 assessment seeding, enriching deterministic skeleton content with AI-aware narration, and removing flow instability between classify → play → results.

---

## Scope Summary

This implementation will stay within the existing monorepo contract wherever possible:

- Keep the public API surface stable unless a blocker forces a contract change.
- Strengthen the deterministic assessment spine by seeding sector + EO profile from Layer 0 classification.
- Add backend narration that rewrites scenario/result text from world state with deterministic fallback when Anthropic is unavailable.
- Improve frontend hydration so the player reliably lands in a playable state after classification.
- Fix gameplay completion/state progression issues that make the end-to-end loop feel brittle.

---

## Dependency Graph

1. **Assessment seeding design** → required before route updates.
2. **Narration service** → required before backend routes can return enriched nodes/results.
3. **Route integration** → required before frontend hydration changes can rely on richer state.
4. **Frontend hydration/rendering** → required before browser verification.
5. **Regression tests + browser QA** → final gate.

---

## Task 1 — Upgrade Layer 0 assessment from node-only routing to seeded profile output
**Tier:** Critical

### Why
Right now `/classify` only chooses a Layer 1 node. It does not seed the player's sector or EO profile, so the hidden assessment starts from a flat midpoint and misses the strongest early signal in the demo.

### Failure mode enumeration
1. **Worst silent failure:** classifier keeps returning a node id, but sector/EO profile remain generic, so later divergence looks fake even though the flow works.
2. **Wrong-input risk:** broad keyword matching can misclassify sector or poles when the response is multi-part and narrative-heavy.
3. **Downstream effect if it fails mid-execution:** session advances to Layer 1 with inconsistent state (node chosen from one distribution, EO profile left neutral).
4. **Regression test coverage:** existing classifier tests cover node selection only; new tests must cover sector inference + EO profile seeding before implementation is considered complete.

### Code changes
- Expand `backend/src/engine/classifier.ts` to expose an internal assessment result containing:
  - pole distribution
  - inferred sector
  - seeded EO profile
  - Layer 1 node id
- Improve the fallback heuristic so it handles the richer Layer 0 prompt structure.
- Update `backend/src/routes/classify.ts` to persist the seeded sector and EO profile, not just `currentNodeId`.
- Replace the weak Layer 0 start prompt in `backend/src/routes/start.ts` with a richer single-string assessment prompt that acts like a deterministic questionnaire while preserving the current API contract.

### Required verification
- Extend classifier unit tests for sector inference and EO profile seeding.
- Keep the API response shape unchanged for `/start` and `/classify`.

---

## Task 2 — Add world-state-aware narration with Anthropic fallback
**Tier:** Critical

### Why
The current demo uses fixed node copy only. The ticket explicitly calls for world-state-aware Anthropic narration, but the flow must remain stable when the API is missing, slow, or malformed.

### Failure mode enumeration
1. **Worst silent failure:** AI rewrites scenario meaning or choice semantics, breaking assessment validity while still looking polished.
2. **Wrong-input risk:** raw world state may produce overly verbose or contradictory narration if prompts are not tightly constrained.
3. **Downstream effect if it fails mid-execution:** a route can stall or crash, blocking `/session`, `/choice`, or `/results`.
4. **Regression test coverage:** no narrator tests exist yet; add deterministic fallback tests before wiring routes.

### Code changes
- Create a backend narration module outside `src/engine/` to avoid engine coverage drift while keeping logic testable.
- Implement:
  - `narrateScenarioNode(baseNode, worldState)`
  - `narrateResultsSummary(worldState)`
  - deterministic fallback builders that preserve semantics and append contextual detail from state
  - Anthropic call with strict timeout + null-on-failure behavior
- Ensure narration only rewrites narrative/summary text and never mutates choice indices or tension hints.
- Reuse existing scenario narratives as deterministic skeletons rather than changing the client contract.

### Required verification
- Add narrator unit tests covering deterministic fallback output.
- Ensure every internet-dependent branch has a deterministic fallback.

---

## Task 3 — Integrate narration + completion safety into backend routes
**Tier:** Elevated

### Why
The narrative layer must reach the frontend through the real routes, and the current choice flow has a brittle completion transition that can leave the game at layer 6 with awkward final state.

### Code changes
- Update `backend/src/routes/session.ts` to narrate the current node before returning it.
- Update `backend/src/routes/choice.ts` to:
  - narrate the next node before sending it
  - clamp completion state so the final completed session remains at layer 5
  - clear `currentNodeId` on completion instead of leaving stale node state behind
- Update `backend/src/routes/results.ts` to use narrated/deterministic enriched summary text.
- Keep race-condition protections intact.

### Required verification
- Verify response shape matches `packages/shared/src/types/api.ts`.
- Extend route integration tests for final layer handling and narrated responses.

---

## Task 4 — Stabilize frontend hydration and richer Layer 0/play rendering
**Tier:** Elevated

### Why
Even if the backend is correct, the demo feels weak if the player has to rely on a resume round-trip to see the first node or if richer Layer 0 content renders poorly.

### Code changes
- Update `frontend/src/context/GameContext.tsx` so `classifyLayer0()` hydrates the session immediately after classification and stores the first playable node.
- Update `frontend/src/app/layer0/page.tsx` to render the richer multiline assessment prompt cleanly.
- Update `frontend/src/app/play/page.tsx` to preserve line breaks in narrated scenario text.
- Keep existing API types intact unless a blocker emerges.

### Required verification
- Extend `frontend/src/__tests__/GameContext.test.tsx` for classify hydration.
- Browser-verify create → layer0 → play → results flow.

---

## Task 5 — Final verification and adversarial review
**Tier:** Elevated

### Checklist
- [ ] Classifier fallback still works with no `ANTHROPIC_API_KEY`.
- [ ] Scenario narration never changes choice ordering or hints.
- [ ] Completed sessions end at layer 5, not 6.
- [ ] `currentNodeId` does not leak stale final-node state after completion.
- [ ] `/results` still hides EO profile until completion.
- [ ] Frontend can start, classify, play through, and reach results without manual storage hacks.
- [ ] Browser QA completed against running frontend/backend.

### Required verification
- API route change: verify response shape matches `packages/shared/src/types/api.ts`.
- Engine/classifier change: keep unit coverage for pure logic intact.
- Frontend: browser smoke test the full loop.
