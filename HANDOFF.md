# Hand-off — 2026-05-30: email dark mode + new same-day-alert template

This session, on top of the prior email redesign (still uncommitted until now), added:
1. **A new email template** — `components/email/event-same-day-alert.tsx`.
2. **A mobile line-length fix** across all card templates.
3. **A hand-designed navy dark mode** across all 10 email templates.

Everything is committed to `main` in one commit (prior redesign + typography/app pass + this session's work bundled — Malik's call). **The canonical email doc is [`docs/emails.md`](docs/emails.md)** — read it first; it now carries the dark-mode + mobile-padding sections and all the gotchas. This file is the session-level summary.

---

## What landed this session

### 1. New template — `event-same-day-alert.tsx`  (TEMPLATE ONLY)
Fires to **organiser A** when admins **approve organiser B's** event that lands in the **same category, same day, AND same city** (online events excluded). Informational/caring register, not promotional — "the call is yours." Gold CTA → that day's lineup (`/events?date=…`). No WhatsApp line (Malik removed it). Copy refined with `/copywriting`: kicker "A heads-up", H1 "Another event shares your day", body line "Worth flagging early…".

**Not wired yet** (next session): send helper in `lib/events/notifications.ts`, the opt-in preference field + storage, and the same-category/same-day/same-city detection at approval time. Memory: `project_same_day_alert_email`.

### 2. Mobile padding — `RESPONSIVE_CSS` in `_theme.ts`
Card `<Container>`s have a fixed inline `padding:40px` that didn't shrink on phones (crushed text to ~34 chars/line). A `@media (max-width:600px)` rule drops it to 24px, keyed on the card's inline-style signature (no per-template className). Newsletter container is exempt by design (its padding lives on inner sections). Memory: `project_email_mobile_padding`.

### 3. Dark mode — `C_DARK` + `DARK_MODE_CSS` in `_theme.ts` (all 10 templates)
Hand-designed **navy** dark theme (not client-inversion), derived in OKLCH from the brand color study. Palette agreed with Malik and **verified by computed colors in the browser**: page `#0A1C24` · card `#102B38` · aside `#15323F` · hairline `#2C4F5E` · text `#CFE4EF` · secondary `#8FB3C2` · link `#6DB7EA` · accent/gold unchanged. All text ≥ WCAG AA. Memory: `project_dark_mode_navy`.

## Hard-won lessons (now in docs/emails.md + memory) — don't re-learn these
- **The preview's moon-icon toggle is NOT `prefers-color-scheme`.** It's a JS LCH inversion (`applyColorInversion`) simulating Gmail/Outlook force-invert; it ignores the `@media` block. To see the *designed* dark theme, emulate `prefers-color-scheme: dark` (OS dark or `preview_resize colorScheme:dark`), not the moon. This caused several wasted rounds.
- **Dark CSS needs TWO layers:** `.em-*` classes on big surfaces PLUS `[style*="color:#<hex>"]` attribute selectors keyed on brand hexes — the hex layer catches nested `<span>`s and buttons that can't carry a class (category span, ghost button, subscribe-alert labels). A class-only version left those invisible navy-on-navy.
- **`@media` has no specificity bonus — source order decides.** A template's own light `:hover` rule must be injected *before* `DARK_MODE_CSS`, else it wins on hover even in dark mode (the "View subscribers" button flashed light-veil on hover until reordered).
- **Newsletter prose** is styled by a `.adamastor-prose` *stylesheet* rule, not inline, so attribute selectors can't reach it — it has a dedicated `DARK_PROSE_CSS` block.
- **Verify by reading computed colors in the running preview** (`preview_eval` under dark emulation), checking `:hover` separately. Grepping source/HTML strings repeatedly gave false "all green" while the render was wrong.

## ⚠️ Still in the tree (intentional, committed)
- **Temp preview scaffolding is committed** (Malik chose this over removing it): `_tmp_fetch_post.ts`, `components/email/_fixtures/post-175.ts`, and the `post175` import in `newsletter-template.tsx`'s `PreviewProps`. They let the newsletter preview with real post-175 content. **Remove in a later session** and restore the synthetic `article` PreviewProps. (They were committed rather than left untracked because the tracked newsletter file imports the fixture — leaving it untracked would break a clean-checkout build.)

---

## ▶ Next session — open tickets (roughly priority-ordered)

**Finish the same-day-alert feature (the natural next step):**
1. Send helper in `lib/events/notifications.ts` (mirror the existing `sendSubmission*` helpers).
2. Opt-in preference field — organisers opt into "flag events near mine" (DB column + `/preferences` UI). Wire the footer `manageUrl`.
3. Detection at approval time: same category + same day + **same city, excluding online**; fire to each opted-in organiser of a matching existing event. Suggested subject: "Another {Category} event in {city} on your day".

**Email cleanup:**
4. Remove the temp preview scaffolding (see above).
5. Wire the welcome's `latestEditionUrl` (still falls back to homepage).
6. Content transforms in the email path — `normalizeEmojiLists` + `normalizeTypography` aren't run before `generateHTML` (docs/emails.md → "Known gap").

**App-side dark-mode migration (surfaced, not started — bigger):**
7. The product's own dark mode is still **cyan-anchored** (`cyan-lifted/glow/dim` in `tailwind.config.ts`, used via `dark:` classes across `app/(main)/layout.tsx`, `PreferencesPageClient.tsx`, etc.) and its `.dark` surfaces in `styles/globals.css` aren't a clean ramp (`--background`==`--card`; muted/border jump hue). Brand decision is **navy-anchored dark everywhere** → migrate the app to the `C_DARK` ramp and flip `docs/design-system.md`'s "cyan anchors dark mode" → navy. Per `feedback_design_system_changes`, surface options before editing the design-system doc. Memory: `project_dark_mode_navy`.

**Carried from prior hand-offs (still open):**
- **Pre-existing tsc error** `lib/posts/related.ts:38` (TS2352 cast — Supabase row `authors[]` vs `RelatedPost`). Already on HEAD before this session; `related.ts` was untouched here. `pnpm typecheck` fails only on this one line. Fix with a corrected cast/shape when convenient.
- SSL 526 on `www.adamastor.blog` (P0).
- `authors.role` column (Opinion byline credential currently regex-derived from bio).
- Lighthouse baseline against `next build && next start`.
- `/llms.txt` + robots AI-bot allowlist + JSON-LD validation + sitemap submission.
- Kicker tracking sweep on `/events` + `/subscribe` (`0.18em` → publication `0.14em`).
- Newsletter parked exploration (events-card variant + "On the calendar" date-block/category-chip section, incl. the AI=cyan chip) — tied to the calendar/category-colour decisions.

## How to resume
1. Read [`docs/emails.md`](docs/emails.md) — design system + dark mode + per-template status + follow-ups.
2. `pnpm email` → http://localhost:3001. Toggle dark via **OS dark mode** (or the preview's resize color-scheme), **not** the moon icon.
3. Reference template is `newsletter-template.tsx`; shared tokens (`C`, `C_DARK`, `RESPONSIVE_CSS`, `DARK_MODE_CSS`) are in `_theme.ts`.
