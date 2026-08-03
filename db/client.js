// Shared Postgres client. Reads DATABASE_URL from .env (never hard-coded).
const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.error(
    "\n✗ DATABASE_URL is not set.\n" +
      "  1. Copy .env.example to .env\n" +
      "  2. Paste your Supabase/Neon connection string into DATABASE_URL\n" +
      "  3. Re-run the command.\n"
  );
  process.exit(1);
}

// Hosted Postgres (Supabase/Neon/Render/Railway) requires SSL.
const url = process.env.DATABASE_URL;
const needsSSL = /supabase|neon|render|railway|amazonaws|\bsslmode=require\b/i.test(url);

const pool = new Pool({
  connectionString: url,
  ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
});

module.exports = { pool };
