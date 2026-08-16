#!/bin/bash
# PostToolUse hook: fires after the Skill tool runs. Only acts when the
# invoked skill was event-monitor — nudges Claude to hand any due events
# to content-orchestrator. Hooks cannot invoke skills themselves, so this
# only emits additionalContext; Claude does the actual invoking.
input="$(cat)"
skill="$(echo "$input" | jq -r '.tool_input.skill // empty')"
if [ "$skill" = "event-monitor" ]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"If event-monitor reported any due events above, invoke the content-orchestrator skill for each due event now (event_id + brand_id), one at a time."}}'
fi
