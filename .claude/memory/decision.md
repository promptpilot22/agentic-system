# Decision log (ADR)

**Purpose:** A durable, append-only record of *why* the system is built and behaves the way it does — architecture, defaults, and rule changes. Consult this before changing architecture or overriding a default; it prevents re-litigating settled choices. Unlike `memory.md` (learned patterns), this captures deliberate decisions and their rationale.

**Written by:** humans and `/self-improve` when a lesson changes system behavior. **Append-only** — never rewrite history; supersede an old decision with a new entry that references it.

**Entry format:**
```
## ADR-NNN: <title>
- Date: YYYY-MM-DD
- Status: proposed | accepted | superseded by ADR-MMM
- Context: <what forced a decision>
- Decision: <what we chose>
- Rationale: <why; alternatives rejected>
- Consequences: <what this implies / constrains>
```

---

## ADR-001: Split image generation from text compositing
- Date: 2026-07-07
- Status: accepted
- Context: Image models render in-image caption text unreliably and off-brand.
- Decision: The image model produces only the illustration/background; text and logo are composited deterministically (HTML/CSS → PNG).
- Rationale: Pixel-perfect, brand-consistent, editable output; avoids garbled text.
- Consequences: `visual-designer` prompts must exclude rendered text; `/compose-post` owns layout and typography.

## ADR-002: Exactly three concepts by fixed archetype
- Date: 2026-07-07
- Status: accepted
- Context: "Three options" risks becoming three variations of one idea.
- Decision: Every event yields exactly 3 concepts — Emotional, Educational, Modern — enforced in `creative-director` and checked by `quality-reviewer`.
- Rationale: Guarantees genuine creative diversity for the human to choose from.
- Consequences: Diversity is a hard gate; near-duplicates are rejected and regenerated.

## ADR-003: Human approval is a hard gate
- Date: 2026-07-07
- Status: accepted
- Context: Autonomous publishing of culturally sensitive content is high-risk.
- Decision: Nothing exports/publishes without explicit human approval; cultural flags require SME sign-off.
- Rationale: Reputational safety; keeps humans in control.
- Consequences: The pipeline pauses at approval; approval never carries across runs.

## ADR-004: Model tiering
- Date: 2026-07-07
- Status: accepted
- Context: Cost vs. quality across agents.
- Decision: Opus for creative-director + quality-reviewer; Sonnet for research/writing/design; Haiku for feedback-router; deterministic logic for date math and compositing.
- Rationale: Spend reasoning budget where judgment matters most.
- Consequences: Revisit tiers with real cost/quality data via `/self-improve`.
