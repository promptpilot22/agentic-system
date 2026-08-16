const fs = require("fs");

function loadRun(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function check(results, name, condition, detail) {
  results.push({ name, pass: !!condition, detail });
}

function report(evalName, results) {
  const failed = results.filter((r) => !r.pass);
  console.log(`\n=== ${evalName} ===`);
  for (const r of results) {
    console.log(`  [${r.pass ? "PASS" : "FAIL"}] ${r.name}${r.pass ? "" : " — " + r.detail}`);
  }
  return failed.length === 0;
}

module.exports = { loadRun, check, report };
