// Lists every table with its primary key and foreign keys, so you can
// confirm the live database matches the ERD.
// Run with: npm run db:tables
const { pool } = require("./client");

(async () => {
  const pks = await pool.query(`
    select tc.table_name, kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
     and tc.table_schema = kcu.table_schema
    where tc.constraint_type = 'PRIMARY KEY' and tc.table_schema = 'public'
    order by tc.table_name`);

  const fks = await pool.query(`
    select tc.table_name,
           kcu.column_name,
           ccu.table_name  as ref_table,
           ccu.column_name as ref_column
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
    order by tc.table_name, kcu.column_name`);

  const pkByTable = {};
  for (const r of pks.rows) (pkByTable[r.table_name] ??= []).push(r.column_name);
  const fkByTable = {};
  for (const r of fks.rows)
    (fkByTable[r.table_name] ??= []).push(`${r.column_name} -> ${r.ref_table}.${r.ref_column}`);

  const tables = await pool.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name`);

  console.log("\nTables · primary keys · foreign keys\n" + "=".repeat(48));
  for (const { table_name } of tables.rows) {
    console.log(`\n▸ ${table_name}`);
    console.log(`    PK:  ${(pkByTable[table_name] || ["(none)"]).join(", ")}`);
    const fk = fkByTable[table_name];
    console.log(`    FK:  ${fk ? fk.join("\n         ") : "(none)"}`);
  }
  console.log("");
  await pool.end();
})().catch((err) => {
  console.error("✗ db:tables failed:", err.message);
  process.exit(1);
});
