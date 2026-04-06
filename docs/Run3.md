# Run 3 — DB Infrastructure & Async Store Refactor

**Date:** 2026-04-07  
**Branch:** `feature/v2-engine`  
**Session type:** Speed run (~30 min, context-limited)  
**Tests at end:** 106/106 passing

---

## Context Coming In

Run 2 had built the full API surface (5 routes, 106 tests, Director AI wired). The session ended mid-task: the DB v2 design spec had been written but the implementation plan hadn't been created yet, and the in-memory `SessionStore` still needed to be replaced with a Drizzle/Supabase-backed implementation.

The compact summary correctly identified the next steps:
1. Commit DB spec (already done before compact)
2. Write the implementation plan via `superpowers:writing-plans`
3. Apply SQL migration to both Supabase projects via MCP
4. Build Drizzle schema, client, and `DbSessionStore`

---

## What Happened

### Plan written

Invoked `superpowers:writing-plans` for the full DB v2 restructure. The plan covered 9 tasks across two phases: DB migration (MCP calls) and TypeScript code (schema, client, store refactor). Plan saved to `docs/superpowers/plans/2026-04-06-database-v2.md`.

**Why:** The writing-plans skill produces comprehensive bite-sized task specs with actual code in each step — removes ambiguity when executing later, especially across context boundaries.

### DB migration blocked

Supabase MCP server had disconnected at session start — `apply_migration` and `list_tables` were unavailable. The original sprint task (applying migrations to both Supabase projects) couldn't proceed.

**Why we pivoted:** With ~12 minutes left, the highest-value thing to do was ship the TypeScript code side of the plan — which doesn't need MCP. The DB migration is just SQL; it can be applied any session Supabase MCP is live.

### ISessionStore — async interface

Created `backend/src/store/types.ts` with:
- `SessionNotFoundError` class (moved here as canonical location)
- `ISessionStore` interface — async versions of all 3 store methods (`Promise<T>` returns)

**Why async:** The original `SessionStore` was synchronous (backed by an in-memory Map). `DbSessionStore` will be async (Drizzle awaits). To allow routes to accept either implementation without caring which one they get, the interface had to be async. `SessionStore` trivially wraps its sync returns in `Promise` by marking methods `async`.

**Why a separate `types.ts`:** Both `SessionStore` (in-memory) and `DbSessionStore` (Drizzle) implement `ISessionStore`. Routes import the interface, not the concrete class. Separating the interface into `types.ts` keeps the concrete implementations from having circular imports.

### SessionStore updated to async

`backend/src/store/session-store.ts` updated:
- All 3 methods (`createSession`, `getSession`, `updateSession`) marked `async`
- Implements `ISessionStore`
- Re-exports `SessionNotFoundError` from `types.ts` for backward compat (callers that imported it from this file still work)

No behavior change — same Map-backed logic, just wrapped in Promises.

### All 5 routes updated

`start.ts`, `classify.ts`, `choice.ts`, `session.ts`, `results.ts` — changed:
- Import: `SessionStore` → `ISessionStore` from `../store/types.js`
- Options interface type updated
- All store calls: `store.getSession(...)` → `await store.getSession(...)` etc.

**Why this matters:** Routes are already `async` functions (Fastify handlers), so adding `await` was a one-word change per call. The routes are now agnostic to whether the store is in-memory or DB-backed.

### All 5 test files updated

`session-store.test.ts`, `choice.test.ts`, `results.test.ts`, `session.test.ts`, `classify.test.ts`:
- `seedSession()` / setup functions made `async`
- All direct store calls (`store.createSession()`, `store.getSession()`, `store.updateSession()`) awaited
- Test functions marked `async` where needed

One issue caught mid-run: `classify.test.ts` had two sync `store.getSession()` calls inside async test bodies — fixed those specifically.

### Drizzle schema

`backend/src/db/schema.ts` — defines all 4 v2 tables:
- `players` — uuid PK, email unique, player_name, created_at
- `gameSessions` — uuid PK, nullable player_id FK, `world_state jsonb.$type<WorldState>()`, status typed as `SessionStatus`, timestamps
- `scenarioNodes` — text PK, layer, narrative, choices, theme, base_weight, eo_target_dimensions text[], conditions nullable
- `choiceEffects` — composite PK `(node_id, choice_index)` via `primaryKey({ columns: [...] })`, all financial deltas as integer, eo_deltas jsonb, flags jsonb nullable

**Key decisions:**
- `gameSessions.worldState` typed as `WorldState` via `.$type<>()` — Drizzle passes it through as-is to postgres-js which serializes/deserializes JSON
- `gameSessions.playerId` is nullable (no `notNull()`) — auth not wired for demo phase; service role bypasses RLS regardless
- `eoTargetDimensions` uses `sql\`'{}'\`` for the default — Drizzle needs raw SQL for array literals
- `choiceEffects` uses Drizzle 0.45's `pgTable(..., (table) => [primaryKey({ columns: [...] })])` syntax (array, not object)

`backend/drizzle.config.ts` — standard Drizzle Kit config pointing at `./src/db/schema.ts`.

### DB client

`backend/src/db/client.ts`:
- Reads `DATABASE_URL` from env, throws immediately if missing
- Creates `postgres()` query client, wraps in `drizzle()` with schema
- Exported as `db` singleton

**Critical design:** `client.ts` throws at import time if `DATABASE_URL` is absent. This means it must only be imported in code paths guarded by the env var check. It is NOT imported from route files or the main `index.ts` directly — it'll be imported only inside `DbSessionStore`, which is in turn only instantiated when `DATABASE_URL` is set (Task 9 of the plan).

---

## What's Left From the Plan

| Task | Status |
|---|---|
| Apply v2 migration to test Supabase | Blocked (MCP disconnected) |
| Apply v2 migration to prod Supabase | Blocked (MCP disconnected) |
| Drizzle schema + config | Done |
| DB client | Done |
| ISessionStore + async SessionStore | Done |
| Update routes to async | Done |
| `DbSessionStore` | Not started |
| Wire `DbSessionStore` in `index.ts` | Not started |

---

## Commits This Run

```
1448485  docs: DB v2 implementation plan
7d2c2a3  refactor: async ISessionStore + Drizzle schema + DB client — all 106 tests green
```

---

## Next Run Priorities

1. **Apply DB migration** (both Supabase projects) — needs Supabase MCP live
2. **`DbSessionStore`** — `backend/src/store/db-session-store.ts`, Task 8 from the plan
3. **Wire in `index.ts`** — `buildStore()` function that returns `DbSessionStore` when `DATABASE_URL` is set, falls back to `SessionStore`
4. **Layer 0 classifier** — `POST /classify` is still a stub that always returns `L1-node-1`. Real implementation needs a Claude API call + keyword heuristic fallback.
5. **Layer 1-3 content** — need enough nodes for one complete demo path

Demo deadline: April 16.
