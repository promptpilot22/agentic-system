# Memory — durable lessons

**Purpose:** The system's long-term, generalizable knowledge — patterns learned from real runs and human feedback. This is the "conclusions" layer: what we now believe to be true and should apply going forward. It is `@import`ed into every session via CLAUDE.md, so **keep it concise** (aim < 150 lines). Detail and one-off events live in `session_log.md`; the reasoning behind rules lives in `decision.md`.

**Written by:** the `/self-improve` skill (and humans). Add a lesson only when supported by ≥2 observations or a clear human directive. Prune entries that later get contradicted.

**Entry format:**
```
- [YYYY-MM-DD] <lesson stated as a reusable rule>. (evidence: <run ids / feedback>)
```

---

## Creative direction
- [2026-08-16] "Modern"-archetype copy must still clearly evoke the specific event, not just be short and punchy — brevity was masking genericness that a human caught immediately. (evidence: human rejected earth-day-c3 "Earth doesn't need us. We need Earth." and mental-health-day-c3 "Mind first." as "too far from event scope" though both passed an AI polish-only check)

## Copywriting
- _(none yet)_

## Visual design
- [2026-08-16] Never trust an LLM-scored "brand alignment" number on its own — cross-check `color_palette` hexes against the brand-guidelines hex list directly. (evidence: independence-day concepts scored brand_alignment 8-9/10 while using Pakistan flag colors, not one hex from the ABA Center palette; see [[decision]] ADR-006)

## Cultural sensitivity
- [2026-08-16] "No sensitivity flag" is ambiguous — it can mean "checked, nothing found" or "never checked." Pakistani-category events need the same visible checklist evidence as Islamic ones, not just a `sensitivity` string that's absent by default. (evidence: independence-day and iqbal-day carry no cultural-review record at all; see [[decision]] ADR-005)
- [2026-08-16] Treat human "cringe"/tone objections as a high-priority signal distinct from grammar or factual checks — this failure mode doesn't show up in a facts or polish check. (evidence: human called independence-day-c3 "too cringe" where the AI judge had passed it on cultural fit)

## Quality & diversity
- [2026-08-16] AI-judge self-flagged low-confidence calls are worth a human spot-check before trusting the rest — but even that subset scored only 1/6 human agreement, meaning quality-reviewer verdicts should not gate approval unsupervised yet. (evidence: 45-item rubric run this session, 6-item human spot-check)

## Brand-specific
- _(none yet — note per brand which archetypes/tones win approval)_
