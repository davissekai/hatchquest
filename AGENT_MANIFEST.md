# AGENT_MANIFEST.md — HatchQuest

## Project Identity
**HatchQuest** is an immersive, state-driven entrepreneurship simulation for the UGBS Nest.
Players make 30 narrative business decisions; the platform secretly measures Entrepreneurial Orientation (EO) across 5 dimensions, then delivers a personal Radar Chart and Acumen Score.

---

## Architecture: The Golden Rules

### 1. The State Machine is the Brain
All game logic lives in `src/engine/`. **Never** put transition logic inside React components.
- `transition.ts` — the single state mutation function
- `scoring.ts` — EO dimension normalization and Acumen Score calculation

### 2. The Contract is Inviolable
`src/types/game.ts` is the **single source of truth** for all interfaces.
If you need a new data shape, update `game.ts` first — never define ad-hoc types inline.

### 3. TDD is Non-Negotiable
Engine functions must have **100% test coverage**. Write the test FIRST (Red), then make it pass (Green), then clean up (Refactor). Tests live in `src/engine/__tests__/`.

### 4. The Frontend is a Consumer
`src/app/` only renders state. It calls `transition()`, receives a new `GameState`, and re-renders. Pages never compute game logic directly.

### 5. drizzle/ owns the Database Contract
All table definitions live in `drizzle/schema.ts`. Never define DB structure elsewhere.

---

## Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + Shadcn/ui |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle |
| Auth | Supabase Auth |
| Testing | Vitest + React Testing Library |
| Hosting | Vercel |

---

## Branch Strategy
- `main` — protected, production-ready only
- `develop` — staging, all PRs merge here first
- `feature/<name>` — individual task branches

**No PR is merged to `master` if `src/engine/__tests__/` fails.**

---

## Starting Capital
GHS 10,000.00 (`v_capital` initial value)

---

## EO Dimensions Measured
1. Autonomy
2. Innovativeness
3. Proactiveness
4. Risk-Taking
5. Competitive Aggressiveness
