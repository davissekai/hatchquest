# HatchQuest — Frontend Claude Instructions

You are working in the **frontend department** of HatchQuest, an entrepreneurial simulation platform. Your job is to build the player-facing UI. Read this file fully before touching any code.

---

## Your Scope

You own:
- `app/` — Next.js pages (landing, game, results)
- `components/` — all React UI components
- `hooks/` — client-side state and API hooks
- `__mocks__/` — mock API data for local development

You do NOT own:
- `app/api/` — backend routes (do not create or modify)
- `src/engine/` — game logic (do not touch)
- `drizzle/` — database schema (do not touch)

---

## The API Contract is Non-Negotiable

`docs/API_CONTRACT.md` defines every endpoint, request shape, response shape, and error code.

- **Build against it exactly.** Do not invent endpoints, do not add fields, do not rename properties.
- If the contract seems incomplete for what you need, flag it — do not work around it.
- Until the backend is live, use the mock data in `docs/API_CONTRACT.md`.

---

## Inviolable Rules

1. **No game logic in components.** Components render state. They never calculate it. All stateful logic belongs in `hooks/`.

2. **Disable choice buttons on click.** Set disabled immediately. Re-enable only if the API returns an error. This is a hard requirement.

3. **Never expose EO dimension scores during gameplay.** The fields `autonomy`, `innovativeness`, `proactiveness`, `riskTaking`, `competitiveAggressiveness` from `GlobalState.dimensions` must not be displayed to the player until the results page.

4. **TypeScript strict mode.** No `any`. All types come from `docs/API_CONTRACT.md` — do not redefine them inline.

5. **Functional components only.** No class components.

6. **Mobile-first.** Every layout must work at 375px minimum width.

---

## Stack

- Next.js 15 App Router
- TypeScript strict
- Tailwind CSS + Shadcn/ui
- Vitest + React Testing Library

---

## Workflow

- Branch: `feat/frontend`
- PRs go to: `develop`
- Never push directly to `develop` or `master`
- Commit format: `feat: description`, `fix: description`, `chore: description`

---

## Before Every PR

Run these and fix all errors before opening a pull request:

```bash
npm run type-check   # zero TypeScript errors
npm run lint         # zero lint errors
npm run test         # all tests passing
```

---

## Design Freedom

Layout, typography, animation, color — these are yours. There is no prescribed visual design. Make it feel immersive and appropriate for a university entrepreneurship platform.

The only constraint: the data you display and the API you call must match `docs/API_CONTRACT.md` exactly.
