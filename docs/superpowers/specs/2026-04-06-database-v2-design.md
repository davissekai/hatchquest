# Database v2 — Design Spec

**Date:** 2026-04-06  
**Status:** Approved for implementation  
**Projects:** HatchQuest prod (`znbptfbabbkyslxmpjqq`), hatchquest-test (`fpbxmqfdjyznnquiohxv`)  
**Both DBs:** Empty — no data migration needed. Clean drop + recreate.

---

## 1. What Changes and Why

The v1 schema was built around a Finite State Machine with fixed narrative beats and choices. v2 replaces that with a world-state + weighted event selector architecture. The v1 tables are structurally incompatible — they are dropped entirely and replaced.

| v1 Table | v2 Replacement | Reason |
|---|---|---|
| `narrative_beats` | `scenario_nodes` | v1 beat concept → v2 node with Director AI metadata |
| `narrative_choices` | embedded in `scenario_nodes.choices` jsonb | Choices are part of the node, not a separate table |
| `choice_impacts` | `choice_effects` | v2 field names (revenue, debt, monthly_burn, etc.); EO deltas as jsonb |
| `game_sessions` | `game_sessions` (modified) | Drop `acumen_score`, rename `state`→`world_state`, replace `is_complete`→`status` |
| `players` | `players` (modified) | Rename `display_name`→`player_name` |

---

## 2. v2 Schema

### 2.1 `players`

```sql
CREATE TABLE players (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text    UNIQUE NOT NULL,
  player_name  text    NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

Change from v1: `display_name` → `player_name`.

---

### 2.2 `game_sessions`

```sql
CREATE TABLE game_sessions (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    uuid    REFERENCES players(id) ON DELETE CASCADE,
  world_state  jsonb   NOT NULL,
  status       text    NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'complete', 'expired')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
```

Changes from v1:
- `state` → `world_state` (stores full `WorldState` TypeScript object as jsonb blob)
- `is_complete boolean` → `status text` with 3-state check constraint
- `acumen_score` dropped (v1 only)
- `started_at` → `created_at` (consistent naming)
- `updated_at` added (needed for session store's `updateSession`)

The full `WorldState` (including `eoProfile`, `seed`, env vars) is stored in `world_state`. The backend strips server-only fields before sending to clients via `toClientState()`. No normalization of world state fields — we store the blob and evolve the schema when the data model stabilises.

---

### 2.3 `scenario_nodes`

```sql
CREATE TABLE scenario_nodes (
  id                    text    PRIMARY KEY,
  layer                 integer NOT NULL CHECK (layer BETWEEN 0 AND 5),
  narrative             text    NOT NULL,
  choices               jsonb   NOT NULL,
  theme                 text    NOT NULL,
  base_weight           real    NOT NULL DEFAULT 1.0,
  eo_target_dimensions  text[]  NOT NULL DEFAULT '{}',
  conditions            jsonb
);
```

Replaces `narrative_beats` + `narrative_choices`. The `choices` column stores a `Choice[]` array:
```json
[
  { "index": 0, "text": "...", "tensionHint": "..." },
  { "index": 1, "text": "...", "tensionHint": "..." },
  { "index": 2, "text": "...", "tensionHint": "..." }
]
```

Director AI metadata (`theme`, `base_weight`, `eo_target_dimensions`, `conditions`) lives on the node. The `conditions` column stores a `NodeConditions` object or null:
```json
{ "capitalMin": 5000, "requiresMentorAccess": true }
```

---

### 2.4 `choice_effects`

```sql
CREATE TABLE choice_effects (
  node_id          text     NOT NULL REFERENCES scenario_nodes(id) ON DELETE CASCADE,
  choice_index     smallint NOT NULL CHECK (choice_index IN (0, 1, 2)),
  capital          integer  NOT NULL DEFAULT 0,
  revenue          integer  NOT NULL DEFAULT 0,
  debt             integer  NOT NULL DEFAULT 0,
  monthly_burn     integer  NOT NULL DEFAULT 0,
  reputation       integer  NOT NULL DEFAULT 0,
  network_strength integer  NOT NULL DEFAULT 0,
  eo_deltas        jsonb    NOT NULL DEFAULT '{}',
  flags            jsonb,
  PRIMARY KEY (node_id, choice_index)
);
```

Replaces `choice_impacts`. Changes from v1:
- `momentum_delta` dropped (v1 only)
- `network_delta` → `network_strength`
- Added `revenue`, `debt`, `monthly_burn` (v2 fields)
- All individual EO delta columns (`autonomy_delta`, etc.) → single `eo_deltas jsonb` object
- `flag_updates` → `flags` (consistent naming with TypeScript `ChoiceEffect.flags`)
- Composite PK `(node_id, choice_index)` — no surrogate key needed
- All financial columns use `integer` not `real` (no fractional GHS)

---

## 3. RLS Policies

### `players`
```sql
-- Read and update own row only. INSERT via service role.
CREATE POLICY "players: read own row"   ON players FOR SELECT USING (auth.uid() = id);
CREATE POLICY "players: update own row" ON players FOR UPDATE USING (auth.uid() = id);
```

### `game_sessions`
```sql
-- Read and update own sessions only. INSERT/DELETE via service role.
CREATE POLICY "game_sessions: read own"   ON game_sessions FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "game_sessions: update own" ON game_sessions FOR UPDATE USING (auth.uid() = player_id);
```

### `scenario_nodes`
```sql
-- Public read. Content seeded by backend admin. No runtime writes from clients.
CREATE POLICY "scenario_nodes: public read" ON scenario_nodes FOR SELECT TO anon, authenticated USING (true);
```

### `choice_effects`
```sql
-- NO public access at all. Zero policies = total denial for anon and authenticated.
-- Only service role (Fastify backend) can read this table.
-- EO impact data must never be exposed to clients.
```

---

## 4. Drizzle Schema Location

The Drizzle schema moves from `frontend/src/db/schema.ts` (deleted in v1 cleanout) to:

```
backend/src/db/schema.ts     ← Drizzle table definitions
backend/drizzle.config.ts    ← Points to backend schema + DB URL
```

The frontend's `drizzle.config.ts` and `drizzle/migrations/` folder are v1 artifacts. They are superseded by the backend schema but left in place to avoid breaking the frontend workspace until Lois/Ebo integrate the new DB client.

---

## 5. Migration Strategy

Both DBs are empty. No data preservation needed.

**Order of operations (apply to test DB first, then prod):**

1. Drop all v1 tables (CASCADE handles FK constraints)
2. Create `players`, `game_sessions`, `scenario_nodes`, `choice_effects`
3. Enable RLS on all tables
4. Apply RLS policies
5. Verify with `list_tables` on both projects

The migration is applied directly via Supabase MCP `apply_migration` — not via `drizzle-kit push` — because we need to apply identical migrations to two separate projects and control the order precisely.

---

## 6. What This Doesn't Cover

- **Seeding `scenario_nodes` and `choice_effects`** — a separate task. The in-memory registry will be the source of truth until seeding scripts are written.
- **Session store DB integration** — `SessionStore` class currently uses an in-memory Map. Replacing it with Drizzle queries against `game_sessions` is a separate task after this schema is live.
- **Auth integration** — `player_id` FK exists but Supabase Auth is not yet wired. For the demo, sessions are identified by UUID only.
- **`updated_at` trigger** — no Postgres trigger to auto-update `updated_at` on row change. The application layer sets it explicitly (consistent with current `updateSession` behaviour).

---

## 7. Review Notes

Decisions made autonomously — flag any you want changed:

1. **`world_state jsonb` blob** — not normalized. Chosen for speed and flexibility. Risk: jsonb queries are slower than column queries. Acceptable at demo scale.
2. **`integer` for financial fields** — not `real`. GHS is whole numbers in practice. Change to `numeric(12,2)` if fractional amounts become needed.
3. **`status text` with CHECK** — not a Postgres enum. Easier to migrate if states are added. Enums require `ALTER TYPE` which is trickier.
4. **No `updated_at` trigger** — application sets it. Add a trigger if we want DB-level enforcement.
5. **Frontend drizzle artifacts left in place** — not deleted to avoid breaking frontend CI. Clean them up when frontend DB integration is done.
