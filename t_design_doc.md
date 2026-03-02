Technical Design Document (TDD): HatchQuest Core Engine

Architectural Philosophy

HatchQuest is not a linear quiz; it is a State-Driven Narrative Engine. We are decoupling the story content from the application logic. The frontend’s primary job is to consume a JSON API, render the current narrative beat, accept user input, and pass that input back to the State Machine.

Core Engine: The State Machine

The application relies on a Finite State Machine (FSM) with three distinct components. This ensures the player's journey is continuous and choices have compounding consequences.

The Global State (Source of truth)

The game maintains a single object that tracks all progress. The frontend must map its UI strictly to this object.

(JSON)

{
  "session": {
    "currentNarrativeId": "N_001", 		// tells what scenario/question is currently in play
    "isStoryComplete": false
  },

  “resources”: {
    “v_capital”: 10000.00,          // the resources a player has at the start of game
    “momentumMultiplier”: 1.0,      // a coefficient that either amplifies or reduces a player’s capital impact
    “reputation”: 50,
    “network”: 10
  },

  "dimensions": {
    "autonomy": 0,
    "innovativeness": 0,			// the 5 eo framework metric components
    "proactiveness": 0,
    "riskTaking": 0,
    "competitiveAggressiveness": 0
  },

  "flags": {
    "hasDebt": false,		// Boolean values used to track milestones or permanent states
    "hiredTeam": false
  },
  "history": []  // append-only log of every choice made — shape: { narrativeId, choiceId, capitalBefore, capitalAfter, timestamp }
                 // used by the engine to prevent duplicate submissions and power compounding consequence logic
}

The Input (User action)

When a user clicks a decision button, the frontend sends a payload containing the choiceId and the current narrativeId to the engine.

The Transition Logic

The engine processes the choice using the flow:

Calculate Impact: NewCapital = CurrentCapital + (ChoiceImpact * MomentumMultiplier)
// ChoiceImpact is a numeric delta (positive or negative) sourced from the private impact schema — a backend-only
// mapping of choiceId → capital delta. It is never exposed to the frontend or included in API responses.

Update Dimensions: Adjust the hidden Entrepreneurial Orientation scores.

Determine Next Beat:  Read the flags and v_capital to determine the next logical narrativeId in the story tree.

Return State: Send the updated Global State back to the frontend to trigger a UI re-render.


3. The API Contract (Data structure)

To allow parallel development, the frontend team will build against this exact schema using dummy data while the backend team finalizes the narrative copy.

The Narrative Schema (Public — safe for frontend consumption):
// Note: choice impact data (capital delta, EO dimension changes, flag mutations) lives in a separate
// private impact schema on the backend only. It is never included in API responses to the client.
(JSON)
{
  "id": "N_005",
  "title": "The Scaling Dilemma",
  "storyText": "Your initial marketing push went viral, but your servers are crashing. Do you pause onboarding or risk a blackout?",
  "choices": [
    {
      "choiceId": "C_05A",
      "label": "Pause Onboarding",
      "immediateFeedback": "You stabilized the system, but lost initial momentum."
    },
    {
      "choiceId": "C_05B",
      "label": "Risk the Blackout & Push",
      "immediateFeedback": "The servers crashed. Customers are angry, but you kept the hype alive."
    }
  ]
}
4. Engineering Standards: Test-Driven Development (TDD)
To ensure the simulation logic is mathematically foolproof and scalable, all state transitions and logic gates must be written using a strict TDD protocol (Red-Green-Refactor).
Unit Testing: The transition function must have 100% test coverage using tools like Jest or Vitest.
Edge Cases to Cover:
Capital cannot drop below 0 (handle bankruptcy logic).
Fast-clicking/double-submissions must not trigger duplicate state updates.
The momentumMultiplier must accurately scale choice impacts without breaking data types.
CI/CD Guardrail: No pull request will be merged into the master branch if it fails the core logic test suite.

Technical Stack & Infrastructure
To ensure a foolproof, scalable, and rapidly deployable prototype by March 31st, we will use a unified TypeScript ecosystem.
Core Frameworks
Frontend & Backend: Next.js (App Router). We will utilize Next.js for both the UI and the Server-Side logic (API Routes/Server Actions).
Language: TypeScript (Strict Mode). Mandatory for all project files to ensure type safety across the State Machine.
Styling: Tailwind CSS. For rapid, responsive UI development.
Database & Persistence
Platform: Supabase.
Database: PostgreSQL for storing narrative content and user progress.
Authentication: Supabase Auth for student login/session management.
ORM: Drizzle. Lightweight, type-safe, and idiomatic for Edge/Serverless environments. Handles migrations and type-safe database queries.
Testing & Quality Assurance
Testing Framework: Vitest. A modern, blazing-fast unit testing framework compatible with Vite/Next.js.
Library: React Testing Library. For testing the user-facing story components.
Workflow: Strict TDD Protocol. Logic functions must have a passing test suite before a Pull Request (PR) is reviewed.
Deployment & DevOps
Hosting: Vercel. Native integration with Next.js for CI/CD.
Version Control: GitHub.
Branch Strategy: master (protected), develop (staging), and feat/name for individual department tasks.
Gatekeeper: All code requires an approved PR from lead.

