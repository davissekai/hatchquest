# HatchQuest — World Conditions Reference for Brie

> This document defines the world the player inhabits. Use it as ground truth when writing the preamble, the 3 classifier questions, and all scenario nodes. If you think something should be changed or could be better — say so.

---

## The Player's Starting World

Every game session begins with the same starting conditions. Some are told to the player upfront (visible in the preamble and HUD). Some are hidden and influence events behind the scenes.

### Visible to the Player

| Condition | Value | What it means |
|---|---|---|
| Capital | GHS 10,000 | Cash on hand. The player can see this at all times. |
| Monthly burn | GHS 1,000–2,000 | How much they spend to keep the business alive each month. Varies per player. |
| Revenue | GHS 0 | Nothing coming in yet. Day one. |
| Debt | GHS 0 | No loans taken yet. |
| Reputation | 0 / 100 | Nobody knows them yet. |
| Network strength | 0 / 100 | No connections yet. |
| Employees | 0 | Solo founder. |
| Business formality | Unregistered | Operating informally. |
| Has premises | No | Working from home. |
| Has backup power | No | Exposed to dumsor. |
| Susu member | No | Not yet in a savings group. |
| Mentor access | No | No formal support linkage yet. |

### Hidden from the Player (Procedurally Seeded)

These variables exist and drive events — but the player never sees them directly. They are set by a random seed at session start and vary per player.

| Condition | Range | What it drives |
|---|---|---|
| Market demand | 0–100 | How hungry the market is for this type of business |
| Infrastructure reliability | 0–100 | How bad dumsor/internet issues are in their area |
| Regulatory pressure | 0–100 | How much compliance burden they face |
| Competitor aggression | 0–100 | How hard informal competitors are pushing |

A player with high market demand and low competitor aggression will see different events than one in the opposite situation — even if they make identical choices.

---

## The Ghana / Accra Economic Context

Ground all scenarios in real numbers and real institutions. These are not invented — they reflect the actual SME environment in Ghana.

### Money

| Reference point | Amount |
|---|---|
| Starting capital | GHS 10,000 |
| Typical informal loan (family/friend) | GHS 2,000–10,000 |
| GEA formal loan | GHS 10,000–50,000 at ~12% interest |
| Susu monthly contribution | GHS 500–2,000 |
| Casual worker daily wage | GHS 50–80 |
| Modest shop rent (Accra, monthly) | GHS 800–2,500 |
| Generator (small business size) | GHS 3,000–8,000 |
| Simple website / branding | GHS 1,500–5,000 |

### Institutions (use by name — they are real)

| Institution | What it does |
|---|---|
| GEA (Ghana Enterprises Agency) | Formal SME loans + business support |
| NEIP (National Entrepreneurship & Innovation Programme) | Youth entrepreneur grants and incubation |
| BAC (Business Advisory Centre) | Free/subsidized business advisory |
| Susu | Informal rotating savings group — players pool money and take turns receiving the pot |
| Mobile Money (MoMo) | Primary payment rail — MTN MoMo, Telecel Cash |

### Locations (use when specific geography adds texture)

- **Accra** — the city, the base of operations
- **Kumasi** — major market hub, wholesale, distribution
- **Madina / Tema / Kasoa** — Accra suburbs, different market characters
- **Kantamanto** — second-hand goods market, relevant for retail/fashion
- **Makola Market** — central Accra, dense informal trade

### Realities to Draw On

- **Dumsor** — erratic power outages. A real operational risk. Having a generator (`hasBackupPower`) is a genuine competitive advantage.
- **Informal competition** — most markets have established informal players who operate without overheads. Competing against them on price is usually a losing game.
- **Relationship capital** — in Ghana's business culture, who you know matters enormously. `networkStrength` reflects this.
- **Formality ladder** — businesses move from unregistered → sole proprietorship → limited company. Each step has costs and benefits.

---

## Sector Options (Layer 0 Framing)

The player picks one of these at the start. It seeds their `sector` field and influences which events they see.

| Option | Sector value | Character |
|---|---|---|
| Digital / tech | `tech` | Platform, app, digital service. Asset-light, high-growth potential, regulatory grey area. |
| Physical product | `retail` or `food` | Something made or sourced. Supply chain, shelf space, quality control matter. |
| Connector / marketplace | `services` | Marketplace, agency, logistics. Value is the network, not inventory. |
| Agri / food chain | `agri` | Farming, processing, rural-to-urban trade. Patience, seasonality, land access. |

---

## EO Poles — What the Classifier Maps To

The 3 classifier questions map player responses to these poles. Each pole pair is independent — a player can be proactive AND risk-averse at the same time.

| Pole pair | What a high response looks like |
|---|---|
| **Proactive** vs Reactive | "I saw the gap and moved before anyone else did" vs "I started because I needed income" |
| **Risk-tolerant** vs Risk-averse | "I put everything in" vs "I made sure I had a fallback" |
| **Autonomous** vs Collaborative | "I made the call myself" vs "I got my people involved" |
| **Competitive** vs Measured | "I went straight at them" vs "I focused on my own lane" |
| **People-first** vs Profit-first | "I wanted to solve a real problem for my community" vs "I saw a market and moved on it" |

These poles shape the starting EO profile and route the player to one of the 5 Layer 1 nodes.

---

## Node Eligibility Conditions

When writing scenario nodes for Layers 2–5, you can attach optional conditions that control when a node is eligible to appear. The Director AI only presents a node if all its conditions pass.

Use these sparingly — most nodes should have no conditions and appear broadly. Use conditions only when a scenario genuinely requires a specific world state to make sense.

| Condition field | Type | Example use |
|---|---|---|
| `capitalMin` | GHS number | Node involves a large investment — only makes sense if player has capital |
| `capitalMax` | GHS number | Node is a crisis of poverty — only fits if player is low on cash |
| `reputationMin` | 0–100 | Node involves being approached for a partnership — requires some reputation |
| `reputationMax` | 0–100 | Node is an early-stage problem — shouldn't appear to established players |
| `debtMin` | GHS number | Node is about managing debt — player must have debt |
| `requiresMentorAccess` | true/false | Node involves a GEA/BAC advisor — only if player has mentor access |
| `requiresPremises` | true/false | Node involves the physical space — only if player has rented premises |
| `employeeCountMin` | integer | Node involves managing staff — player must have at least N employees |

---

## Effect Calibration — What Numbers Are Reasonable

When writing node effects, stay within these ranges. Each choice has its own effect object.

| Field | Layer 2 | Layer 3 | Layer 4 | Layer 5 |
|---|---|---|---|---|
| Capital delta | -5,000 to +25,000 | -8,000 to +30,000 | -10,000 to +40,000 | 0 |
| Revenue delta | -500 to +3,000 | -1,000 to +5,000 | -2,000 to +8,000 | 0 |
| Debt added | 0 to +20,000 | 0 to +30,000 | 0 to +40,000 | 0 |
| Monthly burn delta | -200 to +800 | -400 to +1,500 | -600 to +2,000 | 0 |
| Reputation delta | -15 to +20 | -20 to +25 | -25 to +30 | 0 |
| Network delta | -10 to +15 | -12 to +18 | -15 to +20 | 0 |
| EO delta (per dimension) | -2 to +3 | -2 to +3 | -2 to +3 | 0 |

**Rules that apply across all layers:**
- The bold/risky choice has the biggest upside AND the biggest downside
- The cautious choice has small effects in both directions
- The creative/middle choice has moderate effects, often targeting a different EO dimension
- No choice should have all-positive effects — every real decision has a cost
- EO deltas should only touch 1–2 dimensions per node, not all 5

---

_Reference doc for Brie | HatchQuest v2 | April 2026_
