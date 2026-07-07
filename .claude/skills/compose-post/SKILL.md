---
name: compose-post
description: Assembles a finished social post from a copy package, a visual spec, and brand assets — generates the background image, then composites text and logo deterministically for each format. Use after writing and design, before quality review.
argument-hint: [concept-id] [format]
allowed-tools: Read, Write, Bash
---

# Compose post

Produce finished image files for one concept. Split the work: the image model makes the *illustration/background*; text and logo are placed deterministically by the renderer. Do NOT ask the image model to render caption text — it renders unreliably and off-brand.

## Input
A `CopyPackage` (copy) + `VisualSpec` (image_prompt, layout, typography, palette) + brand assets (logo, fonts) + target format(s): `ig_square` 1080×1080, `ig_story` 1080×1920, `fb`, `linkedin`.

## Steps
1. **Generate background** — Call the configured image API with `VisualSpec.image_prompt`. Save the raw image to the run's working directory. Retry once on failure; if it still fails, report and stop (do not fabricate an image).
2. **Composite** — Run the project renderer (server-side HTML/CSS → PNG) with the layout template for the format, layering: background image → text (one_liner, caption/supporting, CTA per `layout_instructions` and `typography`) → brand logo. Use only brand palette/fonts. Keep text inside the safe zones from `composition_notes`.
3. **Export** — Write the finished PNG (and the editable layered source) to object storage / the run folder. Record URLs.

## Output (return ONLY this JSON)
```json
{
  "concept_id": "string",
  "format": "ig_square | ig_story | fb | linkedin",
  "image_url": "string",
  "layered_source_url": "string",
  "applied_copy": {"one_liner": "string", "caption": "string", "cta": "string"}
}
```

## Rules
- Deterministic step — no creative rewriting here. If the copy doesn't fit the layout, report it for the writer to shorten; don't paraphrase silently.
- One output object per (concept, format).
- Never overwrite an approved export.
