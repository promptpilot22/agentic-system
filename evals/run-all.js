#!/usr/bin/env node
// Runs every eval in this directory against one run file. Exits non-zero if any eval fails.
const { loadRun } = require("./lib");

const runPath = process.argv[2];
if (!runPath) {
  console.error("Usage: node evals/run-all.js <path-to-run.json>");
  process.exit(1);
}

const runData = loadRun(runPath);

const evals = [
  require("./researcher.eval"),
  require("./creative-director.eval"),
  require("./producer.eval"),
  require("./reviewer.eval"),
  require("./synthesis.eval"),
];

const allPass = evals.map((e) => e.run(runData)).every(Boolean);

console.log(`\n${allPass ? "ALL EVALS PASSED" : "EVAL FAILURES FOUND"}`);
process.exit(allPass ? 0 : 1);
