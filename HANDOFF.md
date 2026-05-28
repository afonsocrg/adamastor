# Hand-off — 2026-05-28 (evening): typography deep-audit, paused mid-list

A long, deliberate session walking through the post page's typography element by element, with live measurements via the browser preview tools. We paused mid-audit (7 of ~15 items shipped); tomorrow's session resumes the list from where we stopped.

The canonical typography reference now lives in [`docs/typography.md`](docs/typography.md) — written this session as the authoritative anchor going forward. **`docs/design-system.md`'s typography section is now legacy** and must be migrated or replaced (see "Open follow-ups" below).

---

## What landed this session

### New documentation

- **`docs/typography.md`** — canonical type system, decisions, rationale. Replaces the typography section of design-system.md as the authoritative source. Includes the open follow-ups from the audit so tomorrow can pick up cleanly.

- **Cross-references** added to key files pointing at the new doc:
  - `styles/prosemirror.css` (top of file)
  - `styles/fonts.ts` (in the existing JSDoc block)
  - `components/tailwind/post-preview.tsx`
  - `app/(main)/posts/[id]/PostHero.tsx`
  - `components/tailwind/extensions.ts`
  - `components/tailwind/slash-command.tsx`

### Typography changes shipped

| # | Change | Files |
|---|---|---|
| 1 | **Body H1 collapsed to H2 styling** (graceful degradation for editor accidents) | `styles/prosemirror.css` |
| 2 | **Body H2 weight 600 → 700**, then **size bumped 22/24px → 24/28px** | `styles/prosemirror.css` |
| 3 | **Body H3 size bumped 17/18px → 19/20px** (weight stays 600) | `styles/prosemirror.css` |
| 4 | **Strong weight 600 → 575** (variable font; lands between Medium and SemiBold) | `styles/prosemirror.css` |
| 5 | **Heading > strong inherit guard** — strong inside an h1/h2/h3 inherits the heading's weight, preventing visible weight downshifts from editor-bolded single characters | `styles/prosemirror.css` |
| 6 | **Lora 400 italic** loaded as a separate `--font-lora-italic` (was missing; blockquote pull-outs were rendering Lora Bold Italic 700 instead of intended 400 italic) | `styles/fonts.ts`, `app/layout.tsx`, `styles/prosemirror.css` |
| 7 | **Explicit `font-bold` on the three Lora-italic strap surfaces** (navbar strapline, footer tagline, /about hero strapline) — closes the weight-pooling regression caused by adding the 400 italic | `components/navbar.tsx`, `app/(main)/layout.tsx`, `app/(main)/about/page.tsx` |
| 8 | **Kicker tracking unified at `tracking-[0.14em]`** (was a mix of 0.12/0.14/0.18em) across the post page, homepage, and `/about` | 9 component files |
| 9 | **Apostrophe sweep** — curly U+2019 in all user-facing strings on `/` and `/posts/[id]` | `Masthead.tsx`, `SubscribeForm.tsx`, `feedbackForm.tsx`, `ShareRow.tsx`, homepage JSON-LD |
| 10 | **Prose measure narrowed 68ch → 66ch → 60ch** (final: 60ch ≈ 681px at Inter 18px) | `components/tailwind/post-preview.tsx` |
| 11 | **Header ↔ prose alignment** — `PostHero` constrained to `max-w-[60ch] mx-auto text-lg` so the kicker, H1, and byline share the prose's left edge | `app/(main)/posts/[id]/PostHero.tsx` |
| 12 | **H1 length-responsive sizing** — desktop tiering 48/40/32px at 45/70-char thresholds, mobile stays 31px | `app/(main)/posts/[id]/PostHero.tsx` |
| 13 | **Editor schema restriction** — `heading: { levels: [2, 3] }` prevents new H1 nodes from any source | `components/tailwind/extensions.ts` |
| 14 | **Slash menu + bubble selector** — H1 option removed; remaining options relabeled "Heading 1" → `<h2>`, "Heading 2" → `<h3>` so Carlos's mental model maps to real elements | `components/tailwind/slash-command.tsx`, `components/tailwind/selectors/node-selector.tsx` |
| 15 | **Paste-time H1 → H2 transform** in `transformPastedHTML` so pastes from rendered blogs / Google Docs / Notion don't bring a body `<h1>` along | `components/tailwind/rich-text-editor.tsx` |
| 16 | **Navbar masthead row padding** — `pb-3 md:pb-8` (was `pb-3`) for editorial breathing room above the ARTICLES/EVENTS section nav on desktop | `components/navbar.tsx` |
| 17 | **/about kicker tracking** unified to 0.14em via the `sectionLabel` constant | `app/(main)/about/page.tsx` |

### Infrastructure also shipped this session (typography-adjacent)

| Change | Files |
|---|---|
| **`/posts/preview/[id]` route** — fixes the draft-preview 404 bug (the public `/posts/[id]` route uses `createPublicClient()` which RLS-filters drafts). The new preview route uses cookie-auth + service-role bypass + `force-dynamic` + noindex, and renders the same component tree as the public page. Dashboard "Preview" link updated to use it. | `app/(main)/posts/preview/[id]/page.tsx`, `app/(dashboard)/dashboard/posts/PostAction.tsx` |
| **Typography specimen post** — created (and lives in the DB under slug `what-76-weeks-of-writing-taught-me-about-portuguese-founders`). Authored to exercise every typographic element naturally; used throughout the session as the canonical lens for typography decisions. | DB only — content lives in `posts.content` |

---

## Where the audit stopped

This is the resumption list for tomorrow's session. Items ticked are shipped; un-ticked items are still pending.

```
✓ Body H1 → H2 collapse
✓ Body H2 (24/28px, weight 700)
✓ Body H3 (19/20px, weight 600)
✓ Strong (weight 575)
✓ Strong-inside-heading guard
✓ Editor: H1 hidden + paste transform
✓ Prose width (60ch)
✓ Header ↔ prose alignment
✓ H1 length-responsive sizing (48/40/32px tiers)
□ Bulleted list + nested list rendering
□ Ordered list with multi-sentence items
□ Inline emphasis adjacency (bold + italic in adjacent paragraphs)
□ Blockquote — pick a winner from A/D/E/F variants and lock it in
□ Inline `code` styling (Inconsolata against navy prose)
□ Multi-line code block styling (the dark `pre` block)
□ Inline links + long URL wrap behavior
□ Em-dashes, ellipses, curly quotes — character QA against the specimen
□ Post-prose chrome alignment (AuthorStrap / SubscribeForm / ReadNext / FeedbackForm at full body-column width, not 60ch — needs per-component judgment)
```

The specimen post at `/posts/preview/what-76-weeks-of-writing-taught-me-about-portuguese-founders` exercises all of these. Use it as the audit canvas — change the CSS, refresh, re-inspect.

---

## Open follow-ups (carried forward)

### From the typography audit specifically

1. **`docs/design-system.md` migration.** The typography section of design-system.md is now legacy. Pick one of:
   - **A. Replace** the typography section in design-system.md with a pointer ("Typography lives in `docs/typography.md`") and delete the legacy content. Cleanest.
   - **B. Keep both**, but add a banner at the top of design-system.md's typography section saying "OUTDATED — see `docs/typography.md`". Lower-risk if someone else is still consuming design-system.md.
   - **C. Migrate** the still-relevant non-typography content out of design-system.md's typography section (color tokens, allocation rules), leaving only typography-specific stuff to delete.

   Per Malik's preference (don't auto-update design-system.md to reconcile code/doc conflicts; surface options first), this is left for the next session to decide.

2. **Threshold calibration for length-responsive H1.** 45 and 70 chars are best-guess thresholds. As more articles get written, watch for titles that visually want a different tier and nudge the thresholds — don't add new tiers.

3. **Kicker tracking sweep on `/events` and `/subscribe`.** Those two pages still use `tracking-[0.18em]` for kickers. Publication-wide convention is now 0.14em; sweeping them brings consistency. Out of scope for the typography audit (which is post-page-scoped) but worth doing.

4. **Body H1 content cleanup.** The specimen post has a stored `<h1>` in its TipTap JSON (Carlos's "title in body" paste artifact). CSS collapses it visually but the HTML stays semantically wrong. A one-time migration pass — find every post whose `content` JSON contains an h1 node, rewrite to h2 — would clean up the semantics. Worth doing once design-system.md migration is decided, since both touch stored content.

5. **Editor styling matches rendered styling.** The TipTap editor renders body content with default `.prose prose-lg`, not `.article-prose`. Carlos sees one thing while writing and a different thing when published. Applying a subset of `.article-prose` rules to the editor's content area would close the gap — important UX once the publication has more authors than Carlos.

### Older threads still open (carried from prior handoffs)

- **Blockquote variant decision** — `QuoteVariantPicker` is mounted on every post page. Pick a variant (A / D / E / F), promote it to unscoped `.article-prose blockquote`, delete the picker + the three unchosen variants. **Must remove before pushing to production.** This is also item 4 on the audit resumption list.

- **`authors.role` column.** Opinion byline role is derived from `authors.bio` first sentence via regex — uneven length. Dedicated column would replace the heuristic.

- **Lighthouse baseline.** Run against `next build && next start` for objective SEO/perf score.

- **`/llms.txt`** + `robots.txt` AI bot allowlist check + JSON-LD validation against Rich Results Test + sitemap submission.

- **`orange-hue` text contrast** at small kicker sizes (10–11px) — unverified at AA Normal.

- **SSL 526 on `www.adamastor.blog`** (P0, four handoffs ago).

- **Other operations items** carried from prior handoff: `social_links` DB rows, public calendar variant, newsletter cron + workers, email template tweaks, "unsubscribe from everything" page, dynamic OG images, PostHog event schema, white-on-gold contrast.

---

## How to resume

1. **Read this doc + `docs/typography.md`** to load context.
2. **Open the specimen post**: `http://localhost:3000/posts/preview/what-76-weeks-of-writing-taught-me-about-portuguese-founders`. It exercises every remaining audit element.
3. **Pick the next item** from the un-ticked list above. Suggested order is roughly visual-impact-descending: lists → blockquote variant → code → inline links. Em-dash/ellipsis/curly-quote QA can be last (mostly a verification pass).
4. **Use `mcp__Claude_Preview__preview_inspect`** to read computed styles live — cheaper and more accurate than screenshots for typography work.
5. **Update `docs/typography.md`** alongside each code change. Don't let the doc drift again.

---

## Push reminder

This session's changes are unpushed. Before pushing:

- `pnpm typecheck` — the pre-existing error in `lib/posts/related.ts:38` is unrelated; everything from this session is type-clean.
- `pnpm build` — verify the new preview route, the editor restrictions, and the PostHero conditional className all compile cleanly.
- **Manual smoke**:
  - `/posts/preview/[any-draft-slug]` should render the draft with the "Preview mode" banner (logged in only; anonymous = redirect to /login).
  - `/posts/[any-published-slug]` should render exactly as before with the new typography stack.
  - `/posts/founder-vs-reality-fit-week-21` — the article that surfaced the H2/strong hierarchy issue. Should now read with clear H2 dominance over bold news-item lead-ins.
  - Editor `/`: type `/` in the body, confirm only "Heading 1" and "Heading 2" appear (no Heading 3 option — that's `<h3>`; no H1 option at all).
  - Paste `# Some Title` from a markdown source into the editor — should land as `<h2>`, not `<h1>`.
- **Still don't push to prod until `QuoteVariantPicker` is removed** — see open threads.
