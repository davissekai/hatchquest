# HatchQuest

An immersive, consequence-driven entrepreneurial simulation platform built for the UGBS Innovation and Incubation Hub. Players navigate 30 interconnected business decisions with real capital on the line — while the platform quietly measures their Entrepreneurial Orientation across five dimensions and delivers a diagnostic profile at the end.

---

## What It Does

- Players start with **GHS 10,000** in virtual capital
- Every choice has compounding consequences — capital, momentum, reputation, network
- Five EO dimensions are tracked silently: Autonomy, Innovativeness, Proactiveness, Risk-Taking, Competitive Aggressiveness
- The game ends with a personal **Radar Chart** and **Entrepreneurial Acumen Score**
- Used by UGBS Nest to triage and route student founders into the right programs

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + Shadcn/ui |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle |
| Auth | Supabase Auth |
| Testing | Vitest + React Testing Library |
| Hosting | Vercel |

---

## Project Structure

```
src/
├── app/                  # Next.js pages and API routes
├── engine/               # FSM game logic — state transitions, scoring
├── types/                # Shared TypeScript interfaces (game.ts is source of truth)
└── components/           # UI components

drizzle/                  # Database schema and migrations
docs/                     # API contract and technical documentation
```

---

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

---

## Development

```bash
npm run dev          # start dev server
npm run type-check   # TypeScript check
npm run lint         # ESLint
npm run test         # Vitest
npm run test:coverage  # coverage report
```

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Production — protected |
| `develop` | Staging — all PRs merge here first |
| `feat/engine` | Game state machine |
| `feat/narrative` | Story content and branching logic |
| `feat/frontend` | UI and player experience |
| `feat/analytics` | Scoring, radar chart, results |
| `feat/data` | Database, API routes, auth |
| `feat/qa` | Tests and CI/CD |

**No PR merges to `master` if engine tests fail.**

---

## Documentation

- `AGENT_MANIFEST.md` — architecture rules and golden principles
- `docs/API_CONTRACT.md` — locked API handshake (frontend builds against this)

---

## Frontend Team

Clone only what you need:

```bash
git clone --single-branch --branch feat/frontend https://github.com/davissekai/hatchquest.git
```

Start with `FRONTEND.md`.
