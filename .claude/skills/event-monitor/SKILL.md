---
name: event-monitor
description: Checks the event calendar and reports which events are due for content generation now (default 7 days ahead), skipping events already in progress or done. Use to decide what to generate, or run it from a scheduled task for autonomous triggering.
argument-hint: [as-of-date]
allowed-tools: Read
---

# Event monitor

Decide what content work should start today. This step is deterministic — do calendar math, not creative reasoning.

## Steps
1. Determine "today" (use `as-of-date` if provided, else the current date).
2. Load the event calendar (events store, per `plan.md §6`). For Islamic/lunar events, resolve the concrete Gregorian date for this year with a Hijri calendar library — never rely on a hard-coded date.
3. For each active event, compute `days_until = event_date - today`.
4. An event is **due** when `days_until <= generation_lead_days` (default 7) AND it has no run already `in_progress`, `pending_approval`, or `approved` for this occurrence.
5. Dedupe: never trigger a second run for an event/occurrence that already has one.

## Output (return ONLY this JSON)
```json
{
  "as_of": "YYYY-MM-DD",
  "due": [
    {"event_id": "string", "event_name": "string", "date": "YYYY-MM-DD", "days_until": 0, "brand_id": "string"}
  ],
  "skipped": [{"event_id": "string", "reason": "already in progress | too far out | inactive"}]
}
```

## Follow-up
For each `due` event, start `/generate-event-posts <event_id> <brand_id>`. When run from a scheduled task, trigger those runs automatically; when run interactively, list them and ask before starting.

## Autonomy note
To make this truly autonomous, register a scheduled task (cron) that runs this skill daily. See Claude Code scheduled tasks. Keep the lead time in `generation_lead_days` per event so buffers are per-event configurable.
