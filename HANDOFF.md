# Hand-off — 2026-05-26 (end of day)

Three commits landed today, all on `main`, not pushed (~54 commits unpushed total).

---

## ✅ What landed today

### `aead11a` — fix: sanitize scraped event descriptions

The earliest session work. New `lib/events/clean-description.ts` strips `#### `-style heading markers and de-shouts SHOUTY MARKETING COPY in descriptions auto-filled from Luma/Eventbrite/Meetup scrapes. Wired into all three extractors in `app/api/scrape/route.ts`. User-typed descriptions from `/events/submit` are NOT passed through — only the auto-fill path.

Light tests via `node:test` (no new framework dep) — `npm test` runs `tsx --test lib/**/*.test.ts`. 14 cases at the time of landing.

### `80e918c` — feat: optional end_time on events

Full vertical so the dashboard calendar's existing react-big-calendar duration-block code path has data to render. Migration `20260526120000_add_end_time_to_events.sql` adds `events.end_time timestamptz` (nullable) + check constraint `end_time > start_time`. Applied via Supabase dashboard SQL editor; file kept for audit.

End-to-end pipeline:

- **Scrape** (`app/api/scrape/route.ts`): Event interface gains `endTime?`; pulled from JSON-LD `endDate` and `event:end_time` meta in all three extractors (default / Luma / Eventbrite).
- **Forms** (`/events/submit`, `/dashboard/add-event`, `/events/[slug]/edit`, reviewer screen): optional End-time `DateTimePickerField`, pre-fills from `scraped.endTime`. Zod refine: if provided, must be after `start_time`.
- **APIs** (`/api/events` POST + `[id]` PUT, `/api/events/submissions` POST + `[id]` PATCH): accept `end_time` in body, write to DB.
- **Public read** (`lib/events/fetch-public.ts`): `PublicEvent.end_time?`.
- **Calendar** (`/dashboard/calendar/page.tsx`): fallback is `start + 2h` when `end_time` is NULL, so duration blocks render and overlaps are visible. Constant is local to the page so easy to tune later if the data suggests a different default.
- **JSON-LD** (`lib/events/seo.ts`): `endDate` added to Schema.org Event when present.
- **ICS** (`lib/events/calendar.ts`): DTEND uses real `end_time` when set, otherwise the same 2h default.

**Why end_time is nullable rather than required:** organisers genuinely don't always know when an event ends. Forcing them to guess would either block submissions or teach them to lie. The page-layer fallback gives admins a visible "no end specified" via NULL rather than a fake authoritative value in the DB. (Recap question we worked through during the session.)

### `0d91733` — ref: tighten event description cleaner + extract title cleaner

Second-pass refinement after running a SQL preview over real DB data. The first pass missed a lot.

Description cleaner (`lib/events/clean-description.ts`) now runs in this order:

1. Heading markers `^#{1,6} ` (heading-style, requires whitespace — so `#1`, `Panel #16` pass through unchanged)
2. Blockquote markers `^> `
3. Bold `**x**`, `__x__` (content allows nested markers so `**A *B* C**` matches cleanly)
4. Italic `*x*`, `_x_` (bullet markers `* item` and `snake_case` survive via boundary lookarounds)
5. Markdown links `[text](url)` → `text` (URLs aren't clickable from line-clamped cards anyway)
6. Backslash escapes `\|`, `\,`, `\.` (from Markdown-table source rows)
7. De-shout (see below)
8. Collapse 3+ blank lines → 2

**De-shout threshold:** ≥3 long-caps in a run (matches Malik's "more than 2 words use all caps" rule). Tried lowering to ≥2; preview showed it demoted ~12 acronym pairs (`AWS UG Lisbon`, `AI ACT`, `CNCF KCD`, `WP REST API`, `NFC SUMMIT`, `DSPT x NOS`) vs catching ~7 legitimate 2-word shouts (`HUGE DEAL`, `YOUTH ENTREPRENEURSHIP`, `SOCIAL INNOVATION`). Reverted; acronym preservation wins.

**Classifier fixes from visible preview regressions:**

- Unicode-aware uppercase: `\p{Lu}` / `[[:upper:]]` so `ESTÁ`, `NEGÓCIO` count
- Letter-only extraction so `DON'T` classifies as long-caps (was falling to "other" because of the apostrophe)
- Single-letter caps (`A`, `I`) count as short-caps — they extend runs without anchoring one. Fixes partial transforms like `Mentoring As A VILLAGE`.
- Newline-containing whitespace breaks runs so `1PM\n\nLACS` on adjacent paragraphs isn't merged

**Title cleaner extracted to `lib/events/clean-title.ts`:** same de-shout rule via shared `deshout` export, plus title-specific scrubs:

- Online-indicator junk: `[Online]`, `(Virtual)`, `🌐 / 💻 / 🖥️`
- Meetup date-tail: `", Mon, Jan 1, 2026, 6:00 PM   | Meetup"` → `""`
- Platform branding suffixes: ` · Luma`, ` | Meetup`, ` | Eventbrite`

**DB cleanup of existing rows** was run via the matching SQL function in the Supabase dashboard SQL editor — same logic ported to PL/pgSQL with a tokenizer that mirrors the JS walker. Both `description` and `title` columns swept.

Test suite: 37 cases (clean-description) + 13 (clean-title) via `node:test`.

---

## 🟡 Carried over (still open from previous handoffs)

From `2026-05-26 (earlier)` and prior:

1. **SSL 526 on `www.adamastor.blog`** — P0 from two days ago. Cloudflare → Vercel SSL mode is "Full (strict)" but Vercel doesn't have a cert for `www`. Add `www.adamastor.blog` as a domain in Vercel project → Domains, 301 → apex.
2. **Lighthouse a11y issues** — `aria-pressed` chips fix landed yesterday. Still open:
   - Subscribe button contrast: white on `bg-gold-hue` (#D4A657) = 2.23:1. Fix: navy text on gold. Same pattern on the Submit button across `/events/submit`, `/subscribe`, `/preferences`.
   - Calendar day numbers: `#ababab` on white = 2.29:1. Bump to `text-muted-foreground` or `#6b7280`.
3. **Validate JSON-LD** via Rich Results Test against `/`, `/about`, `/posts/<latest>`, `/events`, `/events/lisboa/design`. (New `endDate` field is now in the Event JSON-LD, worth re-checking.)
4. **Submit sitemap** to Google Search Console + Bing Webmaster Tools.
5. **Manual AI visibility baseline** — screenshot ChatGPT / Perplexity / Claude results, re-check in 4–6 weeks.
6. **Update `social_links` rows** in DB for Carlos, Afonso, Malik (feeds BlogPosting author schema).

---

## 📋 Malik's planned work — release roadmap (from Notion)

Two of these landed today (struck through). Remainder is the runway for upcoming sessions.

- ~~Remove `####` from event descriptions.~~ ✅ `aead11a` + `0d91733`
- ~~Remove ALL CAPS from event descriptions.~~ ✅ `aead11a` + `0d91733`
- ~~Look into adding an **end time** to the events.~~ ✅ `80e918c`
- **Create and deploy cron job and workers for sending the newsletters.** — next likely candidate. The subscriber + categories model is shipped; the missing piece is the send loop.
- **Check and tweak email templates.** Welcome / preferences-link / per-category-newsletter. Brand palette (navy + cyan + gold) + seal as header ornament. Test sends to `delivered@resend.dev`.
- **Design the "unsubscribe from everything" state or page.** The button exists on `/preferences`; the destination/confirmation state doesn't.
- **Make calendar UI fit the box.** Separate concern from the end_time wiring — the `/dashboard/calendar` page currently uses a fixed `height: 800px`. Likely a layout / responsive fix.
- **Redesign Articles screen to be consistent with Events.** `/` editorial pass — biggest open design task. The kicker-color tension lives here (open #2 from yesterday's handoff: doc says `orange-dark`, code uses `#24acb5`).
- **Redesign Articles route.** Per-post or per-author surfaces; spec needed before starting.
- **Improve auto-tag situation.** `inferEventCategorySlugs` in `lib/events/categories.ts` works but is keyword-heuristic. Possibly LLM-assist on submission?
- **Update PostHog tracking** so we can answer "what's happening in our product." Decide on a small set of events before instrumenting.
- **Dynamic OG images per events route** (was in yesterday's P2 backlog at ~1–2hr).

---

## 🧠 Context the next session should know

### Cleaners are now stable

`lib/events/clean-description.ts` and `lib/events/clean-title.ts` are the canonical places to evolve scraped-content sanitization. Both have `node:test` coverage; run `npm test` before touching them. The exported `deshout` is shared between them — change it once, both surfaces inherit.

**If you change the de-shout threshold:** re-run the SQL preview against the DB before re-applying the cleanup. The preview/apply SQL is in the assistant's earlier turn (the temp-function block); paste it into the Supabase SQL editor as one self-contained query (paste the function definitions + the SELECT or UPDATE in the same submission — `pg_temp` is session-scoped and Supabase opens a fresh connection per editor query).

### Cleaners run only on scrape output, not on user input

`cleanEventDescription` and `cleanEventTitle` are only invoked in `app/api/scrape/route.ts`. User-typed submissions via `/events/submit` flow through Zod validation but the cleaner doesn't touch them — user intent is preserved. If you ever want defensive cleanup on submit too, that's a deliberate decision worth surfacing.

### `end_time` is nullable on purpose

The dashboard calendar (`/dashboard/calendar`) uses a `start + 2h` fallback in the page layer when `end_time` is NULL. Don't backfill NULL rows with the fallback value in the DB — the NULL is meaningful ("organiser didn't specify"). The 2h constant is at `FALLBACK_DURATION_MS` in `app/(dashboard)/dashboard/calendar/page.tsx` and again in `lib/events/calendar.ts` (`DEFAULT_DURATION_HOURS`). Keep them aligned if you tune one.

### The dashboard calendar is admin-only

`/dashboard/calendar` is behind admin auth. If the public is ever going to see a time-grid calendar of upcoming events, that's a new surface, not a re-route — the dashboard variant has admin-only event editing wired through `onSelectEvent` / `onSelectSlot` and would need a separate read-only path.

### Tools and quirks (unchanged from prior handoffs)

- **Turbopack + App Router shared layout caching**: still occasionally serves stale HTML after rapid edits to shared layouts. `preview_stop` + `preview_start` fixes it.
- **Supabase migrations**: applied via the dashboard SQL editor, not via `mcp__supabase__apply_migration` (which won't find this project — see `[[reference_supabase_workflow]]` in memory).
- **`pg_temp` is session-scoped**: when running ad-hoc helper functions in the Supabase SQL editor, paste the `CREATE FUNCTION` definitions and the `SELECT`/`UPDATE` together in one editor query. Separate queries = separate sessions = lost helpers.
- **DOM-verify, don't screenshot** UI work (per `[[feedback_no_screenshots]]`).
- **Don't auto-update `docs/design-system.md`** when code/doc conflict (per `[[feedback_design_system_changes]]`) — surface the conflict and ask.
- **Resend QA**: `delivered@resend.dev` (not `@example.com`).

---

## 🔁 Push reminder

**54 commits unpushed** (52 at start of day + today's 3: `aead11a`, `80e918c`, `0d91733`). Before pushing:

- `npm run build` locally — the design-token migration + event_categories work + today's cleaner/end_time changes touch many surfaces; a clean prod build catches missing Tailwind classes Turbopack-dev silently allowed.
- `npm test` — the `node:test` suite now exists and covers both cleaners.
- `npx tsc --noEmit` — already runs as `npm run typecheck`.
- The Vercel preview gives a more honest Lighthouse number than local dev.

---

## Suggested opening for the next session

> Read `HANDOFF.md` first. The events ingestion path is now clean (sanitiser + end_time pipeline). Three likely next targets in priority order: **(1)** newsletter cron job + workers (closes the subscriber → send loop), **(2)** Articles screen redesign on `/` (biggest remaining design task, kicker-color question lives here), or **(3)** calendar UI "fit the box" responsive pass. Per the per-page editorial review pattern: observe → ask → propose options → apply, never apply unilaterally.

Sleep well.
