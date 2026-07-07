# System structure (map)

**Purpose:** The always-current index of how the system is wired — agents, skills, memory, data, and the pipeline. `@import`ed into every session so Claude and teammates share one mental model. Keep it accurate and short; update it (via `/self-improve` or by hand) whenever components change.

## Pipeline
```
event-monitor (cron/deterministic)
   └─► generate-event-posts (orchestrator skill)
          1. event-researcher      → EventBrief
          2. creative-director     → 3 concepts (Emotional/Educational/Modern)
          3. content-writer ∥ visual-designer  (per concept) → CopyPackage + VisualSpec
          4. compose-post          → finished PNGs (image gen + deterministic compositing)
          5. quality-reviewer      → scores + verdict (revise loops ≤2)
          6. HUMAN APPROVAL GATE   (stop)
          7. export
       feedback-router routes human edits back to the minimal step
```

## Subagents (`.claude/agents/`)
| Agent | Responsibility | Model |
|---|---|---|
| event-researcher | Grounded event brief | sonnet |
| creative-director | 3 distinct concepts | opus |
| content-writer | Copy per concept | sonnet |
| visual-designer | Visual spec + image prompt per concept | sonnet |
| quality-reviewer | Score + pass/revise gate | opus |
| feedback-router | Minimal-regeneration routing | haiku |

## Skills (`.claude/skills/`)
| Skill | Role | Invocation |
|---|---|---|
| generate-event-posts | Orchestrates the full pipeline | user + model |
| event-monitor | Finds events due for generation | user + model + scheduled task |
| compose-post | Image gen + deterministic text/logo compositing | user + model |
| brand-guidelines | Brand voice/palette/fonts (reference; preloaded into creative/writer/designer) | reference |
| self-improve | Folds lessons into memory (learning loop) | manual only (`disable-model-invocation`) |

## Memory (`.claude/memory/`)
- `memory.md` — durable lessons (conclusions); `@import`ed.
- `decision.md` — ADR log (why); consulted on architecture changes.
- `session_log.md` — per-run observations; append-only, read on demand.
- `structure.md` — this map; `@import`ed.
> `CLAUDE.md` imports `memory.md` and this file. Native Claude Code auto-memory (`MEMORY.md`) is machine-local and separate; this `.claude/memory/` layer is version-controlled and team-shared.

## Data & config (see plan.md §6–8)
- Events / brands / runs / posts / feedback / agent_logs → Postgres (+ pgvector for `brand_exemplars`).
- Rendered images → object storage (S3/R2).
- Image API + web-search API + renderer are configured project-side (keys in env, not in repo).

## Autonomy
`event-monitor` runs daily as a scheduled task and kicks off `generate-event-posts` for each due event; everything still halts at the human approval gate.
