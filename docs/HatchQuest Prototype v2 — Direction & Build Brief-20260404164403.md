# HatchQuest Prototype v2 — Direction & Build Brief

# HatchQuest Prototype v2 — Direction & Build Brief

**Status:** Active
**Deadline:** Two weeks (from ~April 2, 2026)
**Audience:** Oliver Aggrey (AfriVenture Lab / UGBS), Prof. Acheampong
**Context:** Second prototype demonstrating full gameplay with divergent outcomes and EO profiling
* * *

## What HatchQuest Is

HatchQuest is an **Entrepreneurship-Oriented Business Simulation with Game-Based Assessment (GBA)**. It is a serious game that maps player behavior to the **Lumpkin & Dess Entrepreneurial Orientation (EO) framework** — measuring risk-taking, innovativeness, proactiveness, competitive aggressiveness, and autonomy. Most business sims measure financial performance only. HatchQuest measures behavioral orientation. That's the novel angle.
* * *

## Why We're Rebuilding

**The core problem with v1:** The FSM (Finite State Machine) architecture used 30 fixed sequential beats. Every player, regardless of their choices, converged on similar outcomes and similar EO profiles. The branching factor was essentially 1. Different choices didn't produce meaningfully different worlds — which defeats the purpose of a behavioral assessment tool.

**The fix:** Move from a fixed sequence to a **world state + event selector** pattern. The game's narrative becomes emergent from how state variables evolve, not something authored in advance.
* * *

## The New Architecture

### Core Pattern: World State + Event Selector

The game maintains a **world state** — a set of variables describing the current condition of the player's business and environment (cash flow, market share, competitor health, team morale, etc.). Instead of moving through a fixed sequence of scenarios, the game selects the next scenario from a **pool of events**, where the probability of each event appearing is dynamically weighted by the current world state.

Early choices shift state. Shifted state changes which events are likely to appear next. This compounds — two players making different choices diverge immediately and continue diverging throughout the game.

### The Four Core Systems (Phase 1)

**1\. Weighted Random Event System ("Director AI")**

*   Maintain a pool of events
*   Each event has a base weight
*   World state variables modify those weights each turn
*   A weighted random draw selects the next event
*   Result: No two playthroughs are identical

**2\. Cascading Consequence Chains**

*   Events modify state variables
*   State variables modify next-event weights
*   Example chain: Supplier disruption → input cost spike → margin compression → competitor enters on price → market share loss → cash flow crisis
*   Any player action that breaks the chain creates a different outcome

**3\. Procedural Scenario Seeds**

*   Starting market parameters are randomized from a seed
*   Different demand curves, competitor counts, resource costs per session
*   No two players face the same market conditions
*   PostgreSQL's `setseed()` + `random()` handles this natively

**4\. Hidden Competitor Personalities**

*   3–5 AI competitors with hidden traits (aggressive, conservative, innovative)
*   Same world, different antagonists
*   Low implementation cost, meaningful divergence payoff
* * *

## The Prototype v2 Scope

### The World

The game is set in **Accra, Ghana**, in a defined year with pre-existing economic conditions. The player enters as a founder navigating this specific city and market. All figures (market size, capital requirements, competitor behaviour) use reasonable estimates from Ghana/West Africa SME context — Ghana Statistical Service, World Bank SME data, GIPC figures. Precision is not required; plausibility is.

### The Game Structure

A full playthrough consists of **5 scenario layers** after the fixed opening — 5 scenarios = one complete game. The game ends after Layer 5. Each layer delivers one scenario to the player; which scenario they see depends on their choices and the weighted event selector operating on their current world state.

### The Scenario Tree — Tapered Branching

Branching is widest at Layer 1 (maximum divergence from the start) and tapers progressively. By Layer 3 onwards, the **world state is doing the divergence work** — two players in the same node have different state variables, different cash flows, different competitor conditions. The experience feels unique even when sharing a node.

| Layer | Branches per Node | Total Nodes |
| ---| ---| --- |
| Layer 0 | — (fixed opening) | 1 |
| Layer 1 | 5 | 5 |
| Layer 2 | 3 per L1 node | 15 |
| Layer 3 | 2 per L2 node | 30 |
| Layer 4 | 2 per L3 node | 60 |
| Layer 5 | 1 per L4 node (convergence endings) | 60 |
| Total |  | 171 nodes |

Layer 5 converging to 1 branch per node gives defined ending states — archetypal outcome profiles (e.g. aggressive growth founder, cautious operator, innovative disruptor) that feel earned because of the unique path taken to arrive there.

**For the demo:** Build the engine with all 5 layers structurally. Populate Layer 1 fully (5 nodes), Layer 2 partially, and enough of Layer 3 to show one complete path through all 5 layers. Oliver sees a working game with genuine divergence. Remaining nodes are filled post-demo.
* * *

## Layer 0 Design Philosophy — The Path-Defining Moment

Layer 0 → Layer 1 is the highest-signal moment in the entire game. Before any state variables have diverged, before any consequences have accumulated, this is where the most uncontaminated behavioral signal exists. It deserves special design attention.

### Why This Moment Is Different

At Layer 0, the weighted event selector hasn't yet had data to work with. The player hasn't accumulated consequences. They can't game the system because nothing has happened yet. Their response here is the closest thing to a raw behavioral fingerprint the game will ever capture. This is the moment of maximum divergence — and its design must honour that.

### Free-Text Response Architecture

Rather than multiple choice options at Layer 0, the player responds to **specifically guiding open questions** in their own words. They type their answers freely.

**Why this is better than multiple choice:**

Multiple choice has a gaming problem — a player who understands entrepreneurship can reverse-engineer which option maps to which EO dimension and respond strategically. Free text removes that. You can't game what you can't read. The player reveals their actual mental model, not their best guess at the "right" entrepreneur answer.

**How the backend maps responses to poles:**

The guiding questions are designed to probe specific EO dimensions without telegraphing them. The player writes freely. The backend sends that text to an LLM classifier with a carefully designed prompt that maps the response to defined poles across dimensions:

*   **Values poles:** People-first / Profit-first / Mixed
*   **Risk poles:** Risk-tolerant / Risk-averse
*   **Orientation poles:** Proactive / Reactive
*   **Agency poles:** Autonomous / Collaborative
*   **Competitive poles:** Aggressive / Measured

The classifier returns a **confidence distribution** across poles — not a hard label. That distribution feeds directly into the scoring system and informs which of the 5 Layer 1 world-states the player enters.

### The Lumpkin & Dess Grounding

The five EO dimensions from Lumpkin & Dess (1996) inform both what is being probed and how responses are mapped:

*   **Autonomy** — the independent action of an individual or team in bringing forth an idea or vision and carrying it through to completion
*   **Innovativeness** — a tendency to engage in and support new ideas, novelty, experimentation, and creative processes
*   **Risk-taking** — taking bold actions by venturing into the unknown, committing large portions of resources to uncertain outcomes
*   **Proactiveness** — an opportunity-seeking, forward-looking perspective involving introducing new products/services ahead of competition
*   **Competitive Aggressiveness** — the propensity to directly and intensely challenge competitors to achieve entry or improve position

Critically, Lumpkin & Dess argue these dimensions **may vary independently** — a player can be highly proactive but risk-averse, innovative but not aggressive. The Layer 0 questions should tease apart these combinations, not confirm stereotypes.

### The Questions — Design Principles

Each question must:

*   Feel like genuine founder reflection, not a personality test
*   Maintain immersion — the player is thinking as a founder in Accra, not as a test subject
*   Probe one primary EO dimension without telegraphing it
*   Have no obviously "right" answer
*   Carry emotional weight — the player should feel the decision, not calculate it

The assessment is invisible. The immersion must stay intact.

**Example questions informed by Lumpkin & Dess:**

_"You're two months in. A potential customer asks for a feature you haven't built yet. What goes through your mind?"_
→ Probes: Innovativeness vs. risk-aversion, proactiveness

_"A competitor just launched something similar to what you're building. What do you do?"_
→ Probes: Competitive aggressiveness vs. proactiveness

_"Someone offers to partner with you — they bring resources and market access, but you'd share control of key decisions. What matters most to you here?"_
→ Probes: Autonomy

_"The market isn't responding how you expected. What does that mean to you?"_
→ Probes: Risk-taking tolerance, proactiveness vs. reactiveness

_"You have GHS 5,000 left and two paths: invest in a customer you already have, or spend it reaching someone new. What do you do — and why?"_
→ Probes: Risk-taking, values orientation (people vs. growth)

### The Ambiguity Load

Heavy ambiguity is intentional at Layer 0. This means: incomplete information, no obvious right answer, consequences not spelled out, and emotional stakes. The player should feel the decision. Lumpkin & Dess specifically identify **tolerance for ambiguity** as a key entrepreneurial characteristic — the Layer 0 questions are themselves a measurement of that tolerance.

A player who pauses, thinks carefully, and writes a nuanced answer is revealing something different from one who answers immediately and bluntly. Both are valid — and both are data.
* * *

## Prof. Acheampong's Input (Incorporated)

The following elements from Prof. Acheampong's feedback are incorporated into v2:

*   **3x3 choice matrix structure** — for Layers 1–5, choices presented as a 3x3 grid where options sit at the intersection of EO dimensions in tension (Layer 0 uses free-text instead)
*   **Ambiguous scenario preamble** — each scenario opens with context that is deliberately not prescriptive, forcing the player to interpret before acting
*   **EO dimension tensions baked into choices** — options must force a reveal of true priorities. Examples:
    *   Risk-taking vs. Competitive Aggressiveness: undercut competitors (aggressive) or protect margin (safe)?
    *   Autonomy vs. Proactiveness: partner with an established player or go alone?
    *   Innovativeness vs. Risk-taking: launch proven product or untested concept?

**Deferred to later builds:**

*   Nash equilibrium design (requires multiplayer)
*   People, Profits, Planet + Social Innovation (4Ps) framework — noted for a future build iteration
*   Multiplayer / role differentiation
* * *

## The Content Generation Agent

171 scenario nodes is a substantial content production problem — not an engineering one. Each node requires a scenario description, ambiguous preamble, 3x3 choice matrix with EO dimension tensions, state variable effects per choice, weight modifications for next-layer events, and hidden competitor personality responses.

A **specialised content generation agent** will be built to produce the multiverse. The agent:

*   Receives the world seed (Accra, Ghana, defined year, economic conditions, competitor personalities)
*   Receives the node schema (all required fields per node)
*   Generates scenario nodes systematically and consistently within the world
*   Outputs structured JSON ready for import into the game engine

Davis reviews and edits — not writes from scratch. Engineering stays clean, narrative stays rich, timeline stays feasible.
* * *

## The EO Profiling System

### v2 — Distribution-Based Scoring from Layer 0, Additive from Layers 1–5

Layer 0 free-text responses feed an LLM classifier that returns confidence distributions across EO poles. These distributions seed the player's starting profile. Layers 1–5 use the improved additive architecture (dimension tensions, ambiguous preambles) to refine and diverge that profile further.

### Deferred — Full Bayesian Scoring (Phase 2)

Replace additive scoring with full probability distributions per trait updated using Bayes' rule across all layers. More accurate, more nuanced. Deferred until after validation — but Layer 0's distribution-based classification is a direct precursor to this.
* * *

## The Build System (Sienna's Framework)

This prototype is also the first test of a **repeatable production build system**. The goal: move from vibe coding to systems architecture. Every element of how this is built should be documentable and replicable for future projects.

The four pillars:

1. **A winning workflow** — a repeatable process from inception to production
2. **TDD as the safety net** — tests written before or alongside code, testing real behaviour not just coverage
3. **Internal verification for Claude Code** — explicit framing every session, self-critique prompts, architecture decisions owned by Davis not delegated
4. **Documentation as you go** — own the process, not just the output

HatchQuest v2 is the lab for proving this system works.
* * *

## Tech Stack

*   **Frontend:** Next.js 15, TypeScript strict, Tailwind CSS, Shadcn/ui
*   **Backend:** Node.js game engine — event pool, weighted selection, competitor AI utility functions, LLM classifier for Layer 0 free-text mapping
*   **Database:** Supabase/PostgreSQL — JSONB for flexible game state, append-only `game_events` table for event sourcing, row-level security for player isolation
*   **Telemetry schema per action:** `playerId, sessionId, scenarioId, choiceId, decisionLatencyMs, infoSeeked, revisited, timestamp, round`
*   **Deploy:** Vercel
* * *

## What Gets Deferred

| Element | Reason | When |
| ---| ---| --- |
| Full Bayesian scoring across all layers | Complexity — Layer 0 classifier is the precursor | Phase 2 |
| Full telemetry (decision latency, hover tracking) | Scope | Phase 2 |
| Effectuation theory layer | Adds scope | Phase 2 |
| Nash equilibrium design | Requires multiplayer | Phase 3 |
| 4Ps framework (People, Profits, Planet, Social Innovation) | Prof. Acheampong input — future build | Phase 3 |
| Multiplayer / role differentiation | Out of scope for now | Phase 3 |

* * *

## What Oliver Sees in Two Weeks

A fully playable prototype demonstrating:

*   A city-set opening scenario with defined Accra conditions
*   Layer 0 free-text response with guiding questions — the path-defining moment
*   Genuine divergence — two players making different choices end up in meaningfully different world-states across 5 scenario layers
*   EO profiling output showing behavioral orientation across dimensions
*   The 3x3 choice architecture with dimension tensions in Layers 1–5
*   Ambiguous scenario preambles throughout
*   A complete playthrough from Layer 0 to a Layer 5 ending state

The demo proves the architecture works. Everything after this is content and depth.
* * *

_ Last updated: April 2026_