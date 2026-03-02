# HatchQuest — Frontend Team Guide

Welcome to the HatchQuest frontend. This document covers your scope, workflow, and everything you need to get building.

---

## Your Role

You own everything the player sees and interacts with. That means:

- The landing/login page
- The game screen — narrative text, choice buttons, feedback, progress
- The results dashboard — acumen score, radar chart, dimension breakdown

You do **not** own:
- API route logic (backend handles it)
- Game state calculations (engine handles it)
- Database or auth setup (backend handles it)

Your job is to consume the API and render the game beautifully. Design choices are yours — layout, typography, animations, color. The only non-negotiable is the API handshake (see `docs/API_CONTRACT.md`).

---

## Stack

| What | Technology |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript — strict mode, no `any` |
| Styling | Tailwind CSS + Shadcn/ui |
| Components | React functional components only |
| Testing | Vitest + React Testing Library |

---

## Getting Started

Clone just this branch — you don't need the full repo:

```bash
git clone --single-branch --branch feat/frontend https://github.com/davissekai/hatchquest.git
cd hatchquest
npm install
npm run dev
```

---

## Project Structure (Your Territory)

```
app/
├── page.tsx                  # Landing page / login entry
├── game/
│   └── page.tsx              # Main game view
└── results/
    └── page.tsx              # End-of-game results page

components/
├── NarrativeBeat.tsx         # Renders the story text and title
├── ChoiceButton.tsx          # Single choice option with disabled/feedback state
├── ChoicePanel.tsx           # Container for all choice buttons on a beat
├── ProgressIndicator.tsx     # Shows current beat (e.g. "Beat 4 of 30")
├── TransitionOverlay.tsx     # Loading state between beats
└── results/
    ├── RadarChart.tsx        # 5-axis EO radar chart
    ├── AcumenScore.tsx       # Final score display
    ├── ArchetypeCard.tsx     # Player archetype result
    ├── DimensionBreakdown.tsx
    └── FeedbackPanel.tsx     # Personalised 2–3 sentence feedback

hooks/
└── useGameSession.ts         # Main hook — session state, choice submission
```

---

## The API Contract

Read `docs/API_CONTRACT.md` before writing any fetch logic. That document defines:
- The exact endpoints you call
- The exact shapes of every request and response
- Error codes and what to do with them
- Mock data for local development before the backend is live

**The contract is locked.** Build against it exactly as written. If something seems wrong, raise it — don't work around it.

---

## Working Without the Backend

The backend won't be ready on day one. That's fine — use the mock data in `docs/API_CONTRACT.md` to build fully functional components. Create a `__mocks__/api.ts` file and wire your hooks to it first. Swap in real API calls once the backend endpoints are live.

---

## Key Rules

1. **No game logic in components.** Components render state — they never calculate it. If you find yourself writing conditional business logic inside a component, it belongs in a hook or the API.

2. **Disable choice buttons on click.** The moment a player clicks a choice, disable all buttons. Re-enable only on API error. This prevents double-submission.

3. **Never show EO dimension scores during gameplay.** `autonomy`, `innovativeness`, `proactiveness`, `riskTaking`, `competitiveAggressiveness` are hidden metrics. Only display them on the results page.

4. **Mobile-first.** Design for 375px minimum width. All layouts must be responsive.

5. **TypeScript strict mode.** No `any`. If you don't know the type, check `docs/API_CONTRACT.md` — the types are all there.

---

## Branch Workflow

You work on `feat/frontend`. Do not push to `develop` directly.

```bash
# your daily flow
git pull origin feat/frontend   # stay up to date
# ... make changes ...
git add .
git commit -m "feat: describe what you built"
git push origin feat/frontend
```

When a feature is ready for review, open a PR from `feat/frontend` → `develop` on GitHub. The backend lead will review the handshake points. Design is yours to own.

---

## PR Checklist

Before opening a PR, confirm:

- [ ] Components work against mock data
- [ ] Choice buttons disable on click and re-enable on error
- [ ] No EO dimension data exposed during gameplay
- [ ] Layouts are responsive (check at 375px)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Tests pass (`npm run test`)

---

## Questions

Raise anything that seems off about the API contract or project structure with the backend lead before working around it. It's faster to align than to unpick a diverged implementation.
