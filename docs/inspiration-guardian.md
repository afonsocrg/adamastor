# Inspiration: The Guardian's design & editorial system

A synthesis of what's worth borrowing from The Guardian's open-source design system, captured during the 2026 redesign of Adamastor's typography, colour and components.

**Sources** (cloned locally at `~/Code/Adamastor/_reference/`):
- [`guardian/csnx`](https://github.com/guardian/csnx) — the design-system monorepo. The relevant package is `@guardian/source` (tokens + UI primitives).
- [`guardian/dotcom-rendering`](https://github.com/guardian/dotcom-rendering) — the website itself. **This is where the editorial system lives**, not in csnx.

---

## The central insight

> The Guardian's design system is not a kit of tokens and components. It is the **operational expression of an editorial taxonomy**. Colour and typography are functions of that taxonomy, not free-standing decisions.

Every editorial choice — what colour a headline is, what weight it has, what surface a card sits on — is computed from a three-axis classification of the article:

| Axis | Values | Controls |
|---|---|---|
| **Pillar** (theme) | News · Opinion · Sport · Culture · Lifestyle + specials (SpecialReport, Labs, SpecialReportAlt) | Colour family |
| **Design** (format) | Standard · Feature · Comment · Review · Interview · LiveBlog · Analysis · Editorial · Gallery · Recipe · Profile · Obituary · …~30 values | Font weight, layout role, register |
| **Display** | Standard · Immersive · Showcase · NumberedList | Page-level treatment |

Source of truth: `_reference/dotcom-rendering/dotcom-rendering/src/lib/articleFormat.ts`

### How it composes

The semantic palette in `paletteDeclarations.ts` (8,619 lines) is a set of **functions** over those three axes. Example:

```ts
const headlineTextLight = ({ design, display, theme }) => {
  if (display === ArticleDisplay.Immersive) return neutral[97];
  switch (design) {
    case Editorial: case Feature: case Review: case Recipe:
      return pillarPalette(theme, 200);   // tinted by section
    case Gallery:    return neutral[100];
    case LiveBlog:   return neutral[100];
    // …
  }
};
```

And `ArticleHeadline.tsx` picks the typographic *weight* by design:

```ts
const getFontWeightByDesign = (design) => {
  if (Obituary | Comment | Editorial | Letter)            return 'light';
  if (Feature | Review | Recipe | Interview | Gallery)    return 'bold';
  return 'medium';
};
```

So *Comment in News* renders **light** weight in **News-red 200**. *Feature in Culture* renders **bold** in **Culture-brown 200**. The publication's voice is the *combinatorics* across thousands of articles.

---

## The two-layer split

The Guardian deliberately separates two layers — this is the structural lesson:

| Layer | Lives in | Contains |
|---|---|---|
| **Design system** (generic primitives) | `csnx` / `@guardian/source` | Tokens (palette, typography, space, breakpoints), generic UI: button, link, accordion, choice-card, container, columns, footer, icons, label, radio, select, spinner, stack, text-input, tiles. **No editorial pieces.** |
| **Editorial system** | `dotcom-rendering` | Article components, layouts, the (pillar × design × display) classification, the semantic palette functions. |

A publication's voice lives in the second layer. Conflating the two is what makes generic design systems feel un-editorial.

---

## The editorial component vocabulary

These are real files in `_reference/dotcom-rendering/dotcom-rendering/src/components/` worth borrowing as names:

`ArticleHeadline` · `ArticleTitle` · `ArticleMeta` · `ArticleBody` · `ArticleContainer` · `Standfirst` · `Kicker` · `Byline` · `BylineLink` · `HeadlineByline` · `MultiByline` · `Caption` · `CaptionText` · `GalleryCaption` · `DropCap` · `PullQuoteBlockComponent` · `DesignTag` · `SeriesSectionLink` · `TagPageHeader` · `StarRating` · `AgeWarning`

And 26 *layouts* in `src/layouts/` — one per article archetype: `Standard`, `Comment`, `Live`, `Gallery`, `Immersive`, `Showcase`, `Picture`, `Audio`, `Crossword`, `Interactive`, `Newsletter`, `FullPageInteractive`, plus `Hosted*` variants. **The layout *is* the format.**

---

## Typography specifics

- **Two families.** `GH Guardian Headline` (display serif) for headlines; `GuardianTextEgyptian` (text serif) for body. Falls back to Georgia.
- **Named roles, not loose sizes.** Tokens are named like `article15`, `articleBold17`, `articleItalic15`, `headlineBold17`, `headlineMedium34`, `headlineLight50`. You compose with the role, not by picking a font-size.
- **Line-height encodes register.** Body = `1.4`. Headlines = `1.15`. The ratio difference is the editorial register.
- **Naming convention**: `{role}{Bold?}{Italic?}{size}` — where size is the px value (so `article15` = 15px = 0.9375rem).

Source: `_reference/csnx/libs/@guardian/source/src/foundations/__generated__/typography.ts`

## Colour specifics

The full palette (from `_reference/csnx/libs/@guardian/source/src/foundations/__generated__/palette.ts`):

```
neutral       0 → 100   (12 steps, full greyscale)
news          100 → 800 (red ramp)
opinion       100 → 800 (orange ramp)
sport         100 → 800 (blue ramp)
culture       50 → 800  (brown ramp)
lifestyle     100 → 800 (pink ramp)
labs          100 → 700 (teal ramp)
specialReport / specialReportAlt
brand / brandAlt   (Guardian blue + yellow)
error / success / focus / notificationBlue
```

Each pillar has its own ramp. `400` is typically the canonical pillar tone; `200` is used for headline ink in feature-y designs; `800` for tinted surfaces. Notice **no separate "dark mode palette"** — the same ramp is used and the semantic *functions* in `paletteDeclarations.ts` pick a light or dark step depending on context.

## Spacing specifics

A coarse, deliberate scale (from `space.ts`):

```
{0: 2, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32,
 9: 36, 10: 40, 12: 48, 14: 56, 16: 64, 18: 72, 24: 96}
```

Gaps at 7, 11, 13, 15, etc. — they've forced a sparse scale to limit choices.

---

## Mapping to Adamastor

Adamastor's editorial taxonomy is *narrower* than the Guardian's by design, because Adamastor isn't a generalist news site. Adamastor **is** the Weekly — Carlos Resende's weekly digest is ~80% of output and the reason the publication exists. Opinion and Events were added later as expansions around the core, not as co-equal pillars.

This makes the right reference shape closer to **The New Yorker** or **The Atlantic** (one flagship product with auxiliary surfaces) than to **The Guardian** (many co-equal pillars).

### The settled taxonomy

```
Adamastor
│
├── Article
│   ├── Series: Weekly
│   │   Template: strict 5-block digest (every issue, in order)
│   │   ├── 1. Essay              (free-form prose, Carlos's voice)
│   │   ├── 2. Quote of the Week  (pulled quotation + attribution)
│   │   ├── 3. Highlights         (curated news from the scene)
│   │   ├── 4. Congrats           (celebratory mentions)
│   │   └── 5. Read · Listen · Watch  (curated media list)
│   │
│   └── Series: Opinion           (free-form essay, guest-authored)
│
└── Event
    └── Category × 5 (existing slugs)
```

### The Weekly is a structured digest, not a free-form article

Every Weekly issue contains exactly these 5 blocks, in this order. The template is the contract — subscribers expect it. This is what makes the Weekly a recognisable *product*, not just an article. Example issue: `/posts/growing-up-week-20`.

### Decisions captured this session

- **No Design axis needed.** Series = Format here (Weekly → Digest, Opinion → Essay). 1:1 mapping. No `ArticleDesign` enum required at this scale.
- **No Display axis yet.** Don't build an "Immersive" slot until there's a piece that demands it.
- **Events live outside the article taxonomy.** Separate content type (a directory product, not editorial). They keep their existing 5-category classification and get their own palette decisions — they don't slot into Series.
- **The leverage moves down a level.** Because the Weekly is 80% of output and the template is rigid, the highest-impact design work is **not** at the article shell — it's at the **block level**: `Essay`, `QuoteOfTheWeek`, `Highlights`, `Congrats`, `ReadListenWatch`. Each is a recurring editorial unit deserving its own typographic + visual identity.
- **LisboaJS / LisboaUX.** Same machinery, each sibling property has its own equivalent Series structure (likely just one each, given narrower scope). Component layer is shared; Series definitions differ per property.

---

## What NOT to copy

- **Don't copy the monorepo structure.** csnx is shaped for an engineering org with versioned NPM packages consumed by multiple downstream apps. A single-operator publication doesn't need this.
- **Don't copy 30 article designs.** The Guardian has accumulated them over a decade. Start with 1–3.
- **Don't build the system before the design is settled.** Typography + colour are mid-redesign as of 2026-05. Codify into functions only after the calls are made.
- **Don't model Events as a Pillar.** Events are a separate content type (a directory product, not editorial). They get their own categorisation and palette decisions, not a slot in the article taxonomy.
- **Don't build a Design axis for Articles.** With one digest format and one essay format, mapping Series 1:1 to Format is the right move. Add the axis later if/when Carlos starts running materially different formats (e.g. founder interview as its own thing).

---

## Next moves (in priority order)

1. **Design the 5 Weekly blocks.** Each block (Essay · Quote · Highlights · Congrats · ReadListenWatch) needs its own typographic + visual language. **Highest-impact design work**, because every Weekly issue contains all 5 in the same order.
2. **Settle Weekly vs Opinion contrast.** How does a guest op-ed feel sibling-but-distinct from Carlos's authoritative voice? Likely a typographic register shift or an accent-colour cue, not a wholesale redesign.
3. **Revisit the palette under the settled taxonomy.** With only two Series and a separate Events content type, the Guardian's "pillar-coloured headline" trick doesn't translate directly. The shape likely is: Weekly = canonical navy voice; Opinion = a contrasting accent; Events = its own surface identity (warmer / more directory-like).
4. **Verify Weekly encoding in TipTap.** Are the 5 sections currently heading-based or block-based? Determines whether the redesign is pure styling (CSS in [`prosemirror.css`](../styles/prosemirror.css) and [`extensions.ts`](../components/tailwind/extensions.ts)) or requires custom editor nodes.
5. **Build editorial component primitives** (`Byline`, `Kicker`, `Caption`, `DropCap`) as needed — but only the ones the Weekly + Opinion actually use. The Guardian's full vocabulary is overkill for Adamastor's scope.
6. **Defer Storybook + Storybook MCP** until block components stabilise. Then it compounds (future agent sessions can query stories rather than grep components).

---

## Appendix: Article-element typography (deep dive)

A reference for the in-progress redesign of how typographic elements look inside an article — links, lists, H2 subheadings, blockquotes, pull quotes. Each section: the Guardian's pattern, the principles behind it, and how to translate to Adamastor's narrow Weekly/Opinion taxonomy.

Source files referenced (all under `_reference/dotcom-rendering/dotcom-rendering/src/components/`): `ArticleBody.tsx`, `TextBlockComponent.tsx`, `Subheading.tsx`, `BlockquoteBlockComponent.tsx`, `PullQuoteBlockComponent.tsx`.

### Links

**Pattern**

```css
a {
  text-decoration: none;
  border-bottom: 1px solid var(--article-link-border);
  color: var(--article-link-text);

  &:hover {
    color: var(--article-link-text-hover);
    border-bottom: 1px solid var(--article-link-border-hover);
  }
}
```

**Principles**

1. **`border-bottom` as the underline, not `text-decoration`.** Pixel-precise, never clipped by descenders, never different per browser. The default underline is uncontrollable. (Modern alt: `text-decoration-thickness` + `text-underline-offset`, but `border-bottom` is still cleaner for editorial work.)
2. **Both colour *and* border shift on hover.** Two-axis change reads as a real affordance. Single-axis hover reads as ambient state.
3. **Link colour is pillar-coloured.** News links red, Sport blue, Culture brown. Even a one-word link reinforces section identity.

**For Adamastor.** With one canonical accent (navy.tint), `--article-link-text` and `--article-link-border` collapse into navy-family values for the Weekly. Opinion can use a contrasting accent — link colour becomes the lightest-touch way to communicate which Series the reader is in.

### Lists

**Pattern**

```css
li {
  margin-bottom: 4px;
  padding-left: 20px;
}

ul > li::before {
  content: '';
  display: inline-block;
  border-radius: 50%;
  height: 12px; width: 12px;
  background-color: var(--textblock-bullet-background);
  margin-left: -20px;
  margin-right: 8px;
}
```

**Principles**

1. **The bullet is a real shape, not a glyph.** `::before` + `border-radius: 50%` gives a precisely-sized filled circle, consistent across fonts and browsers. Native `list-style: disc` renders differently in every font.
2. **The bullet is *sized*.** 12px — a deliberate visual weight. Says "editorial list", not the default's pinprick.
3. **The bullet sits in the gutter, not the text column.** `padding-left: 20px` on the `<li>` plus `margin-left: -20px` on the bullet pulls the dot outside the body column. Text aligns flush; bullets float in the margin. This is what makes a list feel typographically integrated rather than indented-and-other.
4. **The bullet is pillar-coloured.** Same logic as links — a quiet brand affordance on every list item.

**For Adamastor.** Disproportionately important: **Highlights, Congrats, and Read·Listen·Watch are all lists** — bullets appear in 3 of the 5 Weekly blocks every week. Take the technique verbatim; swap the colour to navy.tint.

### H2 (in-article subheadings)

**Pattern** (from `Subheading.tsx`)

- Uses the **display font** (`headlineMedium24` → `28` at tablet), same family as the article headline
- Colour themed via `--subheading-text`
- **Weight chosen by article design**:

```ts
case Obituary | Comment | Editorial:        return 'light';
case Standard | Profile | Analysis:         return 'medium';
case Feature:    return theme === News ? 'medium' : 'bold';
case Interview | Recipe | Review:           return 'bold';
```

- **Inline `<strong>` inside h2 is explicitly disabled** (`strong { font-weight: inherit }`) except in immersive articles. Writers cannot bold a word inside a subheading.

**Principles**

1. **H2 uses the display font, not body.** Visual *rhyme* with the article headline — the subheading is a smaller echo of the lead voice. If H2 uses the body face, it reads as "bigger paragraph" rather than "next chapter".
2. **Weight encodes editorial register.** Same size, different feel. Variation comes from weight, not scale.
3. **Disallow inline weight changes.** Writers reaching for `<strong>` inside an H2 are compensating for something the design should handle. Banning it in the component keeps hierarchy clean.
4. **One size per breakpoint, not a scale.** No `h2-small/medium/large`. Just one H2. Variation is design-axis (weight + colour), not size.

**For Adamastor.** Pick **one weight per Series** and lock it. Weekly = medium (Carlos's authoritative voice). Opinion = light (more reflective register). Use the display font for both. Enforce the no-`<strong>`-in-H2 rule — compounds over hundreds of issues.

### Blockquotes (inline editorial quotation)

**Pattern** (from `BlockquoteBlockComponent.tsx`)

```css
blockquote {
  margin: 16px 0 16px 33px;        /* asymmetric: left-indented only */
  ${articleItalic17};               /* body font, italic, 17px */
  color: var(--block-quote-text);
}
```

**Principles**

1. **Italic, not larger.** Blockquotes stay at body size. The italic *is* the signal. Going up in size breaks body rhythm and turns every quotation into a feature moment, which dilutes actual feature moments.
2. **Left-indent only.** No centering, no margin-right. Pulls *out* of the column to the right while keeping left edge inside the gutter. Says "still part of prose flow, just emphasised".
3. **Same colour family as body.** A slightly muted body colour, not a brand accent. Loudness comes from italic + indent, not colour.

**For Adamastor.** Use for ordinary in-text quotations inside Carlos's Essay block. Save the *visual* quote-block treatment for "Quote of the Week" (which is structurally a pull quote, see below).

### Pull quotes (display quote events)

**Pattern** (from `PullQuoteBlockComponent.tsx`)

```css
aside.pullquote {
  ${headlineMedium24};              /* DISPLAY font */
  color: var(--pullquote-text);
}
/* + a large filled QuoteIcon glyph rendered as SVG, pillar-coloured */
```

Three positioning roles: `inline` (stays in flow, max-width 80%), `supporting` (floats to side column with background tint), `showcase` (extra-large at tablet+).

**Principles**

1. **Pull quotes use the DISPLAY font, not body italic.** Cleanest distinction: blockquote = body+italic; pullquote = display+regular. Mixing these blurs the editorial vocabulary.
2. **No italic for pull quotes.** Italic is the blockquote's signature; using it on pull quotes dilutes both.
3. **The QuoteIcon is part of the brand.** A stylised quote-mark SVG, pillar-coloured. Not decoration — semantic affordance ("this is someone *else's* voice"), distinct from the italicised inline quotation.
4. **One quote element, three positioning variants.** Same content; different theatrical level. Editorial controls rhythm without writers fiddling with CSS.

**For Adamastor.** The "Quote of the Week" block is structurally a pull quote, used identically every week:
- Display face, 1.5–2× body size
- Regular weight (no italic)
- Include a quote-mark icon — it's the brand moment
- Attribution underneath in body face, smaller, muted (`— Founder, Company`)
- One positioning variant is enough — no side-floats needed in your layout

### Meta-principles (carry these forward)

If the five collapse into general rules:

1. **Vary by weight and colour, not by size.** One-size-per-element hierarchy looks more confident than a multi-size one.
2. **Display face for editorial-event elements** (H2, pull quote); **text face for body-flow elements** (paragraph, blockquote). The face is the boundary between *prose* and *moment*.
3. **Body italic = inline emphasis; display regular = display event.** Don't mix. A pull quote in italic blurs the vocabulary.
4. **Use `border-bottom` for link underlines, `::before` for bullets, SVG for quote icons.** Three controllable primitives that escape unpredictable browser defaults.
5. **Pull semantically-special elements outside the body column** (bullets in gutter, blockquote indent, pullquote side-float) — but only one step out. Don't double-indent; don't centre.
6. **Disable inline `<strong>` inside structural elements** (headings, captions). Writers reaching for it are compensating.

---

## Appendix: Cross-section design (links, colour, fonts, buttons, consistency)

Reference for the cross-cutting concerns that span Articles, Events and shared chrome — what does the publication look like as one product, not as five separate page templates. **Type-specific rules live in [`docs/typography.md`](typography.md), which is canonical.** This appendix is everything *around* type — link contexts, colour roles, button intent, font *budget*, and the Articles ↔ Events seam.

### Type families and weights (a budget, not a kit)

Adamastor's full type stack (from [`docs/typography.md`](typography.md)):

| Family | Weights loaded | Reserved for |
|---|---|---|
| **Inter** (variable) | 100–900 normal | Everything by default — body, UI, kickers, H2/H3, navigation, captions |
| **Lora Bold** | 700 + 700 italic | Page H1, navbar strapline, footer tagline, /about hero strapline |
| **Lora Italic** | 400 italic only | Blockquote pull-out (separate variable to avoid weight-pool merging) |
| **Inconsolata** | 400 + 700 | Code only |

Three families, tightly bounded. **The "Lora is rare" rule is the load-bearing discipline** — Lora earns its editorial power by being scarce. Every additional surface that adopts Lora dilutes the H1's signal. Below the page H1, hierarchy is carried by **weight + size + colour + structural rules** (hairlines, kickers, spacing) — *never* by switching to serif.

**Compare with the Guardian.** They use two custom families: `GH Guardian Headline` (display serif) and `GuardianTextEgyptian` (body serif), plus `GuardianTextSans` for non-editorial chrome. Same shape as Adamastor's setup, scaled to their needs: one serif for editorial moments, one workhorse for everything else, sans only for the parts that aren't editorial. **Adamastor's Inter-as-default + Lora-as-display is the same principle, executed with cheaper fonts.**

**Weight stations actually in use** (within Inter, for body content):

| Weight | Role | Why this number |
|---|---|---|
| **400** | Body paragraph default | Inter Regular — the publication's resting weight |
| **500** | Inline links (above body) | Light scannability lift without screaming — the underline carries the affordance |
| **575** | Inline `<strong>` emphasis | Sits between Medium (500) and SemiBold (600). Bold lead-ins (Carlos's "**Startup X**" pattern) don't dominate the line; opens a clear 125-weight gap to H2 |
| **600** | H3, kickers (Inter SemiBold) | Structural-but-not-shouty |
| **700** | H2 (Inter Bold) | Hard stop above strong; unambiguous heading |

Five stations within one family — that's the right granularity for a publication of Adamastor's scope. Adding a sixth station (e.g. an Extra-Bold display weight) would need a reason; don't add weights without one.

**Cross-section: where does Lora appear vs. Inter?**

```
Lora           Inter
─────          ─────
Page H1        Body, links, strong, em
Blockquote     H2, H3
Navbar strap   Kickers ("ARTICLES", "EVENTS", "OPINION", "THE ADAMASTOR WEEKLY")
Footer tag     Tabs, navigation, buttons, filter pills
/about strap   Event titles, dates, captions, byline
               Form fields, error messages
```

**The principle for the redesign**: any new element you add should default to Inter. Only reach for Lora if the element is one of: (a) the canonical page title, (b) the canonical pull-out quote, (c) a brand-voice strapline. If neither, Inter.

### Links across contexts

The Guardian doesn't have one link style — they have **five distinct contexts**, each with its own treatment. Adamastor needs the same context-awareness.

| Context | Underline? | Colour | Where in Adamastor |
|---|---|---|---|
| **Body link** (inside paragraph) | Yes — `text-decoration` with `navy-tint` colour, `2px` thickness, `4px` offset | Navy text (matches body) | Inside `.article-prose` — already implemented per typography.md |
| **Headline / card link** (article title in a card) | No | Inherits headline colour (navy, Lora Bold for H1; Inter Bold for card titles) | Homepage post cards, opinion sidebar cards |
| **Kicker link** (section/series label) | No | `navy-tone` (Weekly/neutral) or `orange-hue` (Opinion) | "THE ADAMASTOR WEEKLY · WEEK 21", "OPINION", "ARTICLES" / "EVENTS" tabs |
| **Byline link** (contributor name) | No (until hover) | Subtle colour shift from surrounding text | `By Carlos Resende` |
| **Nav / tab link** | Active state = indicator bar below, not text underline | Neutral; active = accent | Top tabs ("ARTICLES" / "EVENTS"), city pills, category pills |

**The principle.** Links signal *interactivity* — but they only need to do so *one way at a time*. In body prose surrounded by non-link text, the underline is essential. In a card where the entire card is essentially clickable and the headline obviously is too, the underline is noise.

**Note on technique**: Adamastor uses modern `text-decoration-thickness` + `text-underline-offset` for body links (per typography.md). This is correct — better than the Guardian's older `border-bottom` workaround, which existed because the modern properties weren't reliably supported a decade ago. Don't switch backwards.

**The mistake to avoid**: a global `a { text-decoration: underline }` rule. If body-link styling cascades to card titles, kickers, and bylines, the prose-vs-display vocabulary collapses. Scope link styling per-region (`.article-prose a { … }`), not globally.

### Colour: gold, orange, navy — three roles

Adamastor has a **three-accent system**, each with a distinct meaning:

| Family | Role | Surfaces |
|---|---|---|
| **Navy** (4 stations: `navy` / `navy-tone` / `navy-tint` / `navy-frame`) | Editorial spine. The publication's voice. | Body text, H1/H2/H3, byline, default chrome, hairlines, neutral kickers, link underlines, list bullets |
| **Gold** | Invitation / CTA. Warm, transactional, "join us". | Subscribe buttons, primary CTAs |
| **Orange** (`orange-hue` rgb 224, 94, 0) | Opinion accent + arrow-tip icons. The "other voice". | Opinion kickers, arrow CTAs ("Get the picks →") |

Three accents is the right number for a publication this size. Four would start to fight; two wouldn't carry the editorial split. The cleanness is in **each colour having one job**.

**The principle the Guardian teaches**: colour is *load-bearing meaning*, not decoration. Their pillar red is news; their pillar blue is sport. The reader never has to think "what section is this" because seven micro-touchpoints (kicker, link, bullet, headline tint, pull quote, surface tint, nav indicator) carry the colour story coherently. Adamastor's equivalent: navy = canonical voice; gold = "you should act on this"; orange = "this is someone else speaking". Don't let any of them drift into other meanings.

**Where colour should NOT appear** (equally important):
- Most of the page surface (~80%) should be neutral (white/cream/navy-frame hairlines). Colour is the salt, not the meal.
- Don't tint headings just to add visual interest. The hairline + weight + size already carry the structure.
- Don't background-tint cards heavily unless the surface is communicating something (e.g. "this is a related-content module, not body prose").
- Body paragraphs and H2/H3 stay in `navy`; no per-section tinting of editorial text.

**The cross-product question — where does each accent appear on the Events side?**

| Element | Colour role | Notes |
|---|---|---|
| `EVENTS` tab (active) | Navy (indicator bar) | Same treatment as `ARTICLES` tab — they're peers |
| Event titles | Navy (display weight) | Same as article titles — unifies the publication |
| Event date/location | `navy-tone` (muted) | Metadata, same register as byline |
| Calendar widget | Mostly neutral; days-with-events dots = gold | Gold here reads as "invitation to attend" — coherent with Subscribe |
| City filter pills | Navy outline (current) | Stay neutral; cities are *where*, not editorial |
| Category filter pills | **Open question** — see below | |
| "Never miss an event" card | Navy text + gold arrow CTA | Treat as an Events-tab subscribe moment — gold belongs here |

### The Events city × category colour question

Two orthogonal axes (where + what), both currently styled as identical navy pills. As categories grow past 5, scanning gets harder. Three options:

**A. Keep both neutral, label the axes** (most conservative, recommended start)
Add a small label above each pill row: `Where:` above cities, `What:` above categories. No colour. The label + position carries the axis distinction. **Default to this.**

**B. Categories get muted colour, cities stay neutral** (the OKLCH "shared character" approach)
Each category gets a very pale background tint in a different hue but identical lightness and chroma — distinguishable but harmonious. Example values (at the edge-of-tint stimulation tier):

```
Startups & Fundraising  → bg: oklch(0.97 0.03 145)  pale green
Product Management      → bg: oklch(0.97 0.03 250)  pale blue
Design                  → bg: oklch(0.97 0.03 350)  pale pink
Software Engineering    → bg: oklch(0.97 0.03 220)  pale navy
AI                      → bg: oklch(0.97 0.03 290)  pale purple
```

All at the same lightness/chroma, hue is the only varying dimension. Cities stay as navy outlines. The asymmetry carries meaning: categories = warm/topical, cities = navigational/neutral.

**C. Both axes get colour** — don't. Too much, fights with navy/gold/orange.

I'd start with **A** and only adopt **B** if scanning becomes genuinely hard. Don't add a colour dimension you haven't earned.

### Buttons by intent

The Guardian's button system has 4 tiers (`_reference/csnx/libs/@guardian/source/src/react-components/button/theme.ts`):

| Tier | Visual | Use for |
|---|---|---|
| **Primary** | Filled background, contrasting text | The one main action on a screen |
| **Secondary** | Tinted-light background, brand text | Important supporting action |
| **Tertiary** | Transparent background, border, brand text | Lower-prominence action |
| **Subdued** | Text-only, brand colour | Inline action that should feel almost like a link |

Source pairs tier with **theme** (`themeButton` default, `themeButtonBrand` for use on coloured backgrounds, `themeButtonBrandAlt` for fundraising/yellow CTAs). Tier and theme are orthogonal: same prominence ladder, different colour story.

**Adamastor's button system, observed:**

| Button | Tier | Theme | Why |
|---|---|---|---|
| Subscribe (form + sticky) | Primary | Gold | The most important action across the whole publication |
| Send note | Tertiary | Navy outline | Lower-prominence, editorial-register action ("Carlos reads every note") |
| "Get the picks →" | Subdued | Orange | Side-card invitation, link-style CTA |
| Calendar arrows | Subdued icon | Navy | Navigation chrome |

This is **more sophisticated than a uniform "all CTAs same tier" approach**. Adamastor uses *tier × theme* deliberately: Subscribe is a gold-themed primary (warm, transactional); Send note is a navy-themed tertiary (cool, editorial). The colour difference *is* the meaning — Subscribe wants you to act for the publication's growth; Send note invites participation in the editorial intimacy.

**Don't flatten this**. The Guardian's uniform-by-tier approach works for a generalist news site where every CTA serves the same business; Adamastor's *tier × theme* approach is right for a publication where different actions carry different invitations. Keep them differentiated.

**The rules to maintain across the redesign:**

1. **One primary button per visible region.** Two filled CTAs side by side and the reader doesn't know which to choose. Subscribe is the canonical primary across the publication; everything else steps down a tier.
2. **Tier matches importance, not page section.** A footer CTA can absolutely be primary — don't downgrade because it's "below the fold".
3. **Theme should encode the action's *register*.** Gold = warm/transactional. Navy = editorial/cool. Don't reach for gold on a participation action (would feel salesy); don't reach for navy on a subscribe action (would feel reserved).
4. **Filter pills are not buttons.** Cities and categories are toggleable filter chips — a separate component shape with its own selected/unselected states. Don't conflate the two visual systems.

### The Articles ↔ Events consistency thread

The two products already share more correct DNA than I expected from the screenshots:

✓ Masthead (logo + italic-Lora tagline + Account)
✓ Tab navigation (ARTICLES / EVENTS) with identical treatment
✓ Page heading + dek pattern ("Latest from Adamastor" + description / "Events" + description)
✓ Right-sidebar card chrome (Opinion card on Articles, "Never miss an event" card on Events — same border, padding, kicker treatment)
✓ Sticky bottom Subscribe CTA, consistent across both
✓ Same type families on both sides (Lora reserved for the same surfaces; Inter for everything else)

What's correctly different:

✗ Events has a calendar widget; Articles doesn't (different data model)
✗ Events has dual-axis filters; Articles doesn't (different navigation needs)
✗ Events foregrounds time + location; Articles foregrounds date + read time

**The single most powerful unification move is structurally identical kickers**, scoped per content type:

```
ARTICLES side                    EVENTS side
─────────────────────            ─────────────────────
THE ADAMASTOR WEEKLY             [event category kicker — same typographic shape]
Founder vs. Reality Fit          CoWork Lab Day
By Carlos · May 25 · 4 min       09:00 · Lisboa
```

Same uppercase tracked Inter SemiBold 600 label above the title; same display-weight title; same `navy-tone` muted metadata line below. The *content* is different but the *shape* is identical — that's what unifies them as one publication.

Looking at the Events list in your screenshot, the items currently jump straight to the date/time and title with no kicker. **Adding a category kicker per event item** (e.g. `SOFTWARE ENGINEERING · LISBOA`) would tighten consistency with the Articles side considerably. It also gives a place for the optional category-colour treatment from Option B above to live.

### Recap — what to carry into the redesign session

1. **Three accents, three roles, no leaks.** Navy = editorial spine. Gold = invitation / CTA. Orange = Opinion + arrow accents. Each does one job.
2. **Lora is rare.** Resist adding it to any new surface. Hierarchy below H1 is weight + size + colour + structure — never serif-switching.
3. **Link style by region, not globally.** Body links underlined; card titles, kickers, bylines, nav links are not.
4. **Buttons: tier × theme.** Subscribe = gold primary. Send note = navy tertiary. Get the picks = orange subdued. Don't flatten.
5. **Articles ↔ Events**: same masthead, same tabs, same card chrome, same kicker shape, same type families. Different data, different metadata, different filter chrome.
6. **For the category × city filter colour question**: start with both neutral + axis labels; reach for category-tinted OKLCH pills only if scanning becomes hard.

---

*Captured 2026-05-28 during typography/colour redesign session, with taxonomy settled the same day. Cross-section appendix added the same session. Local clones live at `~/Code/Adamastor/_reference/csnx` and `~/Code/Adamastor/_reference/dotcom-rendering`, outside this repo. Canonical type rules live in [`docs/typography.md`](typography.md); this appendix references rather than duplicates them.*
