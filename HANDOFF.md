# Hand-off — 2026-05-27

Closes the calendar cross-fade work that was WIP at end of 2026-05-26. One commit centres on `/dashboard/calendar/{page,CalendarWithSkeleton,CalendarTestClient,MonthSkeleton,calendar-custom}.tsx,css` plus a new engineering reference doc.

---

## ✅ Resolved: calendar "second white flash" + skeleton→live layout shift

The cross-fade issue carried over as open #7 from 2026-05-26 is closed. The root cause turned out to be a stack of contributing factors rather than a single bug — all four addressed in one combined patch:

1. **`next/dynamic` null-yield on mount.** `next/dynamic({ ssr: false, loading: () => null })` runs its own state machine that yielded `null` for one render tick after the chunk resolved, producing a visible white frame. Replaced with manual `import("./CalendarTestClient").then((mod) => setLiveCalendar(() => mod.default))` storing the resolved component in `useState`. We only render the live calendar once we definitely have it.
2. **`absolute → static` wrapper-class flip re-measured rbc.** The prior implementation mounted the live calendar with `absolute inset-0`, then flipped to static positioning post-fade — that layout-context change reflowed the container and rbc re-measured. Replaced with CSS Grid stacking (`grid` parent, both children share `col-start-1 row-start-1`). The live wrapper class no longer changes across phases.
3. **rbc base CSS shipped in the dynamic chunk.** `calendar-custom.css` `@import`s the rbc package stylesheet, and the file was imported in `CalendarTestClient.tsx` — so the whole stylesheet rode the dynamic chunk. Moved the import to `page.tsx` (server component) so Next.js inlines it as a `<link>` in the SSR document head — rbc rules are present before any JS runs.
4. **Residual `@apply animate-in` on `.rbc-month-view`.** Was replaying a fade-in on every live-calendar mount, on top of the wrapper's fade. Removed from `calendar-custom.css`.

After those four, a separate layout shift remained: the skeleton was ~53px shorter than the live calendar, so page height jumped when the live mounted. Diagnosis pinned the cause to the skeleton's calendar grid using `minHeight: 660px` + ~30px day-headers ≈ 690px, while the live calendar inline-styles its wrapper at `height: 740px`. Fix: wrapped the skeleton's day-headers + 6-week grid in a `<div style={{ height: 740 }} className="flex flex-col">` with `gridTemplateRows: "repeat(6, 1fr)"` on the inner grid. Skeleton grid wrapper is now 1058px vs live 1062px (residual 4px is within CLS "good" threshold and below the perception threshold).

Final tightening (added by Codex-assisted iteration after the above): explicit `"mounting"` phase in `CalendarWithSkeleton.tsx`. The live calendar is now rendered at `opacity-0 z-10` underneath the skeleton (`z-20`) during a dedicated mount phase, then the wrapper z-jumps to `z-30 opacity-100` for the cross-fade. This gives rbc a full paint cycle to measure before any visible motion begins.

**New engineering reference**: `docs/react-big-calendar-loading-stability.md` captures the core principle (*the first painted loading UI and the final hydrated UI must occupy the same geometry*) and the full set of synchronization rules — anchor date, week start convention, wrapper height, toolbar height, row layout model, CSS availability. Future calendar work (incl. the public-facing variant) should follow these.

**Companion change**: `CalendarTestClient.tsx` now accepts `initialDate?: Date` and seeds its date state from it (defaults to `new Date()` for safety). `page.tsx` passes `serverNow` through. Keeps the live calendar's initial month aligned with the skeleton's — fixes a subtle midnight-crossing date-anchor mismatch.

---

# Hand-off — 2026-05-26 (late evening)

Two commits today on `main`, not pushed (~56 commits unpushed). Both centre on `/dashboard/calendar`: a brand-aligned redesign across all four views, then a perf pass with an unfinished skeleton/cross-fade refactor.

---

## ✅ What landed today

### `c3631e1` — feat: dashboard calendar redesign — brand palette + scannable Month view

Aligns the admin calendar with the design-system migration. Touches `app/(dashboard)/dashboard/calendar/{page,CalendarTestClient,calendar-custom.css}.tsx`, adds `app/(dashboard)/dashboard/calendar/AgendaList.tsx`, extends `lib/events/categories.ts` with a color mapping.

**Across all views:**

- Category-tinted event chips via `eventPropGetter` + `cat-{slug}` CSS classes. Mapping in `EVENT_CATEGORY_COLORS` (lib/events/categories.ts): `software-engineering → navy`, `ai → cyan`, `design → orange`, `product → gold`, `startups-fundraising → green`. Each category gets a `chip` (full pill), a `dot` (small filled circle for Month view's inline rendering), and a `label`.
- Past days + events fade. `dayPropGetter` returns `className: "rbc-day--past"` + inline `style={{ backgroundColor: "rgba(232, 240, 244, 0.6)" }}` for past cells; `eventPropGetter` adds `rbc-event--past` + inline `opacity: 0.42` for past events. Inline styles ship in the SSR HTML so the wash + fade are present on first paint, not waiting on the custom CSS to apply.
- Sibling fade on hover in time-grid views. Two mechanisms (belt-and-suspenders): a CSS `.rbc-day-slot:has(.rbc-event:hover) .rbc-event:not(:hover) { opacity: 0.2 !important; transform: scale(0.97); }` rule, plus a JS-driven `mouseover` / `mouseout` listener that toggles `rbc-event--dimmed` on siblings. Either works alone; together they cover Chromium's flaky `:has` re-evaluation on `:hover`.
- Orange-hue 'now' time-line in Day/Week (was cyan). Gradient version for Week fades across past/future columns.
- Removed all SSR entry animations (`fadeInUp` on `.rbc-{month,time,agenda}-view`, staggered `.rbc-row` reveals). Per design-system.md: "no default entry animation on SSR'd pages — replaying a fade+slide on hydration creates perceived jank."

**New custom AgendaList component** replaces rbc's tabular Agenda view with a day-grouped editorial list: Lora day headings ("Tuesday, May 26"), indented event rows showing time range + title + category pill + city. Title links to event.url in a new tab; an Edit icon on hover routes to `/events/[id]/edit`. Past events drop to `opacity-40`.

**Per-view chrome:**

- **Week**: stacked `MON / 25` header (Inter caps + tracking above Lora Bold numeral). Today's numeral wears the navy-tint pill. Required `min-height: 3.5rem` on `.rbc-row.rbc-time-header-cell` (rbc's intrinsic sizing resolves to ~42px regardless of child content) AND `overflow: visible` on `.rbc-header` (rbc's default `overflow: hidden` clipped the stacked content). Today's column body is transparent — pill alone signals today.
- **Month**: weekday headers right-aligned to match in-cell date numerals; no top/bottom dividers around the header row. Today's cell has NO wash (white); today's date numeral wears the navy-tint pill. Past in-range and past off-range cells look identical (both get navy-frame at 60% via `rbc-day--past`; off-range bg dropped). Events render as inline rows: `● 11am Title…` with category dot + time + truncated title. Hover on a non-past event reveals a popover (140ms fade + scale to 1.05) that expands to the full title up to 320px.
- **Day** inherits the time-grid CSS from Week.

**Outer wrapper**: `<div className="rounded-lg border border-navy-frame bg-white p-5 …">`. The inner `.rbc-calendar` border + rounded-xl were dropped — the wrapper provides the only border tone.

**Click behaviour**: clicking an event opens `event.url` in a new tab (matches Agenda). The persistent `.rbc-selected` ring was removed — no useful workflow for "stay selected."

### `684c907` — perf(calendar): windowed query, moment locale strip, skeleton cross-fade (wip)

Three perf passes, the third unfinished.

**1. Windowed events query.** `page.tsx` now fetches only events in `[now − 60d, now + 180d]`. Past matters less than future for organisers (they care about what's coming), so the asymmetry is intentional. Drops SSR payload from ~840 rows to ~100–200. Navigating outside the window currently shows empty cells; on-demand re-fetch on prev/next at the window edges is a follow-up.

**2. moment.js locale strip.** `webpack.IgnorePlugin` in `next.config.js` ignores `^./locale$` inside the moment module — drops ~50–80KB of non-English locale data from the production bundle. **Caveat**: Turbopack (dev) ignores `webpack` config, so dev runs still ship the full moment. The IgnorePlugin only applies to production builds. Until we migrate off moment entirely (next-likely-target), this is a prod-only win.

**3. Skeleton cross-fade — WIP, open issue documented below.** New `MonthSkeleton.tsx` server-renders a look-alike grid: toolbar shell (calendar icon + Lora "May 2026" + nav button shapes + view-select shape), MON/TUE/WED day headers, 7×6 grid with date numerals + today pill + past wash + event-count "ghost" bars sized to actual events-per-day. New `CalendarWithSkeleton.tsx` is a three-phase state machine:
- `"skeleton"` — SSR + first paint, only the skeleton rendered.
- `"crossfade"` — chunk preloaded (via `import("./CalendarTestClient")` in useEffect), real calendar mounts `absolute inset-0` on top of skeleton, both visible during 300ms opacity transition.
- `"done"` — 300ms timer fires, skeleton unmounts, real calendar's wrapper drops `absolute inset-0` and returns to static flow (so Agenda's variable height isn't capped).

**Open issue**: there's still a perceptible "second white moment" after the cross-fade completes — Malik described it as "the page transitions to all white after a first mount and then loads the calendar again." Suspected causes: React Strict Mode double-mount in dev (which would visually disappear in production), or the `absolute → static` wrapper-class change re-triggering rbc's mount measurements. Refactor plan agreed on but not implemented: **CSS Grid stacking** — render both skeleton and real calendar in the same grid cell (`col-start-1 row-start-1`), they overlap naturally without `position: absolute`, real calendar's wrapper class never changes across phases.

**Vercel-best-practices cleanup applied in the same pass:**

- `page.tsx`: `Promise.all` for parallel `getUserProfile(supabase)` + events query; explicit column list in `select()` (no `*`). Added `serverNow: Date` prop passed to `CalendarWithSkeleton` so SSR + hydration agree on "today" (avoids a midnight-crossing mismatch). `select('id, title, ...')` initially included `name` (carried over from the old `event.title || event.name` fallback) and hit `column events.name does not exist` — removed.
- `CalendarTestClient.tsx`: hoisted `calendarComponents` to module scope (was `useMemo([] -> {…})`); functional `setState` in `handleSelectSlot` (drops `events` from deps); **fixed a real interval-leak bug** in the week midnight effect — `clearInterval` was returned from inside the `setTimeout` callback, which is meaningless (the timer callback's return is ignored), so on unmount after midnight the interval kept firing forever. Lifted `dailyInterval` out so the useEffect's cleanup actually clears it. Hoisted duplicate `new Date()` calls in the Upcoming Events block into a single `now`. Trimmed `CalendarEvent` interface (dropped unused `location`, `description`).
- `AgendaList.tsx`: hoisted `Date.now()` out of the per-event map loop.

---

## 🟡 Carried over (still open)

From `2026-05-26 (earlier)` and prior, plus the new entries from today:

1. **SSL 526 on `www.adamastor.blog`** — P0 from two days ago. Cloudflare → Vercel SSL mode is "Full (strict)" but Vercel doesn't have a cert for `www`. Add `www.adamastor.blog` as a domain in Vercel project → Domains, 301 → apex.
2. **Lighthouse a11y issues**:
   - Subscribe button contrast: white on `bg-gold-hue` (#D4A657) = 2.23:1. Fix: navy text on gold. Same pattern on the Submit button across `/events/submit`, `/subscribe`, `/preferences`.
   - ~~Calendar day numbers: `#ababab` on white = 2.29:1.~~ ✅ Resolved as part of the calendar redesign — off-range date numbers now use `text-navy-tone/70`, current-month numbers use `text-navy` (full strength).
3. **Validate JSON-LD** via Rich Results Test against `/`, `/about`, `/posts/<latest>`, `/events`, `/events/lisboa/design`.
4. **Submit sitemap** to Google Search Console + Bing Webmaster Tools.
5. **Manual AI visibility baseline** — screenshot ChatGPT / Perplexity / Claude results, re-check in 4–6 weeks.
6. **Update `social_links` rows** in DB for Carlos, Afonso, Malik.

**New from today:**

7. ~~**Calendar cross-fade second flash**~~ ✅ Resolved 2026-05-27. See the top-of-file section for full diagnosis and fix. Reference doc: `docs/react-big-calendar-loading-stability.md`.
8. **Agenda revisit** flagged mid-session: Malik wanted to revisit some of the day-grouped layout decisions "with more time and mental space." Specifics not captured; ask before re-opening.
9. **Calendar window edge handling** — prev/next currently shows empty cells past the ±window. On-demand re-fetch trigger when user navigates to a month outside the loaded window.

---

## 📋 Malik's planned work — release roadmap (from Notion)

Updated from yesterday's roadmap. Today's two big chunks landed:

- ~~Remove `####` from event descriptions.~~ ✅ (earlier `aead11a` + `0d91733`)
- ~~Remove ALL CAPS from event descriptions.~~ ✅ (earlier `aead11a` + `0d91733`)
- ~~Look into adding an **end time** to the events.~~ ✅ (earlier `80e918c`)
- ~~Make calendar UI fit the box.~~ ✅ Resolved as part of the redesign — outer wrapper sets the calendar dimensions; toolbar + grid fit within. Inner `.rbc-calendar` border removed so the navy-frame outer wrapper is the only frame.
- **Create and deploy cron job and workers for sending the newsletters.** — next likely candidate. The subscriber + categories model is shipped; the missing piece is the send loop.
- **Check and tweak email templates.** Welcome / preferences-link / per-category-newsletter. Brand palette (navy + cyan + gold) + seal as header ornament. Test sends to `delivered@resend.dev`.
- **Design the "unsubscribe from everything" state or page.** The button exists on `/preferences`; the destination/confirmation state doesn't.
- **Public-facing calendar variant.** Today's redesign is admin-only. Malik flagged that the calendar will be adapted for public use so event organisers + community builders can see when events overlap and pick better dates. **Open performance plan** (discussed but not implemented) prioritises:
  - moment.js → date-fns migration (~290KB → ~10-20KB on every public page)
  - ISR + on-demand revalidation (public has no cookie auth → CDN-cacheable)
  - Cloudflare Workers KV for events-feed caching at edge globally (Malik has paid CF account, MCP now connected — see Tools)
  - Hover-prefetch on prev/next/select buttons (only meaningful once query is windowed AND prev/next re-fetch)
  - Possibly: replace rbc with a lighter custom calendar (~5–10KB) for the public read-only variant
- **Redesign Articles screen to be consistent with Events.** `/` editorial pass — biggest open design task. The kicker-color tension lives here (open #2 from yesterday's handoff: doc says `orange-dark`, code uses `#24acb5`).
- **Redesign Articles route.** Per-post or per-author surfaces; spec needed before starting.
- **Improve auto-tag situation.** `inferEventCategorySlugs` in `lib/events/categories.ts` works but is keyword-heuristic. Many Portuguese-titled events fall through to `cat-none` (visible in the calendar as the neutral navy-veil block). Possibly LLM-assist on submission.
- **Update PostHog tracking** so we can answer "what's happening in our product." Decide on a small set of events before instrumenting.
- **Dynamic OG images per events route**.

---

## 🧠 Context the next session should know

### Calendar architecture

- `app/(dashboard)/dashboard/calendar/page.tsx` (server component) — fetches windowed events + user in parallel; passes `initialEvents`, `user`, `serverNow` to `CalendarWithSkeleton`.
- `app/(dashboard)/dashboard/calendar/CalendarWithSkeleton.tsx` (client component, hosts the dynamic import) — four-phase state machine (`skeleton → mounting → crossfade → done`) with CSS Grid stacking + explicit z-index layering. See `docs/react-big-calendar-loading-stability.md` for the synchronization rules the skeleton must honour.
- `app/(dashboard)/dashboard/calendar/MonthSkeleton.tsx` (renders inside CalendarWithSkeleton) — static look-alike for first paint.
- `app/(dashboard)/dashboard/calendar/CalendarTestClient.tsx` (client component, dynamic-loaded) — the real react-big-calendar wrapper. Renders the AgendaList for the Agenda view; renders rbc Calendar for the grid views.
- `app/(dashboard)/dashboard/calendar/AgendaList.tsx` — custom day-grouped editorial list.
- `app/(dashboard)/dashboard/calendar/calendar-custom.css` — single CSS file, organized into 10 numbered sections with a TOC at top.

`react-big-calendar` is bundled into the route. The Calendar component is loaded via a manual `import("./CalendarTestClient")` in a `useEffect` (not `next/dynamic`) and stored in `useState`, so we control the exact moment of mount and avoid `next/dynamic`'s internal null-yield. The stylesheet (incl. rbc's base CSS via `@import`) is imported in `page.tsx` so it ships in the SSR document, not the dynamic chunk.

### Category color mapping is reused beyond the calendar

`EVENT_CATEGORY_COLORS` in `lib/events/categories.ts` exposes `chip` (full pill class), `dot` (small filled circle for Month view inline rendering), and `label` (short display name). When the public-facing calendar lands, reuse this mapping for any category visualisation.

### `dayPropGetter` and `eventPropGetter` carry inline styles, not just classnames

This was load-bearing for first-paint correctness: classes alone meant past wash + opacity were missing in initial paint (CSS file injection is async in some dev modes). Inline styles ship in SSR HTML. Don't drop them when refactoring.

### The week-midnight `useEffect` had a real interval leak

Fixed in `684c907` but worth re-stating: when setting up an interval inside a setTimeout callback, the interval handle MUST be lifted to the outer scope (using `let dailyInterval` declared before the setTimeout) so the useEffect's return-cleanup can clear it. Returning a function from the setTimeout's callback does nothing — that return value is ignored.

### Cross-fade open issue — refactor plan ready

The position-`absolute` overlay during crossfade phase causes a visible flicker when transitioning to phase "done" (skeleton unmounts, real wrapper class changes from `absolute inset-0 …` to `…`). Refactor to CSS Grid stacking:

```tsx
<div className="grid">
  {phase !== "done" && (
    <div className={`col-start-1 row-start-1 transition-opacity duration-300 ${phase === "crossfade" ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
      <MonthSkeleton {...} />
    </div>
  )}
  {phase !== "skeleton" && (
    <div className="col-start-1 row-start-1 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <CalendarTestClient {...} />
    </div>
  )}
</div>
```

Both children at same grid cell → they overlap naturally → real calendar's wrapper class doesn't change between crossfade and done.

### Tools added today

- **Cloudflare MCP** is now available (Workers, KV, D1, R2, Hyperdrive). For the public-facing calendar performance plan, Workers KV is the killer pattern: cron-update an `events:index.json` on event approval/edit, serve at <50ms from edge globally.
- **Vercel MCP** is also connected (deployments, runtime logs, search docs).
- **PostHog MCP** is connected (extensive — feature flags, dashboards, surveys, LLM eval, error tracking).
- **Supabase MCP** is connected. Note: `mcp__supabase__apply_migration` still doesn't find this project; migrations still go through the dashboard SQL editor (see `[[reference_supabase_workflow]]` in memory).
- **`find-skills` skill** is now symlinked from `/Users/malik/.agents/skills/find-skills` to `~/.claude/skills/find-skills`. Use it when there's a need for functionality that might exist as an installable skill — e.g. the smooth-mount problem.

### Tools and quirks (unchanged from prior handoffs)

- **Turbopack + App Router shared layout caching**: still occasionally serves stale HTML after rapid edits to shared layouts. `preview_stop` + `preview_start` fixes it.
- **Turbopack ignores webpack config in dev**. The `webpack.IgnorePlugin` in next.config.js only applies to production builds — dev keeps the full moment.
- **DOM-verify, don't screenshot** UI work (per `[[feedback_no_screenshots]]`).
- **Don't auto-update `docs/design-system.md`** when code/doc conflict (per `[[feedback_design_system_changes]]`) — surface the conflict and ask.
- **Resend QA**: `delivered@resend.dev` (not `@example.com`).
- **`.next` cache can corrupt** on aggressive HMR / file moves. Symptom: `ENOENT … app-build-manifest.json`. Fix: `rm -rf .next` and restart.

---

## 🔁 Push reminder

**56 commits unpushed** (54 at start of day + today's 2: `c3631e1`, `684c907`). The calendar redesign is admin-only and not yet user-facing in a meaningful way — push pressure is low.

Before pushing:

- `npm run build` locally — the calendar work touches enough CSS + components that a clean prod build catches issues Turbopack-dev silently allows.
- `npm test` — `node:test` suite for cleaners still passes; no new tests added today.
- `npx tsc --noEmit` — already runs as `npm run typecheck`.
- Vercel preview Lighthouse for the calendar page once pushed.

---

## Suggested opening for the next session

> Read `HANDOFF.md` first. Calendar is in a good state visually but has one open issue: the cross-fade between skeleton and real calendar still has a second visible white moment. The refactor plan is documented above (CSS Grid stacking). Before implementing, invoke the `find-skills` skill (now symlinked into `~/.claude/skills/`) with a query about "smooth client-component mount transitions / hydration flash in Next.js App Router" — there may be a more idiomatic pattern available. Per the per-page editorial-review pattern: observe → ask → propose options → apply, never apply unilaterally.

Sleep well.
