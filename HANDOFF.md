# Hand-off — 2026-05-26 (end of day)

Closing out a long mobile redesign session. Everything below is committed but **not pushed** (~51 commits unpushed once today's lands).

---

## ✅ What landed today

One large commit covering mobile polish + doc updates across the editorial surfaces. 14 files, ~390 lines added.

### `/events` (list page)
- Sidebar moved below events on mobile (was above). H1 went from y=641 → y=148; first event card from y=1035 → y=422 on a 375×812 viewport.
- City tabs + category chips → single-row horizontal scroll with hidden scrollbar, breakout to screen edges (`-mx-4 px-4`), revert to `flex-wrap` at `sm:+`.
- Active chip auto-centers in its container on mount and route change (`useEffect` + manual `scrollLeft`, not `scrollIntoView` — the latter bubbles).
- `aria-pressed` on link chips replaced with `aria-current="page"` (closes one of the three Lighthouse a11y issues from yesterday's hand-off).
- Type compaction: H1 `text-2xl md:text-3xl`, intro `text-sm md:text-base leading-snug md:leading-relaxed`, card title `text-lg md:text-xl`, description `text-sm md:text-base leading-5 md:leading-relaxed`.
- Rail padding `pl-4 md:pl-8` (was `pl-8`), day-marker dot offset scaled to match.
- Vertical rhythm tightened on mobile: outer `space-y-6 md:space-y-10`, day buckets `space-y-6 md:space-y-10`, day heading → first card `space-y-0 md:space-y-4`.
- Calendar mobile strip gains a right-edge fade-to-`from-background` gradient (32px wide) as a scroll affordance.

### `/events/submit`
- Form module rendered borderless and edge-to-edge on mobile (card chrome scoped to `md:+`).
- Reviewer aside stacks vertically on mobile (`flex-col sm:flex-row`); text column grows from ~243px → ~303px.
- Redundant `<Separator />`s removed between named sections; the in-dropdown one inside the City `<Select>` stays (it has real UX signal — separates the 3 most-common cities from the long tail).
- Category-selector chosen-tag pills migrated from raw cyan hex (`#04C9D8` border / `#DFF6F8` bg) → canonical `border-navy bg-navy-tint text-navy` per the cyan-restricted rule.
- Curly apostrophes (`Portugal’s`, `we’ll`) — WIG punctuation hygiene.

### `/subscribe` and `/preferences`
Same six patterns applied: H1 `text-2xl md:text-3xl`, body `text-sm md:text-base leading-snug md:leading-relaxed`, outer `space-y-6 md:space-y-8`, form module card chrome scoped to `md:+`, redundant Separators removed, curly apostrophes across 5 strings.

### Footer
- `AdamastorMark` stays unwrapped — preserves the SMIL rainbow easter egg. (Yesterday I briefly wrapped it in a Link to `/`; Malik called this out and we reverted.)
- "Browse Events" heading → Link to `/events`. "Follow Us" heading → Link to `/subscribe`. "Our Projects" stays as a plain label (the items below ARE the destinations).
- Tagline "Only You Know Who You Can Be" → Link to `/about` with subtle hover-underline.
- `FOOTER_LINK` adds `inline-block py-1.5` — text-link tap zones grow from 17px → 32px.

### `MobileTabBar` (light-mode palette)
- Background: `rgba(255,255,255,0.78)` → `rgba(255,255,255,0.92)` (less transparent; backdrop-blur still reads).
- Active state: `#04C9D8` (cyan in light mode — brand violation) → `#104357` (navy.shade) text on `navy.tint @ 55%` pill.
- Inactive: `rgba(0,0,0,0.35)` → `#4D7689` (navy.tone).
- Dark mode untouched — cyan IS the dark-mode anchor per the design tokens.

### Documentation
`docs/design-system.md`: 775 → 1009 lines.
- New top-level **Mobile patterns** section (between Spacing & layout and Motion) with 10 subsections.
- In-place fixes: Pill chips toggle behavior (aria-current), Form-page template layout primitives (mobile variants), Footer clickability conventions (with the AdamastorMark-stays-unlinked carve-out).

---

## 🟡 Carried over from previous hand-off (still not done)

### From yesterday's HANDOFF.md
1. **SSL 526 on `www.adamastor.blog`** — P0 from yesterday, still unresolved. Cloudflare → Vercel SSL mode is "Full (strict)" but Vercel doesn't have a cert for `www`. Add `www.adamastor.blog` as a domain in Vercel project → Domains, 301 → apex.
2. **Lighthouse a11y issues** — aria-pressed on chips is now fixed (this session). Still open:
   - Subscribe button color contrast: white text on `bg-gold-hue` (#D4A657) = 2.23:1. Fix: navy text on gold. Same pattern affects the Submit button on `/events/submit`, `/subscribe`, `/preferences`. Deferred from this session intentionally (asked, you said no).
   - Calendar day numbers: `#ababab` on white = 2.29:1. Bump to `text-muted-foreground` or `#6b7280`.
3. **Validate JSON-LD** via Rich Results Test against `/`, `/about`, `/posts/<latest>`, `/events`, `/events/lisboa/design`.
4. **Submit sitemap** to Google Search Console + Bing Webmaster Tools.
5. **Manual AI visibility baseline** — screenshot ChatGPT / Perplexity / Claude results today, re-check in 4–6 weeks.
6. **Update `social_links` rows** in DB for Carlos, Afonso, Malik (feeds BlogPosting author schema).

---

## 📋 Malik's planned work before release

From Notion, transcribed in his order:

- Remove `####` from the event descriptions.
- Remove ALL CAPS from the event descriptions.
- Look into adding an **end time** to the events.
- Create and deploy cron job and workers for sending the newsletters.
- Check and tweak email templates.
- Design the "unsubscribe from everything" state or page.
- Make calendar UI fit the box.
- Redesign Articles screen to be consistent with Events.
- Redesign Articles route.
- Improve auto-tag situation.
- Update PostHog tracking to make sure we know what's happening in our product.
- **Dynamic OG images per events route** (was already in yesterday's P2 backlog at ~1–2hr).

---

## 🧠 Context the next session should know

### Tools and quirks
- **Turbopack + App Router shared layout caching**: while doing the footer pass, I edited `app/(main)/layout.tsx` 5 times in a row. Three of the edits showed up in served HTML; two didn't. Dev server logs said "Compiled / in 67ms" but `curl http://localhost:3000/` still showed the pre-edit content. Fix: stop and restart the dev server via `preview_stop` + `preview_start`. Worth a quick sanity check when shared-layout edits don't appear to apply.
- **Hot-reload artifact in server logs**: `TypeError: Cannot read properties of null (reading 'useState')` at `EventsPageClient.tsx:150` appeared repeatedly in the dev log throughout the session but never actually broke rendering (page always had 31 articles, no client console errors). Stale digest from an in-flight reload; ignore unless it shows up on a fresh process.

### Design-system enforcement
- **"Cyan in light mode" is the most-violated rule.** Two surfaces this session: `MobileTabBar` active state + the category-selector chosen pills. Both used hand-tuned cyan hex (`#04C9D8`, `#DFF6F8`) that pre-date the navy-tint highlight migration. New heuristic in the doc: **"When you find a hand-tuned hex starting with `#04…` or `#DFF6…` inside a light-mode style, treat it as legacy"** — migrate to `border-navy bg-navy-tint text-navy`.
- **`aria-pressed` on link chips is invalid ARIA**. Use `aria-current="page"`. Both old chips on `/events` had `aria-pressed`; the category one was flagged in yesterday's Lighthouse audit, the city one I noticed during the auto-center work. Both fixed.

### What `/events/[slug]` and `/events/[slug]/[category]` look like
They reuse `EventsPageClient` with a locked filter (no separate page component). Every mobile improvement to `/events` applies automatically — no separate work needed for the per-city/per-category routes. There is **no event-detail page** on Adamastor; event titles link out to external hosts (Luma, Eventbrite, etc.).

### Admin-only routes I didn't touch
`/events/[slug]/edit` uses a similar form pattern to `/events/submit` but didn't get the mobile pass. Admin-only, lower priority. If it ever opens to non-admins, mirror the submit-form changes.

---

## 🔁 Push reminder

Still **51 commits unpushed** (was 50 yesterday + today's commit). Before pushing:
- `npm run build` locally — the design-token migration + this session's responsive utilities together touch many surfaces; a clean prod build catches missing Tailwind classes Turbopack-dev silently allowed.
- The Vercel preview will give a more honest Lighthouse number than local dev.

Sleep well.
