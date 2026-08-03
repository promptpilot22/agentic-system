-- Agentic Content Creator — database schema
-- Generated from the final corrected ERD.
-- Target: PostgreSQL (Supabase / Neon). Safe to run more than once (IF NOT EXISTS).
--
-- Design notes:
--   * Every table has a UUID primary key defaulting to gen_random_uuid().
--   * Every table has created_at timestamptz default now().
--   * Foreign keys live on the "many" side of each 1-to-many relationship.
--   * There are NO many-to-many relationships in this ERD, so no junction table
--     is required. CONCEPT already acts as the associative entity between
--     EVENT and BRAND (event_id + brand_id), and POST between CONCEPT and format.
--     If you later add a real M:N (e.g. posts published to many channels), add a
--     post_channel(post_id, channel_id) junction table following the same pattern.

create extension if not exists "pgcrypto";  -- provides gen_random_uuid()

-- 1. COMPANY — the employer / social-media agency
create table if not exists company (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    created_at  timestamptz not null default now()
);

-- 2. BRAND — brand guidelines that drive every design (one company -> many brands)
create table if not exists brand (
    id             uuid primary key default gen_random_uuid(),
    company_id     uuid not null references company(id) on delete cascade,
    name           text not null,
    palette        jsonb,
    fonts          jsonb,
    tone_of_voice  text,
    audience       text,
    logo_url       text,
    created_at     timestamptz not null default now()
);

-- 3. CONTENT_CREATOR — a person who makes posts (one company -> many creators)
create table if not exists content_creator (
    id          uuid primary key default gen_random_uuid(),
    company_id  uuid not null references company(id) on delete cascade,
    name        text not null,
    created_at  timestamptz not null default now()
);

-- 4. EVENT — the shared calendar (global / Pakistani / Islamic / custom).
--    NOT owned by a company — events are shared reference data.
create table if not exists event (
    id                    uuid primary key default gen_random_uuid(),
    name                  text not null,
    date                  date,
    category              text not null
                              check (category in ('global','pakistani','islamic','custom')),
    description           text,
    recommended_tone      text,
    generation_lead_days  int not null default 7,
    created_at            timestamptz not null default now()
);

-- 5. CONCEPT — one of the 3 archetype directions for an event, per brand.
--    Associative entity: links EVENT x BRAND x CONTENT_CREATOR.
create table if not exists concept (
    id            uuid primary key default gen_random_uuid(),
    event_id      uuid not null references event(id) on delete restrict,
    brand_id      uuid not null references brand(id) on delete cascade,
    created_by    uuid references content_creator(id) on delete set null,
    archetype     text not null
                      check (archetype in ('Emotional','Educational','Modern')),
    core_message  text,
    status        text not null default 'draft'
                      check (status in ('draft','in_review','approved','rejected')),
    created_at    timestamptz not null default now()
);

-- 6. POST — a finished asset for one concept in one format (concept -> many posts)
create table if not exists post (
    id                  uuid primary key default gen_random_uuid(),
    concept_id          uuid not null references concept(id) on delete cascade,
    format              text not null
                            check (format in ('ig_square','ig_story','fb','linkedin')),
    written_content     text,
    visual_content_url  text,
    status              text not null default 'draft'
                            check (status in ('draft','approved','rejected')),
    version             int not null default 1,
    created_at          timestamptz not null default now()
);

-- 7. FEEDBACK — a human edit request against a post (post -> many feedback rows)
create table if not exists feedback (
    id           uuid primary key default gen_random_uuid(),
    post_id      uuid not null references post(id) on delete cascade,
    creator_id   uuid references content_creator(id) on delete set null,
    instruction  text not null,
    scope        text check (scope in ('copy','visual','both','tone')),
    created_at   timestamptz not null default now()
);

-- Helpful indexes on the foreign-key columns
create index if not exists idx_brand_company    on brand(company_id);
create index if not exists idx_creator_company  on content_creator(company_id);
create index if not exists idx_concept_event    on concept(event_id);
create index if not exists idx_concept_brand    on concept(brand_id);
create index if not exists idx_concept_creator  on concept(created_by);
create index if not exists idx_post_concept     on post(concept_id);
create index if not exists idx_feedback_post    on feedback(post_id);
create index if not exists idx_feedback_creator on feedback(creator_id);
