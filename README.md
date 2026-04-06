# HatchQuest

An immersive, consequence-driven entrepreneurial simulation platform built for the UGBS Innovation and Incubation Hub. Players navigate a branching business narrative set in Accra, Ghana — making decisions with real capital on the line, while the platform quietly measures their **Entrepreneurial Orientation** across five dimensions and delivers a diagnostic profile at the end.

---

## What It Does

- Players start with **GHS 10,000** in virtual capital and a sector path of their choosing
- Every choice has compounding consequences — capital, revenue, debt, reputation, network
- A **Director AI** dynamically selects the next scenario node based on world state, theme affinities, and EO profile
- Five EO dimensions tracked silently: Autonomy, Innovativeness, Proactiveness, Risk-Taking, Competitive Aggressiveness
- Game ends with a personal **Radar Chart** and **Entrepreneurial Acumen Score**
- Used by UGBS Nest to triage and route student founders into the right programs

---

## How the Game Works

```
Layer 0: Onboarding — preamble + 3 classifier questions → EO profile
    ↓
Layer 1: Personalized entry node based on classified EO poles
    ↓
Layer 2: Early challenges — financing, competition, operations, hiring
    ↓
Layer 3: Growth decisions — scaling, crisis management, brand positioning
    ↓
Layer 4: Strategic inflection — partnerships, market shifts, major commitments
    ↓
Layer 5: Convergence ending — reflective outcomes based on the journey
```

Each layer presents 2–5 scenario nodes. The **Director AI** selects the next node from the pool using weighted random scoring: `baseWeight × themeAffinity × eoAffinity`. Layers 1–2 test the player's strengths; Layers 3–5 challenge their blind spots.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + Fastify (API) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + Shadcn/ui |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle |
| Auth | Supabase Auth |
| Testing | Vitest + React Testing Library |
| Hosting | Vercel |
| AI | Anthropic Claude (Director AI + Layer 0 classifier) |

---

## Project Structure

```
hatchquest/
├── backend/                  # Fastify API server
│   ├── src/
│   │   ├── db/               # Drizzle schema + DB client
│   │   ├── engine/           # Game engine: applyChoice, Director AI, world-state
│   │   ├── routes/           # API routes: start, classify, choice, session, results
│   │   ├── store/            # Session stores: in-memory + DB-backed
│   │   ├── scenario-registry.ts  # All scenario node content
│   │   └── index.ts          # Server entry
├── frontend/                 # Next.js 15 player-facing app
│   └── src/
│       ├── app/              # Pages and API proxy routes
│       ├── components/       # UI components
│       └── types/            # TypeScript interfaces
├── packages/shared/          # Shared types between frontend and backend
│   └── src/types/
│       ├── game.ts           # WorldState, EOProfile, etc.
│       ├── session.ts        # GameSession
│       └── api.ts            # API request/response types
├── docs/                     # Design docs, plans, specs, onboarding
│   ├── superpowers/          # Implementation plans and design specs
│   └── brie-world-conditions.md  # World rules reference
└── drizzle/                  # Database migrations
```

---

## Getting Started

```bash
# Install all dependencies across workspaces
npm install

# Set up environment
cp .env.example .env.local   # fill in your Supabase credentials

# Run services
npm run dev:frontend   # Next.js dev server on :3000
npm run dev:backend    # Fastify API server (auto port)
```

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

---

## Development Commands

```bash
npm run test              # Run all tests across workspaces
npm run type-check        # TypeScript check across workspaces
npm run dev:frontend      # Start frontend dev server
npm run dev:backend       # Start backend dev server
npm run build             # Build frontend + backend
```

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Production — protected, behind CI |
| `develop` | Staging — all PRs merge here first |
| `feature/*` | Active work branches |

**No PR merges to `master` if engine tests fail.**

---

## Documentation

- `docs/` — All design docs, implementation plans, and specs
- `docs/brie-world-conditions.md` — World state reference for scenario content
- `docs/superpowers/` — Detailed architectural plans (Director AI, Database v2)
- `docs/AGENT_MANIFEST.md` — Architecture rules and golden principles
- `docs/API_CONTRACT.md` — Locked API handshake

---
