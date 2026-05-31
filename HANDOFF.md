# Hand-off — 2026-05-31: Next 16 / React 19 upgrade + calendar, category palette, navy dark mode

Committed as **`2d25c05`** on branch **`chore/next-16-react-19-spike`**. `pnpm typecheck` and `pnpm build` both green (next@16.2.6 / react@19.2.6). Working tree clean.

This is the session-level summary. Deeper docs: [`docs/react-big-calendar.md`](docs/react-big-calendar.md) (new), [`docs/animations.md`](docs/animations.md), [`docs/design-system.md`](docs/design-system.md) (navy dark tokens + category-colours section).

---

## ⚠️ THE release decision — what framework version ships?

The whole session's work lives on `chore/next-16-react-19-spike`, **not on `main`**. The branch tangles two things in shared files (`styles/globals.css`, the layouts), so they can't be cleanly cherry-picked apart:

1. the **Next 16 / React 19 framework upgrade**, and
2. a big slice of **design/UX work** (calendar redesign, navy dark mode, category palette, animations, error boundaries, the `app/(auth)/` route-group move).

Two paths before launch:

- **A — Harden and ship from this branch (React 19 / Next 16).** Build + typecheck are green; all features are validated at compile time. These are now the *latest stable majors*, not betas. Cost: React 19 is recent, and `lucide-react` / `react-day-picker` / `novel(tiptap)` emit peer warnings (harmless at runtime, but officially unsupported combos). Needs a full **runtime** QA pass.
- **B — Revert framework to the safe 15.5 / 18.3 on `main`, keep the design work.** Lower framework risk, but the design/UX work is entangled with React 19 (error boundaries, `RouteTransitionFrame`), so disentangling is real surgery right before launch.

**My recommendation: A, gated on a runtime QA pass.** The riskier move is the disentangling in B, not running a green React 19 build. Before merging to `main`, run [`docs/release-smoke-checklist.md`](docs/release-smoke-checklist.md) with focus on the three peer-warning surfaces: **the editor (novel/tiptap), auth (`app/(auth)/`), and the events calendar (react-day-picker)**. If any break, fall back to B. This is genuinely your call — flagging it loudly so it's a *decision*, not a default.

---

## What landed (commit `2d25c05`, 82 files)

- **Framework** — Next 15→16 (Turbopack is the default now; webpack is gated behind `--webpack`), React 18→19. React 19 fixes: `JSX.Element` global removed → `import { JSX }`. Branded `app/global-error.tsx` + `app/not-found.tsx`. Auth pages moved `app/login` + `app/signup` → **`app/(auth)/`** route group.
- **Calendar** (admin big-calendar + the two events calendars) — migrated off neutral grays + legacy cyan onto the **navy ramp, light AND dark** (first surface of the navy dark-mode anchor). Directional slide/fade/blur on nav; opacity-hold mask over the month↔week view-switch reflow. Past-day washes, hover-reveal month previews, sibling fade, week current-time gradient.
- **Category palette** — dedicated **seal-rainbow tints re-assigned by meaning**: Design=peach, Engineering=yellow, Startups=green, Product=cyan, AI=lavender (rose reserved for a 6th). Single source: `--cat-*` CSS custom properties (light + dark in one place) → consumed by calendar CSS, `EVENT_CATEGORY_COLORS`, and the newsletter email hex copy.
- **Dark mode** — **navy now anchors dark mode** (`navy-lifted`/`dim`/`edge` from the email `C_DARK` ramp); cyan dark-anchor being phased out.
- **Animations** — route transitions crossfade on **opacity only** (never translateY); blur masks microtransitions; `RouteTransitionFrame` + loading skeletons so fades land on real content.
- **Docs** — new portable `docs/react-big-calendar.md`; reconciled the `scrollbar-gutter` drift in `animations.md`; design-system navy + category sections.

---

## Dependencies

- **Bumped:** `posthog-js` 1.376.4 → 1.376.5 (only no-risk update available).
- **React / Next:** already on the latest majors (19.2.6 / 16.2.6) — nothing to do.
- **Deferred — all breaking, do NOT bump before launch:**

| Package | → | Why deferred |
|---|---|---|
| `tailwindcss` 3 → 4 | major | Known migration (config + engine rewrite); `tailwind-merge` 3 is TW4-only, keep both back |
| `@tiptap/core` 2 → 3 + `tiptap-markdown` | major | `novel` editor pins tiptap 2; TipTap 3 is a blocker |
| `react-day-picker` 8 → 10 | 2 majors | Drives the events calendar; v9 rewrote the API + needs date-fns 4 |
| `zod` 3 → 4 | major | Breaking validation API across the app |
| `typescript` 5 → 6 | major | Just released; can surface new errors — not pre-launch |
| `@supabase/ssr` 0.5 → 0.10 | breaking minors | **Auth-critical**; cookie handling changed — do not touch pre-launch |
| `sonner` 2, `@vercel/blob` 2, `lucide-react` 1, `@biomejs/biome` 2, `@commitlint/*` 21, `@types/node` 25, `eventsource-parser` 3, `react-markdown` 10, `react-email` 6 | major | Defer; bundle into a post-launch dependency sweep |

- **React 19 peer warnings** (harmless at runtime, watch in QA): `lucide-react` and `react-day-picker` want React ≤18; `@tiptap/pm` mismatch via novel.

---

## Known debt / carry-forward

- **Temp newsletter preview scaffolding is committed** (to keep a clean-checkout build green — `newsletter-template.tsx` imports `_fixtures/post-175`): `_tmp_fetch_post.ts` (repo root), `components/email/_fixtures/post-175.ts`. Remove once `PreviewProps` no longer imports the fixture; `_tmp_fetch_post.ts` has no importers and can go now.
- **This was a bundled mega-commit** (82 files, ~5 workstreams) — the changes were genuinely entangled. If you ever need granular history for a revert, `2d25c05` is the single point.
- **RESOLVED:** the old `lib/posts/related.ts:38` TS2352 error is gone — `pnpm typecheck` is now clean (fixed in the React 19 / tsconfig pass).

---

## Remaining pre-release tickets (roughly priority-ordered)

**P0**
- SSL 526 on `www.adamastor.blog`.

**Design / dark mode (the natural next push)**
- **App-side dark-mode navy migration** — only the calendar is migrated. The product's own dark mode is still **cyan-anchored** (`cyan-lifted/glow/dim` via `dark:` classes in `app/(main)/layout.tsx`, `PreferencesPageClient.tsx`, etc.) and its `.dark` surfaces in `globals.css` aren't a clean ramp. Migrate to the `C_DARK`/navy ramp. Per `feedback_design_system_changes`, surface options before editing the design-system doc. Memory: `project_dark_mode_navy`.
- **Redesign the email templates** to match the new article-page design system (the pre-launch punch-list's flagged next item).

**Events / email feature wiring**
- **Same-day-alert** (`event-same-day-alert.tsx` is template-only): send helper in `lib/events/notifications.ts`; organiser opt-in field + `/preferences` UI + footer `manageUrl`; detection at approval = same category + same day + **same city, excluding online**. Memory: `project_same_day_alert_email`.
- Wire the category-welcome `latestEditionUrl` (falls back to homepage).
- Run `normalizeEmojiLists` + `normalizeTypography` in the email path before `generateHTML` (docs/emails.md → "Known gap").

**Launch hygiene**
- Lighthouse baseline against `next build && next start`.
- `/llms.txt` + robots AI-bot allowlist + JSON-LD validation + sitemap submission.
- `authors.role` column (Opinion byline credential currently regex-derived from bio).
- Kicker tracking sweep on `/events` + `/subscribe` (`0.18em` → publication `0.14em`).

---

## How to resume

1. **Decide the release path above** (A: ship the branch after runtime QA, or B: revert framework).
2. If A: run [`docs/release-smoke-checklist.md`](docs/release-smoke-checklist.md), focusing on editor / auth / calendar; then merge `chore/next-16-react-19-spike` → `main`.
3. Calendar work: start from [`docs/react-big-calendar.md`](docs/react-big-calendar.md). Email: [`docs/emails.md`](docs/emails.md), `pnpm email` → :3001 (toggle dark via **OS dark mode**, not the moon icon).
