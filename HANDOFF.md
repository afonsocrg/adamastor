# Hand-off — 2026-05-29: typography audit pass 2 (lists, blockquote, links, emoji-list transform)

Continuation of the typography deep-audit from 2026-05-28. Resumed from the un-ticked items in the prior handoff's list and closed five of them (lists, blockquote variant, links, emoji-list section transform, font-stack cleanup). Three audit items remain pending; one was deferred until needed.

Everything in this session lives in commit `5039496` (single squash-able commit for the whole pass). Branch is **63 commits ahead of `origin/main`**; nothing pushed.

The canonical typography reference is still [`docs/typography.md`](docs/typography.md) — extended this session for everything shipped + deferred. [`docs/design-system.md`](docs/design-system.md) was already migrated to a pointer in the prior session; the typography pointer paragraph was extended to mention this session's additions. [`docs/inspiration-guardian.md`](docs/inspiration-guardian.md) was added (the Guardian inspiration doc that informed the blockquote + link decisions).

---

## What landed this session

### 1. List rhythm — tightened to 0.6em (per Butterick)

Walked through the bulleted/ordered list audit. Found three stale TipTap-injected classes (`leading-3` on `<ul>`/`<ol>`, `leading-normal` on `<li>`, `tight` marker) and the `-mt-2` / `-mb-2` negative-margin compression that was producing 16px item gaps.

Diagnosis (Butterick): list items are a coordinated set, not a sequence of standalone paragraphs. If item spacing equals body paragraph spacing, the "list-ness" signal collapses. The fix: items should sit **tighter** than body paragraphs.

Shipped: `0.6em` (~11px) between items, vs body paragraphs at ~22-24px. Asymmetric and intentional. Implementation via explicit CSS rule in [`styles/prosemirror.css`](styles/prosemirror.css), `li > p` margin reset to suppress TipTap's paragraph-in-listItem wrapping. Stale classes removed from [`components/tailwind/extensions.ts`](components/tailwind/extensions.ts).

### 2. Weekly emoji-led sections — render-time transform

The Adamastor Weekly has four recurring sections written as emoji-prefixed paragraphs (`🔷 Highlights`, `👏 Congrats`, `📚🎧🎥 Read/Listen/Watch`, `💡 Events`). They were rendering as standalone paragraphs at body-paragraph rhythm, missing list semantics and the new list typography.

**Decision arc** (worth re-reading if revisiting):
- First considered: rewrite source content to be real lists. Rejected — Carlos has been writing the same pattern for ~10 years; behaviour change is hard, historical content already shipped.
- First built: strip emoji + inject text kickers ("READ —" / "LISTEN —" / "WATCH —"). Rejected by Malik — text kickers don't scan pre-attentively the way emoji icons do.
- Final design: wrap consecutive emoji-paragraphs into `<ul class="emoji-list">` at render time, **preserve the emoji** as the visible bullet, suppress the default disc via CSS. Carlos keeps writing his pattern; readers get proper lists with emoji-as-bullet plus all the list typography.

Implementation:
- [`lib/posts/normalize-emoji-lists.ts`](lib/posts/normalize-emoji-lists.ts) — pure JSON transform walks `doc.content`, groups consecutive emoji-paragraphs into a `bulletList` node tagged `attrs.class = "emoji-list"`.
- [`components/tailwind/extensions.ts`](components/tailwind/extensions.ts) — new `BulletListClassAttribute` global-attributes extension lets the `class` attr reach the DOM through TipTap's strict schema.
- [`components/tailwind/post-preview.tsx`](components/tailwind/post-preview.tsx) — calls the normaliser before passing initialContent to RichTextEditor.
- [`styles/prosemirror.css`](styles/prosemirror.css) — `.article-prose ul.emoji-list` rules: `list-style: none`, hanging indent via `padding-left: 1.75em; text-indent: -1.75em` so the emoji sits at the column edge and wrap lines align below the text.

Source content in the DB is **never modified**. Transform runs only in `PostPreview` (both public route and preview route).

There's also a recommended-pattern note in `docs/typography.md` for Carlos's future writing: move the emoji to the H2 and use a clean bulleted list underneath (one section emoji vs per-item emoji). The transform keeps supporting the old pattern indefinitely.

### 3. Blockquote — final design picked

A long picker exploration through 6 variants (A/D/E/F shipped from prior session + G/H added this session). Key reframing: per the Guardian inspiration doc, pull-quote ≠ blockquote — different elements, different patterns. The "Quote of the Week" in the Weekly digest is structurally a pull-quote, but our font stack only has Lora italic (variable) + Lora 700 normal/italic. A "pure Guardian pull-quote" (Lora 400 regular, non-italic) would need a new font load.

Built G (Guardian-pure Lora 400 normal + glyph above) and H (Lora 700 bold + glyph above) alongside the existing variants. **Malik picked D** — Lora italic with a navy-tint hairline — and tweaked it twice:
- Italic weight bumped to **475** (variable axis, between default 400 and 500).
- Hairline thickness **4px**, color `navy-tint`, extended to **full height** of the citation (covers attribution paragraph too, brackets the whole block as one unit).

Removed: `QuoteVariantPicker.tsx`, all `.quote-a` / `.quote-d` / `.quote-e` / `.quote-f` / `.quote-g` / `.quote-h` scoped CSS, the `--font-lora-regular` load (G's only consumer).

`loraItalic` in [`styles/fonts.ts`](styles/fonts.ts) was changed from a discrete weight-400 load to a **variable font load** (weight omitted), so the 475 weight is interpolated on the variable axis. Smaller bundle than loading 400 + 500 as discrete files.

One content-side wrinkle fixed: the attribution rule (`::before { content: "— " }`) was injecting an em-dash before Carlos's source `— Catarina M.` line, producing `— — Catarina M.`. Removed the CSS injection — Carlos's source convention (leading em-dash in attribution) is authoritative. Cost: the orange-hue accent on the em-dash is gone; can be restored later with a render-time wrap if it matters.

### 4. Inline links — pillar-coloured (Guardian-true)

Started with a comparison picker (A: text-decoration with skip-ink, B: border-bottom Guardian-style). Both shipped at 1px navy-tint with two-axis hover.

Malik's feedback: *"B is the winner but it doesn't look like a clickable URL. A also doesn't."* The diagnosis: both variants kept link colour = body colour (navy), so the only affordance was the line. Per the Guardian doc principle: *"Link colour is pillar-coloured. News links red, Sport blue, Culture brown. Even a one-word link reinforces section identity."*

Built a second comparison: **distinct link colour (Guardian-true)** vs **stay navy + louder underline (closer to original)**. Malik picked the distinct-colour variant.

Final shipped:
- New palette token **`navy.bright`** = `#1C6EB4` (saturated mid-blue, higher chroma than the rest of the navy ramp, but stays in the navy neighbourhood)
- Hover token **`navy.bright-deep`** = `#0F5091` (deepened)
- `border-bottom: 1.6px solid navy.bright` at rest (browser subpixel-rounds to 1.5px at 2× DPI; the source value preserves intent)
- Hover: colour deepens to `navy.bright-deep` AND border thickens to 2px (two-axis)
- Dark mode: link colour shifts to `cyan-glow` (the navy.bright analogue)
- `overflow-wrap: anywhere` so raw URLs wrap inside the 60ch column

Palette tokens are wired into [`tailwind.config.ts`](tailwind.config.ts) (sortable as `navy.bright` / `navy.bright-deep`) and described in [`docs/design-system.md`](docs/design-system.md) under the Navy family with their OKLCH approximations and roles. The link colour was also added to the typography color table in `typography.md`.

`QuoteVariantPicker` deleted; `LinkVariantPicker` also created mid-session and deleted at the end.

### 5. Other things shipped

- [`docs/design-system.md`](docs/design-system.md) typography pointer paragraph extended to mention this session's additions; navy table updated with `navy.bright` + `navy.bright-deep` rows in a new "Saturated zone — distinct higher chroma (link colour)" sub-section; navy intro + navy-tint role refined; color usage rule #2 updated to remove "underline decorations" from navy-tint's role list.
- [`docs/typography.md`](docs/typography.md) — entire doc reviewed and updated. Color table refreshed. Audit progress section reflects what shipped + what's deferred. Code styling deferred until needed.
- [`docs/inspiration-guardian.md`](docs/inspiration-guardian.md) committed (was untracked).

---

## Where the audit stands now

```
✓ Bulleted list + nested list rendering
✓ Ordered list with multi-sentence items
✓ Blockquote variant pick + cleanup
✓ Inline link refresh (navy.bright)
✓ Emoji-led Weekly section transform (bonus)
□ Inline emphasis adjacency (bold + italic in adjacent paragraphs) — not yet started
□ Em-dash / ellipsis / curly-quote character QA — planned as renderer pass + editor Typography extension
□ Post-prose chrome alignment (AuthorStrap / SubscribeForm / ReadNext / FeedbackForm at 60ch) — not yet started
□ navy.bright literal cleanup in prosemirror.css — define CSS custom property, swap two rgb literals
~ Inline `<code>` and `<pre>` block styling — DEFERRED, not yet used in published articles
```

---

## Open follow-ups (carried forward)

### From the typography audit specifically

1. **Inline emphasis adjacency.** Audit how `<strong>` (575 weight) and `<em>` (Lora italic? or Inter italic?) read when stacked in adjacent paragraphs. Likely a small visual pass on the specimen post or a new test paragraph.

2. **Em-dash / ellipsis / curly-quote character normalisation.** Two-layer:
   - **Renderer pass** (~40 lines, mirrors `lib/posts/normalize-emoji-lists.ts`): walks TipTap JSON in `PostPreview`, applies safe substitutions (straight quotes → curly, `--` → em-dash, `...` → ellipsis). Fixes *all historical content* immediately. Safe substitutions only — defer ` - ` → em-dash (ambiguous with compound words) and `1-10` → en-dash (needs number-range detection).
   - **Editor pass**: wire TipTap's `@tiptap/extension-typography` (~5 lines) so Carlos sees smart characters as he types in the editor.

3. **Post-prose chrome alignment (60ch).** AuthorStrap / SubscribeForm / ReadNext / FeedbackForm currently sit at the full body column width (768px), not the 60ch reading column the prose body uses. Each has its own internal layout (AuthorStrap = photo+text flex, SubscribeForm = form fields, etc.), so a blanket 60ch constraint isn't safe — per-component judgment needed. Biggest remaining audit chunk.

4. **navy.bright literal cleanup in prosemirror.css.** The link colour `rgb(28, 110, 180)` and hover `rgb(15, 80, 145)` are inlined twice in `.article-prose a`. Now that the Tailwind tokens exist, define matching CSS custom properties in `styles/globals.css` (or similar) and swap. Single source of truth.

5. **Code styling (deferred).** Inline `<code>` and `<pre>` blocks. Carlos doesn't use code samples in published articles today. Revisit when an article needs it (likely a technical-deep-dive piece or anything in LisboaJS). At that point: Inconsolata against navy prose, navy-tint background, padding, scroll behaviour for `<pre>`.

### From the previous handoff (still open)

- **`authors.role` column.** Opinion byline role is derived from `authors.bio` first sentence via regex — uneven length. Dedicated column would replace the heuristic.
- **Lighthouse baseline.** Run against `next build && next start` for objective SEO/perf score.
- **`/llms.txt`** + `robots.txt` AI bot allowlist check + JSON-LD validation against Rich Results Test + sitemap submission.
- **`orange-hue` text contrast** at small kicker sizes (10–11px) — unverified at AA Normal.
- **SSL 526 on `www.adamastor.blog`** (P0, carried for several handoffs).
- **Threshold calibration for length-responsive H1** — 45 and 70 chars are best-guess; tune as more titles appear.
- **Kicker tracking sweep on `/events` and `/subscribe`** — both still use `tracking-[0.18em]`; publication-wide convention is now 0.14em.
- **Body H1 content cleanup in stored content** — specimen has stored `<h1>` from a paste artifact; CSS collapses visually but HTML is semantically wrong. One-time TipTap JSON migration.
- **Editor styling matches rendered styling** — TipTap editor uses default `.prose prose-lg`, not `.article-prose`. Carlos sees one thing while writing, another when published.
- **Other operations items carried** — `social_links` DB rows, public calendar variant, newsletter cron + workers, email template tweaks, "unsubscribe from everything" page, dynamic OG images, PostHog event schema, white-on-gold contrast.

---

## How to resume

1. **Read this doc + `docs/typography.md`** to load context. The typography doc covers fonts, type stack, lists, blockquote, links, character QA conventions, the Weekly emoji-led sections, palette, and open follow-ups. Most decisions have inline justification.
2. **Open the canvas**: the specimen post lives at `/posts/preview/what-76-weeks-of-writing-taught-me-about-portuguese-founders`. The Weekly digest test post at `/posts/growing-up-week-20` exercises the emoji-led sections + multi-paragraph blockquote.
3. **Pick the next item** from "Where the audit stands now" above. Suggested order: **#2 (character QA renderer pass)** is the highest-impact remaining item — fixes a publication-wide quality issue with ~40 lines. Then **#1 (emphasis adjacency)** as a quick visual pass. Then **#3 (post-prose chrome)** as the biggest chunk. **#4 (navy.bright literal cleanup)** can slot in anywhere as a 5-minute tidy.
4. **Use `mcp__Claude_Preview__preview_inspect`** to read computed styles live — cheaper and more accurate than screenshots for typography work. Malik prefers live preview over screenshots (`feedback_no_screenshots.md` memory).
5. **Update `docs/typography.md`** alongside each code change. Don't let the doc drift.

---

## Push reminder

Branch is **63 commits ahead of `origin/main`**. Before pushing:

- `pnpm typecheck` — the pre-existing error in `lib/posts/related.ts:38` is unrelated; everything from this session is type-clean.
- `pnpm build` — verify the new normaliser route, the link styling, the BulletListClassAttribute extension, and the variable Lora font load all compile cleanly.
- **Manual smoke**:
  - `/posts/preview/[any-draft-slug]` should render the draft with the "Preview mode" banner.
  - `/posts/[any-published-slug]` should render with the new typography (italic 475 blockquote, navy.bright links, emoji-led lists).
  - **`/posts/growing-up-week-20`** — the Weekly digest that exercises the emoji-list transform and the blockquote. Should see proper `<ul>` with emoji-as-bullet across all four sections.
  - **`/posts/preview/what-76-weeks-of-writing-taught-me-about-portuguese-founders`** — specimen for the blockquote (single em-dash on attribution) and the link colour.
  - Editor `/` slash menu: confirm only "Heading 1" and "Heading 2" appear (mapping to `<h2>` and `<h3>` respectively, no `<h1>` option).
  - Paste `# Some Title` from a markdown source into the editor — should land as `<h2>`, not `<h1>` (paste transform from prior session).
- **Source content with straight quotes still renders as straight quotes** — character QA renderer pass is not yet shipped. Don't be surprised by `"`, `'`, `--` on rendered articles until #2 above is done.
