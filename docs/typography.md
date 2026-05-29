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
| **Lora Italic** | Variable axis 400–700 italic | `--font-lora-italic` | Blockquote body (rendered at 475); byline credential line (rendered at 400 / 14px). Two "set-apart voice" cues: quotation, and writer-self-description. Loaded as variable font so we can target weights between discrete steps. Separate from Lora Bold to avoid weight-pool merging (see "Lora weight pooling" below). |
| **Inconsolata** | 400 + 700 (separate calls) | `--font-inconsolata`, `--font-inconsolata-bold` | Code blocks, inline `code`, technical content. |

#### Lora weight pooling — the trap

`next/font/google` *appears* to pool `@font-face` declarations for the same family across multiple calls. When `loraItalic` was first added alongside `loraBold`, every element using `var(--font-lora-bold)` without an explicit `font-weight` silently downshifted from 700 (the only previously-loaded weight, used by browser fallback) to the newly-available 400 italic. This caused the navbar strapline, footer tagline, and `/about` hero strapline to all visibly weaken.

**The rule that came out of that fix**: any element using `var(--font-lora-bold)` MUST also declare its `font-weight` explicitly (e.g., Tailwind's `font-bold`). Don't rely on browser fallback substitution to pick "the only loaded weight" — that fallback breaks the moment another weight enters the pool.

Same principle for inline emphasis inside headings — see "Heading > strong inherit guard" below.

### Lora is rare (design rule)

Lora is reserved for **two surfaces only**:

1. **Page H1** — the editorial moment per page. The named title.
2. **Blockquote** — Lora italic 475 with a navy-tint hairline (see "Blockquote" section below), structurally distinct from heading hierarchy.

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

### Byline strap

Defined in [`app/(main)/posts/[id]/Byline.tsx`](../app/(main)/posts/[id]/Byline.tsx). Sits below the H1, bracketed by two `navy-frame` hairlines. **No "By" prefix.**

The strap is **two zones split by an internal hairline**, each zone holding one kind of concern. The split is the whole point: it keeps "who's speaking" from blurring into "reader tooling".

| Zone | Element | Spec |
|---|---|---|
| Strap | container | `border-y border-navy-frame` (outer hairlines); no padding on the container itself — each zone pads independently |
| **A — Author identity** | row | `flex items-start gap-4 py-5` |
| | Avatar | 56×56 (`h-14 w-14`) with initials fallback |
| | Name link | Inter **15px** (`text-[15px]`), weight **575**, `text-navy`. No underline at rest. Hover: `underline` + `decoration-navy-tint` + `decoration-2` + `underline-offset-4`. |
| | Credential | **Lora italic** (`[font-family:var(--font-lora-italic)] italic font-normal`) **14px**, `text-navy-tone`, `max-w-[44ch]`, `hyphens-manual` |
| **B — Utility bar** | row | `border-t border-navy-frame py-2.5`; `flex flex-col gap-2` → `sm:flex-row sm:items-center sm:justify-between sm:gap-0` |
| | Metadata | Date + read time, Inter **13px**, `text-navy-tone`, bullet separator. Left side. |
| | ShareRow | Right side at `sm:`+ (`-mr-2` optical pull); stacks under metadata on mobile (`-ml-2` left-aligns). |

**Why two zones, not one stacked column** (the fix that landed 2026-05-29): the avatar, name, and credential all answer *who's speaking* — that's editorial voice, set in full navy + Lora italic. The date, read-time, and share buttons are all *reader tooling* — when, how long, and how to pass it on. Mixing the two (e.g. date·read-time stacked under the credential, sharing a text column with the author photo) reads as undifferentiated generic-CMS chrome. The internal hairline + the quieter navy-tone register on Zone B is what makes the eye parse identity-block vs. utility-bar instantly. Stratechery, NYT, Guardian, The Atlantic all give the meta/share row its own lane.

**Why the credential is Lora italic, not Inter**: this is a deliberate second role for the Lora italic font, sibling to the blockquote. Both blockquote (Lora italic 475) and the byline credential (Lora italic 400) are "set-apart voice" cues — quotation and writer-self-description share a register because both are *not the body prose*. The italic at 14px also solves the previous "12px reads too small" problem: Inter 12px was the kicker register, used for prose. 14px Lora italic carries proper editorial weight.

For Weekly posts the credential is a fixed string (Carlos's role); for Opinion posts it's pulled from the first sentence of the guest author's bio. Both feed the same line. See `Byline.tsx → authorTag()`.

**Why the name weight is 575, not 600**: matches `.article-prose strong` and `PostTOC` active — same emphasis station across the publication. 600 would sit at H3 weight, which is overcommitted for a byline anchor.

**Why the name link has no underline at rest** (per Guardian doc): byline links should carry "no underline at rest, subtle colour shift from surrounding text." The shift is produced by the surrounding metadata being `navy-tone` while the name is `navy`. Hover restores the underline as the two-axis affordance.

**Distinct from body inline links** (`navy.bright` + 1.6px border-bottom): body links are pillar-coloured ("interactive register" inside prose). Byline links are chrome — quieter. Don't unify the two registers.

### ShareRow — placement in the byline utility bar

Defined in [`app/(main)/posts/[id]/ShareRow.tsx`](../app/(main)/posts/[id]/ShareRow.tsx), rendered in **Zone B of the byline strap** (top of the article), on the right of the date · read-time metadata.

Placement history: started in the byline → moved into `AuthorStrap` below the article (2026-05-29, "read → meet → share" sequence) → moved **back to the top byline** (2026-05-29, same day). The deciding factor: share affordances need to be in view *on entry* — a reader who wants to pass an article on shouldn't have to scroll to the very bottom to find the buttons. They now live with the other reader-tooling (date, read-time) in the utility bar. `AuthorStrap` no longer carries a share block.

| Element | Spec |
|---|---|
| Container | Right-aligned in Zone B at `sm:`+ via the parent's `justify-between`; stacks below metadata on mobile. |
| Buttons | 44×44 hit area at mobile, `sm:` 36×36; 16×16 icon centred; `rounded-full`; `aria-label` on every button. Hover: `bg-navy-frame` + `text-navy`. Focus-visible: `ring-2 ring-navy/40`. |

**Why share targets scale 44 → 36**: 44×44 at mobile satisfies Apple HIG / Material / WCAG 2.5.5 AAA touch standards. At `sm:`+ mouse precision makes the larger target read as wasted chrome, so it compresses to 36×36. The icon glyph stays 16×16 in both; only the surrounding hit-area scales.

**Why the share row stacks on mobile**: five 44px targets (220px) plus the date string overflow a ~343px content column. Zone B is `flex-col` on mobile (metadata, then share row beneath) and only switches to the side-by-side `justify-between` bar at `sm:`+ where the width is there.

### Kicker labels (small-caps tracked labels)

Used for: post-page kicker ("OPINION", "THE ADAMASTOR WEEKLY · WEEK 21"), section kickers in /about, Subscribe section labels, ReadNext "More opinion", AuthorStrap "About the author", Reader notes, PostTOC "In this article", masthead module headings, navbar sections (ARTICLES / EVENTS).

- **Font**: Inter SemiBold 600
- **Case**: UPPERCASE via `uppercase` utility (source text stays sentence-cased)
- **Size**: **12px (`text-xs`) is the publication default** for editorial-context kickers (post-page, AuthorStrap, Subscribe, Reader notes, ReadNext, PostTOC). 10–11px (`text-[10px]` / `text-[11px]`) remains in sidebar chrome (home sidebar, dashboard nav) where the lower information density earns a quieter scale.
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

### Em (inline italic)

- **Font**: Inter italic (stays in the body family — see "Why not Lora italic" below)
- **Weight**: **450** — slight lift from body's 400, well below `strong`'s 575. Inter variable axis, no extra load.
- Same colour, family, size, and line-height as body

**Why a 450 bump**: at body 400, Inter italic is visible but quiet — the slant carries the whole emphasis signal. A small weight lift (+50) makes the italic feel deliberate without crowding toward `strong`. Sits in the "edge of still a tint" zone (Butterick: *smallest visible increment for emphasis*). Still a 125-weight gap to `strong`'s 575, so the bold/italic distinction stays unambiguous.

**Why not Lora italic**: a serif italic against an Inter sans body would introduce a visible cross-family texture switch mid-paragraph — reads as ornament rather than emphasis on the web. Butterick's "italic sans barely stands out" rule is a print-era observation (10pt magazine bodies); at 18px on modern screens with anti-aliasing, Inter italic's slant is plenty visible. Most contemporary editorial web (Stratechery, The Verge, NYT digital, Guardian online) keeps `<em>` in the body family for the same reason. Lora is reserved for its established editorial-moment roles: headlines (Lora Bold) and blockquote (Lora italic 475).

**Adjacency note**: the design intentionally keeps emphasis single-axis from body — `<strong>` changes only weight, `<em>` changes only style (with the small 450 nudge). When a strong-led paragraph sits next to an em-led paragraph (real in the specimen post), the shared family/size/colour preserve the texture; the eye picks up the changing axis without rebuilding the rhythm.

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

### Lists (bulleted, ordered, nested)

Two project overrides shape list rendering:
1. TipTap node-class injections in [`components/tailwind/extensions.ts`](../components/tailwind/extensions.ts) — just `list-disc list-outside` / `list-decimal list-outside` (the disc/decimal style needs to be set because Tailwind's preflight resets `list-style: none` would otherwise win)
2. An explicit list-spacing rule in [`styles/prosemirror.css`](../styles/prosemirror.css) that overrides prose-lg's defaults — see below

| Property | Top-level `<ul>` / `<ol>` | Nested `<ul>` |
|---|---|---|
| Item gap | **~11px** (0.6em at 18px) | ~11px |
| Gap above list (from `<p>`) | **24px** (body-paragraph register) | – |
| Bullet / number color | `navy-tint` rgb(167, 225, 252) | inherits |
| Indent (text → text into nested) | – | **36px** (28px padding + 8px li) |
| Line-height per item | `leading-relaxed` (1.625) — same as body | same |
| Bullet position | `list-outside` | `list-outside` |

**The editorial rhythm rule** (per Butterick): list items sit **tighter** than body paragraphs because a list is a coordinated set, not a sequence of standalone thoughts. The asymmetry is the signal:

- **24px above the list** — the list-as-a-whole is distinct from the paragraph above, matching body paragraph-to-paragraph rhythm.
- **11px between items** — items breathe but visibly coordinate, signalling "these belong together."

If items spaced at the same 24px as paragraphs, the list-ness signal collapses and items read as separate paragraphs. (We shipped that briefly during the audit and caught it on a screenshot — it looked wrong because it *was* wrong.)

**Implementation gotcha — TipTap wraps li content in `<p>`**: each list item's content is a `<p>` inside the `<li>`. Without overriding `li > p { margin: 0 }`, the `<p>`'s 24px top/bottom margins stack on top of the li's margins and the list ends up at ~24px+ gaps. The rule lives in `prosemirror.css` and is documented inline there. Multi-paragraph items (rare) get `p + p { margin-top: 0.75em }` so inner-paragraph spacing returns inside the same item.

**TipTap-injected classes**: only `list-disc list-outside` and `list-decimal list-outside`. The `<li>` extension injects no class. The `tight` marker class (emitted by `tiptap-markdown`'s library default) appears on every list wrapper but no CSS targets it — harmless metadata, kept to avoid overriding a library default for no reason.

### Weekly Adamastor — emoji-led sections

The Weekly has four recurring sections that read as coordinated sets of items: **Highlights of the week** (🔷), **Congrats** (👏), **Read / Listen / Watch** (📚 / 🎧 / 🎥), and (sometimes) **Events / opportunities** (💡). Each item is written as a `<p>` prefixed with the section's emoji. **Carlos writes the same way he always has**; the renderer coerces these paragraph-runs into real bulleted lists at render time.

**The render-time transform** ([`lib/posts/normalize-emoji-lists.ts`](../lib/posts/normalize-emoji-lists.ts), called by [`components/tailwind/post-preview.tsx`](../components/tailwind/post-preview.tsx)):

1. Walks the TipTap JSON top-level
2. Detects runs of consecutive `<p>` whose first text starts with `\p{Extended_Pictographic}` (the emoji range; geometric Unicode like ◆ doesn't match)
3. Wraps each run in a `<ul>` tagged with `class="emoji-list"`
4. **Keeps the leading emoji** as the first character of each item — the emoji IS the bullet

Source content in the DB is never modified. The transform runs only inside `PostPreview` (used by both the public post route and the dashboard preview route). Carlos's editor view shows the original emoji-paragraphs; readers see the transformed lists.

**Why keep the emoji as the bullet** (rather than strip it and use the standard navy-tint disc):
- *Pre-attentive scanning*: 📚 vs 🎧 vs 🎥 is recognisable at a glance without reading. A text alternative ("READ —" / "LISTEN —" / "WATCH —") forces the reader to read each label and loses the scan affordance the icon was providing. Tested in-session and confirmed harder to scan.
- *Author intent*: Carlos has used this pattern for years and the emoji is a deliberate signal, not a typo or chat-app artifact.
- *No double-bullet*: with the emoji preserved, the default disc bullet would create a visible double marker (• 🔷 …). The CSS rule below suppresses the default for `ul.emoji-list`.

**The trade-off vs Butterick's "no emoji in publications" rule**: full-color emoji glyphs don't inherit the navy palette and read more casually than the rest of the publication. Acknowledged. The scanning win outweighs the palette consistency cost in this specific format. Future move (if needed): swap to monochrome geometric Unicode characters (◆ ▶ ♥ etc.) that inherit text color and behave as text — and update the transform to do the swap.

**Required schema extension**: TipTap's bulletList doesn't accept per-instance attributes by default. A small global-attributes extension ([`components/tailwind/extensions.ts`](../components/tailwind/extensions.ts) → `BulletListClassAttribute`) registers the `class` attribute on the bulletList schema so the transform's `attrs.class = "emoji-list"` actually renders into the DOM. Merges with StarterKit's default `list-disc list-outside` via TipTap's `mergeAttributes`, producing the final `class="list-disc list-outside emoji-list"`.

**CSS treatment** (in [`styles/prosemirror.css`](../styles/prosemirror.css)):
- `list-style: none` — suppresses the default disc bullet (emoji replaces it)
- `padding-left: 0` on the `<ul>` (no extra column indent at the wrapper)
- `padding-left: 1.75em; text-indent: -1.75em` on each `<li>` — hanging indent. First line (emoji + text) starts at column edge; wrap lines align to the padding-left position, hanging below the text, not below the emoji. 1.75em ≈ the visual width of an emoji glyph plus a single space at 18px body.

**Detection edge cases** (already handled):
- Single-emoji-paragraph runs (just one item) still become a one-item `<ul>`. Slightly redundant visually but consistent.
- H2/H3 headings that start with an emoji (e.g. `✍ Quote of the week`) are not paragraphs and are left untouched.
- Plain paragraphs without leading emoji never match and pass through unchanged.

**Going forward**: if Carlos starts using new emoji as a section marker, they Just Work — `\p{Extended_Pictographic}` covers the whole range. No code change needed unless the indent (1.75em) becomes wrong for an unusually wide glyph.

#### Recommended editorial direction — emoji on the H2, items as a clean list

The current emoji-per-item pattern is **rendered well**, but the cleanest version of the Weekly's editorial intent is **one emoji per section, on the H2**, with items underneath as a plain bulleted list. The transform keeps supporting the old pattern indefinitely; this is a *recommendation*, not a forced migration.

**Why this is better**:
- *One signal, not many*: the emoji's job is to mark "this section is Highlights / Congrats / Reads." That's a section-scoped signal, not a per-item one. Repeating the same glyph on every item dilutes its meaning — the reader sees 🔷 once and knows what list they're in; seeing it six times in a row adds noise, not information.
- *Editorial register*: section markers belong in section headings, the way newspaper standfirsts or magazine kickers carry the editorial cue. Per-item icons read as a chat-app thread (Slack, WhatsApp, email bullets). The Weekly is a publication, and publications mark sections at the section level.
- *Readability*: a clean disc-bullet list at the publication's navy-tint colour reads quieter and more uniform than a wall of repeated full-colour glyphs. Long lists especially — the Highlights section with six 🔷s in a column visually pulls toward the left margin instead of toward the text.

**Before / after** (for a future Weekly):

```
Old pattern (still supported by the transform):
  ## Highlights of the week
  🔷 NOVA Starters Academy DEMO Day, this Wednesday.
  🔷 Sunset Fado Experience at Ando Living Rooftop w/ Fiona.
  🔷 Productized Talks at Sixt this Thursday.

Recommended pattern:
  ## 🔷 Highlights of the week
  - NOVA Starters Academy DEMO Day, this Wednesday.
  - Sunset Fado Experience at Ando Living Rooftop w/ Fiona.
  - Productized Talks at Sixt this Thursday.
```

**What it costs Carlos** (~10 seconds per section):
1. Move the emoji to the H2 (cut + paste once per section, not per item).
2. Convert the items to a bulleted list (in the editor: select the lines and pick "Bulleted list" from the slash menu, or type `- ` at the start of each line — TipTap's markdown shortcut handles it).

The Read/Listen/Watch section is the one exception worth thinking about — different items in that list use *different* emoji (📚 / 🎧 / 🎥). The cleanest move is to split into three sub-sections (`## 📚 Read`, `## 🎧 Listen`, `## 🎥 Watch`), each with its own clean bulleted list. The H2 carries the type-cue per section; the items underneath stay quiet.

### Inline links inside prose

The link colour itself is the primary affordance — a distinct saturated mid-blue (**navy.bright** = `#1C6EB4`) lifts the link out of the body navy register so the colour alone reads as "interactive." Border-bottom is secondary. This follows the [Guardian doc](inspiration-guardian.md) principle that *"link colour is pillar-coloured"* — even on a single-pillar publication like Adamastor, the link colour shouldn't equal the body colour, or the affordance signal collapses.

**Design** (defined in [`styles/prosemirror.css`](../styles/prosemirror.css)):

| Property | Light mode | Dark mode |
|---|---|---|
| Link colour | `navy.bright` rgb(28, 110, 180) | `cyan-glow` rgb(76, 228, 240) |
| Underline | `border-bottom: 1.6px solid navy.bright` | `border-bottom: 1.6px solid cyan-glow` |
| Hover colour | `rgb(15, 80, 145)` — navy.bright deepened | `rgb(120, 240, 245)` — cyan-glow lifted |
| Hover underline | `border-bottom-width: 2px` (in hover colour) | same |
| Focus outline | `2px navy-tint`, 4px offset | same (navy-tint reads on dark too) |
| Weight | 500 (slight bump vs body 400 — scannable, not screaming) | 500 |
| Wrap | `overflow-wrap: anywhere` (raw URLs wrap inside the 60ch column) | same |

**Why `border-bottom` instead of `text-decoration`**: Guardian's pixel-precise approach — the line is always uniform thickness, never clipped by browser-specific underline rendering. The trade-off is no skip-ink (the line is solid through descenders); accepted as a Guardian-authentic choice.

**Why 1.6px specifically**: 1.5px reads too thin against the saturated link colour; 2px competes with body weight. 1.6px lands in between as the visible-but-not-loud sweet spot. Browser subpixel rounding may render this as 1.5px at 2× DPI; the source value preserves intent.

**Why the two-axis hover**: colour deepens AND border thickens. Two simultaneous visual changes register pre-attentively as "I'm hovering this" without needing a heavy state change. Guardian's principle.

**Palette tokens**: `navy.bright` (`#1C6EB4`) and `navy.bright-deep` (`#0F5091`) are defined in [`tailwind.config.ts`](../tailwind.config.ts) under the navy family, and mirrored as the `--prose-link` / `--prose-link-hover` CSS custom properties on `.article-prose` in [`styles/prosemirror.css`](../styles/prosemirror.css) (the only consumer today). Promote the custom properties to `:root` if a non-prose surface ever needs the link colour.

### Blockquote — Lora italic 475 with navy-tint hairline

Single styling for both inline citations (rare, inside Carlos's essay prose) AND the recurring "Quote of the Week" block in the Weekly digest. If/when those diverge structurally (a custom TipTap pull-quote node), they can split into separate treatments.

**Design** (defined in [`styles/prosemirror.css`](../styles/prosemirror.css)):

- **Font**: Lora italic at variable-axis **weight 475** (via `--font-lora-italic`, loaded as a variable font so we can target weights between the discrete 400 and 500). 475 is slightly heavier than the default 400 — more refined, more present, without becoming bold.
- **Color**: navy (`rgb(16, 67, 87)`)
- **Size**: 22px mobile / 24px desktop
- **Line-height**: 1.45
- **Letter-spacing**: -0.005em

**Chrome**: a **4px navy-tint vertical rule** at the left edge of the prose column. The rule spans the **full height** of the citation (from the top of the first quote paragraph to the bottom of the attribution) — quote + attribution read as one bracketed unit. No quote glyph, no panel; the rule is the affordance, in the publication's own accent register (same colour as list bullets and link underlines).

**Why this design** (vs explored alternatives):
- *Restrained, architectural* — reads as a marginal annotation in a long essay, the Guardian "BlockquoteBlockComponent" pattern from the [Guardian inspiration doc](inspiration-guardian.md).
- *No gutter escape* — the rule sits flush with the prose column edge at every viewport. Earlier designs that pulled the rule or a quote glyph into the left gutter collided with the article TOC on Weekly posts.
- *Quote glyph alternatives ruled out* — large display glyphs (tested with Lora 400 italic, Lora 400 normal, and Lora 700 normal at 26–32px) all felt loud against the otherwise quiet body register, and the gutter-positioned variants collided with the TOC.

**Attribution paragraph** (last child of a multi-paragraph blockquote): source content carries its own leading em-dash (Carlos's convention) — the renderer does **not** inject one via `::before`, otherwise it would double up. Rendered as small-caps Inter SemiBold 11px, `tracking-[0.14em]` (publication kicker tracking), navy-tone.

**Why the dedicated `--font-lora-italic` variable**: see "Lora weight pooling" above. Loaded as a variable font (weight omitted in `next/font/google`) so we can request any weight in the 400–700 axis — 475 is what we use; could tune up or down without loading new files.

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

### Post-prose chrome alignment

`AuthorStrap`, `SubscribeForm`, `ReadNext`, and `FeedbackForm` are wrapped at the page level in a single 681px-cap container so their hairlines and content edges align exactly with the prose column above them. Without this, each section's `border-t border-navy-frame` would extend ~43px past each side of the prose (the article container holds the body column at 48rem / 768px; prose narrows itself to 60ch / 681px), producing a visible alignment break at the coda.

**Why 681px and not `60ch`**: the `ch` unit resolves against the element's own font-size. Prose computes `60ch` inside the `prose-lg` (18px Inter) context → 681.3px. The chrome wrapper has no prose context — chrome owns its own type discipline — so `60ch` on the wrapper would resolve against the inherited 16px and land ~75px narrower than the prose. The literal 681px value pins the chrome to the prose's resolved width directly. If the prose font-size ever changes, recompute: 60 × ch-width of Inter at the new size.

**Why a single wrapper, not per-component**: the four coda components form one semantic group ("post coda") and all align to the same width. A page-level wrapper means one source of truth — if the reading column ever changes, one edit moves all four sections. Per-component widths would risk drift. The wrapper sits in [`app/(main)/posts/[id]/page.tsx`](../app/(main)/posts/[id]/page.tsx) and [`app/(main)/posts/preview/[id]/page.tsx`](../app/(main)/posts/preview/[id]/page.tsx) — both routes mirror each other so preview parity is preserved.

**Internal layouts at 681px** (audited safe):
- `AuthorStrap` — photo (128px) + 32px gap + text column (~520px). Bio already capped at 55ch internally.
- `SubscribeForm` — 2-column input grid → each input ~340px (well above usable). Heading/dek already at 55ch.
- `ReadNext` — row-based opinion cards; width-tolerant.
- `FeedbackForm` — textarea reads as more inviting at 681px than at 768px.

At tablet and below the article container is full-width anyway; the wrapper's `max-w-` doesn't apply and prose + chrome both fill the column naturally.

### PostTOC — left-rail navigation

Floats in the 12rem left column at `lg:` and above. Hidden below — small screens correctly let body lead.

| Element | Spec |
|---|---|
| Kicker "In this article" | Inter 12px / 600, uppercase, `tracking-[0.14em]`, `navy-tone` — matches the publication kicker default |
| Item (inactive) | Inter 14px / 400, `navy-tone`, line-height 1.375 (`leading-snug`) |
| Item (active) | Inter 14px / **575**, `navy`, 1px `navy` left border |
| Inactive rule | 1px `navy-frame` on the `<ol>` (the vertical hairline spanning all items) |
| Active border | 1px `navy` on the active `<a>`, overlaid on the ol's frame border via `-ml-px` |
| H3 indent | 8px (`pl-2`) — restrained per Butterick |
| Item gap | `space-y-2` (8px) |

**Why the label is "In this article" and not "Contents"**: "Contents" is the wiki/book/Notion-doc register — clinical, reference-flavored. The rest of the page's kickers ("About the author", "More opinion", "Reader notes", "Subscribe") are editorial noun-phrases addressed to the reader, matching the Guardian-inspired register. "Contents" was the odd one out. "In this article" is the serious-editorial-web convention (NYT, WaPo) and reads as the publication addressing the reader rather than describing structure to itself. Accessible name on the `<nav>` stays `aria-label="Article contents"` — terser, reads better as a landmark name to screen readers than the visible editorial label would.

**Why active weight is 575, not 600**: matches `.article-prose strong` so the page maintains one consistent emphasis ladder (body strong = TOC active). At sidebar 14px, 575 is still pre-attentive against the 400 inactive items. Previously at 600 it sat at H3 weight — overcommitted for a passive scroll indicator.

**Why the active accent stays `navy` (not `navy.bright`)**: the active state is *passive* — it tracks the reader's scroll position, the reader didn't click it. `navy` reads as "you are here" and matches the body anchor; `navy.bright` would read as "this is clickable" and pull the eye toward a discoverable link. `navy.bright` is reserved for prose inline links, where the colour is the affordance.

**Why a single hairline + per-item overlay**: the ol's `border-l border-navy-frame` provides the always-on vertical rail. Each item's `border-l` is transparent by default; on the active item it switches to `border-navy`. Because the item has `-ml-px`, its border sits exactly on top of the ol's border at the same x-coordinate — so the active accent appears to "fill in" the existing hairline rather than introducing a new line. Visual logic = clean.

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
| Body text | `navy` rgb(16, 67, 87) | `cyan-lifted` rgb(227, 242, 247) | All body type, headings |
| Muted body | `navy-tone` rgb(77, 118, 137) | `cyan-dim` rgb(158, 210, 225) | Kickers, secondary copy, byline tag |
| Link colour | `navy.bright` rgb(28, 110, 180) | `cyan-glow` rgb(76, 228, 240) | Inline link colour + border-bottom at rest |
| Link hover | `rgb(15, 80, 145)` (navy.bright deepened) | `rgb(120, 240, 245)` (cyan-glow lifted) | Inline link colour + border-bottom on hover |
| Accent (rules, bullets) | `navy-tint` rgb(167, 225, 252) | `cyan-glow @ 40%` | List bullets, blockquote hairline, focus outline |
| Hairline | `navy-frame` rgb(232, 240, 244) | `cyan-glow @ 12%` | H2 top rule, section dividers |
| Opinion accent | `orange-hue` rgb(224, 94, 0) | same | Opinion kickers, arrow-tip icons |

For full color tokens (background tints, button fills, etc.), see `docs/design-system.md`.

---

## Open follow-ups

Things that came out of the typography audit but weren't shipped yet:

1. ~~**Post-prose chrome alignment.**~~ — shipped 2026-05-29. All four chrome components (`AuthorStrap`, `SubscribeForm`, `ReadNext`, `FeedbackForm`) are now wrapped in a single `<div className="mx-auto w-full max-w-[681px] space-y-8 md:space-y-12">` inside both [`app/(main)/posts/[id]/page.tsx`](../app/(main)/posts/[id]/page.tsx) and [`app/(main)/posts/preview/[id]/page.tsx`](../app/(main)/posts/preview/[id]/page.tsx). See [Post-prose chrome alignment](#post-prose-chrome-alignment) for the rationale and the 681px math.

2. **Editor vs rendered styling divergence.** The TipTap editor renders body content with default `.prose prose-lg` styling, *not* `.article-prose` overrides. Carlos sees one thing while writing and a different thing when published. Closing this gap means applying a subset of `.article-prose` rules to the editor's content area.

3. **Body H1 cleanup in stored content.** The typography specimen and possibly other posts have `<h1>` nodes in their stored TipTap JSON. The CSS collapses them to H2 visually, but the HTML is still semantically wrong (two H1s on the page). A one-time migration to rewrite stored H1 nodes to H2 would clean up the semantic layer.

4. **Threshold calibration for length-responsive H1.** 45 and 70 chars are best-guess thresholds. As more articles get written, watch for titles that visually want a different tier and nudge the thresholds — don't add new tiers.

5. **Kicker tracking sweep on `/events` and `/subscribe`.** These two pages still use `tracking-[0.18em]` for kickers. The publication-wide convention is now 0.14em; sweeping them brings consistency.

6. **Typography audit progress** (started 2026-05-28, in progress):
   - ~~Bulleted list + nested list rendering~~ — shipped 2026-05-28 (item gap tightened to 0.6em per Butterick)
   - ~~Ordered list with multi-sentence items~~ — covered by the same list-rhythm rule
   - ~~Blockquote variant pick~~ — shipped 2026-05-28 (Lora italic 475 + 4px navy-tint full-height hairline)
   - ~~Inline link long-URL wrap behavior~~ — shipped 2026-05-28 (`overflow-wrap: anywhere`, navy.bright link colour, 1.6px border-bottom)
   - ~~Emoji-led section transform~~ — shipped 2026-05-28 (Weekly emoji-paragraph runs auto-coerce to `<ul class="emoji-list">` at render time; see "Weekly Adamastor — emoji-led sections")
   - ~~Inline emphasis adjacency (bold + italic in adjacent paragraphs)~~ — shipped 2026-05-29. Verified single-axis emphasis is the right discipline: `<strong>` = Inter 575 (weight axis), `<em>` = Inter italic 450 (style axis + slight weight lift). Kept `<em>` in the body family rather than promoting to Lora italic — cross-family mid-paragraph reads as ornament on the web. See [Em (inline italic)](#em-inline-italic).
   - ~~Em-dash / ellipsis / curly-quote character QA (renderer pass)~~ — shipped 2026-05-29; editor `@tiptap/extension-typography` pass still pending (see item #8 below)
   - **Code styling (inline `code` + multi-line `<pre>`) — deferred.** Carlos doesn't currently use code samples in published articles, so the existing `@tailwindcss/typography` defaults are acceptable. Revisit when an article needs code (likely a technical-deep-dive piece, or anything in LisboaJS). At that point: Inconsolata against navy prose, navy-tint background, padding, scroll behaviour for `<pre>`.

7. ~~**navy.bright literal cleanup in `prosemirror.css`.**~~ — shipped 2026-05-29. Defined `--prose-link` / `--prose-link-hover` custom properties on `.article-prose`, mirroring the `navy.bright` / `navy.bright-deep` Tailwind tokens. The four `rgb()` literals in the `.article-prose a` ruleset now read `var(--prose-link)` / `var(--prose-link-hover)`. Scoped to `.article-prose` because prose is the only consumer; promote to `:root` if that changes.

8. **Typographic character normalisation.** Two-layer plan; renderer pass shipped 2026-05-29, editor extension still pending.

   - ~~*Renderer pass*~~ — shipped. [`lib/posts/normalize-typography.ts`](../lib/posts/normalize-typography.ts) walks TipTap JSON in `PostPreview` (composed with `normalizeEmojiLists`). Substitutions applied to every text node, except inside `codeBlock` or text carrying a `code` mark:
       - `--` (and any 3+ run of hyphens) → `—` em-dash. Adamastor doesn't publish inline CLI snippets; revisit if LisboaJS articles need raw hyphens outside `<code>`.
       - Exactly `...` (not surrounded by more dots) → `…` ellipsis. `....` is left alone so sentence-ending ellipsis stays intentional.
       - `'` immediately after a word character OR before a digit → `’` (right single / curly apostrophe). Handles contractions (`don't`), possessives (`Carlos's`), decade abbreviations (`'90s`). Standalone `'` quotes (extremely rare in editorial prose) are not converted — defer until needed.
       - `"` after whitespace, start-of-string, or open-bracket → `“`; everything else → `”`.

       Unit tests in [`lib/posts/normalize-typography.test.ts`](../lib/posts/normalize-typography.test.ts) cover the rules and the marks/code-skip behaviour (`pnpm test`). Source content in the DB is never modified.

       **Intentionally deferred** (would need smarter detection): ` - ` (space-hyphen-space) → em-dash is ambiguous with compound words; `1-10` → en-dash needs number-range detection; opening single quote at start-of-word (`'twas`, `'em`) is rare enough to skip.

   - *Editor extension* — still pending. Wire TipTap's `@tiptap/extension-typography` (~5 lines) so Carlos sees smart characters as he types. Closes the editor/rendered gap for new writing; renderer pass already covers historical content.

---

## How to use this doc

- **Adding a new typographic element**: read the relevant section, follow the same patterns. Reference this doc from a comment in the file you're editing.
- **Changing an existing element**: update both the code and this doc in the same change. If you're going to argue with a decision below, the comment headers in `styles/prosemirror.css` and `components/tailwind/post-preview.tsx` and `app/(main)/posts/[id]/PostHero.tsx` capture the reasoning per element — read those first.
- **Debugging a visual oddity**: most weird typography behavior in this codebase has been encountered at least once. Search this doc + the audit handoff for keywords first (e.g., "weight pooling", "ch unit", "balance").

## History

- **2026-05-27/28** — Full typography deep-audit session. Established the canonical type stack, fixed the Lora weight-pooling trap, unified kicker tracking, collapsed body H1, bumped H2 to weight 700 and 24/28px, raised H3 to 19/20px, tuned strong to 575, narrowed prose to 60ch, aligned header with prose, introduced length-responsive H1 sizing, restricted editor heading levels to [2,3], added paste transform. Audit paused mid-session at element 7/15; see HANDOFF.md for full resumption list.

Earlier typography decisions (Lora vs CalSans, Inter as body, Inconsolata for mono, the "Lora is rare" rule, blockquote variants) were established in prior sessions documented in `docs/design-system.md`.
