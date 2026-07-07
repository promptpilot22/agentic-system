---
name: generate-event-posts
description: End-to-end workflow that turns one upcoming event into three approval-ready social posts. Use when the user asks to generate content for an event, or when event-monitor triggers a run. Orchestrates research, creative direction, writing, design, composition, and quality review, then stops for human approval.
argument-hint: [event-name-or-id] [brand-id]
---

# Generate event posts

Orchestrate the full pipeline for ONE event. You are the conductor: you delegate each step to the right subagent, pass structured JSON between them, and STOP at the human approval gate. Do not skip steps or publish anything.

## Steps
1. **Research** — Delegate to the `event-researcher` subagent with the event record + brand id. Get the `EventBrief`. If it returns `sensitivity_flags`, note them; they will gate approval.
2. **Concepts** — Delegate to `creative-director` with the brief. Get exactly 3 concepts (Emotional, Educational, Modern). If fewer than 3 or any two look interchangeable, send it back once.
3. **Write + Design (parallel)** — For each of the 3 concepts, delegate to `content-writer` and `visual-designer`. Collect `CopyPackage` + `VisualSpec` per concept.
4. **Compose** — For each concept and each requested format, run `/compose-post` to generate the image and composite text/logo into finished files.
5. **Review** — Delegate to `quality-reviewer` with all finished posts + the brief. If `verdict: revise`, re-run only the `revise_targets` (write and/or design → compose) up to 2 times, then proceed with the best result and note it.
6. **Human approval gate** — Present all 3 options with scores to the user. STOP. Do nothing further until a human approves, requests an edit (→ `feedback-router`), or rejects.
7. **Export** — Only after approval, export the approved post(s).

## Rules
- Validate each subagent's JSON against the schemas in `plan.md §6` before passing it on.
- If any `sensitivity_flag` or a quality `flag` for cultural concern is present, require explicit human SME sign-off before export.
- Log the run outcome to `.claude/memory/session_log.md` (event, verdict, scores, edits, approval).
- Never let approval from one event apply to another.

## Default formats
Instagram square (1080×1080) for MVP. Add story / Facebook / LinkedIn when requested.
