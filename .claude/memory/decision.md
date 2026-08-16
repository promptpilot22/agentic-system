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

## ADR-005: Cultural-sensitivity checklist must persist an explicit outcome, not just an optional flag
- Date: 2026-08-16
- Status: proposed
- Context: An end-to-end eval found no way to tell "checklist ran, nothing to flag" apart from "checklist never ran" for Pakistani-category events — only the one Islamic event carried any stored sensitivity data.
- Decision: `EventBrief.sensitivity_flags` should always be accompanied by an explicit `cultural_review_completed: true` marker (or equivalent) for every event in the Islamic/Pakistani/cultural categories, even when the list is empty.
- Rationale: Auditability — reviewers and future eval passes need proof the checklist ran, not silence to infer it from.
- Consequences: `event-researcher` schema gains a field; `quality-reviewer` should treat a missing marker (not just a raised flag) as a `revise`-worthy gap for these categories. Requires a prompt/schema edit — see open proposal in conversation before applying.

## ADR-006: Add a deterministic brand-palette check to quality review
- Date: 2026-08-16
- Status: proposed
- Context: independence-day concepts scored 8-9/10 on LLM-judged brand alignment while using Pakistan flag colors that don't appear anywhere in the ABA Center palette — the LLM score alone missed an objectively checkable violation.
- Decision: Add a cheap deterministic check (same spirit as the existing embedding-similarity diversity backstop) that compares each `VisualSpec.color_palette` against the brand's stored hex list; a mismatch hard-flags rather than only lowering a score.
- Rationale: Objective, cheap, and catches exactly the kind of miss an LLM grader is prone to when the surrounding content (national holiday, national colors) makes the wrong choice feel intuitively "on-theme."
- Consequences: `quality-reviewer` or `/compose-post` gains a palette-match step. Requires a prompt/tooling edit — see open proposal in conversation before applying.

## ADR-007: Pin Turbopack workspace root when multiple lockfiles exist in the repo
- Date: 2026-08-16
- Status: accepted
- Context: A root-level `package.json`/`package-lock.json` (added for `db/` tooling) alongside `frontend/`'s own lockfile made Turbopack infer the wrong workspace root, breaking the RSC client manifest on every route — a 500 on `/` and `/login` before any dev-server code even ran.
- Decision: `frontend/next.config.mjs` pins `turbopack.root` explicitly to the frontend directory.
- Rationale: Smallest fix; keeps both lockfiles (db tooling vs. frontend) without forcing a monorepo restructure.
- Consequences: Don't remove this pin on a future Next.js upgrade without re-verifying `/` and `/login` return 200 with a clean `.next` cache.
