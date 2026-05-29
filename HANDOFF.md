# Hand-off — 2026-05-29: "Weekly Adamastor" rename + cross-route consistency + article-page strap/TOC/em pass

Continuation of the editorial-design "road to release" sweep. This session did two things:

1. **Brand rename** — dropped the leading "The" from the publication name everywhere it's a *display* string: **"The Adamastor Weekly" → "Weekly Adamastor"**. (The referential "the" in flowing prose — "*The* Weekly Adamastor every Tuesday" — is grammar, not the brand name, and is kept.)
2. **Article-page refinements** — byline strap redesign (two-zone), ShareRow moved back to the top byline, PostTOC microcopy + active-weight, coda 60ch/681px alignment, `<em>` inline-italic decision, character-QA renderer pass, and a `prosemirror.css` link-token cleanup. **These are what Malik said he still wants to tweak next.**

**Committed** as `ea912c8` (single grouped commit for the whole session). Branch is **65 commits ahead of `origin/main`**; **nothing pushed yet**. See "Push" at the bottom.

Canonical references, both extended this session:
- [`docs/typography.md`](docs/typography.md) — fonts, type stack, **byline strap**, **ShareRow placement**, kicker labels, **em (inline italic)**, **PostTOC**, **post-prose chrome alignment**, **character-QA renderer**, links, blockquote, open follow-ups.
- [`docs/design-system.md`](docs/design-system.md) — lexicon, two-pillar kicker accent, `getFeedCardLabel`, navy family incl. `navy.bright` / `navy.bright-deep`.

---

## What landed this session

### A. "Weekly Adamastor" rename (display strings only)

Dropped the leading "The" on every brand-display surface. Files touched:

- [`components/home/Masthead.tsx`](components/home/Masthead.tsx) — `DEFAULT_DEK` keeps the **referential** "The Weekly Adamastor every Tuesday" (this is *the newsletter*, lowercase-the grammar — Malik corrected this explicitly).
- [`components/SubscribeForm.tsx`](components/SubscribeForm.tsx) — `heading: "Subscribe to Weekly Adamastor"`, `stickyLabel: "Weekly Adamastor · Every Tuesday"`.
- [`app/(main)/preferences/PreferencesPageClient.tsx`](app/(main)/preferences/PreferencesPageClient.tsx) + [`app/(main)/subscribe/SubscribePageClient.tsx`](app/(main)/subscribe/SubscribePageClient.tsx) — checkbox labels + selection summary.
- [`app/(main)/about/page.tsx`](app/(main)/about/page.tsx) — bio prose + the "Weekly Adamastor" stream heading.
- [`app/layout.tsx`](app/layout.tsx) — RSS feed `<link>` title.
- [`app/(main)/page.tsx`](app/(main)/page.tsx) + [`app/(main)/page/[page]/page.tsx`](app/(main)/page/[page]/page.tsx) — JSON-LD `name` + archive meta description.
- [`lib/posts/kind.ts`](lib/posts/kind.ts) — `getFeedCardLabel(kind)` returns `"Weekly Adamastor"` / `"Opinion"`. **`getKickerLabel` was deleted** (the `Week N` marker is no longer concatenated into the label — it renders separately in the kicker-row right gutter).
- [`lib/posts/normalize-emoji-lists.ts`](lib/posts/normalize-emoji-lists.ts) + [`docs/typography.md`](docs/typography.md) — comment + heading "Weekly Adamastor — emoji-led sections".

**Left verbatim on purpose** — the Resend segment/topic literal name **"Adamastor Weekly"** is an infrastructure identifier (targeted by ID via env vars, but the literal name must match what Resend stores). Occurrences in `README.md`, `app/api/emailSubscribers/route.ts`, `app/api/sendNewsletter/route.ts`, `docs/newsletter-subscriptions.md`, `lib/newsletter/segments.ts` were intentionally **not** renamed.

### B. Cross-route consistency (kicker system unified)

- **Two-pillar kicker accent** is now publication-wide: **Weekly = `text-navy-bright` / `dark:text-cyan-glow`** (cool brand-blue), **Opinion = `text-orange-hue`** (warm "named voice"). Applied on the river ([`PostRiver.tsx`](components/home/PostRiver.tsx)), featured hero ([`FeaturedHero.tsx`](components/home/FeaturedHero.tsx)), sidebar Opinion ([`HomeSidebar.tsx`](components/home/HomeSidebar.tsx)), and the article hero ([`PostHero.tsx`](app/(main)/posts/[id]/PostHero.tsx)). **The accent colour is the kind-signal across routes** — scan a kicker on `/`, meet the same colour on the article.
- **Kicker-row layout unified**: `[pillar label] ←→ [Week N, right gutter]` via `flex justify-between`. Week marker is title-case "Week 21" (not uppercase), `text-muted-foreground/75` — quietest tier, deliberately neutral gray (not navy-tinted). On `FeaturedHero` the date + read-time moved *out* of the kicker row and *into* the byline cluster below.
- **Hover-background canon**: `hover:bg-navy-veil/40` (+ `dark:hover:bg-cyan-glow/[0.04|0.06]`) — one interactive-surface register everywhere.

### C. Colour audit — river stays gray (decision, no code change)

Audited whether the homepage should adopt the article's navy-tone secondary register. Only divergence: **secondary/metadata text** (home river = neutral gray `muted-foreground` `#737373`; article = navy-tone `#4D7689`). **Malik chose "keep the river gray."** The river is "catalog / scan mode" (Inter titles); the article is "anchor moment" (Lora). Two secondary registers coexist by design — do **not** re-propose unifying. (Saved as memory `feedback_river_scan_register.md`.)

### D. Byline strap — redesigned to two zones

[`app/(main)/posts/[id]/Byline.tsx`](app/(main)/posts/[id]/Byline.tsx). Below the H1, bracketed by two `navy-frame` hairlines. **No "By" prefix.** One concern per zone, split by an internal hairline:

- **Zone A — author identity** (`flex items-start gap-4 py-5`): avatar 56×56 + name + credential. Name = Inter **15px / weight 575** `text-navy`, **no underline at rest** (hover adds `decoration-navy-tint decoration-2 underline-offset-4`). Credential = **Lora italic 14px** `text-navy-tone`, `max-w-[44ch]`, `hyphens-manual`.
- **Zone B — utility bar** (`border-t border-navy-frame py-2.5`): date · read-time (Inter 13px navy-tone) on the left, **ShareRow** on the right at `sm:`+, stacks below on mobile.

Rationale (in the doc): avatar+name+credential all answer *who's speaking* (editorial voice, full navy + Lora italic); date+read-time+share are all *reader tooling*. The internal hairline + quieter navy-tone on Zone B is what makes the eye parse identity vs. tooling instantly. Name weight **575 (not 600)** matches `.article-prose strong` + PostTOC active — one emphasis station across the publication.

### E. ShareRow — back in the top byline, 44 → 36 targets

[`app/(main)/posts/[id]/ShareRow.tsx`](app/(main)/posts/[id]/ShareRow.tsx). Placement bounced (byline → AuthorStrap below → **back to top byline**); deciding factor: share affordances must be in view *on entry*. Now lives in Zone B with the other reader-tooling. **`AuthorStrap` no longer carries a share block.** Hit targets **44×44 at mobile** (Apple HIG / WCAG 2.5.5 AAA), compress to **36×36 at `sm:`+** (icon stays 16×16). Hover uses the `bg-navy-veil/40` canon + dark-mode cyan tokens.

### F. PostTOC — "In this article" + active weight 575

[`app/(main)/posts/[id]/PostTOC.tsx`](app/(main)/posts/[id]/PostTOC.tsx). Kicker microcopy **"Contents" → "In this article"** (serious-editorial-web register; "Contents" read as wiki/Notion-clinical and was the odd one out against "About the author" / "More opinion" / "Reader notes"). Size `text-[10px]` → `text-xs` (12px publication kicker default). `aria-label` on the `<nav>` stays "Article contents" (terser landmark name). Active item `font-semibold` (600) → **`font-[575]`** to match `.article-prose strong`; active accent stays **`navy` (not `navy.bright`)** because the active state is *passive* (scroll-tracking, not clicked).

### G. `<em>` inline italic — Inter italic 450 (stays in body family)

[`styles/prosemirror.css`](styles/prosemirror.css): `.article-prose em { font-weight: 450; }`. **Decision: keep `<em>` in Inter, not Lora italic.** A serif italic against the sans body reads as ornament mid-paragraph; Butterick's "italic sans barely stands out" is print-era (10pt) and doesn't carry to 18px anti-aliased screens. The +50 weight bump lifts the italic to read as deliberate while staying a clear 125-weight gap below `strong` (575). Single-axis discipline: `<strong>` changes weight only, `<em>` changes style only (with the small nudge). Lora stays reserved for headlines + blockquote.

### H. Character-QA renderer pass (NEW)

[`lib/posts/normalize-typography.ts`](lib/posts/normalize-typography.ts) + [`lib/posts/normalize-typography.test.ts`](lib/posts/normalize-typography.test.ts). Walks TipTap JSON in `PostPreview`, composed with `normalizeEmojiLists`: `const content = normalizeEmojiLists(normalizeTypography(initialContent));` ([`post-preview.tsx`](components/tailwind/post-preview.tsx)). Conservative ASCII→Unicode substitutions on every text node **except inside `codeBlock` or text with a `code` mark**:

- `--` (2+ hyphens) → `—` em-dash
- `...` (exactly three, not surrounded by more dots) → `…`
- `'` after a word char or before a digit → `’` (contractions, possessives, `'90s`)
- `"` after whitespace / start / open-bracket → `“`; everything else → `”`

DB content is never mutated; fixes all historical content at render time. **Deferred** (need smarter detection): ` - ` → em-dash (ambiguous with compounds), `1-10` → en-dash (number-range), opening single quote `'twas`/`'em`. The **editor-side `@tiptap/extension-typography`** pass (~5 lines, so Carlos sees smart chars as he types) is **still pending**.

### I. prosemirror.css link-token cleanup

Defined `--prose-link: #1C6EB4` / `--prose-link-hover: #0F5091` custom properties on `.article-prose` (mirroring the `navy.bright` / `navy.bright-deep` Tailwind tokens), and swapped the four inlined `rgb()` literals in `.article-prose a` to `var(...)`. Scoped to `.article-prose` (only consumer); promote to `:root` if a non-prose surface ever needs the link colour.

### J. Coda 60ch / 681px alignment (shipped — was a carried follow-up)

[`app/(main)/posts/[id]/page.tsx`](app/(main)/posts/[id]/page.tsx) + [`app/(main)/posts/preview/[id]/page.tsx`](app/(main)/posts/preview/[id]/page.tsx): the four coda components (`AuthorStrap`, `SubscribeForm`, `ReadNext`, `FeedbackForm`) are wrapped in one `<div className="mx-auto w-full max-w-[681px] space-y-8 md:space-y-12">` so their hairlines align with the prose column above. **681px, not `60ch`**: prose computes `60ch` in the `prose-lg` (18px) context → 681.3px; the chrome wrapper has no prose context, so `60ch` would resolve against 16px and land ~75px narrower. One page-level wrapper = one source of truth for both routes.

---

## Article-page anatomy (current state — for the next tweak session)

The reading column is **60ch / 681px**, centred. Top-to-bottom on `/posts/[id]`:

```
PostHero            kicker-row [pillar label ←→ Week N gutter] → length-responsive Lora H1
  └─ Byline         Zone A: avatar + name(575) + Lora-italic credential
                    ── navy-frame hairline ──
                    Zone B: date · read-time (navy-tone 13px)  ←→  ShareRow (44→36)
.article-prose      Inter 18px body; strong=575; em=Inter italic 450; links=navy.bright + 1.6px border
  (left rail: PostTOC at lg+ — "In this article", active=navy/575)
── coda wrapper (max-w-[681px]) ──
  AuthorStrap       duotone-navy portrait 128px + bio (no share block anymore)
  SubscribeForm     weekly copy: "Subscribe to Weekly Adamastor"
  ReadNext          "More opinion" cards
  FeedbackForm      "Reader notes"
```

Key tokens in play (full table in `docs/typography.md`): `navy #104357` (titles/body/byline-name), `navy.bright #1C6EB4` (inline links + Weekly kicker), `navy.bright-deep #0F5091` (link hover), `navy.tone #4D7689` (article secondary/credential/dateline), `navy.tint #A7E1FC` (blockquote hairline, name-hover underline, focus), `navy.frame #E8F0F4` (hairlines), `navy.veil` (hover bg), `orange.hue #E05E00` (Opinion kicker). Dark: `cyan.glow` (bright analogue), `cyan.lifted` (body), `cyan.dim` (secondary).

H1 sizing in `PostHero` is **length-responsive**: ≤45 chars → `text-5xl`, ≤70 → `2.5rem`, 71+ → `2rem` (thresholds are best-guess — tune as titles accrue).

---

## Open follow-ups (carried forward)

### Article-typography (the active thread)

- **Editor `@tiptap/extension-typography` pass** (~5 lines) — so Carlos sees curly quotes / em-dash / ellipsis *as he types*. Renderer pass (H above) already covers historical content; this closes the editor/rendered gap for new writing.
- **Editor vs rendered styling divergence** — the TipTap editor renders body with default `.prose prose-lg`, **not** `.article-prose`. Carlos writes against one style, publishes another. Closing it = apply a subset of `.article-prose` rules to the editor content area.
- **Code styling (`<code>` + `<pre>`) — deferred.** Not used in published articles today. Revisit for a technical-deep-dive or LisboaJS piece: Inconsolata against navy prose, navy-tint bg, padding, `<pre>` scroll.
- **Threshold calibration for length-responsive H1** — 45 / 70 chars are best-guess.
- **Body H1 content cleanup** — specimen has a stored `<h1>` paste artifact; CSS collapses it visually but the HTML is semantically wrong. One-time TipTap JSON migration.
- **`orange-hue` text contrast** at small kicker sizes — unverified at AA Normal (now mostly 12px, but sidebar chrome still 10–11px).

### Platform / operations (carried for several handoffs)

- **SSL 526 on `www.adamastor.blog`** (P0).
- **`authors.role` column** — Opinion byline credential is derived from `authors.bio` first sentence via regex; a dedicated column would replace the heuristic.
- **Lighthouse baseline** against `next build && next start`.
- **`/llms.txt`** + `robots.txt` AI-bot allowlist + JSON-LD validation (Rich Results Test) + sitemap submission.
- **Kicker tracking sweep on `/events` + `/subscribe`** — both still `tracking-[0.18em]`; publication convention is now `0.14em`.
- **Other ops** — `social_links` DB rows, public calendar variant, newsletter cron + workers, email template tweaks, "unsubscribe from everything" page, dynamic OG images, PostHog event schema, white-on-gold contrast.

---

## How to resume

1. **Read this doc + [`docs/typography.md`](docs/typography.md)** — the typography doc now carries the byline strap, ShareRow, PostTOC, em, character-QA, and chrome-alignment sections with full inline rationale.
2. **Canvas posts**:
   - Specimen (Opinion register, blockquote, links, em/strong adjacency): `/posts/preview/what-76-weeks-of-writing-taught-me-about-portuguese-founders`
   - Weekly digest (emoji-led sections, two-pillar kicker, Carlos byline): `/posts/growing-up-week-20`
3. **Verify live with `mcp__Claude_Preview__preview_inspect`** to read computed styles — Malik prefers live preview over screenshots (`feedback_no_screenshots.md`). **Do not call `preview_screenshot`.**
4. **Update `docs/typography.md` alongside each code change** — don't let the doc drift. Don't auto-rewrite `docs/design-system.md` to reconcile conflicts; surface options and ask (`feedback_design_system_changes.md`) — though Malik approved this session's design-system edits explicitly.
5. **Likely next tweaks** (Malik's words: "tweak some elements inside the article pages"): the byline strap zones, PostTOC, the coda wrapper, or the pending editor-side smart-typography extension are all live surfaces.

---

## Push

This session is committed as `ea912c8`. Branch is **65 commits ahead of `origin/main`**; **not yet pushed**.

Before pushing:

- `pnpm test` — covers `normalize-typography.test.ts` (rules + marks/code-skip).
- `pnpm typecheck` — pre-existing error in `lib/posts/related.ts:38` is unrelated; this session is type-clean.
- `pnpm build` — verify the new normaliser route + the `getFeedCardLabel` rename compile (confirm **no dangling `getKickerLabel`** references — there were none at handoff time).
- **Manual smoke**:
  - `/posts/growing-up-week-20` — Weekly: navy.bright kicker + "Week N" right gutter, emoji-led `<ul>`, two-zone byline with share at top, character-QA (curly quotes / em-dash now rendered).
  - `/posts/preview/what-76-weeks-...founders` — Opinion: orange kicker, byline credential in Lora italic, navy.bright links, em=Inter italic 450 vs strong=575.
  - Coda hairlines (`AuthorStrap` / `SubscribeForm` / `ReadNext` / `FeedbackForm`) align edge-to-edge with the prose column (681px).
  - PostTOC at `lg:`+ reads "In this article"; active item is navy/575 with the filled-in hairline.
- **Reminder**: per Malik's global config, **no `Co-Authored-By: Claude` trailer** on commits and **no "Generated with Claude Code"** footer on any PR.
