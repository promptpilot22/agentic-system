// Seeds the database with a real company, brand, the seed events, and one
// fully worked event (3 concepts + posts). Idempotent-ish: safe to re-run
// (it clears the seeded tables first). Run with: npm run db:seed
const { pool } = require("./client");

const EVENTS = [
  ["Pakistan Independence Day", "2026-08-14", "pakistani", "Independence of Pakistan, 1947.", "Proud, hopeful"],
  ["Earth Day", "2026-04-22", "global", "Global environmental awareness day.", "Hopeful, action-oriented"],
  ["World Mental Health Day", "2026-10-10", "global", "Awareness of mental health.", "Warm, supportive"],
  ["Eid-ul-Fitr", "2027-03-20", "islamic", "Festival marking the end of Ramadan.", "Joyful, reverent"],
  ["Iqbal Day", "2026-11-09", "pakistani", "Birthday of Allama Iqbal.", "Inspirational"],
];

const CONCEPTS = [
  ["Emotional", "The dream of 1947 lives in every one of us."],
  ["Educational", "79 years of Pakistan: a story worth knowing."],
  ["Modern", "Green. Bold. Ours."],
];

(async () => {
  // Clear (respect FK order)
  await pool.query("truncate feedback, post, concept, event, brand, content_creator, company restart identity cascade");

  const company = (await pool.query(`insert into company (name) values ($1) returning id`, ["Taleemabad"])).rows[0];

  const brand = (
    await pool.query(
      `insert into brand (company_id, name, palette, fonts, tone_of_voice, audience, logo_url)
       values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      [
        company.id,
        "ABA Center",
        JSON.stringify({ primary: "#F4A259", secondary: "#5B8E7D", bg: "#FDF6EC", ink: "#2E2E2E" }),
        JSON.stringify({ heading: "Poppins", body: "Inter" }),
        "warm, professional, encouraging",
        "parents and caregivers",
        "assets/brands/aba/logo.svg",
      ]
    )
  ).rows[0];

  const creator = (
    await pool.query(`insert into content_creator (company_id, name) values ($1,$2) returning id`, [
      company.id,
      "Ayesha",
    ])
  ).rows[0];

  const eventIds = {};
  for (const [name, date, category, description, tone] of EVENTS) {
    const e = (
      await pool.query(
        `insert into event (name, date, category, description, recommended_tone)
         values ($1,$2,$3,$4,$5) returning id`,
        [name, date, category, description, tone]
      )
    ).rows[0];
    eventIds[name] = e.id;
  }

  // Fully work one event: 3 concepts, each with an IG-square post; one feedback row.
  const eventId = eventIds["Pakistan Independence Day"];
  for (const [archetype, coreMessage] of CONCEPTS) {
    const concept = (
      await pool.query(
        `insert into concept (event_id, brand_id, created_by, archetype, core_message, status)
         values ($1,$2,$3,$4,$5,$6) returning id`,
        [eventId, brand.id, creator.id, archetype, coreMessage, "in_review"]
      )
    ).rows[0];
    const post = (
      await pool.query(
        `insert into post (concept_id, format, written_content, status)
         values ($1,$2,$3,$4) returning id`,
        [concept.id, "ig_square", coreMessage, "draft"]
      )
    ).rows[0];
    if (archetype === "Modern") {
      await pool.query(
        `insert into feedback (post_id, creator_id, instruction, scope) values ($1,$2,$3,$4)`,
        [post.id, creator.id, "Make it more emotional and shorten the caption", "both"]
      );
    }
  }

  const counts = await pool.query(`
    select 'company' t, count(*) n from company
    union all select 'brand', count(*) from brand
    union all select 'content_creator', count(*) from content_creator
    union all select 'event', count(*) from event
    union all select 'concept', count(*) from concept
    union all select 'post', count(*) from post
    union all select 'feedback', count(*) from feedback
    order by t`);
  console.log("\n✓ Seeded. Row counts:");
  console.table(counts.rows);
  await pool.end();
})().catch((err) => {
  console.error("✗ seed failed:", err.message);
  process.exit(1);
});
