# Orchestrator plan

**Project:** Agentic Content Creator (main project).

**The biggest job, too big for one agent:** Turn one upcoming event into three genuinely distinct, human-ready social post concepts, each independently quality-scored — too big for one pass because it needs deep research, creative judgment, copywriting, visual design, and independent scoring, and mixing those in one shot collapses distinctiveness and lets errors compound unchecked.

## Sub-agents

1. **researcher**
   - Task: research the event and produce a grounded `EventBrief` (facts, key messages, do's/don'ts, sensitivity flags) — the only source of truth every downstream agent may use.
   - Guardrail: never state a fact it cannot verify — mark it `unverified_claims` instead of asserting it.

2. **creative-director**
   - Task: turn the `EventBrief` into exactly 3 concepts, one each for the Emotional, Educational, and Modern archetypes.
   - Guardrail: never ship two concepts that share the same core message or visual direction — a collapse into near-duplicates is a fail, not a pass.

3. **producer**
   - Task: for ONE concept, write its copy (one-liner, caption, CTA, hashtags) and its visual spec (palette, layout, image prompt) together, matched to the brand.
   - Guardrail: never use a color, font, or tone outside the brand-guidelines palette — brand constraints are never optional, even to match a national or event theme.

4. **reviewer**
   - Task: score all 3 finished concepts against the quality rubric, issue a pass/revise verdict per concept, and check the 3 are genuinely diverse as a set.
   - Guardrail: never pass a concept with a cultural/religious sensitivity concern without an explicit human-SME-required flag — silence is not clearance.

## Orchestrator's own job

Run researcher once → run creative-director once → run producer three times (once per concept) → run reviewer once over all three outputs together → combine into one packet for human approval.

**The orchestrator does none of this work itself** — it only sequences the four sub-agents above and combines their outputs. If it's producing content, scoring content, or making a creative call, that's a sub-agent's job, not the orchestrator's.
