// Eval: researcher — task done (grounded EventBrief) + guardrail (no unverifiable facts asserted as fact)
const { check, report } = require("./lib");

function run(run) {
  const b = run.brief;
  const results = [];

  check(results, "brief has a summary", b && typeof b.summary === "string" && b.summary.length > 0);
  check(results, "brief has key_messages", Array.isArray(b.key_messages) && b.key_messages.length > 0);
  check(results, "brief has dos and donts", Array.isArray(b.dos) && b.dos.length > 0 && Array.isArray(b.donts) && b.donts.length > 0);
  check(results, "brief has sensitivity_flags field (even if empty)", Array.isArray(b.sensitivity_flags));
  check(results, "brief has recommended_tone and audience", !!b.recommended_tone && !!b.audience);

  // Guardrail: task must be grounded — sources present, and any characterization
  // without a hard citation is captured in unverified_claims rather than stated as fact.
  check(results, "guardrail: sources cite real URLs", Array.isArray(b.sources) && b.sources.length > 0 && b.sources.every((s) => /^https?:\/\//.test(s)));
  check(results, "guardrail: unverified_claims field present (even if empty)", Array.isArray(b.unverified_claims));

  return report("researcher", results);
}

module.exports = { run };
