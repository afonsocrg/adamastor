# Typography (Adamastor)

Canonical typography reference for Adamastor. Where this conflicts with `docs/design-system.md`, **this doc wins** — design-system.md's typography section reflects an earlier sweep and is being progressively migrated here.

Adamastor is a publication first, a product second. Typography is brand-load-bearing — it does more work than any other design element to signal what we are. This doc exists so the type system has a single anchor that the rest of the brand can be designed around, not the other way round.

## Type system

### Loaded fonts

Configured in [`styles/fonts.ts`](../styles/fonts.ts), wired into `<html>` via CSS variables in [`app/layout.tsx`](../app/layout.tsx).

| Family | Weights / styles loaded | CSS variable | Role |
|---|---|---|---|
| **Inter** | Variable font, all weights 100–900, normal | `--font-inter` | Body, UI, all sans-serif type. The publication's default voice. |
| **Lora Bold** | 700 normal + 700 italic | `--font-lora-bold` | Editorial display. Page H1, navbar strapline, footer tagline, module headings. |
| **Lora Italic** | 400 italic only | `--font-lora-italic` | Blockquote pull-out body. Separate from Lora Bold to avoid weight-pool merging (see "Lora weight pooling" below). |
| **Inconsolata** | 400 + 700 (separate calls) | `--font-inconsolata`, `--font-inconsolata-bold` | Code blocks, inline `code`, technical content. |

#### Lora weight pooling — the trap

`next/font/google` *appears* to pool `@font-face` declarations for the same family across multiple calls. When `loraItalic` was first added alongside `loraBold`, every element using `var(--font-lora-bold)` without an explicit `font-weight` silently downshifted from 700 (the only previously-loaded weight, used by browser fallback) to the newly-available 400 italic. This caused the navbar strapline, footer tagline, and `/about` hero strapline to all visibly weaken.

**The rule that came out of that fix**: any element using `var(--font-lora-bold)` MUST also declare its `font-weight` explicitly (e.g., Tailwind's `font-bold`). Don't rely on browser fallback substitution to pick "the only loaded weight" — that fallback breaks the moment another weight enters the pool.

Same principle for inline emphasis inside headings — see "Heading > strong inherit guard" below.

### Lora is rare (design rule)

Lora is reserved for **two surfaces only**:

1. **Page H1** — the editorial moment per page. The named title.
2. **Blockquote pull-out** — Lora 400 italic, structurally distinct from heading hierarchy.

Plus two brand-strap surfaces that count as "publication voice":
- Navbar strapline ("A digital publication about all things startup in Portugal")
- Footer tagline ("Only You Know Who You Can Be")
- `/about` hero strapline ("A weekly read on Portugal's startup scene.")

Everything else uses Inter. Hierarchy below the page H1 is carried by weight + size + color + structural rules (hairlines, kickers, spacing) — **never** by switching to a serif.

**Why**: a display serif earns its power by being rare. When every heading is in Lora, contrast collapses and the editorial signal stops feeling special. Lora at sub-14px also loses serif definition and reads fuzzy — kickers and small labels stay Inter for crispness.

---

## Page chrome

### Page H1 (PostHero title)

Defined in [`app/(main)/posts/[id]/PostHero.tsx`](../app/(main)/posts/[id]/PostHero.tsx).

- **Font**: Lora Bold 700, navy
- **Mobile**: 31px (`text-[1.9375rem]`) — constant across all title lengths
- **Desktop**: length-responsive tiering:

| Title length | Desktop size | Tailwind class |
|---|---|---|
| ≤ 45 chars | 48px | `md:text-5xl` |
| 46–70 chars | 40px | `md:text-[2.5rem]` |
| 71+ chars | 32px | `md:text-[2rem]` |

The tier is computed server-side from `displayTitle.length`. Short titles get full editorial mass; long titles compress so they don't wrap past 2 lines inside the 60ch reading column. Thresholds are calibrated against actual Adamastor titles — if you find a title where the tier feels wrong, *nudge the threshold*, don't add a new tier.

- `text-wrap: balance` for balanced line breaks on multi-line titles
- `leading-tight tracking-tight`
- Lives inside the 60ch reading column (see "Header ↔ prose alignment" below)

### Kicker labels (small-caps tracked labels)

Used for: post-page kicker ("OPINION", "THE ADAMASTOR WEEKLY · WEEK 21"), section kickers in /about, Subscribe section labels, ReadNext "More opinion", AuthorStrap "About the author", Reader notes, PostTOC "Contents", masthead module headings, navbar sections (ARTICLES / EVENTS).

- **Font**: Inter SemiBold 600
- **Case**: UPPERCASE via `uppercase` utility (source text stays sentence-cased)
- **Size**: 10–12px depending on context (`text-[10px]` / `text-[11px]` / `text-xs`)
- **Color**: `text-navy-tone` (Weekly + neutral kickers), `text-orange-hue` (Opinion kickers)
- **Tracking**: `tracking-[0.14em]` — unified across the publication

**Why 0.14em (not 0.18em)**: Butterick's range for ALL CAPS is 5–12%. At 10–12px, micro-caps need more tracking for legibility, but 18% (the previous value) felt airy and didn't scale up to 14px+ cleanly. 0.14em is the unified value — already matches the date plaque pattern that was at 0.14em from earlier. The "publication voice" knob: if the brand register ever pushes toward broader caps spacing, this is where to tune.

### Navbar strapline + footer tagline + /about strapline

These three elements share a register: **Lora Bold italic, navy**.

| Element | File | Size |
|---|---|---|
| Navbar strapline | [`components/navbar.tsx`](../components/navbar.tsx) | `text-sm` |
| Footer tagline | [`app/(main)/layout.tsx`](../app/(main)/layout.tsx) | `text-base` |
| /about hero strapline | [`app/(main)/about/page.tsx`](../app/(main)/about/page.tsx) | `text-xl md:text-2xl` |

All three carry **explicit `font-bold`** (not implicit). This is the lock-in fix for the Lora weight pooling trap — see Section 1.

---

## Body typography (`.article-prose`)

Defined in [`styles/prosemirror.css`](../styles/prosemirror.css). Applied to:
- Post bodies (via `<PostPreview>` in `app/(main)/posts/[id]/page.tsx` and `app/(main)/posts/preview/[id]/page.tsx`)
- The same component would apply to any future TipTap-rendered editorial content

### Body paragraph

- **Font**: Inter Regular 400, navy
- **Mobile**: 17px (`-1px from prose-lg's 18px`)
- **Desktop**: 18px (prose-lg default)
- **Line-height**: `leading-relaxed` (~1.625)
- **Max-width**: 60ch (≈ 681px at Inter 18px) — see "Reading column"

### Strong (inline bold)

- **Weight**: **575** — between Inter Medium (500) and SemiBold (600). Inter is a variable font; 575 renders natively, no faux-bold.
- Same color, family, and size as body

**Why 575**: at the default `prose strong` weight of 600, bold lead-ins (Carlos's "**Startup Grind Lisbon Pitch Awards 2026**" pattern) created per-line density that made every line of news-item lists feel bold-heavy. Each line was visually a wall. 575 keeps the "this is important" scan cue without dominating the line, and opens a clear 125-weight gap to H2's 700.

If the brand register ever shifts toward heavier publication voice (NYT/Guardian's `strong` sits at 700), this is the dial.

### Body H1 — collapsed to H2 styling

Body H1 is **graceful-degradation territory**. The page-level H1 is the post title in `PostHero` — not in the prose body. Inside `.article-prose`, an `<h1>` is either a structural mistake or a paste artifact. Three layers prevent it from appearing:

1. **Editor schema restriction** ([`components/tailwind/extensions.ts`](../components/tailwind/extensions.ts)): StarterKit configured with `heading: { levels: [2, 3] }` — H1 cannot exist in new content.
2. **Slash + bubble menus** ([`components/tailwind/slash-command.tsx`](../components/tailwind/slash-command.tsx), [`components/tailwind/selectors/node-selector.tsx`](../components/tailwind/selectors/node-selector.tsx)): no H1 option exposed.
3. **Paste transform** ([`components/tailwind/rich-text-editor.tsx`](../components/tailwind/rich-text-editor.tsx)): `transformPastedHTML` rewrites `<h1>` → `<h2>` before TipTap parses.

For any existing posts that still have body H1 in their stored content (the typography specimen, for instance), CSS collapses them to H2 styling so they degrade gracefully — `.article-prose h1` and `.article-prose h2` share the same rule.

### Body H2 — print-magazine section break

- **Font**: Inter Bold **700**, navy
- **Mobile**: 24px (`1.5rem`)
- **Desktop**: 28px (`1.75rem`)
- **Line-height**: 1.25 (tighter at larger size)
- **Top hairline rule**: 1px `border-top: rgb(232, 240, 244)` (navy-frame) + 2rem padding-top mobile / 2.5rem desktop
- **Top margin**: 3rem mobile / 3.5rem desktop (the rule + the margin together create the section-break feel)
- **`:first-child` exception**: no rule, no padding-top, no margin-top — for articles that open with an H2

**Why weight 700 (not 600)**: H2 must clearly outrank inline `strong`. With both at 600 (the original spec), the hierarchy collapsed on Carlos's articles where H2 sits directly above bold news-item lead-ins. 700 vs 575 = 125-weight gap, plus the 6–10px size differential and the structural hairline = unambiguous heading.

### Body H3 — sub-section

- **Font**: Inter SemiBold **600**, navy
- **Mobile**: 19px (`1.1875rem`)
- **Desktop**: 20px (`1.25rem`)
- **Line-height**: 1.35
- **No rule above** (H2 has the rule; H3 integrates within H2's section)
- **Tighter top margin** than H2 (1.75rem) so it sits in clear relation to the H2 above

### Heading > strong inherit guard

```css
.article-prose h1 strong,
.article-prose h2 strong,
.article-prose h3 strong {
  font-weight: inherit;
}
```

**The bug this prevents**: editor accidents can produce `<h2><strong>H</strong>ighlights of the week</h2>` (Carlos bolded a single letter while editing). Without this guard, the `<strong>`'s weight 575 would override the heading's 700, producing a visibly lighter letter inside a heavier word — looks like a rendering bug but is actually CSS specificity working as designed.

**The rule**: inline emphasis inside a heading should always inherit the heading's weight. Emphasis-inside-heading is structurally redundant (the heading IS the emphasis), and visually destructive when the styles diverge.

### Inline links inside prose

- **Color**: navy (same as body), dark mode: cyan-lifted
- **Decoration**: `underline`, `text-decoration-color: navy-tint`, `text-decoration-thickness: 2px`, `text-underline-offset: 4px`
- **Hover**: decoration-color deepens to navy
- **Focus**: 2px navy-tint outline + 4px offset
- **`font-weight: 500`** — slightly heavier than body 400 so the link is scannable without screaming

One canonical inline-link treatment across the publication. The body color and the link color are both navy (the typography anchor), so the underline carries 100% of the affordance signal.

### Blockquote — Lora 400 italic pull-out

Currently A/B/C/D-tested via `QuoteVariantPicker` (Marginal Glyph, Indent Margin, Twin Apertures, Tactile Broadside). Once a variant is picked, the chosen rule promotes to unscoped `.article-prose blockquote` and the picker + unchosen variants get deleted.

- **Font**: Lora 400 italic (via `--font-lora-italic`, not `--font-lora-bold`)
- **Color**: navy
- **Size**: varies by variant (20–26px)

**Why the dedicated `--font-lora-italic` variable**: see "Lora weight pooling" — Lora Bold loads only weight 700; an italic 400 declaration against that variable would silently substitute up to 700 ("Lora Bold Italic" instead of the intended "Lora Regular Italic"). The dedicated 400-italic font lives under its own variable so the declared weight is the rendered weight.

---

## Reading column

### Width: 60ch at Inter 18px ≈ 681px

The reading column for `.article-prose` is `max-w-[60ch] mx-auto`, defined in [`components/tailwind/post-preview.tsx`](../components/tailwind/post-preview.tsx).

The `ch` unit resolves against the prose's font (Inter 18px via prose-lg), where each `ch` ≈ 11.34px. So 60ch ≈ 681px.

**Why 60ch**:
- Santa Maria's optimal range: 45–75 chars (66 ideal). 60 is comfortably inside.
- Butterick's sweet spot: 60–66 chars.
- Creates ~87px of internal floatation in the 768px body grid column → real breathing room from the TOC on the left.

### Header ↔ prose alignment

The kicker, H1, and byline (everything in `PostHero`) all sit inside the same 60ch reading column as the prose body. From the reader's eye, the entire article — top to bottom — is one column.

Implementation: `PostHero`'s `<header>` is `max-w-[60ch] mx-auto text-lg`.

**The `text-lg` is load-bearing**: the `ch` unit is computed from the element's own font-size. The header inherits the body default (16px), but the prose computes `ch` at 18px (prose-lg). Without setting the header's font context to 18px, `60ch` on the header would resolve ~60px narrower than on the prose — invisibly misaligned. `text-lg` (18px) pins the context. The kicker, H1, and Byline all have their own explicit `text-*` sizes that override the inherited 18px, so the only effect of `text-lg` is to standardize the `ch` calculation.

### Post-prose chrome — currently unaligned

`AuthorStrap`, `SubscribeForm`, `ReadNext`, `FeedbackForm` currently sit at the full body-column width (768px), not the 60ch reading column. **This is a known open follow-up** — see "Open follow-ups" below.

---

## Editor policy (TipTap / novel)

### Heading levels restricted to [2, 3]

Configured in [`components/tailwind/extensions.ts`](../components/tailwind/extensions.ts) via `StarterKit.configure({ heading: { levels: [2, 3] } })`. New headings — whether from the slash menu, the bubble menu, programmatic API, or paste — cannot be H1.

Existing posts with stored H1 nodes in their JSON content still load (ProseMirror enforces the schema during transactions, not during initial document load). The typography specimen and any historical content with body H1 continue to render via the CSS H1→H2 collapse.

### UI labels vs HTML elements

The editor relabels heading options so Carlos's mental model maps to "the biggest body heading I can use":

| Editor dropdown label | Generated HTML |
|---|---|
| "Heading 1" | `<h2>` |
| "Heading 2" | `<h3>` |

Defined in [`components/tailwind/slash-command.tsx`](../components/tailwind/slash-command.tsx) and [`components/tailwind/selectors/node-selector.tsx`](../components/tailwind/selectors/node-selector.tsx).

### Paste-time HTML transform

[`components/tailwind/rich-text-editor.tsx`](../components/tailwind/rich-text-editor.tsx) sets:

```js
transformPastedHTML: (html) =>
  html.replace(/<h1(\s[^>]*)?>/gi, "<h2>").replace(/<\/h1>/gi, "</h2>")
```

When Carlos pastes from a rendered blog article (or Google Docs / Notion), the `<h1>` in the source HTML is rewritten to `<h2>` *before* TipTap parses it. Belt-and-suspenders with the schema restriction — the schema would coerce H1 to paragraph (default behavior), the paste transform coerces it to H2 (better default for the context).

---

## Character QA

The renderer doesn't auto-correct typographic characters. Source text must use the real Unicode characters; ASCII fallbacks render as ugly substitutes.

| Character | Unicode | ASCII trap | Example |
|---|---|---|---|
| Right single quote / apostrophe | `’` (U+2019) | `'` | Portugal's startup scene |
| Left double quote | `“` (U+201C) | `"` | "I keep reading…" |
| Right double quote | `”` (U+201D) | `"` | …half of it." |
| Em dash | `—` (U+2014) | `--` or `—` | The ecosystem — small, scrappy |
| Ellipsis | `…` (U+2026) | `...` | I started counting, then…stopped |
| Middle dot (separator) | `·` (U+00B7) | `*` or `.` | By Carlos · May 25, 2026 |

The TipTap editor preserves whatever Carlos types or pastes. If you paste from a smart-quote-enabled source (Google Docs, NYT, most modern editors), the characters come through correctly. If you paste from a code editor or chat app that doesn't smart-quote, you'll get straight ASCII — fix at the source.

A previous sweep cleaned every straight apostrophe in hardcoded user-facing strings (Masthead, SubscribeForm, page metadata, JSON-LD descriptions, feedbackForm, ShareRow). If you add new hardcoded copy, use real Unicode characters.

---

## Color (typography-specific)

| Token | Light | Dark | Use |
|---|---|---|---|
| Body text | `navy` rgb(16, 67, 87) | `cyan-lifted` rgb(227, 242, 247) | All body type, headings, links |
| Muted body | `navy-tone` rgb(77, 118, 137) | `cyan-dim` rgb(158, 210, 225) | Kickers, secondary copy, byline tag |
| Underline accent | `navy-tint` rgb(167, 225, 252) | `cyan-glow @ 40%` | Inline link decoration at rest |
| Hairline | `navy-frame` rgb(232, 240, 244) | `cyan-glow @ 12%` | H2 top rule, section dividers |
| Opinion accent | `orange-hue` rgb(224, 94, 0) | same | Opinion kickers, arrow-tip icons |

For full color tokens (background tints, button fills, etc.), see `docs/design-system.md`.

---

## Open follow-ups

Things that came out of the typography audit but weren't shipped yet:

1. **Post-prose chrome alignment.** `AuthorStrap`, `SubscribeForm`, `ReadNext`, `FeedbackForm` sit at the full body column width (768px), not the 60ch reading column. Same misalignment as the pre-fix `PostHero` had. Each component has its own internal layout (AuthorStrap has photo+text flex, SubscribeForm has form fields), so a blanket 60ch constraint isn't safe — each needs individual review.

2. **Editor vs rendered styling divergence.** The TipTap editor renders body content with default `.prose prose-lg` styling, *not* `.article-prose` overrides. Carlos sees one thing while writing and a different thing when published. Closing this gap means applying a subset of `.article-prose` rules to the editor's content area.

3. **Body H1 cleanup in stored content.** The typography specimen and possibly other posts have `<h1>` nodes in their stored TipTap JSON. The CSS collapses them to H2 visually, but the HTML is still semantically wrong (two H1s on the page). A one-time migration to rewrite stored H1 nodes to H2 would clean up the semantic layer.

4. **Threshold calibration for length-responsive H1.** 45 and 70 chars are best-guess thresholds. As more articles get written, watch for titles that visually want a different tier and nudge the thresholds — don't add new tiers.

5. **Kicker tracking sweep on `/events` and `/subscribe`.** These two pages still use `tracking-[0.18em]` for kickers. The publication-wide convention is now 0.14em; sweeping them brings consistency.

6. **Remaining typography audit items** (paused mid-session):
   - Bulleted list + nested list rendering
   - Ordered list with multi-sentence items
   - Inline emphasis adjacency (bold + italic in adjacent paragraphs)
   - Blockquote variant pick (A/D/E/F)
   - Inline `code` styling
   - Multi-line code block styling
   - Inline link long-URL wrap behavior
   - Em-dash / ellipsis / curly-quote character QA against the specimen

7. **`docs/design-system.md` migration.** The design-system.md typography section is the legacy spec. It still references the pre-audit values (H2 at 600, strong at 600, tracking 0.18em, H3 at body size, no length-responsive H1, etc.). Either replace it with a pointer to this doc, or copy the relevant sections back into design-system.md and delete from here. **Don't let both coexist as authoritative sources** — pick one home.

---

## How to use this doc

- **Adding a new typographic element**: read the relevant section, follow the same patterns. Reference this doc from a comment in the file you're editing.
- **Changing an existing element**: update both the code and this doc in the same change. If you're going to argue with a decision below, the comment headers in `styles/prosemirror.css` and `components/tailwind/post-preview.tsx` and `app/(main)/posts/[id]/PostHero.tsx` capture the reasoning per element — read those first.
- **Debugging a visual oddity**: most weird typography behavior in this codebase has been encountered at least once. Search this doc + the audit handoff for keywords first (e.g., "weight pooling", "ch unit", "balance").

## History

- **2026-05-27/28** — Full typography deep-audit session. Established the canonical type stack, fixed the Lora weight-pooling trap, unified kicker tracking, collapsed body H1, bumped H2 to weight 700 and 24/28px, raised H3 to 19/20px, tuned strong to 575, narrowed prose to 60ch, aligned header with prose, introduced length-responsive H1 sizing, restricted editor heading levels to [2,3], added paste transform. Audit paused mid-session at element 7/15; see HANDOFF.md for full resumption list.

Earlier typography decisions (Lora vs CalSans, Inter as body, Inconsolata for mono, the "Lora is rare" rule, blockquote variants) were established in prior sessions documented in `docs/design-system.md`.
