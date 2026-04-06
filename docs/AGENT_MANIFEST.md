# AGENT_MANIFEST.md — HatchQuest v2

## Project Identity

**HatchQuest** is an Entrepreneurship-Oriented Business Simulation with Game-Based Assessment (GBA).
It maps player behavior to the **Lumpkin & Dess EO framework** across 5 dimensions: Autonomy, Innovativeness, Proactiveness, Risk-Taking, and Competitive Aggressiveness.

Set in **Accra, Ghana**. Built for the **UGBS Nest** as a behavioral diagnostic gateway for incoming founders.

> This is v2. v1 used a fixed 30-beat FSM — it is dead. Do not reference it.
> Read `CLAUDE.md` for full project context before doing anything.

---

## Architecture: The Golden Rules

### 1. World State is the Brain
All game logic reads from and writes to the world state. The engine lives in `backend/src/engine/`.
Never put game logic inside React components or Next.js routes.

### 2. `packages/shared/` is the Contract
All TypeScript interfaces shared between frontend and backend live in `packages/shared/`.
Update types there first — never define ad-hoc types inline on either side.
Any change to `packages/shared/` requires Davis sign-off.

### 3. TDD is Non-Negotiable
Engine functions have tests before implementation. 100% coverage on `backend/src/engine/`.
Write the test FIRST (Red), make it pass (Green), clean up (Refactor).

### 4. The Frontend is a Consumer
`frontend/` only renders state. It calls the backend API, receives new state, re-renders.
No game logic in the frontend — ever.

### 5. The Backend is the Source of Truth
EO dimensions are **never sent to the client during gameplay**.
Strip dimensions from all API responses except `/results`.
The Director AI (event weights, event selection, consequence chains) is backend-only. Never expose it to the client.

### 6. Davis Decides Architecture. Claude Implements.
Flag any decision with architectural implications before writing code. Do not decide silently.

---

## Repo Structure

```
/
├── frontend/          ← Next.js 15 app (Lois + Ebo)
├── backend/           ← Fastify game engine server (Davis)
├── packages/
│   └── shared/        ← Shared TypeScript types (Davis owns, both sides consume)
└── package.json       ← Workspace root
```

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript strict, Tailwind CSS, Shadcn/ui |
| Backend | Fastify (standalone Node.js) |
| Shared Types | `packages/shared/` |
| Database | Supabase / PostgreSQL |
| ORM | Drizzle |
| Testing | Vitest |
| LLM | Claude API (Layer 0 classifier) |
| Frontend hosting | Vercel |
| Backend hosting | Railway |

---

## Team

| Person | Role | Works In |
|---|---|---|
| Davis | Architect + backend lead | `backend/`, `packages/shared/`, all architectural decisions |
| Lois | Frontend engineer | `frontend/` only |
| Ebo | Frontend engineer | `frontend/` only |

---

## Game Structure

| Layer | Description | Nodes |
|---|---|---|
| Layer 0 | Fixed opening — free-text response + LLM classifier | 1 |
| Layer 1 | 5 divergent world-states | 5 |
| Layer 2 | 3 branches per L1 node | 15 |
| Layer 3 | 2 branches per L2 node | 30 |
| Layer 4 | 2 branches per L3 node | 60 |
| Layer 5 | Convergence endings | 60 |
| **Total** | | **171 nodes** |

Each scenario (Layers 1–5): **3 choices**, each at the intersection of EO dimensions in tension.
Not 9. Not 2. 3.

---

## EO Dimensions (Lumpkin & Dess, 1996)

1. **Autonomy** — independent action carrying an idea through to completion
2. **Innovativeness** — support for new ideas, novelty, experimentation
3. **Risk-Taking** — bold actions, committing resources to uncertain outcomes
4. **Proactiveness** — opportunity-seeking, forward-looking, ahead of competition
5. **Competitive Aggressiveness** — directly and intensely challenging competitors

These dimensions vary independently. The game teases them apart — it does not confirm stereotypes.

---

## Branch Strategy

- `main` — protected, production-ready only
- `develop` — staging, all PRs merge here first
- `feature/v2-engine` — active v2 rebuild branch
- `feat/<name>` — individual feature branches off `feature/v2-engine`

No PR merges to `main` if engine tests fail.
