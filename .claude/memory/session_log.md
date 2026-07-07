# Session log

**Purpose:** An append-only, chronological record of what actually happened in each generation run — the raw "observations" layer. `/self-improve` reads this to distill patterns into `memory.md`. This file is NOT `@import`ed (it grows without bound); it is read on demand.

**Written by:** the `generate-event-posts` workflow after each run, and any agent that completes a notable step. **Append-only.** Newest entries at the bottom.

**Entry format:**
```
## YYYY-MM-DD HH:MM — <event name> (<brand>) — run <run_id>
- Concepts: <archetypes produced>
- Quality: creativity/relevance/brand/uniqueness/message; diversity=<n>; verdict=<pass|revise>
- Flags: <cultural / brand / none>
- Human action: approved <concept> | edit "<instruction>" → regenerated <component> | rejected
- Notes: <anything surprising worth learning from>
```

---

<!-- Append run entries below this line. -->
