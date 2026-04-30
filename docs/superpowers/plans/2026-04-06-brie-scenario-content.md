# HatchQuest Scenario Content — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write all scenario node content needed for a complete demo playthrough — Layer 0 onboarding experience (preamble + 3 classifier questions) and scenario nodes for Layers 2 through 5.

**Architecture:** Nodes live in `backend/src/scenario-registry.ts` as hand-crafted TypeScript objects. The Director AI selects from the pool each turn based on world state. Brie writes the narrative and choice text; the effect numbers follow calibration rules defined in this plan.

**Tech Stack:** TypeScript (hand-written content objects, no code execution needed — just write the data)

---

## Context You Must Read First

### What HatchQuest Is

A business simulation game set in **Accra, Ghana**. Players make decisions as early-stage entrepreneurs. The game secretly measures their **Entrepreneurial Orientation (EO)** across 5 dimensions, revealed only at game end.

The 5 EO dimensions (Lumpkin & Dess, 1996):

| Dimension | What it measures |
|---|---|
| `autonomy` | Independent action — doing things your own way without needing validation |
| `innovativeness` | Support for new ideas, experimentation, creative solutions |
| `riskTaking` | Bold actions, committing resources to uncertain outcomes |
| `proactiveness` | Opportunity-seeking, acting before competitors, forward-looking |
| `competitiveAggressiveness` | Directly and intensely challenging rivals |

**Critical:** These dimensions vary independently. A player can be highly proactive but risk-averse. Your scenarios must tease them apart — each choice should force a reveal of one or two specific EO priorities, not personality in general.

### The Ghana Startup Context

Economic figures are grounded in real data (Ghana Statistical Service / World Bank SME context):
- Starting capital: GHS 10,000
- Typical monthly burn: GHS 1,000–2,000
- A significant informal loan: GHS 5,000–20,000
- A GEA (Ghana Enterprises Agency) formal loan: GHS 10,000–50,000 at ~12% interest
- A susu (rotating savings group) contribution: GHS 500–2,000/month
- A casual worker daily wage: GHS 50–80

**Accra references that ground the game:**
- Dumsor (power outages) — a real operational risk
- GEA / NEIP / BAC — formal support agencies
- Susu — informal rotating savings group
- Kumasi market — wholesale/distribution hub
- Mobile money (MoMo) — primary payment rail

Scenarios do NOT need to use all of these. Use them when they make the scenario feel real.

### Narrative Style

- **2–4 sentences max.** The scenario must be immediately legible on a phone screen.
- **Present tense.** "It is your third week" not "It was your third week."
- **No obviously right answer.** If a player can immediately tell which choice is "correct," the scenario fails.
- **Specificity over generality.** "A distributor in Kumasi offers 500 units" beats "A potential partner approaches you."
- **Emotional stakes.** Good scenarios put something real at risk — money, a relationship, a reputation, an opportunity.

### Choice Style

Each node has **exactly 3 choices**. Format:
- `text`: 1–2 sentences. What the player actually does. No hedging.
- `tensionHint`: 3–5 words describing the EO tension WITHOUT naming the dimensions. Example: "Speed vs. financial stability", "Market dominance vs. relational capital."

The `tensionHint` is shown to the player as a subtitle. It should feel like a moral trade-off, not a category label.

### What Already Exists

Layer 1 (5 nodes) and Layer 2 node 1 are done. Read them in `backend/src/scenario-registry.ts` for tone and style reference. Do not duplicate their scenarios.

Existing Layer 1 themes:
- L1-node-1: distributor deal, Kumasi, 500 units (competition)
- L1-node-2: blogger product giveaway (branding)
- L1-node-3: underperforming friend/employee (hiring)
- L1-node-4: competitor pricing below cost (competition)
- L1-node-5: cheap packaging vs. rebrand (branding)

Existing Layer 2 node:
- L2-node-1: GEA loan vs. informal cousin loan (financing)

---

## The TypeScript Node Format

Every node must conform to this exact shape. Copy it exactly — field names are case-sensitive.

```typescript
const NODE_ID: ScenarioNodeFull = {
  id: "L{layer}-node-{n}",          // e.g. "L2-node-2"
  layer: 2,                          // integer 2–5
  theme: "competition",              // one of the NodeTheme values below
  baseWeight: 1.0,                   // always 1.0 unless you have a reason
  eoTargetDimensions: ["riskTaking", "proactiveness"],  // 1–2 dimensions
  conditions: {                      // OPTIONAL — omit if no conditions
    capitalMin: 5000,
    reputationMin: 10,
  },
  narrative: "...",
  choices: [
    { index: 0, text: "...", tensionHint: "..." },
    { index: 1, text: "...", tensionHint: "..." },
    { index: 2, text: "...", tensionHint: "..." },
  ],
  effects: [
    // Choice 0 effect
    {
      capital: -2000,
      revenue: 1500,
      debt: 0,
      monthlyBurn: 200,
      reputation: 8,
      networkStrength: 5,
      eoDeltas: { riskTaking: 2, proactiveness: 1 },
    },
    // Choice 1 effect
    {
      capital: 0,
      revenue: 400,
      debt: 0,
      monthlyBurn: 0,
      reputation: 4,
      networkStrength: 3,
      eoDeltas: { autonomy: 1 },
    },
    // Choice 2 effect
    {
      capital: 0,
      revenue: 100,
      debt: 0,
      monthlyBurn: 0,
      reputation: -2,
      networkStrength: -1,
      eoDeltas: { autonomy: 2, riskTaking: -1 },
    },
  ],
};
```

### Valid `theme` values
`"financing"` | `"competition"` | `"hiring"` | `"branding"` | `"operations"` | `"networking"` | `"crisis"` | `"general"`

### Valid `eoTargetDimensions` values
`"autonomy"` | `"innovativeness"` | `"riskTaking"` | `"proactiveness"` | `"competitiveAggressiveness"`

### Valid `conditions` fields (all optional)
```typescript
{
  capitalMin?: number;       // player must have AT LEAST this much capital
  capitalMax?: number;       // player must have AT MOST this much capital
  reputationMin?: number;    // player must have AT LEAST this reputation
  reputationMax?: number;
  debtMin?: number;
  debtMax?: number;
  requiresMentorAccess?: boolean;   // true = only shows if player has mentor
  requiresPremises?: boolean;       // true = only shows if player has premises
  employeeCountMin?: number;        // minimum employee count
}
```

### Optional flags in effects (set boolean state on world)
```typescript
eoDeltas: { ... },
flags: {
  mentorAccess: true,     // player now has mentor access
  susuMember: true,       // player joined a susu group
  hasBackupPower: true,   // player bought a generator
  hasPremises: true,      // player rented a space
}
```

---

## Effect Calibration Rules

These are the guardrails for the numeric effects. Stay within these ranges.

| Field | Layer 2 | Layer 3 | Layer 4 | Layer 5 |
|---|---|---|---|---|
| `capital` | -5,000 to +25,000 | -8,000 to +30,000 | -10,000 to +40,000 | 0 |
| `revenue` | -500 to +3,000 | -1,000 to +5,000 | -2,000 to +8,000 | 0 |
| `debt` | 0 to +20,000 | 0 to +30,000 | 0 to +40,000 | 0 |
| `monthlyBurn` | -200 to +800 | -400 to +1,500 | -600 to +2,000 | 0 |
| `reputation` | -15 to +20 | -20 to +25 | -25 to +30 | 0 |
| `networkStrength` | -10 to +15 | -12 to +18 | -15 to +20 | 0 |
| `eoDeltas` (per dimension) | -2 to +3 | -2 to +3 | -2 to +3 | 0 |

**Rules:**
- The "bold/risky" choice should have the biggest upside AND the biggest downside.
- The "cautious/conservative" choice should have small effects in both directions.
- The "middle/creative" choice should have moderate effects and often targets a different EO dimension than choices 0 and 1.
- No choice should have all-positive effects — every meaningful decision has a trade-off.
- `eoDeltas` should only touch dimensions that `eoTargetDimensions` specifies (plus one adjacent dimension for nuance). Don't blast all 5 dimensions in one node.

---

## Layer 0 — Onboarding Experience

Layer 0 is the player's entry point into the world. It has three parts in sequence.

---

### Part 1: Preamble

A short narrative that drops the player into a specific moment in Accra. This is not a question — it is story immersion. It establishes:
- Who the player is (a young entrepreneur, a specific character moment)
- The economic conditions they're entering (some stated, some hidden in world state)
- The emotional stakes of starting

**Format:** 3–5 sentences. Present tense. Specific. Grounded in Accra.

**What to reveal:** Character situation, available capital (GHS 10,000), the city as setting.

**What to hide:** Market demand level, competitor aggression, infrastructure reliability — these are seeded procedurally and influence events later.

**Example tone** (not final — Brie should write her own):
> "It is the first Monday of April and you are sitting in the front room of your family home in Madina, laptop open, MoMo balance at GHS 10,000. You have been planning this for two years. Everyone around you thinks you should take the civil service job. You have already decided you won't."

---

### Part 2: Opening Direction Choice

Before the classifier questions, give the player 3–4 **sector/approach options** presented as narrative framings — not plain labels. These seed the player's `sector` field in world state and give the classifier early signal.

**Format:** Short label + 1-sentence description. Example structure:

```
Option A — "I'm building something digital"
Tech product, platform, or service. Your office is your laptop.

Option B — "I'm selling something physical"
A product you make or source. Your challenge is supply and shelf space.

Option C — "I'm connecting people"
A marketplace, agency, or logistics play. Your value is the network you build.

Option D — "I'm growing something"
Agri-business, food processing, or rural-to-urban trade. Your edge is patience and land.
```

**What the classifier does with this:** The sector choice seeds `worldState.sector` and adjusts which Layer 1 node the player enters. It is NOT the primary EO signal — the 3 questions below do that.

---

### Part 3: The 3 Classifier Questions

Three sequential short-answer prompts. Each one is scenario-flavored — not abstract. The player types a free-text response to each. The backend sends all 3 responses together to the Claude API classifier.

**Design rules:**
- One situation. One question. No "or." No options. No hedging.
- Each question is grounded in the world state the preamble has already established — the player answers from inside the story, not from outside it
- No question names an EO dimension
- Each question targets 1–2 specific poles (see mapping below)
- Questions build on each other — the story progresses across the 3 prompts
- Short. Direct. A player should be able to read it in 3 seconds.

**Question 1** — targets: values (people vs profit) + orientation (proactive vs reactive)

Ask the player *why* they are doing this. One sentence. The answer reveals whether they are chasing an opportunity (proactive) or responding to circumstances (reactive), and what they value most.

Example:
> "Why are you starting this business?"

---

**Question 2** — targets: risk tolerance + autonomy (autonomous vs collaborative)

Place the player in a single, specific situation that has already happened in their world. No choices offered. Ask what they did. The answer reveals how they handle adversity — alone or with others, absorbing risk or avoiding it.

Example:
> "Your first supplier just backed out. What did you do?"

---

**Question 3** — targets: competitive aggressiveness + agency (autonomous vs collaborative)

Introduce one specific person into their world — not a category of person, one person. Ask how the player responded to them. The answer reveals how they relate to others in their space — competitively or collaboratively, independently or dependently.

Example:
> "Someone in Accra is building something very similar to yours. You've just heard about them. What's your move?"

---

### Layer 0 Output Format

Brie should write these as plain text strings — not TypeScript objects. They will be hardcoded into the backend API route (`POST /api/game/start`) and passed to the frontend as structured JSON.

**Deliver as:**

```
PREAMBLE:
[3–5 sentences]

SECTOR_OPTIONS:
A: [label] — [1-sentence description]
B: [label] — [1-sentence description]
C: [label] — [1-sentence description]
D: [label] — [1-sentence description]

QUESTION_1:
[prompt text]

QUESTION_2:
[prompt text]

QUESTION_3:
[prompt text]
```

Davis will review and integrate these into the backend code. Brie does not need to touch any code for Layer 0.

---

## Nodes to Write

### Layer 2 — 4 new nodes

The Director AI selects from all Layer 2 nodes. These scenarios should feel like "a few months in" — the business has survived but is still small and fragile.

---

**L2-node-2**
- `theme`: `"competition"`
- `eoTargetDimensions`: `["competitiveAggressiveness", "proactiveness"]`
- Context: A rival has opened nearby / undercut you / stolen a client. How do you respond?
- The scenario should force a choice between direct confrontation, flanking strategy, or patience.

---

**L2-node-3**
- `theme`: `"operations"`
- `eoTargetDimensions`: `["riskTaking", "innovativeness"]`
- Context: An operational crisis — dumsor, a supplier delay, a logistics breakdown.
- The scenario should force a choice between a risky fix, a creative workaround, or absorbing the loss.

---

**L2-node-4**
- `theme`: `"networking"`
- `eoTargetDimensions`: `["proactiveness", "autonomy"]`
- Context: A networking opportunity — a trade fair, a pitch event, an industry association.
- The scenario should force a choice between investing time/money to attend, sending someone else, or skipping it.

---

**L2-node-5**
- `theme`: `"hiring"`
- `eoTargetDimensions`: `["autonomy", "competitiveAggressiveness"]`
- Context: A talented person wants to join but expects co-founder status or equity — not a salary.
- The scenario should force a choice between giving equity, offering a performance deal, or hiring someone less talented for cash.

---

### Layer 3 — 4 nodes

These scenarios should feel like "six months to a year in" — the business has a track record, some revenue, and more complex decisions. Stakes are higher.

---

**L3-node-1**
- `theme`: `"financing"`
- `eoTargetDimensions`: `["riskTaking", "proactiveness"]`
- Context: A growth financing decision — scale up fast with debt/investment or grow organically.
- The scenario should involve a real Ghanaian financing mechanism (susu, GEA, angel investor, bank).

---

**L3-node-2**
- `theme`: `"competition"`
- `eoTargetDimensions`: `["competitiveAggressiveness", "innovativeness"]`
- Context: A more mature competitive threat — a larger player entering your space or poaching your customers.
- The scenario should force a choice between direct fight, differentiation, or partnership with the threat.

---

**L3-node-3**
- `theme`: `"crisis"`
- `eoTargetDimensions`: `["riskTaking", "autonomy"]`
- Context: A serious crisis — a key employee quits taking client relationships, a large client defaults on payment, a regulatory issue.
- The scenario should force a choice between aggressive recovery, damage control, or restructuring.

---

**L3-node-4**
- `theme`: `"branding"`
- `eoTargetDimensions`: `["innovativeness", "proactiveness"]`
- Context: An opportunity to reposition or expand the brand — new channel, new customer segment, new product line.
- The scenario should force a choice between bold repositioning, incremental extension, or staying focused.

---

### Layer 4 — 3 nodes

These scenarios should feel like "one to two years in" — the business is real, bigger decisions, team exists, market position established. Higher capital effects, more complex trade-offs.

---

**L4-node-1**
- `theme`: `"operations"`
- `eoTargetDimensions`: `["proactiveness", "riskTaking"]`
- Context: A scaling decision — rent proper premises, hire aggressively, or acquire a smaller competitor.
- The scenario should involve a significant capital commitment with meaningful downside if it fails.

---

**L4-node-2**
- `theme`: `"networking"`
- `eoTargetDimensions`: `["competitiveAggressiveness", "autonomy"]`
- Context: A strategic partnership offer — a larger company wants to distribute/white-label/acquire a stake in your business.
- The scenario should force a choice between independence, partial partnership, or full exit exploration.

---

**L4-node-3**
- `theme`: `"crisis"`
- `eoTargetDimensions`: `["innovativeness", "proactiveness"]`
- Context: A market shift forces a pivot — customer behavior changed, a new technology disrupted your model, regulation changed.
- The scenario should force a choice between bold pivot, incremental adaptation, or doubling down on the original model.

---

### Layer 5 — 2 ending nodes

Layer 5 is the **convergence ending**. The narrative describes the state of the player's business at the end of the simulation. There are no further decisions — these are outcomes.

**Style for Layer 5:**
- 3–5 sentences. More reflective and conclusive than earlier layers.
- The narrative should feel like the end of a story, not a new problem.
- Choices still need to exist (3 per node) but they are **reflective/farewell choices** — e.g., "What does this experience mean to you?" These don't affect state (all effects are zero).
- `tensionHint` for L5 choices can be omitted or minimal.

---

**L5-ending-1** — The Thriving Founder
- `theme`: `"general"`
- `eoTargetDimensions`: `[]` (empty — no profiling at this stage)
- Context: The player's business has grown. They have revenue, a small team, market presence. The narrative should feel earned but not triumphalist — acknowledge the cost.
- Choices: 3 reflective options about what the player learned or what they'd do next.

---

**L5-ending-2** — The Resilient Founder
- `theme`: `"general"`
- `eoTargetDimensions`: `[]`
- Context: The player's business is alive but still small and struggling. They survived things that would have ended lesser ventures. The narrative should feel honest — not failure, but a realistic picture of early-stage entrepreneurship.
- Choices: 3 reflective options.

---

## How to Register the Nodes

After writing the node objects, add each one to the `REGISTRY` map at the bottom of `backend/src/scenario-registry.ts`:

```typescript
const REGISTRY: Map<string, ScenarioNodeFull> = new Map([
  [L1_NODE_1.id, L1_NODE_1],
  // ... existing nodes ...
  [L2_NODE_2.id, L2_NODE_2],   // ← add your nodes here
  [L2_NODE_3.id, L2_NODE_3],
  // etc.
]);
```

---

## Task Breakdown

### Task 0: Write Layer 0 onboarding content

**File:** Deliver as plain text (not TypeScript). Davis integrates into backend.

- [ ] Write the preamble (3–5 sentences, Accra, present tense, GHS 10,000 starting capital)
- [ ] Write 4 sector options (A–D) in narrative framing format
- [ ] Write Question 1 (values + proactive/reactive orientation)
- [ ] Write Question 2 (risk tolerance + autonomy signal)
- [ ] Write Question 3 (competitive aggressiveness + social/relational signal)
- [ ] Self-check: no question names an EO dimension; each feels like a story continuation, not a survey
- [ ] Deliver in the plain-text format specified above

### Task 1: Write Layer 2 nodes (L2-node-2 through L2-node-5)

**File:** `backend/src/scenario-registry.ts`
Add after the existing `L2_NODE_1` constant.

- [ ] Write `L2_NODE_2` (competition / competitiveAggressiveness + proactiveness)
- [ ] Write `L2_NODE_3` (operations / riskTaking + innovativeness)
- [ ] Write `L2_NODE_4` (networking / proactiveness + autonomy)
- [ ] Write `L2_NODE_5` (hiring / autonomy + competitiveAggressiveness)
- [ ] Verify: each node has exactly 3 choices, exactly 3 effects in parallel, all required fields present
- [ ] Add all 4 to `REGISTRY`
- [ ] Commit: `content: add Layer 2 scenario nodes (L2-node-2 through L2-node-5)`

### Task 2: Write Layer 3 nodes (L3-node-1 through L3-node-4)

**File:** `backend/src/scenario-registry.ts`

- [ ] Write `L3_NODE_1` (financing / riskTaking + proactiveness)
- [ ] Write `L3_NODE_2` (competition / competitiveAggressiveness + innovativeness)
- [ ] Write `L3_NODE_3` (crisis / riskTaking + autonomy)
- [ ] Write `L3_NODE_4` (branding / innovativeness + proactiveness)
- [ ] Verify effects are within Layer 3 calibration range (see table above)
- [ ] Add all 4 to `REGISTRY`
- [ ] Commit: `content: add Layer 3 scenario nodes`

### Task 3: Write Layer 4 nodes (L4-node-1 through L4-node-3)

**File:** `backend/src/scenario-registry.ts`

- [ ] Write `L4_NODE_1` (operations / proactiveness + riskTaking)
- [ ] Write `L4_NODE_2` (networking / competitiveAggressiveness + autonomy)
- [ ] Write `L4_NODE_3` (crisis / innovativeness + proactiveness)
- [ ] Verify effects reflect higher-stakes Layer 4 calibration
- [ ] Add all 3 to `REGISTRY`
- [ ] Commit: `content: add Layer 4 scenario nodes`

### Task 4: Write Layer 5 ending nodes

**File:** `backend/src/scenario-registry.ts`

- [ ] Write `L5_ENDING_1` (thriving founder ending — all effects zero, reflective choices)
- [ ] Write `L5_ENDING_2` (resilient founder ending — all effects zero, reflective choices)
- [ ] Verify: all numeric effects are 0, `eoDeltas` is `{}`
- [ ] Add both to `REGISTRY`
- [ ] Commit: `content: add Layer 5 ending nodes`

### Task 5: Self-review checklist

Before declaring done:

- [ ] Every node has exactly 3 choices and exactly 3 effects (parallel arrays)
- [ ] No scenario duplicates an existing L1 or L2-node-1 scenario
- [ ] Every `tensionHint` describes a moral/strategic trade-off, not a label
- [ ] No choice has all-positive effects — every decision has a real cost
- [ ] Effect numbers are within the calibration ranges for their layer
- [ ] `eoDeltas` only touch dimensions in `eoTargetDimensions` (plus one adjacent max)
- [ ] Layer 5 effects are all zeroes
- [ ] All nodes are registered in `REGISTRY`
- [ ] TypeScript compiles: run `npm run type-check` from the `backend/` directory

---

## Completion Criteria

The demo is ready when a player can complete the path:
```
Layer 0 (classify) → any L1 node → any L2 node → any L3 node → any L4 node → any L5 ending
```

The Director AI selects from the pool — so as long as each layer has at least 2–3 nodes, the demo will show meaningful divergence between two players.

---

_Content spec for Brie | April 2026 | HatchQuest v2 demo_
