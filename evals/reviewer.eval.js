// Eval: reviewer — task done (verdict + diversity check per concept) + guardrail
// (never pass a sensitivity concern without an explicit human-SME flag)
const { check, report } = require("./lib");

function run(run) {
  const review = run.review || {};
  const results = [];

  check(results, "a verdict was issued for every concept",
    Array.isArray(review.per_concept) && review.per_concept.length === (run.concepts || []).length);

  check(results, "every verdict is pass or revise",
    (review.per_concept || []).every((v) => v.verdict === "pass" || v.verdict === "revise"));

  check(results, "a diversity_score was produced", typeof review.diversity_score === "number");

  // Guardrail: silence on cultural review is not the same as clearance. Any event whose
  // brief carries sensitivity_flags, OR whose category-level review wasn't recorded at all,
  // must not pass silently.
  const briefFlags = (run.brief && run.brief.sensitivity_flags) || [];
  const reviewFlags = review.flags || [];
  if (briefFlags.length > 0) {
    check(results, "guardrail: brief sensitivity_flags are echoed in review.flags",
      briefFlags.every((f) => reviewFlags.some((rf) => rf.includes(f))));
  } else {
    check(results, "guardrail: cultural review was explicitly recorded, not silently skipped",
      review.cultural_review_completed === true);
  }

  return report("reviewer", results);
}

module.exports = { run };
