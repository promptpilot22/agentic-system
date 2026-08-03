// End-to-end connectivity check.
// Connects, lists tables, inserts one real row + a linked row,
// reads them back with a JOIN, and prints the result.
// Run with: npm run db:check
const { pool } = require("./client");

(async () => {
  // 1. Connect + list tables
  const tables = await pool.query(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE'
     order by table_name`
  );
  console.log("\n✓ Connected. Tables in public schema:");
  console.log("  " + tables.rows.map((r) => r.table_name).join(", "));

  // 2. Insert one real row (company) + a linked row (brand -> company)
  const stamp = new Date().toISOString();
  const company = await pool.query(
    `insert into company (name) values ($1) returning id, name`,
    [`Taleemabad (db:check ${stamp})`]
  );
  const companyId = company.rows[0].id;

  const brand = await pool.query(
    `insert into brand (company_id, name, tone_of_voice, audience)
     values ($1, $2, $3, $4) returning id`,
    [companyId, "ABA Center", "warm, professional, encouraging", "parents and caregivers"]
  );
  console.log(`\n✓ Inserted company ${companyId}`);
  console.log(`✓ Inserted linked brand ${brand.rows[0].id} (company_id -> company.id)`);

  // 3. Read them back with a JOIN
  const joined = await pool.query(
    `select c.name as company, b.name as brand, b.tone_of_voice, b.audience
     from brand b
     join company c on c.id = b.company_id
     where b.id = $1`,
    [brand.rows[0].id]
  );
  console.log("\n✓ Joined read-back:");
  console.table(joined.rows);

  await pool.end();
  console.log("\n✓ db:check passed.\n");
})().catch((err) => {
  console.error("✗ db:check failed:", err.message);
  process.exit(1);
});
