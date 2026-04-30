# HatchQuest — Claude Code Session Context

> Full detail (architecture, EO framework, failure modes, lessons, planning protocol) is stored in Hindsight.
> Retrieve at session start with: `mcp__hindsight__recall` query "HatchQuest"

---

## Project in One Line

EO-based entrepreneurship simulation (World State + Weighted Event Selector). Accra, Ghana setting. Fastify backend on Railway, Next.js 15 frontend on Vercel, shared types in `packages/shared/`.

## Critical Constraints

- **3 choices per scenario, never 9.** Davis decides if this changes.
- **v2 only. v1 FSM is dead.** Do not build on v1 architecture.
- **Davis decides architecture. Dia implements.** Flag any architectural decision before writing code.
- **`packages/shared/` is the contract.** Never define types inline. Any change needs Davis sign-off.
- **Layer 0 classifier stub** returns L1-node-1 always until real LLM call is wired.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript strict, Tailwind CSS, Shadcn/ui |
| Backend | Fastify (standalone, Railway) |
| Shared Types | `packages/shared/` |
| Database | Supabase / PostgreSQL, Drizzle ORM |
| Testing | Vitest |
| LLM | Claude API (Anthropic SDK) — Haiku for Narrator AI |

## Team

- **Davis** — Architect and lead. All decisions belong to Davis.
- **Lois + Ebo** — Frontend only (`frontend/`). Never touch `backend/` or `packages/shared/`.

## Branch Strategy

- `main` — protected
- `develop` — staging, all PRs merge here
- `feature/v2-engine` — active v2 rebuild
- `feat/<name>` — off `feature/v2-engine`

## Verification Gate

```bash
bash scripts/verify.sh
```

1. TypeScript — `npm run type-check` (all workspaces)
2. Lint — `npm run lint --workspace=frontend`
3. Tests — `npm test --workspace=backend`
4. Coverage — engine must be 100% (lines, functions, branches, statements)

Gate must pass before declaring code complete. No exceptions.

## Architecture Rules

1. World state is the brain. No game logic in React components.
2. `packages/shared/` is the contract. Frontend and backend both import from it.
3. TDD is non-negotiable. 100% engine coverage.
4. Frontend is a consumer — renders state, calls API, re-renders. No game logic.
5. Backend is source of truth. EO dimensions never sent to client during gameplay.
6. Director AI lives in backend. Never expose weight system to client.
7. Davis decides. Dia implements.

---

_Owner: Davis Dey | April 2026 | Supersedes AGENT_MANIFEST.md_
