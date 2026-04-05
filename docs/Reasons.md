# HatchQuest — Design Decisions & Justifications

> This document records **why** specific design choices were made.
> Updated as the project evolves. Each entry includes the decision, the reasoning, and the data source where applicable.

---

## World State Variables

### Starting Capital: GHS 10,000

A university graduate in Ghana starting a small business realistically has access to GHS 5,000–20,000 through family support, personal savings, or micro-grants (e.g., GEA YouStart averages ~GHS 21,000 per grantee). GHS 10,000 sits at the lower-realistic end — enough to start but tight enough that every financial decision matters. This creates meaningful tension from turn one.

**Source:** Ghana Enterprises Agency YouStart disbursement data (2023); World Bank Ghana SME surveys.

### Monthly Burn: GHS 1,000–2,000 (varies per player)

A solo founder operating from home in Accra faces minimum costs of ~GHS 1,000–2,000/month (internet: GHS 329–750, mobile data: ~GHS 400, transport, basic supplies). This is deliberately below the ~GHS 8,000–15,000 burn of a 2-person business with rented premises — the player starts scrappy and burn scales up as they hire and formalize.

Variation per player adds replayability and forces adaptation to different resource constraints.

**Source:** Numbeo Accra cost of living; Ghana telecom tariff data (2025); field estimates.

### Reputation & Network: Start at 0

A fresh graduate founder has no established market presence and no business network. Starting both at zero reflects the reality that trust and connections must be earned through gameplay decisions. This also maximizes the dynamic range of these variables as game signals — the Director AI can clearly distinguish between a well-connected player and an isolated one.

### Business Sector (set at Layer 0)

Five sectors chosen for relevance to Ghanaian graduate entrepreneurs: tech, agriculture, retail, food & beverage, and services. These are the dominant sectors for youth-led SMEs in Accra per Ghana Statistical Service data. Each sector interacts differently with environment variables (e.g., agri is more affected by infrastructure reliability; tech by internet costs; retail by competitor aggression from Chinese imports).

**Source:** Ghana Statistical Service; GEA sector reports.

### Dumsor (Backup Power) as a Boolean

Power unreliability ("dumsor") is a defining operational risk for Accra SMEs. Businesses report significant losses from unannounced outages — spoiled inventory, idle equipment, forced generator costs (GHS 500–2,000/month). Making this a binary variable (has backup power or doesn't) creates a clean scenario trigger: invest in resilience vs. absorb the risk.

**Source:** Energy Commission of Ghana; news reports on 2024–2025 grid instability.

### Susu Group Membership

Susu (rotating savings cooperatives) are a primary informal capital source for Ghanaian micro-businesses, with typical rounds of GHS 500–5,000/month per contributor. Membership represents both financial access and community trust. As a boolean, it functions as a network capital mechanic — joining a susu is a meaningful choice with social and financial consequences.

### Environment Variables (Seeded per Session)

Four environment axes — market demand, infrastructure reliability, regulatory pressure, competitor aggression — are procedurally generated from the session seed. This ensures:
1. No two playthroughs face identical market conditions
2. The Director AI has external pressure variables independent of player choices
3. Scenarios can reference concrete environmental context (e.g., "the power grid has been unstable this month" when infrastructureReliability is low)

### EO Profile: Starts at 5.0 (Neutral Midpoint)

All five Lumpkin & Dess dimensions start at 5.0 on a [0–10] scale. This is the neutral midpoint — the player has not yet revealed any entrepreneurial orientation. Choices shift dimensions up or down from this baseline. Starting neutral prevents any built-in bias in the assessment.

**Source:** Lumpkin, G.T. & Dess, G.G. (1996). Clarifying the entrepreneurial orientation construct and linking it to performance. Academy of Management Review, 21(1), 135–172.

---

## Architecture Decisions

### v1 → v2: FSM Replaced by World State + Weighted Event Selector

v1 used a fixed 30-beat FSM where every player converged on similar outcomes regardless of choices. This defeated the purpose of behavioral assessment — if different choices don't produce different worlds, the EO profiling is meaningless. v2 uses world state as the brain: choices modify state, state modifies event weights, and divergence compounds across layers.

### 3 Choices Per Scenario (Not 9)

Each scenario presents 3 choices, each sitting at the intersection of EO dimensions in tension. This satisfies Prof. Acheampong's requirement for "dimension tensions baked into choices" without the UX cost of presenting 9 options. Three is the sweet spot — enough to create genuine dilemmas, few enough to keep pacing tight.

### Monorepo with Separate Backend (Fastify on Railway)

Frontend (Next.js on Vercel) is a pure consumer — no game logic. Backend (Fastify on Railway) owns all game state, EO scoring, and the Director AI. This separation ensures EO dimensions are never exposed to the client during gameplay and keeps the assessment tamper-resistant.

---

_Document owner: Davis Dey | Started: April 2026_
