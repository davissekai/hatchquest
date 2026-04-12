# Tasks 3 & 4 — Error Handling & Edge Cases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden HatchQuest against API/DB failure states, silent error swallowing, and missing UI feedback for empty/loading/offline states.

**Architecture:** Two parallel, independent tracks — Track A patches two backend routes (classify 409 guard + results 409 status); Track B adds frontend components (ErrorBanner, LoadingOverlay, offline hook) and wires them into the play, create, and results pages. Tracks share no files and can be executed simultaneously.

**Tech Stack:** Fastify (backend), Next.js 15 App Router + React (frontend), Vitest + React Testing Library (tests), Tailwind CSS + existing design tokens

---

## File Map

### Track A — Backend

| File | Action | What changes |
|---|---|---|
| `backend/src/routes/classify.ts` | Modify | Add 409 guard: reject if session already has a `currentNodeId` |
| `backend/src/routes/results.ts` | Modify | Change 400 → 409 for "game not complete" response |
| `backend/src/routes/__tests__/error-handling.test.ts` | Modify | Add 2 test cases for the above |

### Track B — Frontend

| File | Action | What changes |
|---|---|---|
| `frontend/src/components/ErrorBanner.tsx` | Create | Reusable error display with optional retry button |
| `frontend/src/components/LoadingOverlay.tsx` | Create | Full-screen loading indicator with retro styling |
| `frontend/src/hooks/useOffline.ts` | Create | Detects browser online/offline state |
| `frontend/src/components/OfflineBanner.tsx` | Create | Persistent banner shown when offline |
| `frontend/src/app/layout.tsx` | Modify | Mount OfflineBanner globally |
| `frontend/src/app/play/page.tsx` | Modify | Wire error display, empty state, and loading overlay |
| `frontend/src/app/results/page.tsx` | Modify | Wire error display and loading state |
| `frontend/src/__tests__/ErrorBanner.test.tsx` | Create | Unit tests for ErrorBanner |
| `frontend/src/__tests__/useOffline.test.ts` | Create | Unit tests for useOffline hook |

---

## Track A — Backend

### Task A1: Guard against double-classification in classify.ts

**Files:**
- Modify: `backend/src/routes/classify.ts`
- Modify: `backend/src/routes/__tests__/error-handling.test.ts`

The `/classify` route currently overwrites the world state even if the session was already classified. A second call silently resets the player's Layer 1 node. It should return 409.

- [ ] **Step 1: Write the failing test**

Open `backend/src/routes/__tests__/error-handling.test.ts` and add this test at the bottom of the file (inside the existing describe block or a new one):

```typescript
describe("POST /classify — double-classification guard", () => {
  it("returns 409 when session is already classified", async () => {
    // Arrange: create a session that already has a currentNodeId set
    const store = new DbSessionStore(testDb);
    const session = await store.createSession("Ama", "ama@test.com");
    // Manually advance to Layer 1 so currentNodeId is non-null
    await store.updateSession(session.id, {
      worldState: {
        ...session.worldState,
        layer: 1,
        currentNodeId: "L1_NODE_1",
      },
    });

    const app = buildApp(store);
    await app.ready();

    // Act: attempt to classify again
    const res = await app.inject({
      method: "POST",
      url: "/api/game/classify",
      payload: { sessionId: session.id, response: "I want to build a fintech startup." },
    });

    // Assert
    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.payload) as { error: string };
    expect(body.error).toMatch(/already classified/i);

    await app.close();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd C:/Users/P/PROJECTS/ProjectS/HQ-new
npm test --workspace=backend -- --reporter=verbose 2>&1 | grep -A 5 "double-classification"
```

Expected: FAIL — `expected 200 to be 409`

- [ ] **Step 3: Add the guard to classify.ts**

In `backend/src/routes/classify.ts`, inside the route handler, add this block immediately after resolving the session (after the `if (!session)` check):

```typescript
// --- Guard: reject if already classified (layer > 0 means /classify already ran) ---
if (session.worldState.layer > 0 || session.worldState.currentNodeId !== null) {
  return reply.status(409).send({ error: "Session is already classified." });
}
```

The full handler body should now read:

```typescript
async (request, reply) => {
  const { sessionId, response } = request.body;

  const session = await store.getSession(sessionId);
  if (!session) {
    return reply.status(404).send({ error: `Session not found: ${sessionId}` });
  }

  // Guard: reject if already classified
  if (session.worldState.layer > 0 || session.worldState.currentNodeId !== null) {
    return reply.status(409).send({ error: "Session is already classified." });
  }

  const layer1NodeId = await classify(response);

  await store.updateSession(sessionId, {
    worldState: {
      ...session.worldState,
      layer: 1,
      currentNodeId: layer1NodeId,
    },
  });

  return reply.status(200).send({ sessionId, layer1NodeId });
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd C:/Users/P/PROJECTS/ProjectS/HQ-new
npm test --workspace=backend -- --reporter=verbose 2>&1 | grep -A 5 "double-classification"
```

Expected: PASS

- [ ] **Step 5: Run full backend test suite to confirm no regressions**

```bash
npm test --workspace=backend
```

Expected: All tests pass (was 212 before this change).

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/classify.ts backend/src/routes/__tests__/error-handling.test.ts
git commit -m "fix: guard classify route against double-classification (409)"
```

---

### Task A2: Fix results.ts — use 409 for incomplete session

**Files:**
- Modify: `backend/src/routes/results.ts`
- Modify: `backend/src/routes/__tests__/error-handling.test.ts`

The results route returns 400 when the game is not complete. 400 means "bad request" (client error in request shape). The correct code is 409 (Conflict) — the session exists and is valid, but its state conflicts with the operation.

- [ ] **Step 1: Write the failing test**

Add to `backend/src/routes/__tests__/error-handling.test.ts`:

```typescript
describe("GET /results/:sessionId — incomplete session", () => {
  it("returns 409 when session is not yet complete", async () => {
    const store = new DbSessionStore(testDb);
    const session = await store.createSession("Kwame", "kwame@test.com");
    // Session is active (not complete) by default

    const app = buildApp(store);
    await app.ready();

    const res = await app.inject({
      method: "GET",
      url: `/api/game/results/${session.id}`,
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.payload) as { error: string };
    expect(body.error).toMatch(/not available until the game is complete/i);

    await app.close();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd C:/Users/P/PROJECTS/ProjectS/HQ-new
npm test --workspace=backend -- --reporter=verbose 2>&1 | grep -A 5 "incomplete session"
```

Expected: FAIL — `expected 400 to be 409`

- [ ] **Step 3: Fix the status code in results.ts**

In `backend/src/routes/results.ts`, find:

```typescript
if (!worldState.isComplete) {
  return reply
    .status(400)
    .send({ error: "Results are not available until the game is complete." });
}
```

Change `.status(400)` to `.status(409)`:

```typescript
if (!worldState.isComplete) {
  return reply
    .status(409)
    .send({ error: "Results are not available until the game is complete." });
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd C:/Users/P/PROJECTS/ProjectS/HQ-new
npm test --workspace=backend -- --reporter=verbose 2>&1 | grep -A 5 "incomplete session"
```

Expected: PASS

- [ ] **Step 5: Run full backend test suite**

```bash
npm test --workspace=backend
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/results.ts backend/src/routes/__tests__/error-handling.test.ts
git commit -m "fix: results route returns 409 (not 400) when session is incomplete"
```

---

## Track B — Frontend

### Task B1: Create ErrorBanner component

**Files:**
- Create: `frontend/src/components/ErrorBanner.tsx`
- Create: `frontend/src/__tests__/ErrorBanner.test.tsx`

A reusable error display component that shows the error string from GameContext. Shows nothing when `message` is null. Optionally shows a Retry button.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/__tests__/ErrorBanner.test.tsx`:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ErrorBanner from "@/components/ErrorBanner";

describe("ErrorBanner", () => {
  it("renders nothing when message is null", () => {
    const { container } = render(<ErrorBanner message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders error message when provided", () => {
    render(<ErrorBanner message="Connection failed" />);
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(<ErrorBanner message="Something went wrong" onRetry={onRetry} />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorBanner message="Something went wrong" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd C:/Users/P/PROJECTS/ProjectS/HQ-new
npm test --workspace=frontend -- --reporter=verbose ErrorBanner
```

Expected: FAIL — module not found

- [ ] **Step 3: Create the component**

Create `frontend/src/components/ErrorBanner.tsx`:

```typescript
"use client";

interface ErrorBannerProps {
  /** Error message to display. Renders nothing when null. */
  message: string | null;
  /** Optional callback — shows a Retry button when provided. */
  onRetry?: () => void;
}

/**
 * Displays a retro-styled error banner.
 * Renders null when message is null — safe to unconditionally mount.
 */
export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="w-full border-[3px] border-destructive bg-card px-4 py-3 shadow-brutal-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-body text-sm text-destructive leading-snug">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 border-[2px] border-destructive px-3 py-1 font-display text-xs tracking-wider text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            RETRY
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test --workspace=frontend -- --reporter=verbose ErrorBanner
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ErrorBanner.tsx frontend/src/__tests__/ErrorBanner.test.tsx
git commit -m "feat: add ErrorBanner component with optional retry"
```

---

### Task B2: Create LoadingOverlay component

**Files:**
- Create: `frontend/src/components/LoadingOverlay.tsx`

A full-screen retro loading overlay, conditionally rendered by the play page when `isLoading` is true outside of an active transition.

No separate test needed — it is a pure presentational component with no logic. Visual correctness verified by mounting in the play page.

- [ ] **Step 1: Create the component**

Create `frontend/src/components/LoadingOverlay.tsx`:

```typescript
"use client";

interface LoadingOverlayProps {
  /** Message to display below the spinner. */
  message?: string;
}

/**
 * Full-screen loading overlay in retro HatchQuest style.
 * Mount conditionally — renders a fixed overlay when mounted.
 */
export default function LoadingOverlay({
  message = "LOADING...",
}: LoadingOverlayProps) {
  return (
    <div
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/90"
    >
      <div className="scanlines pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Retro spinner — 4 rotating blocks */}
        <div className="grid grid-cols-2 gap-1.5 animate-spin-slow">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 w-4 border-[2px] border-primary bg-accent"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase animate-pulse">
          {message}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/LoadingOverlay.tsx
git commit -m "feat: add LoadingOverlay component"
```

---

### Task B3: Create useOffline hook and OfflineBanner

**Files:**
- Create: `frontend/src/hooks/useOffline.ts`
- Create: `frontend/src/components/OfflineBanner.tsx`
- Create: `frontend/src/__tests__/useOffline.test.ts`

Detects browser online/offline state and exposes a boolean. OfflineBanner mounts at the top of the screen when offline.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/__tests__/useOffline.test.ts`:

```typescript
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useOffline } from "@/hooks/useOffline";

describe("useOffline", () => {
  beforeEach(() => {
    // Simulate online state
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
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test --workspace=frontend -- --reporter=verbose useOffline
```

Expected: FAIL — module not found

- [ ] **Step 3: Create the hook**

Create `frontend/src/hooks/useOffline.ts`:

```typescript
"use client";

import { useState, useEffect } from "react";

/**
 * Returns true when the browser is offline.
 * Subscribes to window online/offline events and updates reactively.
 * Returns false during SSR (server is never "offline" in the browser sense).
 */
export function useOffline(): boolean {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !navigator.onLine;
  });

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return isOffline;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test --workspace=frontend -- --reporter=verbose useOffline
```

Expected: 4 tests pass.

- [ ] **Step 5: Create OfflineBanner**

Create `frontend/src/components/OfflineBanner.tsx`:

```typescript
"use client";

import { useOffline } from "@/hooks/useOffline";

/**
 * Renders a sticky banner at the top of the screen when the browser is offline.
 * Mount once in the root layout — renders nothing when online.
 */
export default function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 border-b-[3px] border-destructive bg-destructive/10 px-4 py-2 text-center"
    >
      <span className="font-display text-xs tracking-[0.25em] text-destructive uppercase">
        YOU ARE OFFLINE — Progress may not be saved
      </span>
    </div>
  );
}
```

- [ ] **Step 6: Mount OfflineBanner in layout.tsx**

Open `frontend/src/app/layout.tsx` and add the import and component:

```typescript
// Add this import at the top with other imports
import OfflineBanner from "@/components/OfflineBanner";
```

Then inside the `<body>` tag, add `<OfflineBanner />` as the first child:

```typescript
<body>
  <OfflineBanner />
  {/* ... existing children ... */}
</body>
```

- [ ] **Step 7: Run full frontend tests to confirm no regressions**

```bash
npm test --workspace=frontend
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/hooks/useOffline.ts frontend/src/components/OfflineBanner.tsx frontend/src/app/layout.tsx frontend/src/__tests__/useOffline.test.ts
git commit -m "feat: add offline detection hook and OfflineBanner"
```

---

### Task B4: Wire error + empty + loading states into play page

**Files:**
- Modify: `frontend/src/app/play/page.tsx`

Currently: errors from `makeChoice` are silently cleared (`catch {}` resets disabled state only), the `return null` on missing beat gives the user a blank screen, and there's no loading indicator beyond disabled buttons.

- [ ] **Step 1: Add error display and empty state to play/page.tsx**

Open `frontend/src/app/play/page.tsx`. Make these changes:

**Add import at top:**
```typescript
import ErrorBanner from "@/components/ErrorBanner";
import LoadingOverlay from "@/components/LoadingOverlay";
```

**Update the `useGame` destructure to include `error` and `resetGame`:**
```typescript
const { state, makeChoice, isLoading, error, resetGame } = useGame();
```

**Replace the `return null` guard** (currently at the bottom of the component, before the main return):

```typescript
// Empty / error state — shown when there is no beat and we're not mid-transition
if (!state.currentBeat && !isTransitioning) {
  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      <BreathingGrid />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 gap-6">
        {error ? (
          <>
            <p className="font-display text-sm tracking-widest text-destructive uppercase text-center">
              Something went wrong
            </p>
            <ErrorBanner message={error} />
          </>
        ) : (
          <p className="font-display text-sm tracking-widest text-muted-foreground uppercase text-center">
            No active session
          </p>
        )}
        <button
          onClick={() => { resetGame(); router.replace("/"); }}
          className="border-[3px] border-primary bg-accent px-6 py-3 font-display text-sm tracking-wider text-accent-foreground shadow-brutal"
        >
          START OVER
        </button>
      </div>
    </div>
  );
}
```

**Add error banner and loading overlay inside the main return**, immediately after the `<BreathingGrid />` line and before the `{isTransitioning && ...}` block:

```typescript
{/* Loading overlay — shown during non-transition loads (e.g. session resume) */}
{isLoading && !isTransitioning && <LoadingOverlay message="PROCESSING..." />}

{/* Error banner — shown when makeChoice or other API call fails */}
{error && !isTransitioning && (
  <div className="relative z-20 px-5 pt-4">
    <ErrorBanner
      message={error}
      onRetry={() => router.replace("/resume")}
    />
  </div>
)}
```

- [ ] **Step 2: Run frontend tests to verify no regressions**

```bash
npm test --workspace=frontend
```

Expected: All tests pass. (No new tests added here — the ErrorBanner and LoadingOverlay are already unit-tested; the play page integration is verified visually.)

- [ ] **Step 3: Run type check**

```bash
npm run type-check --workspace=frontend
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/play/page.tsx
git commit -m "feat: add error display, empty state, and loading overlay to play page"
```

---

### Task B5: Wire error and loading states into results page

**Files:**
- Modify: `frontend/src/app/results/page.tsx`

Currently: `loadResults().catch(() => {})` silently swallows errors. The user sees a blank/broken results page with no feedback. There's also no loading indicator while results are being fetched.

- [ ] **Step 1: Update results/page.tsx**

Open `frontend/src/app/results/page.tsx`.

**Add imports:**
```typescript
import ErrorBanner from "@/components/ErrorBanner";
import LoadingOverlay from "@/components/LoadingOverlay";
```

**Update the `useGame` destructure to include `isLoading` and `error`:**
```typescript
const { state, loadResults, resetGame, isLoading, error } = useGame();
```

**Replace the existing `useEffect`:**
```typescript
useEffect(() => {
  // Don't swallow errors — they surface via `error` in GameContext
  loadResults().catch(() => {});
}, []);
```
with:
```typescript
useEffect(() => {
  void loadResults();
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Add loading and error states** — insert this block immediately after the opening `<div className="relative min-h-[100dvh]...">` and `<BreathingGrid />` lines, before the `<div className="relative z-10 ...">` content div:

```typescript
{/* Loading state */}
{isLoading && <LoadingOverlay message="CALCULATING RESULTS..." />}

{/* Error state */}
{error && !isLoading && (
  <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 gap-6">
    <p className="font-display text-sm tracking-widest text-destructive uppercase text-center">
      Could not load results
    </p>
    <ErrorBanner message={error} onRetry={() => void loadResults()} />
    <button
      onClick={handlePlayAgain}
      className="border-[3px] border-primary bg-card px-6 py-3 font-display text-sm tracking-wider text-muted-foreground shadow-brutal"
    >
      PLAY AGAIN
    </button>
  </div>
)}
```

Wrap the existing results content in a conditional to hide it during error state:

```typescript
{!error && (
  <div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-16 pb-8">
    {/* ... all existing results content ... */}
  </div>
)}
```

- [ ] **Step 2: Run type check**

```bash
npm run type-check --workspace=frontend
```

Expected: 0 errors.

- [ ] **Step 3: Run full test suite**

```bash
cd C:/Users/P/PROJECTS/ProjectS/HQ-new && bash scripts/verify.sh
```

Expected: All 4 checks pass (TypeScript, lint, backend tests at 100% coverage, frontend tests).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/results/page.tsx
git commit -m "feat: add error display and loading state to results page"
```

---

## Parallel Execution Strategy

Track A (Tasks A1, A2) and Track B (Tasks B1–B5) operate on entirely separate file trees and can run simultaneously with no merge conflicts.

**Recommended parallel assignment:**
- **Agent 1** → Tasks A1, A2 (backend, ~30 min)
- **Agent 2** → Tasks B1, B2, B3, B4, B5 (frontend, ~60 min)

Both agents should finish with `bash scripts/verify.sh` passing.

---

## Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| `classify.ts` guard breaks existing classify tests | Medium | Run full backend suite after A1; check existing test fixtures don't use pre-classified sessions |
| Frontend `return null` removal introduces JSX layout shift | Low | Empty state uses same BreathingGrid layout as other pages |
| `useOffline` hook fails during SSR | Low | Hook guards `typeof window === "undefined"`, returns false server-side |
| `LoadingOverlay` `animate-spin-slow` class missing from Tailwind config | Medium | If the spinner doesn't spin, add `spin-slow` to `tailwind.config.ts` keyframes — visual only, not blocking |
| Results page `!error && (...)` wrapper moves DOM nodes, breaking animations | Low | Existing animations use `animationDelay` styles, not mount-order dependent |
