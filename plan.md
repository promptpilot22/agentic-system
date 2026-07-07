# AI Agentic Content Creator System — Engineering Blueprint

> **Status:** Design / pre-implementation
> **Owner:** AI Systems Architecture
> **Last updated:** 2026-07-07

This document is the engineering blueprint for an agentic content-creation platform that automatically produces social-media posts for upcoming events, with humans in the loop for review and approval. It is written so a development team can execute it phase by phase.

---

## 1. Product Overview

### The Problem
Content creation for event-based marketing is manual and repetitive. A single person today:
1. Tracks upcoming events on a calendar.
2. Designs assets in Canva by hand.
3. Prompts an LLM for catchy copy.
4. Hunts for stock/relevant visuals.
5. Assembles copy + visual into a finished post.

This is slow (hours per event), inconsistent (quality depends on the individual), doesn't scale (one person, many brands/events), and loses institutional knowledge (brand voice lives in someone's head).

### The Solution
An **agentic creative team** — a set of specialized AI agents that collaborate to run the full workflow autonomously, from event detection to finished post variations, while surfacing every output to a human for approval. The system:

- Maintains a structured **event calendar** (global, Pakistani, Islamic, and custom events).
- **Detects** upcoming events on a schedule and triggers generation ahead of time.
- **Researches** each event's meaning, sensitivity, and messaging.
- Produces **three genuinely distinct creative concepts** per event.
- Writes **copy**, designs **visuals**, and renders **finished posts** in multiple formats.
- **Quality-checks** every output (content, design, diversity) with scored evaluations.
- Presents everything on a **dashboard** for preview / download / edit / regenerate / approve.
- Learns brand voice through a **Brand Memory** system reused across events.

### The Value
- **Speed:** Draft posts ready 7 days before an event with zero manual kickoff.
- **Scale:** Many brands and many events handled in parallel.
- **Consistency:** Brand memory enforces voice, palette, and tone.
- **Control:** Humans approve everything; nothing publishes without sign-off.
- **Compounding quality:** Feedback and approved posts feed back into the system.

### What this is NOT
This is **not a chatbot**. There is no single prompt-response loop. It is a coordinated multi-agent pipeline with deterministic orchestration, tool use, structured hand-offs, and explicit human gates.

---

## 2. User Personas

### Persona 1 — Content Manager ("Ayesha")
- **Role:** Owns the content calendar and day-to-day output for one or more brands.
- **Goals:** Have high-quality drafts waiting; spend time curating, not creating.
- **Uses:** Dashboard heavily — reviews the 3 concepts, requests edits ("make it more emotional"), approves, downloads.
- **Pain today:** Repetitive Canva work; scrambling before events.
- **Success metric:** % of posts approved with ≤1 edit round; time-to-approved.

### Persona 2 — Marketing Team Member ("Reviewer")
- **Role:** Contributes copy tweaks, checks cultural/brand fit, occasionally regenerates.
- **Goals:** Ensure on-brand, culturally safe output; collaborate on the final pick.
- **Uses:** Preview + feedback actions; comments; regenerate single component.
- **Success metric:** Fewer cultural/brand escalations; faster review cycles.

### Persona 3 — Administrator ("Ops/Admin")
- **Role:** Configures brands, manages the event database, sets triggers, monitors agent health/costs.
- **Goals:** Keep the system reliable and on-budget; add new events/brands.
- **Uses:** Admin panels — brand memory editor, event CRUD, agent logs, cost dashboards, model config.
- **Success metric:** Uptime, cost-per-post, agent failure rate.

---

## 3. System Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Web)                             │
│  Next.js dashboard: Calendar · Content review · Brand editor · Admin    │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │ REST + WebSocket (live status)
┌───────────────────────────────▼───────────────────────────────────────┐
│                               BACKEND API                               │
│  FastAPI: auth, CRUD, workflow triggers, feedback intake, exports       │
└───────┬───────────────────────────────────┬───────────────────────────┘
        │                                     │
        │ enqueue jobs                        │ read/write
┌───────▼───────────────┐          ┌──────────▼────────────────────────┐
│   ORCHESTRATION LAYER  │          │            DATA LAYER              │
│  Celery workers +      │          │  PostgreSQL (events, users, brands,│
│  LangGraph state graph │◄────────►│  posts, feedback, agent_logs)      │
│  (the agent pipeline)  │          │  pgvector (brand/event embeddings) │
└───────┬───────────────┘          │  Redis (queue + cache)             │
        │                          │  Object storage (S3/R2): images    │
        │ tool calls               └────────────────────────────────────┘
┌───────▼────────────────────────────────────────────────────────────┐
│                            AI AGENT LAYER                            │
│  8 specialized agents (see §4), each an LLM node + typed tools       │
└───────┬─────────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                           │
│  Anthropic Claude (reasoning/writing/eval) · Image gen (see §7)      │
│  Web search (research) · Font/asset CDNs · (future) Canva, Meta APIs │
└──────────────────────────────────────────────────────────────────────┘
```

### Layer responsibilities
- **Frontend:** Read-only + action UI. Never calls LLMs directly; talks only to the backend API.
- **Backend API:** Thin, stateless request handling; validation; auth; enqueues workflow runs; serves data. Owns the human-approval gate transitions.
- **Orchestration layer:** The heart. A **LangGraph** state machine defines the agent pipeline; **Celery** runs it asynchronously so long generations don't block requests. Handles retries, timeouts, partial regeneration.
- **Data layer:** Source of truth. Postgres for relational data, pgvector for semantic recall (brand memory, similar past posts), Redis for the task queue + hot cache, object storage for rendered images.
- **AI agent layer:** Eight agents, each a well-scoped node with a system prompt, typed I/O (Pydantic), and a small toolset.
- **External services:** LLM + image APIs and (future) publishing/design integrations.

### Key architectural decisions
- **Async-first:** Generation can take minutes; everything runs as background jobs with status pushed to the UI over WebSocket/SSE.
- **Typed contracts between agents:** Every agent input/output is a validated Pydantic schema, not free text. This is what makes it a *system*, not a chat.
- **Human gates are first-class states**, not afterthoughts — the workflow *pauses* at `PENDING_APPROVAL`.
- **Idempotent, resumable runs:** Each run has a persisted state so partial regeneration ("just the caption") re-enters the graph at the right node.

---

## 4. Agent Architecture

All agents share a common contract:
- **Model:** Claude (tier chosen per task — see §7).
- **I/O:** Pydantic-validated structured objects.
- **Observability:** Every invocation logged to `agent_logs` (input hash, output, tokens, latency, cost, model, run_id).
- **Failure policy:** Bounded retries with backoff; on final failure, emit a typed error and pause the run for human attention rather than producing garbage.

### 4.1 Event Monitoring Agent
- **Purpose:** Watch the calendar; decide when to start generation.
- **Responsibilities:** Query upcoming events; apply per-event lead time (default 7 days, configurable); dedupe (don't re-trigger an in-progress/complete run); enqueue the workflow.
- **Input:** Current date, event table, per-event `generation_lead_days`, existing run statuses.
- **Output:** `WorkflowTrigger { event_id, brand_id, triggered_at, reason }` or no-op.
- **Tools:** DB query tool; clock; queue-enqueue tool.
- **Dependencies:** None upstream; kicks off everything. Runs on a **cron** (hourly/daily), so this agent is *mostly deterministic logic* — the LLM is optional here (see §7).

### 4.2 Event Research Agent
- **Purpose:** Understand the event deeply before anything creative happens.
- **Responsibilities:** Summarize background & cultural/historical context; extract key messages; define do's/don'ts and sensitivity flags; suggest visual inspiration and tone; identify audience expectations.
- **Input:** Event row (name, date, category, description, stored context), brand context (from Brand Memory).
- **Output:** `EventBrief { summary, key_messages[], dos[], donts[], sensitivity_flags[], visual_inspiration[], recommended_tone, audience }`.
- **Tools:** Web search (grounding + freshness), event-DB read, brand-memory retrieval.
- **Dependencies:** Triggered by Monitoring Agent. Feeds Creative Director.

### 4.3 Creative Director Agent
- **Purpose:** Define THREE genuinely different creative concepts.
- **Responsibilities:** Produce three briefs that differ across *creative direction, visual storytelling, messaging angle, emotional approach, design style, and layout*. Enforce diversity by construction — each concept is assigned a distinct **archetype** (e.g., Emotional/Inspirational, Educational/Awareness, Modern/Bold) so they can't collapse into variations.
- **Input:** `EventBrief`, brand context.
- **Output:** `CreativeConcepts { concepts: [ConceptBrief × 3] }` where each `ConceptBrief { archetype, goal, core_message, emotional_tone, visual_direction, layout_concept, design_style }`.
- **Tools:** Brand-memory retrieval; (optional) retrieval of past high-performing concepts.
- **Dependencies:** After Research. Fans out to Content Writing + Visual Design (per concept).

### 4.4 Content Writing Agent
- **Purpose:** Generate all written content per concept.
- **Responsibilities:** For each concept produce main one-liner, caption, optional supporting text, CTA, optional hashtags — matched to event type, audience, brand tone, and cultural context.
- **Input:** One `ConceptBrief` + `EventBrief` + brand voice.
- **Output:** `CopyPackage { concept_id, one_liner, caption, supporting_text?, cta, hashtags[] }`.
- **Tools:** Brand-memory retrieval (voice/tone exemplars).
- **Dependencies:** Runs per concept, in parallel across the three. Feeds Post Generation.

### 4.5 Visual Design Agent
- **Purpose:** Define the visual direction and the actual image-generation prompt per concept.
- **Responsibilities:** Produce image concept, image-generation prompt, layout instructions, typography recommendations, color palette, composition guidelines — constrained by brand palette/fonts.
- **Input:** One `ConceptBrief` + brand visual guidelines.
- **Output:** `VisualSpec { concept_id, image_concept, image_prompt, layout_instructions, typography, color_palette[], composition_notes }`.
- **Tools:** Brand-memory retrieval; palette/font catalog lookup.
- **Dependencies:** Runs per concept, in parallel with Content Writing. Feeds Post Generation.

### 4.6 Post Generation Agent
- **Purpose:** Assemble finished posts from copy + visual spec + brand assets.
- **Responsibilities:** Call image generation with `VisualSpec.image_prompt`; composite text/logo over the image per layout for each requested format (IG square 1080×1080, IG story 1080×1920, FB, LinkedIn); apply brand logo/colors/fonts; export to object storage.
- **Input:** `CopyPackage` + `VisualSpec` + brand assets + target formats.
- **Output:** `GeneratedPost { concept_id, format, image_url, layered_source_url?, applied_copy, metadata }` (one per format per concept).
- **Tools:** Image-generation API; **rendering/compositing service** (see §7 — e.g., server-side HTML/CSS→PNG or a templating engine); object-storage upload; font loader.
- **Dependencies:** After Writing + Design complete for a concept. Feeds Quality Review.
- **Note:** This is the most engineering-heavy agent — text-on-image compositing is deterministic templating, *not* an LLM job (see §7).

### 4.7 Quality Review Agent
- **Purpose:** Gate quality before humans see output.
- **Responsibilities:** Score each post on **content** (grammar, clarity, event relevance, cultural sensitivity) and **design** (attractiveness, brand consistency, readability, professionalism); run a **diversity check** across the three concepts (are they actually different?); flag failures for auto-regeneration when below threshold.
- **Input:** All `GeneratedPost`s for an event + `EventBrief` + brand guidelines.
- **Output:** `QualityReport { per_post_scores: {creativity, event_relevance, brand_alignment, visual_uniqueness, message_quality}, diversity_score, flags[], verdict: pass|revise }`.
- **Tools:** Vision-capable LLM (evaluate the rendered image), grammar/readability check, embedding-similarity for diversity (deterministic backstop).
- **Dependencies:** After Post Generation. If `revise`, loops back to the specific failing agent (bounded to N retries). If `pass`, moves run to `PENDING_APPROVAL`.

### 4.8 Human Feedback Agent
- **Purpose:** Turn human feedback into *targeted* regeneration.
- **Responsibilities:** Parse a user instruction ("make this more emotional", "different visuals", "shorten the caption"); classify which component(s) to regenerate; re-enter the graph at the minimal node (copy only, visual only, or both) without redoing the whole pipeline.
- **Input:** `FeedbackRequest { post_id, instruction, scope? }` + current post state.
- **Output:** `RegenerationPlan { target_nodes[], modified_constraints }` → triggers partial re-run.
- **Tools:** Intent classifier; access to run state; graph re-entry API.
- **Dependencies:** Triggered from the dashboard by a human. Bridges human ↔ pipeline.

### 4.9 Brand Memory Agent (cross-cutting)
- **Purpose:** Store and apply reusable brand guidelines.
- **Responsibilities:** Persist brand name, logo, colors, fonts, design style, tone of voice, audience, and exemplar successful posts; retrieve the right brand context (structured + semantic via embeddings) for any agent that needs it.
- **Input:** Brand config (admin-edited) + queries from other agents.
- **Output:** `BrandContext { name, palette, fonts, logo_url, tone, audience, style_notes, exemplars[] }`.
- **Tools:** DB read/write; pgvector similarity search over exemplar posts.
- **Dependencies:** Consumed by Research, Creative Director, Writing, Design, Generation, Quality. It is a **service used by all agents**, not a pipeline step.

---

## 5. Agent Communication Design

### Orchestration model
A **LangGraph state graph** defines nodes (agents) and edges (transitions). Communication is **not** free-form agent-to-agent chatter — it is a directed graph over a shared, typed **run state** object persisted in Postgres.

```
[Monitor] → [Research] → [Creative Director]
                               │  (fan-out: 3 concepts)
                 ┌─────────────┼─────────────┐
            [Write c1]    [Write c2]    [Write c3]     (parallel)
            [Design c1]   [Design c2]   [Design c3]    (parallel)
                 └─────────────┼─────────────┘
                          [Post Gen ×3 ×formats]
                               │
                        [Quality Review]
                          │           │
                     verdict=pass  verdict=revise
                          │           └──► loop to failing node (≤ N times)
                          ▼
                   [PENDING_APPROVAL]  ← human gate (workflow pauses)
                          │
              ┌───────────┼─────────────┐
          approve      request-edit   regenerate
              │        [Human Feedback Agent]
              ▼          │ (targeted re-entry)
         [Final Export]  └──► Write/Design/Gen for that component
```

### How tasks are passed
- Each node reads the fields it needs from the **run state** and writes its typed output back. No node mutates another's inputs.
- **Fan-out/fan-in:** Creative Director emits 3 concepts; the graph fans out to parallel Write+Design tasks (Celery group), then fans in at Post Generation.
- **Contracts:** Pydantic schemas validate every hand-off; a schema violation is a hard failure that triggers retry, not silent propagation.

### How failures are handled
- **Transient errors** (API timeout/rate limit): exponential backoff, up to N retries per node.
- **Validation failures** (bad structured output): re-prompt the same agent with the validation error appended; after N attempts, mark node `FAILED`.
- **Quality failures:** Quality Review can request bounded auto-revision loops; a hard cap prevents infinite loops, after which the run pauses for human review with the best-so-far outputs.
- **Node failure:** The run pauses in a `NEEDS_ATTENTION` state; the admin sees it in agent logs; partial outputs are preserved (idempotent, resumable — a resume re-runs only failed/downstream nodes).
- **Dead-letter:** Permanently failing jobs land in a dead-letter queue with full context for debugging.
- **Cost/rate guardrails:** Per-run token budget; circuit breaker if external APIs degrade.

---

## 6. Database Design

PostgreSQL (relational) + pgvector (embeddings). Simplified schemas:

### `events`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "Earth Day" |
| date | date | next occurrence; recurring rule below |
| recurrence | text | e.g. `annual:04-22`, `islamic_lunar:...` |
| category | enum | global / pakistani / islamic / custom |
| description | text | |
| context | text | historical/cultural context |
| target_audience | text | |
| visual_themes | text[] | suggested themes |
| recommended_tone | text | |
| keywords | text[] | |
| branding_considerations | text | |
| generation_lead_days | int | default 7 |
| is_active | bool | |
| created_at / updated_at | timestamptz | |

> Islamic events use lunar dates — store a `recurrence` rule and resolve concrete dates via a Hijri calendar library at monitor time (do not hard-code Gregorian dates).

### `users`
| id uuid PK · email · name · role (enum: content_manager/marketing/admin) · brand_ids uuid[] · created_at |

### `brands`
| id uuid PK · name · logo_url · palette jsonb (colors) · fonts jsonb · design_style text · tone_of_voice text · audience text · style_notes text · created_by · created_at/updated_at |

### `brand_exemplars`
| id uuid PK · brand_id FK · post_url · caption · notes · embedding vector(1536) · created_at |
*(semantic recall of past successful posts)*

### `generation_runs`
| id uuid PK · event_id FK · brand_id FK · status (enum: queued/researching/creating/generating/reviewing/pending_approval/needs_attention/approved/failed) · state jsonb (full run state) · quality_report jsonb · started_at/completed_at |

### `concepts`
| id uuid PK · run_id FK · archetype · goal · core_message · visual_direction · layout_concept · design_style · created_at |

### `generated_posts`
| id uuid PK · run_id FK · concept_id FK · format (enum: ig_square/ig_story/fb/linkedin) · image_url · layered_source_url · copy jsonb (one_liner, caption, cta, hashtags) · visual_spec jsonb · scores jsonb · status (enum: draft/approved/rejected) · version int · created_at |

### `feedback`
| id uuid PK · post_id FK · user_id FK · instruction text · scope (enum: copy/visual/both/tone) · resulting_run_id FK · created_at |

### `agent_logs`
| id uuid PK · run_id FK · agent_name · input_hash · output jsonb · model · tokens_in/tokens_out · cost_usd · latency_ms · status (ok/retry/failed) · error · created_at |

### Indexes / notes
- Index `events(date, is_active)` for the monitor query; `generation_runs(status)`; `generated_posts(run_id)`.
- `agent_logs` is append-only and high-volume → partition by month; consider retention policy.
- pgvector indexes (IVFFlat/HNSW) on `brand_exemplars.embedding`.

---

## 7. AI Model Strategy

### Task → mechanism mapping
| Task | Mechanism | Why |
|---|---|---|
| Event detection & triggering | **Deterministic logic** (SQL + date math + cron) | No reasoning needed; must be reliable & cheap |
| Hijri/lunar date resolution | **Deterministic library** | Correctness matters; not an LLM job |
| Event research & brief | **LLM (Claude Sonnet)** + web search tool | Reasoning + grounding |
| Creative concepts | **LLM (Claude Opus)** | Hardest creative reasoning; diversity matters |
| Copywriting | **LLM (Claude Sonnet)** | Strong writing, cost-effective |
| Visual spec / image prompt | **LLM (Claude Sonnet)** | Structured creative reasoning |
| Image generation | **Image model API** (see below) | — |
| Text-on-image compositing | **Deterministic templating** (HTML/CSS→PNG) | LLMs can't reliably place text; templating gives pixel-perfect, brand-consistent, editable layouts |
| Quality scoring (content) | **LLM (Sonnet)** | Judgment on grammar/clarity/relevance |
| Quality scoring (design) | **Vision LLM** on rendered image | Evaluate actual output |
| Diversity check | **Embedding similarity** (deterministic) + LLM backstop | Cheap, objective distance measure |
| Feedback intent → scope | **LLM (Haiku/Sonnet)** classifier | Small, fast classification |

> Model tiering rule: use the cheapest model that clears the quality bar for each task; reserve Opus for creative-direction and hard evaluation. Make model choice per-agent configurable (admin-editable) so tiers can be tuned against cost/quality data.

### Image generation approach
- **Recommended for MVP:** A hosted text-to-image API. Options to evaluate: **OpenAI gpt-image / DALL·E**, **Google Imagen**, **Stability/Flux**, or **Ideogram** (Ideogram is notably strong at *rendering legible text inside images*, which matters for posters).
- **Decision:** Separate **background/illustration generation** (image model) from **text/logo layout** (deterministic compositing). Do NOT rely on the image model to render captions — generate a clean visual, then composite typographic text over it via the rendering service. This gives control, brand consistency, and editability.
- **Compositing service:** Server-side rendering (e.g., headless-browser HTML/CSS → PNG, or an SVG/Canvas templating layer) driven by `VisualSpec.layout_instructions`. Templates per format (square/story/FB/LinkedIn).

### Prompt management strategy
- **Versioned prompt registry:** Store agent system prompts + templates as versioned files/records (not inline strings). Each prompt has an id + version; `agent_logs` records which version produced an output → reproducibility and A/B testing.
- **Structured output enforcement:** Use tool/JSON-schema forcing so agents return validated objects, not prose.
- **Guardrails:** Prepend brand + cultural-sensitivity constraints as system-level instructions; the Research Agent's `donts[]` and `sensitivity_flags[]` are injected into downstream prompts to reduce hallucination and cultural missteps.
- **Grounding:** Research uses web search to ground facts; downstream agents are instructed to only use facts present in the `EventBrief`.

---

## 8. Recommended Technology Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | **Next.js (React) + TypeScript + Tailwind + shadcn/ui** | Fast to build, great DX, SSR for dashboard, WebSocket/SSE support for live status; component libraries speed up the review UI. |
| **Backend** | **Python + FastAPI** | Python is the center of gravity for AI/agents; FastAPI gives async, typed, auto-documented APIs; Pydantic doubles as the agent I/O contract layer. |
| **Agent framework** | **LangGraph** (with the Anthropic SDK) | Explicit graph orchestration, persisted state, fan-out/fan-in, human-in-the-loop pause/resume — exactly the primitives this pipeline needs. Avoids opaque "autonomous agent" frameworks. |
| **Task queue** | **Celery + Redis** | Battle-tested async job execution, retries, scheduling (Celery Beat for the monitor cron), parallel groups for fan-out. |
| **Database** | **PostgreSQL + pgvector** | Relational integrity for events/posts/runs + native vector search for brand memory — one system, less ops. |
| **Cache/broker** | **Redis** | Queue broker + hot cache + rate-limit counters. |
| **Object storage** | **S3 or Cloudflare R2** | Store rendered images + layered sources; R2 has no egress fees. |
| **LLM** | **Anthropic Claude** (Opus/Sonnet/Haiku tiers) | Strong reasoning + writing + vision; tiering controls cost. |
| **Image gen** | **Hosted image API** (evaluate Ideogram/Imagen/gpt-image) | No GPU ops; strong quality; pick by text-legibility + cost. |
| **Compositing** | **Headless Chromium (Playwright) HTML→PNG** | Pixel-perfect, brand-consistent, editable templates. |
| **Web search** | **Search API** (Brave/Tavily/Bing) | Grounding for research. |
| **Auth** | **Clerk/Auth0 or FastAPI-Users** | Roles (manager/marketing/admin). |
| **Observability** | **Langfuse or OpenTelemetry + Grafana** | Trace agent runs, tokens, cost, latency. |
| **Deploy** | **Docker + (Fly.io/Render/AWS ECS)** | Containerized API + workers; managed Postgres/Redis. |

*Rationale summary:* Python/FastAPI for the AI backend, LangGraph for explicit and inspectable orchestration, Celery/Redis for async scale, Postgres+pgvector to avoid a separate vector DB, and a strict split between image-generation (model) and text-layout (deterministic templating) for reliable, on-brand output.

---

## 9. Folder Structure

```
agentic_system/
├── plan.md
├── docker-compose.yml
├── README.md
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI entry
│   │   ├── config.py               # settings, model tiers, env
│   │   ├── api/                    # routers
│   │   │   ├── events.py
│   │   │   ├── brands.py
│   │   │   ├── runs.py             # trigger/status
│   │   │   ├── posts.py            # preview/download/approve
│   │   │   └── feedback.py
│   │   ├── models/                 # SQLAlchemy models
│   │   ├── schemas/                # Pydantic (API + agent contracts)
│   │   │   ├── event_brief.py
│   │   │   ├── concepts.py
│   │   │   ├── copy.py
│   │   │   ├── visual_spec.py
│   │   │   └── quality.py
│   │   ├── agents/
│   │   │   ├── base.py             # shared agent runner, logging, retries
│   │   │   ├── monitoring.py
│   │   │   ├── research.py
│   │   │   ├── creative_director.py
│   │   │   ├── writer.py
│   │   │   ├── visual_designer.py
│   │   │   ├── post_generator.py
│   │   │   ├── quality_review.py
│   │   │   ├── feedback.py
│   │   │   └── brand_memory.py
│   │   ├── orchestration/
│   │   │   ├── graph.py            # LangGraph definition
│   │   │   ├── state.py            # run-state object
│   │   │   └── tasks.py            # Celery tasks
│   │   ├── tools/                  # web_search, image_gen, compositor, db
│   │   ├── prompts/                # versioned prompt templates
│   │   ├── rendering/              # HTML/CSS templates per format + renderer
│   │   ├── services/               # storage, embeddings, cost tracking
│   │   └── db/                     # session, migrations (alembic)
│   ├── tests/
│   └── pyproject.toml
├── frontend/
│   ├── app/                        # Next.js routes
│   │   ├── calendar/
│   │   ├── content/[eventId]/      # 3-concept review view
│   │   ├── brands/
│   │   └── admin/
│   ├── components/                 # PostCard, ConceptViewer, FeedbackBox...
│   ├── lib/                        # api client, ws client
│   └── package.json
├── data/
│   └── seed_events.json            # initial global/pk/islamic events
└── scripts/
    └── seed_db.py
```

---

## 10. MVP Plan

**Goal:** Prove the core loop end-to-end for **one brand**, a small seed event set, and Instagram-square output — with a human able to preview, download, and approve.

### MVP scope (in)
1. **Event calendar** — seeded DB (10–15 global/Pakistani/Islamic events) + basic CRUD.
2. **Automatic event detection** — Celery Beat cron runs the Monitoring Agent daily; triggers 7 days out.
3. **Three-post generation** — Research → Creative Director (3 archetypes) → Writer + Visual Designer → Post Generator, producing 3 concepts.
4. **Image generation** — one image API + deterministic text compositing for **IG square (1080×1080)** only.
5. **Quality review** — scored report + diversity check (auto-flag, no auto-revision loop yet in MVP; flags shown to human).
6. **Dashboard preview** — calendar view + per-event 3-concept view with scores.
7. **Download** — export finished PNGs.

### MVP scope (deliberately out)
- Multi-format (story/FB/LinkedIn), multi-brand at scale, feedback-driven partial regeneration, Canva/social publishing, analytics, learning loops. (These are Phase 3–4 / Future.)

### MVP success criteria
- A seeded event, 7 days out, auto-generates 3 visibly distinct approved-quality IG posts with no manual trigger, viewable and downloadable from the dashboard.
- Cost-per-event and generation latency measured and logged.

---

## 11. Development Roadmap

### Phase 1 — Foundation (Weeks 1–3)
- Repo scaffolding, Docker Compose (Postgres+pgvector, Redis), CI.
- Data models + migrations; seed event DB (with Hijri resolution for Islamic events).
- FastAPI skeleton, auth + roles, basic CRUD for events/brands.
- Prompt registry, agent `base.py` (logging/retries/structured output), tool stubs.
- **Exit:** Events and brands persist; one agent runs end-to-end returning validated JSON.

### Phase 2 — Agent System (Weeks 4–7)
- Implement all 8 agents with typed contracts.
- LangGraph pipeline: monitor → research → creative director → (parallel write+design) → post gen → quality review → pending_approval.
- Celery tasks + Beat cron for monitoring; fan-out/fan-in; retries + failure handling.
- Image-gen tool + compositing service (IG square template).
- Brand Memory service + pgvector retrieval.
- **Exit:** A triggered event produces 3 quality-scored IG posts stored in DB + object storage. **(MVP core complete.)**

### Phase 3 — Dashboard & Human Loop (Weeks 8–10)
- Next.js: calendar view, per-event 3-concept review, score display, preview/download.
- WebSocket/SSE live status of runs.
- Human actions: approve / reject / **request edit** → Human Feedback Agent → targeted partial regeneration (graph re-entry).
- Multi-format output (story/FB/LinkedIn templates).
- Brand editor UI + admin panels (event CRUD, agent logs, cost view).
- **Exit:** Full human-in-the-loop workflow usable by content managers.

### Phase 4 — Optimization & Hardening (Weeks 11–13)
- Auto-revision loop in Quality Review (bounded).
- Model tiering tuned against cost/quality data; caching; batch generation.
- Observability dashboards (Langfuse/Grafana): tokens, cost, latency, failure rates.
- Load/robustness testing, dead-letter handling, guardrails, prompt A/B testing.
- **Exit:** Reliable, cost-controlled, multi-brand-ready system.

---

## 12. Future Improvements
- **Canva integration** — push layered designs to Canva for manual fine-tuning.
- **Automatic social posting** — Meta Graph API / LinkedIn API scheduling after approval.
- **Performance analytics** — pull engagement data; correlate with concepts/archetypes.
- **Learning from previous posts** — feed approved + high-performing posts into Brand Memory exemplars; bias Creative Director toward what works.
- **A/B testing** — publish variants, measure, feed back.
- **Self-improving creative agent** — reinforcement from engagement + human approvals to refine prompts/archetypes automatically (versioned, human-reviewed prompt evolution).
- **Video/reels** and carousel formats.
- **Multi-language** copy (Urdu + English) for local audiences.

---

## 13. Risks and Challenges

| Risk | Impact | Mitigation |
|---|---|---|
| **AI hallucination** (wrong facts about an event) | Factually wrong posts, embarrassment | Ground research with web search; restrict downstream agents to `EventBrief` facts; human approval gate; cite sources in the brief. |
| **Cultural/religious insensitivity** (esp. Islamic/national events) | Serious reputational harm | Research Agent produces explicit `donts[]` + `sensitivity_flags[]` injected downstream; Quality Review cultural-sensitivity check; **mandatory human approval**; maintain a per-category sensitivity checklist; consider human/SME review for religious events. |
| **Brand inconsistency** | Off-brand output erodes trust | Brand Memory enforces palette/fonts/tone; deterministic compositing applies brand assets; Quality Review brand-alignment score. |
| **Image quality / illegible text** | Unusable posts | Separate illustration (model) from text (deterministic compositing); Quality Review vision check; regenerate below threshold. |
| **Concepts not actually diverse** | Three "options" that are the same | Archetype-by-construction in Creative Director + embedding-similarity diversity gate + LLM diversity check. |
| **Cost / token blow-up** | Unsustainable unit economics | Model tiering, caching, per-run token budgets, cost logging + alerts. |
| **Lunar/holiday date errors** | Content generated on wrong day | Deterministic Hijri library; admin review of resolved dates; monitor lead-time buffer. |
| **Latency (minutes per run)** | Poor UX if synchronous | Fully async jobs + live status UI; generate days ahead of event. |
| **Over-automation removing human judgment** | Bad posts slip through | Human approval is a hard, non-bypassable gate; nothing publishes without sign-off. |
| **External API downtime/rate limits** | Pipeline stalls | Retries + backoff, circuit breakers, dead-letter queue, provider fallbacks where feasible. |

---

## Appendix A — Worked Example: Earth Day

1. **Monitor** (daily cron): today is 15 days out; lead=7 → no-op. On day −7 → `WorkflowTrigger`.
2. **Research** → `EventBrief`: summary of Earth Day; key messages (shared responsibility, small actions); do's (hopeful, action-oriented) / don'ts (avoid doom, avoid greenwashing clichés); tone: hopeful; audience: parents/community.
3. **Creative Director** → 3 concepts by archetype:
   - *Emotional/Inspirational* — "Protect the planet because it is our shared home." Children + nature.
   - *Educational/Awareness* — "Small actions today create a greener tomorrow." Recycling/planting.
   - *Modern/Bold* — "Earth doesn't need us. We need Earth." Minimal, striking.
4. **Writer + Designer** (parallel ×3): copy packages + visual specs (image prompts, palette, layout).
5. **Post Generator**: image API renders backgrounds; compositor overlays text/logo → 3 IG-square PNGs.
6. **Quality Review**: creativity 8, relevance 10, brand 9, uniqueness 8, message 9; diversity pass.
7. **Dashboard**: 3 options shown with scores; content manager previews.
8. **Human**: "Make #1 more emotional" → **Feedback Agent** scopes to copy+visual for concept 1 → partial re-run → approve → **download/export**.

---

## Appendix B — Human Approval Points (summary)
1. **Pre-approval gate** — after Quality Review, run pauses at `PENDING_APPROVAL`; no output proceeds automatically.
2. **Edit request** — human feedback triggers targeted regeneration (not full re-run).
3. **Final approval** — required before export; (future) required before any auto-publish.
4. **Sensitive categories** — Islamic/national events may require explicit SME sign-off before approval is allowed.
```
