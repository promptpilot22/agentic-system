---
name: self-improve
description: Reviews recent generation runs and human feedback, extracts durable lessons, and folds them into the memory hierarchy so the system gets better over time. Run after a batch of runs or a round of edits/approvals.
disable-model-invocation: true
allowed-tools: Read, Edit, Write
---

# Self-improve

Turn recent experience into durable improvements. This is the learning loop — run it deliberately (not automatically), because it edits shared, versioned memory.

## Steps
1. **Gather** — Read the recent entries in `.claude/memory/session_log.md` and any new feedback. Focus on: what got rejected or heavily edited, which archetype won approval, recurring quality-reviewer issues, cultural flags raised.
2. **Extract lessons** — Identify patterns, not one-offs. Examples: "Modern concepts for Islamic events get rejected — lead with Educational", "captions over 2 lines fail readability on stories", "parents respond to second-person CTAs".
3. **Update memory** — Append durable, generalizable lessons to `.claude/memory/memory.md` under the right section. Keep it concise; prune stale or contradicted entries.
4. **Record decisions** — If a lesson changes how the system should behave (a rule, a default, a model-tier change), add an entry to `.claude/memory/decision.md` in ADR form.
5. **Update structure** — If agents, skills, formats, or data locations changed, update `.claude/memory/structure.md`.
6. **Propose rule changes** — If a lesson belongs in `CLAUDE.md` (a hard rule) or a subagent/skill prompt, propose the specific edit and ask the human before applying it there.

## Rules
- Only record lessons supported by ≥2 observations, or one clear human directive.
- Never delete `decision.md` or `session_log.md` history — append and supersede, don't rewrite.
- Keep `memory.md` and `structure.md` small enough to load cheaply (they are `@import`ed into context). Move detail into topic sections, not prose dumps.
- Distinguish *observations* (in session_log) from *conclusions* (in memory) from *rules* (in CLAUDE.md / prompts).
