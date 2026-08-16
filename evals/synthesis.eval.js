// Synthesis eval — each sub-agent can pass alone while the combined result contradicts
// itself. This checks that the pieces actually fit together, not just each in isolation.
const { check, report } = require("./lib");

function run(run) {
  const results = [];
  const concepts = run.concepts || [];
  const review = run.review || {};

  // 1. Reviewer covered exactly the concepts producer actually made — no missing, no extra.
  const conceptIds = concepts.map((c) => c.concept_id).sort();
  const reviewedIds = (review.per_concept || []).map((v) => v.concept_id).sort();
  check(results, "reviewer's verdicts cover exactly the concepts produced (no missing/extra)",
    JSON.stringify(conceptIds) === JSON.stringify(reviewedIds),
    `concepts=${conceptIds.join(",")} reviewed=${reviewedIds.join(",")}`);

  // 2. Producer's actual copy is as diverse as creative-director intended — a plan can call
  // for 3 distinct concepts while the written one-liners collapse into near-duplicates.
  const oneLiners = concepts.map((c) => (c.copy && c.copy.one_liner || "").trim().toLowerCase());
  check(results, "producer's one-liners are pairwise distinct (plan's diversity survived production)",
    oneLiners.length === new Set(oneLiners).size);

  // 3. Every concept's assigned palette differs from its siblings' — three concepts that all
  // pass the brand-palette check individually could still all pick the identical two hexes.
  const paletteKeys = concepts.map((c) => JSON.stringify((c.visual && c.visual.color_palette || []).slice().sort()));
  check(results, "each concept's palette pairing is distinct from its siblings'",
    paletteKeys.length === new Set(paletteKeys).size);

  // 4. If any concept individually failed review, that must be visible at the top level —
  // a synthesis packet cannot report an overall-ready state while hiding a per-concept revise.
  const anyRevise = (review.per_concept || []).some((v) => v.verdict === "revise");
  check(results, "no hidden revise: if any concept needs revision it is not silently dropped",
    !anyRevise || (review.flags || []).length > 0 || review.overall_verdict === "revise");

  // 5. Cross-check producer against reviewer: a concept that violates producer's own brand-palette
  // guardrail must never carry a reviewer "pass" — each piece can look fine alone (producer just
  // reports its palette; reviewer just reports a verdict) while the combination is broken.
  const BRAND_PALETTE = ["#F4A259", "#5B8E7D", "#F4E285", "#FDF6EC", "#2E2E2E"].map((h) => h.toUpperCase());
  const offBrandConceptIds = concepts
    .filter((c) => (c.visual && c.visual.color_palette || []).some((hex) => !BRAND_PALETTE.includes(String(hex).toUpperCase())))
    .map((c) => c.concept_id);
  const wronglyPassed = offBrandConceptIds.filter((id) => {
    const v = (review.per_concept || []).find((v) => v.concept_id === id);
    return v && v.verdict === "pass";
  });
  check(results, "reviewer never passes a concept that violates producer's brand-palette guardrail",
    wronglyPassed.length === 0, `wrongly passed despite off-brand palette: ${wronglyPassed.join(", ")}`);

  return report("synthesis", results);
}

module.exports = { run };
