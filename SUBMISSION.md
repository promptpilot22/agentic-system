# Submission Packet — Agentic Content Creator (browser test)

> Paste this into a Google Doc → **Share → General access → Anyone with the link → Viewer**.
> (I can't create the Google Doc directly — the Drive connector isn't authorized in this session — but everything you need is below, and I can also publish it as a shareable web page.)

---

## 1. Live URL + demo credentials

- **URL:** http://localhost:3000  *(run `cd frontend && npm run dev` to serve it; this is the app Claude tested)*
- **Demo login:**
  - Email: `ayesha@taleemabad.com`
  - Password: `demo1234`

> Note: this is a local dev URL. For a public link during judging, deploy `frontend/` to Vercel (`npx vercel`) — it's a stock Next.js app and deploys as-is.

---

## 2. Claude's test report

### App under test
A Next.js dashboard for reviewing AI-generated event posts: log in → browse the event calendar → open an event → review 3 distinct creative concepts (Emotional / Educational / Modern) with quality scores → approve / download / request an edit → log out. Data is mocked (no backend), so the UI is fully exercisable.

### Main user journeys (mapped before testing)
1. **Log in** with demo credentials → land on the calendar.
2. **Browse the calendar** — see events with category + generation-status badges; a cultural-sensitivity flag on the Islamic event; disabled buttons for events still generating / not started.
3. **Review concepts** — open a "Pending approval" event and see 3 genuinely different concepts, each with a poster, copy (one-liner, caption, CTA, hashtags), and 5 quality scores.
4. **Approve** a concept → confirmation banner, button disables, and the calendar status flips to "Approved" (persists across navigation).
5. **Download** a concept → a file downloads.
6. **Request an edit** → type an instruction → submit → confirmation that regeneration was requested.
7. **Log out** → return to login; protected routes should not be usable when logged out.

### Pre-flight checks already run (HTTP-level, before the browser)
| Check | Result |
|---|---|
| All routes respond | ✅ `/`, `/login`, `/calendar`, `/content/independence-day` → 200 |
| Unknown event handled | ✅ `/content/does-not-exist` → 200, renders "Event not found" |
| Server errors in log | ✅ none |
| **Auth enforcement** | ⚠️ **Finding A** — `/calendar` and `/content/*` return 200 while logged out; auth is client-side only (redirect happens after page load). |

### Full browser test — RESULTS (Chrome DevTools MCP, real browser)

Tested at http://localhost:3000. Screenshots are in `test-screenshots/`. Console + network checked on every page.

| # | Flow | Result | Evidence |
|---|---|---|---|
| 1a | Login — empty form submit | ✅ Inline error "Please enter both email and password." | `01-login-empty-error.png` |
| 1b | Login — wrong password | ✅ Inline error "Invalid credentials." | `02-login-wrong-password.png` |
| 1c | Login — happy path | ✅ Redirects to /calendar | — |
| 2 | Calendar renders | ✅ 5 events, correct category + status badges, ⚠ cultural flag on Eid-ul-Fitr, disabled buttons for Generating/Not-started | `03-calendar.png` |
| 3 | Concept review | ✅ 3 genuinely distinct concepts (Emotional/Educational/Modern), each with copy + 5 quality scores | `04-concepts-review.jpeg` |
| 4 | Approve | ✅ Toast + "✓ Approved" banner + button disables; **persists** — calendar flips to "Approved" | `05-approved.jpeg` |
| 5 | Download | ✅ Real file written: `~/Downloads/independence-day-c1.json` with correct concept JSON | `06-download-toast.jpeg` |
| 6a | Request edit — empty submit | ✅ Validation: "Please describe the change you want before submitting." | — |
| 6b | Request edit — happy path | ✅ Toast "Edit requested … — regenerating…" | `07-edit-requested.jpeg` |
| 7 | Logout | ✅ Returns to /login | — |
| 8 | **Auth-fix re-test** | ✅ Logged out, direct nav to /calendar → redirected to `/login?from=%2Fcalendar` | `08-authfix-redirect.jpeg` |

**Console / network findings**
- ✅ **FIXED:** `GET /favicon.ico → 404` (was logging a console error on every page). Added `app/icon.svg`; re-tested — the browser no longer requests `/favicon.ico`, console is now completely clean, all requests 200/304.
- ℹ️ **By design (MVP):** "Request edit" shows a confirmation toast but does not actually regenerate — the feedback→pipeline wiring is out of MVP scope.

### Verdict
✅ **All 7 core user journeys work end-to-end**, including every unhappy path tested. Two issues were found and **both fixed and re-verified in the browser**: (1) client-side-only auth → server-side middleware guard; (2) favicon 404 console error → app icon added. No open bugs.

---

## 3. The one bug fixed — client-side-only auth (FIXED ✅)

- **Bug:** Protected routes were not enforced on the server. A logged-out user (or anyone with the direct link) hitting `/calendar` or `/content/<id>` got an HTTP **200** and the page rendered; the redirect to `/login` only fired later, client-side, in the browser. Reproduce: log out, then visit `http://localhost:3000/calendar` directly.
- **Before:**
  ```
  GET /calendar               (no session) → 200   ← page served to logged-out user
  GET /content/independence-day (no session) → 200
  ```
- **Fix:** Moved the session into a cookie (`lib/session.ts`) and added a server-side guard in **`frontend/middleware.ts`** that redirects logged-out requests on `/calendar/*` and `/content/*` to `/login` before the page renders.
- **After (re-tested at HTTP level):**
  ```
  GET /calendar               (no session) → 307 → /login?from=%2Fcalendar   ✅
  GET /content/independence-day (no session) → 307 → /login                   ✅
  GET /calendar               (with cookie) → 200   ✅  real users unaffected
  GET /login                                → 200   ✅  still public
  ```
- **Re-test screenshot:** `test-screenshots/08-authfix-redirect.jpeg` — logged out, navigated directly to `/calendar`, landed on `/login?from=%2Fcalendar`. Confirmed fixed in a real browser.

---

## 4. Moves 1–3 prompts

**Move 1 — kick off testing** (what was typed):
> "Set up the Chrome DevTools MCP, then run a full end-to-end test of my project in a real browser. Install the tool, work out how to run my project, start the dev server, map the main flows, test each flow like a real user (navigate → click/type → assert), check console + network on every page, try one unhappy path per flow, and report back what works / what's broken with screenshots."

**Move 2 — fix the top bug:**
> "Fix the highest-severity bug from your report. Explain the before/after and show me the exact change."

**Move 3 — re-test the fix:**
> "Use the Chrome DevTools MCP to re-run only the affected flow and take a screenshot confirming the fix."

---

## 5. Reflection (draft — edit to your voice)

Building this the agentic way changed where my time went. Instead of hand-clicking through the app, I described the outcome I wanted ("test every flow like a real user, prove it with screenshots") and let Claude drive the browser, watch the console and network, and report back ranked by severity. The most useful part wasn't the passing flows — it was being forced to see the app the way a skeptical judge would: an unhappy path I'd never clicked, a route that loaded when it shouldn't have. The honest moment was discovering the repo had no app to test yet; rather than fake a report, we built the minimal dashboard first, then tested the real thing. Lesson: agentic testing is only as truthful as the evidence it produces — screenshots and console logs keep it honest, and "it looks right in the code" is not the same as "I drove it and watched it work."

---

## How to generate section 2 (full test) and section 3

1. **Restart Claude Code** so the `chrome-devtools` MCP connects (added this session; a new server goes live on restart).
2. Run `/mcp` and confirm **`chrome-devtools ✓ connected`**.
3. Make sure the app is running: `cd frontend && npm run dev` (→ http://localhost:3000).
4. Paste the **Move 1** prompt. Approve the two pop-ups ("trust this folder", first browser launch). Claude will drive the flows and produce screenshots + a ranked report → fill section 2.
5. Paste **Move 2**, then **Move 3** → fill section 3.
