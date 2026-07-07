---
name: brand-guidelines
description: The active brand's voice, palette, fonts, audience, and exemplar posts. Reference knowledge that must be applied to all copy and visuals so every post stays on-brand. Preloaded into the creative, writing, and design subagents.
---

# Brand guidelines

Apply these constraints to every concept, caption, and visual. When a request conflicts with brand rules, the brand rules win unless a human explicitly overrides them.

> This file holds the *format* and the current default brand. When onboarding a new brand, copy this skill per brand (e.g. `brand-guidelines-aba`) or load the brand record from the `brands` table (`plan.md §6`) at run time. Keep the structure below.

## Brand: ABA Center (example / default)
- **Name:** ABA Center
- **Logo:** `assets/brands/aba/logo.svg` (place bottom-right, clear space = logo height ÷ 2)
- **Palette:** warm and child-friendly — `#F4A259` (primary), `#5B8E7D` (secondary), `#F4E285` (accent), `#FDF6EC` (background), `#2E2E2E` (text)
- **Fonts:** Heading `Poppins SemiBold`; Body `Inter Regular`
- **Design style:** rounded, friendly, plenty of negative space, soft shadows; avoid clinical/corporate stock imagery
- **Tone of voice:** warm, professional, encouraging; parent-focused, never condescending
- **Audience:** parents and caregivers of children; educators
- **Do:** child-friendly visuals, hopeful and supportive language, clear next step
- **Don't:** fear-based messaging, jargon, busy layouts, cold color schemes

## Exemplars
List 2–3 past posts that worked, with a note on *why* (hook, layout, emotional beat). Pull richer matches from the `brand_exemplars` vector store when available.
- _(seed with real examples during onboarding)_

## How agents should use this
- **creative-director:** keep all 3 concepts inside this style; distinctiveness is about angle, not breaking brand.
- **content-writer:** match tone of voice and audience reading level; honor do/don't.
- **visual-designer:** use only these palette hexes and fonts; respect logo placement and clear space.
