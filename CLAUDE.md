# Agentic Content Creator — Project Guide

Autonomous, self-improving system that generates event-based social posts (see @plan.md). It runs on Claude Code primitives: subagents in `.claude/agents/`, skills in `.claude/skills/`, and a versioned memory layer in `.claude/memory/`. Humans approve every output.

## Non-negotiable rules
- **Never** export/publish a post without an explicit human approval step. Approval for one run never carries to another.
- Islamic, Pakistani, and other cultural/religious events REQUIRE the `cultural-sensitivity` checklist; when it raises a flag, stop and request human SME sign-off.
- Every event MUST yield exactly **3 concepts** that differ by archetype (Emotional / Educational / Modern). Reject near-duplicates.
- Event facts (history, dates, figures) come **only** from the researcher's brief. Never invent them.
- Brand voice, palette, and fonts come from the `brand-guidelines` skill. Do not override brand constraints.
- Resolve Islamic (lunar) event dates with a Hijri library. Never hard-code Gregorian dates.

## Pipeline
`event-researcher` → `creative-director` (3 concepts) → [`content-writer` ∥ `visual-designer`] → `/compose-post` → `quality-reviewer` → **human approval** → export.
Human edits re-enter at the *minimal* step via `feedback-router`. Full map: @.claude/memory/structure.md

## Model tiering
- Opus: `creative-director`, `quality-reviewer`
- Sonnet: `event-researcher`, `content-writer`, `visual-designer`
- Haiku: `feedback-router`
- Deterministic (no LLM): calendar date math, text/logo compositing.

## Conventions
- Agent I/O is structured JSON matching the schemas in @plan.md §6. Validate before passing downstream.
- After each run, append the outcome to `.claude/memory/session_log.md`; record any non-obvious choice in `.claude/memory/decision.md`.
- Keep temp/render files out of the repo.

## Memory
@.claude/memory/memory.md
Consult `.claude/memory/decision.md` before changing architecture; append to `session_log.md` after each run. (Native auto-memory `MEMORY.md` is machine-local; these files are the shared, versioned layer.)

## Self-improvement
After a completed batch or a round of feedback, run `/self-improve` to fold durable lessons into `memory.md` and `decision.md`.
