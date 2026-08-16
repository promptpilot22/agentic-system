// Eval: producer — task done (copy + visual spec per concept) + guardrail (brand palette only)
// The palette check is a deterministic backstop, not an LLM judgment call — this is the
// exact check ADR-006 (decision.md) proposed after the Independence Day brand-palette miss.
const { check, report } = require("./lib");

const BRAND_PALETTE = ["#F4A259", "#5B8E7D", "#F4E285", "#FDF6EC", "#2E2E2E"];

function run(run) {
  const concepts = run.concepts || [];
  const results = [];

  for (const c of concepts) {
    const id = c.concept_id;
    const copy = c.copy || {};
    check(results, `${id}: copy has one_liner/caption/cta/hashtags`,
      !!copy.one_liner && !!copy.caption && !!copy.cta && Array.isArray(copy.hashtags) && copy.hashtags.length > 0);

    const visual = c.visual || {};
    check(results, `${id}: visual spec has a color_palette`,
      Array.isArray(visual.color_palette) && visual.color_palette.length > 0);

    // Case-insensitive exact match against the brand hex list.
    const paletteUpper = BRAND_PALETTE.map((h) => h.toUpperCase());
    const offBrandHexes = (visual.color_palette || []).filter((hex) => !paletteUpper.includes(String(hex).toUpperCase()));
    check(
      results,
      `${id}: guardrail — every hex is in the brand palette`,
      offBrandHexes.length === 0,
      `off-brand hex(es): ${offBrandHexes.join(", ")}`
    );
  }

  return report("producer", results);
}

module.exports = { run };
