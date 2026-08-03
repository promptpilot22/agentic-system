// Applies db/schema.sql to the database in DATABASE_URL.
// Run with: npm run db:migrate
const fs = require("fs");
const path = require("path");
const { pool } = require("./client");

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  console.log("Applying db/schema.sql …");
  await pool.query(sql);
  console.log("✓ Schema applied successfully.");
  await pool.end();
})().catch((err) => {
  console.error("✗ Migration failed:", err.message);
  process.exit(1);
});
