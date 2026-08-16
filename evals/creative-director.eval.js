// Eval: creative-director — task done (exactly 3 archetype concepts) + guardrail (no near-duplicate pair)
const { check, report } = require("./lib");

function run(run) {
  const concepts = run.concepts || [];
  const results = [];

  check(results, "exactly 3 concepts produced", concepts.length === 3, `got ${concepts.length}`);

  const archetypes = concepts.map((c) => c.archetype);
  const wantArchetypes = ["Emotional", "Educational", "Modern"];
  check(
    results,
    "one Emotional, one Educational, one Modern",
    wantArchetypes.every((a) => archetypes.includes(a)) && new Set(archetypes).size === 3,
    `got archetypes: ${archetypes.join(", ")}`
  );

  // Guardrail: no two concepts may share the same core message or visual direction.
  const messages = concepts.map((c) => (c.core_message || "").trim().toLowerCase());
  const directions = concepts.map((c) => (c.visual_direction || "").trim().toLowerCase());
  const dupMessages = messages.length !== new Set(messages).size;
  const dupDirections = directions.length !== new Set(directions).size;
  check(results, "guardrail: no two concepts share a core_message", !dupMessages);
  check(results, "guardrail: no two concepts share a visual_direction", !dupDirections);

  return report("creative-director", results);
}

module.exports = { run };
