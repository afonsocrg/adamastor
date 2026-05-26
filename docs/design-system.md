# Adamastor Design System

The source of truth for how Adamastor looks and feels. Update this doc when we change a brand decision; treat it as canonical when in doubt.

## Voice

Editorial / publication-grade. Adamastor is a digital publication, not a SaaS dashboard — the UI should feel **written, not generated**.

- Generous whitespace
- Distinctive typography
- Color used with intention, never as decoration
- Modular containers that breathe with their content (not forced uniformity)
- Headings carry the page; numbers are pull-quotes

### AI-tic red flags (avoid)

Patterns that smuggle "AI writing" into editorial copy. Identified and stripped during the About page rewrite. Run prose through this list before shipping:

- **Aphoristic semicolon contrasts**: *"The publication is the front; the communities are where conversations actually happen"* / *"The Weekly is our voice; Opinion brings the room"*. Parallel-grammar punchlines reading like ChatGPT closing a paragraph. Just stop after the substantive sentence — no need to land a moral.
- **Hedge-emphasis adverbs**: *"actually"*, *"truly"*, *"really"*. AI uses them to add weight without committing to specificity. Cut them; if the sentence needs weight, rewrite the noun or verb instead.
- **"Not only X, but Y" constructions**: Same AI tendency to land sections with a tidy contrast. Drop the "not only" tail and keep the first clause if it carries the meaning.
- **Em-dashes piled up in body copy**: A single em-dash for a strong parenthetical is fine. Three in one paragraph is AI cadence — restructure with periods, colons, or commas. Title-tag separators (`Page — Site`) are a publication convention, not the same pattern.
- **Four-noun parallel lists** with abstract nouns (*memory, visibility, critique, and connection*): defensible in a manifesto sentence, but flag when you spot more than one in the same page.
- **Closer aphorisms that summarise the section**: any sentence that lands "what this all means" at the end of a paragraph. Editorial register lets paragraphs end on the last fact.
- **"At the intersection of X" / "weaving threads"** type metaphor stacks: forced cleverness. Use plain action verbs. *"Adamastor began at the intersection of three threads"* → *"Carlos was writing… Afonso was organising… Malik wanted to build…"* (the actual concrete actions each person was doing).
- **Forced metaphors around abstract concepts** (*"the publication is the front"*, *"into one editorial home"*): the metaphor is doing work that direct verbs would do better.

When in doubt: read the sentence aloud. If it lands with a "ta-da" cadence that no human would actually say, rewrite.

### Copy conventions

- **Section heads and titles take Title Case** ("Weekly Digest", "Topics to Follow"), body copy stays sentence case. Section heads name a *thing* — title-casing them signals "this is the name of something" rather than "this is an instruction."
- **Avoid SaaS-y formulations.** "Your inbox, your call" was killed mid-session for this reason — too cute, too product-y. Default to declarative editorial register.
- **"Choose one or many"** beats "Choose one or several" — fewer syllables, more direct, slightly warmer.
- **"any" beats "a/an" in templates that span vowel + consonant + plural nouns.** "Don't miss any X event" works for "AI", "design", and "startup or fundraising" without article gymnastics; `a`/`an` needs special-casing per category. Reshape plurals to singular where they collide ("startups" → "startup or fundraising" so the noun pairs cleanly with "any … event").
- **Greet by name when we know it.** Lora H1 personalizes — e.g. "Submit your event, Malik" / "Subscribe to Adamastor, Malik" / "Hi Malik — manage your subscriptions". Snapshot the name on mount so the H1 doesn't react to live edits in the form below it (live-updating reads as noisy).
- **"Every X meetup, conference, and workshop happening in Portugal, sent each week"** is the canonical category-newsletter description rhythm — it delivers on the heading's "Don't miss any X event" promise. Heading sets the FOMO, description delivers the scope + cadence.
- **Personal placeholders.** Email placeholders read `ana@yourstartup.pt` rather than `you@example.com` — a Portuguese first name + ecosystem TLD signals the audience and brand without forcing the UI into Portuguese-language copy.

References that shape the voice:
- [The Guardian Design System](https://design.theguardian.com/foundations) — color tokens, typography pairings, modular cards, highlight color used **for emphasis only**.
- Vercel Web Interface Guidelines (`~/.claude/skills/web-design-guidelines`) — accessibility, forms, typography micro-rules.

## Typography

Three families, all loaded in [`app/layout.tsx`](../app/layout.tsx) via [`styles/fonts.ts`](../styles/fonts.ts). No new font loads needed for the brand.

| Family | Variable | Use |
|---|---|---|
| **Lora Bold** (serif display) | `--font-lora-bold` | Page titles, headlines, module headings, headline numbers. Max weight is 700 — pair with Tailwind `font-bold` so the weight resolves. Both `normal` and `italic` styles are loaded; italic is reserved for editorial straplines (masthead tagline). |
| **Inter** (sans body) | `--font-inter` | UI labels, table content, body copy, form controls. The default body font (see `globals.css`). |
| **Inconsolata** (mono) | `--font-inconsolata` (400) and `--font-inconsolata-bold` (700) | Code blocks, technical content, env var names. |

Reference fonts via Tailwind arbitrary value:
```tsx
<h1 className="font-bold [font-family:var(--font-lora-bold)]">Newsletter Subscribers</h1>
<p className="[font-family:var(--font-inter)]">42 subscribers</p>
```

**Type usage:**
- Page title (h1): Lora Bold + `font-bold` + `text-3xl` minimum, `text-navy`
- Module heading (sidebar block, empty state heading): Lora Bold + `font-bold` + `text-lg`, `text-navy`
- Section headers (h3, in-content): Inter `font-semibold`
- Body, labels, table cells: Inter (the default)
- Numerical displays (stat headlines, pull-quotes): Lora Bold + `font-bold` + `tabular-nums`
- Code / env var / technical token: Inconsolata, `text-xs`, `bg-muted` padded

**Why Lora and not CalSans or Crimson Text?** CalSans (modern startup display font) and Crimson Text (classical book serif) were both dropped because neither matched Adamastor's "contemporary digital publication" voice. CalSans read too "SaaS product"; Crimson read too "Victorian literary magazine." Lora Bold is designed for screen reading, sits between them in feel, and pairs cleanly with Inter for body.

## Color

The Adamastor color system is grounded in three principles, drawn from the gradient and stimulation-toolkit articles that shaped the brand:

1. **Tints over shades.** The brand uses lightened colors (`pure color + white`) for interactive accents, not darkened ones. Shades exist only for typography (`navy.shade`, `navy.deep`) and structural emphasis — never for chips, fills, hovers, or selected states.
2. **Same character, varied lightness.** Within a family, all variants share OKLCH chroma so the eye reads them as one system. Variation comes from lightness, not from pigment jumps. ("Character" here = how saturated/intense a color feels — what painters mean when they say a palette holds together.)
3. **Close hues, clean transitions.** Hue arcs in gradients and adjacent UI stay within ~45° to avoid the muddy mid-points wider arcs produce. Hues sitting close on the wheel blend beautifully; complementary pairs only get used for deliberate high-stim moments.

### Why OKLCH

The brand tokens are defined in OKLCH-perceptual terms even though they ship as hex. OKLCH separates Lightness, Chroma (colorfulness), and Hue — perceptually uniformly. A "chroma 0.08" tint at any hue feels equally saturated, unlike HSL where 100%-saturation yellow and 100%-saturation blue look wildly different in pigment.

This matters because it's the *only* way to build a token system where "tint" means the same thing across navy / cyan / orange / gold / green. See `~/.claude/skills/color-expert` for the deeper perceptual-color reference.

### The painter's vocabulary

Each color family uses the same variant names with consistent OKLCH character. Read these as the brand's color "register":

| Variant | Painter term | Target OKLCH | Role |
|---|---|---|---|
| `deep` | Extra-dark shade | L≈0.25, C≈0.05 | Rare structural emphasis. |
| `shade` | Dark shade | L≈0.40, C≈0.06 | Typography anchor — body text, headlines, brand strip. |
| `tone` | Mid-tone, grey-added | L≈0.55, C≈0.04 | Secondary text, labels, dim hover. |
| `hue` | Pure hue | L≈0.65-0.75, C≈0.15-0.20 | High-stim accent. Used rarely (per stimulation tier). |
| `tint` | Lightened (pure + white) | L≈0.88, C≈0.07 | **The default interactive-accent register.** Soft UI fills, selected states, hover backgrounds. |
| `wash` | Very light tint | L≈0.94, C≈0.03 | Subtle backgrounds, hover surfaces (where the family's tint should READ as visible). |

`DEFAULT` aliases keep `bg-navy` / `bg-cyan` working without a suffix — `navy.DEFAULT` points at `navy.shade` (the most-common typography use), `cyan.DEFAULT` points at `cyan.hue`. Orange / gold / green have no `DEFAULT` — always suffix them explicitly.

**Navy is an exception** to the system-wide vocabulary: it adds **`frame`** (near-neutral, for borders) and **`veil`** (intermediate, for text-containing soft backgrounds) on top of `wash`. This gives navy a three-tier atmospheric system because the family has many more atmospheric roles than any other (76+ surfaces). See the Navy family table below for the rationale.

### Stimulation tiers — codified

Per the three-tool stimulation framework (intensity × hue distance × value contrast), Adamastor operates at three tiers depending on surface. The brand baseline is **mid** — Bloomberg / NYT Magazine register, not editorial whisper.

| Tier | Surface | Chroma (intensity) | Hue distance | Value contrast | Examples |
|---|---|---|---|---|---|
| **Baseline** (mid-stim) | Body, atmosphere, default UI | ≤ 0.08 (tints, low-intensity hue) | ≤ 60° within family | Moderate (L spread 0.4-0.95 across surface) | Body text on white, sidebar modules, default chips. |
| **Easter eggs** (mid-high) | Animations, delight moments | 0.09-0.11 (vivid tints) | 60-90° within cool family | Moderate-to-strong | Footer seal animation, hover transitions. One notch above baseline. |
| **Hero** (high) | Covers, big CTAs, "wow" beats | ≥ 0.15 (full hues) | Complementary pairs allowed (cyan × orange) | Strong, including value opposition | Gold CTA pill, hero covers, rare brand-moment punches. The 60-30-10 "10%" reserve. |

**Forbidden combination** (vibrating, per Heller): intense colors + contrasting hues + similar value = uncomfortable optical buzz. If a combination starts to vibrate, break it by either lowering intensity, narrowing hue distance, or adding value contrast.

### Brand families

#### Navy — architectural + the light-mode highlight color

Adamastor's primary color. Typography, structural framing, brand strip. **And** — as `navy.tint` — every light-mode interactive highlight (selected states, active chips, underline decorations). This last role was previously cyan's; the migration happened mid-redesign as the cyan family became too visually heavy.

| Token | Hex | OKLCH (approx) | Role |
|---|---|---|---|
| `navy-deep` | `#08293A` | L=0.27 C=0.05 h=236 | Rare structural emphasis. |
| `navy` *(DEFAULT = shade)* | `#104357` | L=0.36 C=0.06 h=229 | Typography anchor. Headlines, body text, brand strip, links. |
| `navy-tone` | `#4D7689` | L=0.54 C=0.05 h=229 | Secondary text — inactive tabs, weekday headers, dim hover. |
| `navy-tint` | `#A7E1FC` | L=0.88 C=0.07 h=228 | **The default light-mode highlight.** Selected calendar day, active chip fill, underline decoration. |
| **Atmospheric / wash zone — three pigment tiers:** | | | |
| `navy-frame` | `#E8F0F4` | L=0.95 C=0.01 h=229 | **Near-neutral. THE workhorse for borders, hairlines, structural framing.** "Navy frames everything" — see color rule #5. |
| `navy-veil` | `#E1F2F9` | L=0.95 C=0.02 h=228 | Intermediate. For soft text-containing backgrounds — trust asides ("Reviewed by"), empty-state fills, banners. Subtle enough not to compete with text, visible enough to register as a contained surface. |
| `navy-wash` | `#D7F0FB` | L=0.94 C=0.03 h=228 | Visibly navy-tinted. For hover backgrounds and fills where navy presence should READ. **Don't use behind body text** — competes with readability. |

**Why three atmospheric tiers in navy specifically.** The navy family has more atmospheric roles than the other families (76+ surfaces use one of these). A single token tries to serve borders, soft text backgrounds, AND visible hovers — and ends up wrong for at least one (the original `#D7F0FB` workhorse made borders too present and reduced readability behind text-containing soft fills). The three-tier split lets each surface pick the right pigment level for its job: invisible for frames, subtle for content backgrounds, visible for hover affordance. Other families don't need this split — their atmospheric roles are rarer and a single pigmented `*-wash` serves them well.

#### Cyan — RESTRICTED (dark-mode anchor + rare brand moments)

> ⚠️ **Cyan is restricted in light mode.** Use `navy.tint` for default interactive highlights instead. Cyan is reserved for:
> - **Dark mode** anchoring (`cyan-lifted`, `cyan-glow`, `cyan-dim` handle the dark theme)
> - **Rare brand-moment hues** — hero covers, the occasional big CTA punch (per the high-stim tier)
> - The footer seal Easter-egg animation where intentional
>
> **Future direction**: we may deprecate cyan entirely. Don't reach for it as a default; if you want a highlight, `navy.tint`.

| Token | Hex | OKLCH (approx) | Role |
|---|---|---|---|
| `cyan-shade` | `#028E97` | L=0.59 C=0.10 h=203 | Dark cyan — active-state text on cyan fills (legacy). |
| `cyan` *(DEFAULT = hue)* | `#04C9D8` | L=0.76 C=0.13 h=204 | Vivid brand cyan — rare brand-moment use only. |
| `cyan-tint` | `#9DE8EF` | L=0.88 C=0.075 h=203 | ⚠️ Avoid in light-mode interactive accents. |
| `cyan-wash` | `#D5F2F4` | L=0.94 C=0.03 h=203 | ⚠️ Avoid in light-mode backgrounds (use `navy-wash`). |
| **Dark-mode anchors** | | | *(named for role, not painter's vocabulary)* |
| `cyan-glow` | `#4CE4F0` | L=0.86 C=0.10 h=195 | Bright cyan borders + hover on dark surfaces. Use with opacity: `cyan-glow/[0.12]`. |
| `cyan-lifted` | `#E3F2F7` | L=0.94 C=0.015 h=215 | Off-white body text in dark mode. |
| `cyan-dim` | `#9ED2E1` | L=0.80 C=0.05 h=220 | Secondary text in dark mode. |

#### Orange — editorial accent + arrow tips

Inline accent only. Arrow-tip color on Subscribe/Continue links, opinion-piece kickers, byline accents. **Not a button fill** (that's gold's job).

| Token | Hex | OKLCH (approx) | Role |
|---|---|---|---|
| `orange-shade` | `#BD5318` | L=0.57 C=0.15 h=45 | Deep orange — opinion kicker, byline accent. |
| `orange-hue` | `#E05E00` | L=0.64 C=0.18 h=45 | Inline accent — arrow-tip on Subscribe/Continue. |
| `orange-bright` | `#FF7F0F` | L=0.73 C=0.19 h=52 | Boosted hue — rare high-emphasis warmth. |
| `orange-tint` | `#FECBAF` | L=0.88 C=0.07 h=50 | Soft peach — atmospheric warmth. |
| `orange-wash` | `#FDE6DA` | L=0.94 C=0.03 h=50 | Cream wash — opinion-content section background. |

#### Gold — primary action

The brand's primary CTA color. Form submits, conversion buttons. **One gold pill per page, max.**

| Token | Hex | OKLCH (approx) | Role |
|---|---|---|---|
| `gold-shade` | `#B8893A` | L=0.66 C=0.11 h=78 | Hover / pressed state of gold primary buttons. |
| `gold-hue` | `#D4A657` | L=0.75 C=0.11 h=79 | Primary CTA fill. Form submits. |
| `gold-tint` | `#F0D49F` | L=0.88 C=0.075 h=83 | Soft gold — rare "you did it" moment. |
| `gold-wash` | `#F5EAD5` | L=0.94 C=0.03 h=83 | Confirmation / success section background. |

#### Green — positive momentum

Growth deltas (`+5 this week`), success states, approval signals. Reserved for **good news** — not generic "ok" or "online" (too dilute).

| Token | Hex | OKLCH (approx) | Role |
|---|---|---|---|
| `green-shade` | `#236925` | L=0.46 C=0.12 h=144 | Deep green — growth headings, success kicker. |
| `green-hue` | `#3DB540` | L=0.68 C=0.19 h=143 | Primary green — growth deltas, success badges, approvals. |
| `green-tint` | `#BBE5B8` | L=0.88 C=0.075 h=143 | Soft green — rare. |
| `green-wash` | `#E0F1DF` | L=0.94 C=0.03 h=143 | Pale green — rare. |

#### Neutrals

Use Tailwind's built-in `gray-*` scale and the shadcn theme tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`). Don't invent custom neutrals.

### Color usage rules

1. **TINTS for interactive accents.** Selected states, active chips, hover backgrounds — always `*-tint` or `*-wash`. Never `*-shade` or `*-hue` for interactive fills.
2. **`navy-tint` is the light-mode highlight color.** Selected calendar days, active filter chips, underline decorations, "this is the current item" fills. Cyan does NOT do this anymore.
3. **Gold is THE action color.** Primary CTAs use `bg-gold-hue` with `hover:bg-gold-shade`. One gold pill per page, max.
4. **Orange is an inline accent, never a button fill.** Arrow-tip icons (`text-orange-hue`), opinion kickers (`text-orange-shade`). Don't use `bg-orange-hue` as a button.
5. **Navy frames everything.** All page-level borders use `border-navy-frame`. Single border tone per page.
6. **One hue moment per fold (high-stim reserve).** A surface in the mid-stim baseline can have ONE high-stim moment — usually the gold pill OR a brand-cyan "wow" beat, not both. Don't pile high-stim elements.
7. **Don't mix orange + green** on the same screen unless content explicitly warrants both signals (content type + growth delta, for example).
8. **Test in dark mode.** Each color needs a working dark-mode counterpart via the `cyan-lifted / glow / dim` system or per-usage `dark:` variants.

### Migration: old token names → painter's vocabulary

For anyone reading older code or older versions of this doc:

| Old name | New name | Notes |
|---|---|---|
| `navy-darker` | `navy-deep` | Painter's vocab |
| `navy` (DEFAULT) | `navy` (DEFAULT — alias to `navy.shade`) | No code change |
| `navy-muted` | `navy-tone` | Mid-tone for secondary text |
| `navy-pastel` (the OLD `#4D7689` mid-tone) | `navy-tone` | Same color, renamed |
| `navy-pastel` (the NEW `#A7E1FC` blue tint) | `navy-tint` | The light-mode highlight |
| `navy-faded` | `navy-wash` | |
| `cyan-darker` | `cyan-shade` | |
| `cyan` (DEFAULT) | `cyan` (DEFAULT — alias to `cyan.hue`) | No code change |
| `cyan-pastel` | `cyan-tint` | ⚠️ avoid in light mode |
| `cyan-faded` | `cyan-wash` | ⚠️ avoid in light mode |
| `cyan-lifted`, `cyan-glow`, `cyan-dim` | unchanged | Dark-mode-specific roles |
| `orange-dark` | `orange-shade` | |
| `orange-main` | `orange-hue` | |
| `orange-bright` | unchanged | Descriptive special role |
| `orange-pastel` | `orange-tint` | |
| `orange-faded` | `orange-wash` | |
| `gold-dark` | `gold-shade` | |
| `gold-main` | `gold-hue` | |
| `gold-pastel` | `gold-tint` | |
| `gold-faded` | `gold-wash` | |
| `green-dark` | `green-shade` | |
| `green-main` | `green-hue` | |
| `green-pastel`, `green-faded` | unchanged (just added) | |

Additional code-level migrations done in the same pass:
- Hardcoded `dark:text-[#E3F2F7]` → `dark:text-cyan-lifted`
- Hardcoded `dark:border-[rgba(76,228,240, α)]` etc. → `dark:border-cyan-glow/[α]`
- Hardcoded `dark:text-[rgba(158,210,225, α)]` → `dark:text-cyan-dim/[α]`
- Hardcoded `text-[#24acb5]` (legacy teal) → `text-navy-tone` or `text-navy`
- `decoration-cyan` and `hover:text-cyan-shade` (formerly `cyan-darker`) → `decoration-navy-tint` and `hover:decoration-navy`
- All light-mode `bg-cyan-wash text-cyan-shade` (active states) → `bg-navy-tint text-navy`

## Spacing & layout

- Vertical rhythm: **32px (2rem)** between major sections, **16px (1rem)** within.
- Public surfaces cap at `max-w-screen-xl` (1280px); text-heavy pages (single articles, forms) cap further at `max-w-screen-lg` (1024px) or narrower. Admin uses available width up to `max-w-screen-2xl`.
- **Section dividers**: `navy-frame` hairline. Never multiple border tones on the same page.
- **Modular cards** (Guardian-inspired): cards expand and contract to their content. Don't force uniform heights unless presenting genuinely comparable data (stat grids, comparison tables).
- **Content edge on desktop = 32px.** On `/events`, the page content wrapper has `md:p-4` on top of `<main>`'s `p-4`, doubling the inset to 32px at `md:` and up. The navbar masthead (`md:px-8`) and the site-level section nav (`px-8` inside its `hidden md:block` wrapper) match this 32px edge so the tagline, site nav, scope tabs, and page heading all share one vertical rail down the page. Mobile stays at 16px because the doubling kicks in at `md:` only.

### Editorial grid

For pages with a main column + sidebar (e.g. `/events`), use the **8-column editorial grid**:

- `lg:grid-cols-8 gap-8 lg:gap-20` — 80px gap between columns for editorial breathing room
- Main column: `lg:col-span-5` (62.5% width)
- Sidebar: `lg:col-span-3` (37.5% width)
- **Page-level scope controls** (city tabs, edition selectors) render *outside* the grid, full-width at the top
- **Column-level lens controls** (category chips, in-list filters) render *inside* the main column
- The page H1+dek should render *inside* the main column, so the sidebar top aligns with the H1 baseline — pulls sidebar above the fold and frames the page as one composition

## Mobile patterns

The editorial register translates differently on small screens. Two principles guide the
adaptation: **lead with the content, not the chrome** — sidebars, calendars, and
subscribe asides become *codas below* the page's primary surface, never above; and
**drop the card register on mobile** — form modules, sidebar outlines, and rail
indentations that frame content on desktop are visual noise at 375px. The page
should *be* the content on mobile; on desktop the chrome carries hierarchy.

### Type compaction

| Role | Mobile | Desktop (`md:`+) |
|---|---|---|
| Page H1 (Lora Bold) | `text-2xl` (24px) | `text-3xl` (30px) |
| Body / dek | `text-sm leading-snug` (14px / 19.25px) | `text-base leading-relaxed` (16px / 26px) |
| Card title (h3) | `text-lg` (18px) | `text-xl` (20px) |
| Card description | `text-sm leading-5` (14px / 20px) | `text-base leading-relaxed` (16px / 26px) |
| Card metadata | `text-sm leading-5` (14px / 20px) | `text-sm leading-5` (14px / 20px) |

Establish the responsive pair via paired utilities: `text-2xl md:text-3xl`,
`text-sm md:text-base`, `leading-snug md:leading-relaxed`. The mobile size leads
because Tailwind is mobile-first — base utilities apply unconditionally; `md:*`
utilities override from 768px up via a min-width media query, winning by source-order
cascade (Tailwind emits `md:*` rules after the bare utilities so they take precedence
once the breakpoint fires).

### Vertical rhythm

| Slot | Mobile | Desktop |
|---|---|---|
| Outer page wrapper `space-y-*` | `space-y-6` (24px) | `space-y-8` to `space-y-10` (32–40px) |
| Events column siblings | `space-y-6` (24px) | `space-y-8` (32px) |
| Between day buckets | `space-y-6` (24px) | `space-y-10` (40px) |
| Day heading → first card | `space-y-0` | `space-y-4` (16px) |
| Filter rows → list | `space-y-6` (24px) | `space-y-8` (32px) |
| City nav → H1 | 16px | 40px |

The day heading's own `py-3` (12px top + bottom) already provides breathing
room, so `space-y-0` between heading and the first card on mobile lets the heading's
padding carry the gap rather than stacking margins on top of it. Same logic for the
form module's removed `<Separator />`s — h3 section heads with their default
typographic weight do the work the divider used to do.

### Card chrome on mobile

Form modules and outlined editorial cards use `md:rounded-lg md:border md:border-navy-frame md:p-6`
— the rounded-border-padded card register is **scoped to `md:` only**. Mobile renders
the children unframed and edge-to-edge against the page padding, so the form *is*
the page rather than a card within a page.

```tsx
{/* Mobile: borderless, edge-to-edge. Desktop: outlined card. */}
<div className="md:rounded-lg md:border md:border-navy-frame md:p-6 md:dark:border-cyan-glow/[0.18]">
  <form>…</form>
</div>
```

Same pattern reaches into the events list rail: `pl-4 md:pl-8` (16px on mobile, 32px on
desktop), with the day-marker dot's left offset scaled to match
(`left-[-1rem] md:left-[-2rem]`) so it stays anchored to the rail at both
breakpoints.

### Column order flip

When a desktop layout uses a two-column grid with a sidebar, **the sidebar moves below
the main column on mobile** — never above. Flip via `order-*` utilities on the grid
children:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-8 gap-8">
  <div className="order-1 lg:col-span-5">…events column…</div>
  <div className="order-2 lg:col-span-3">…sidebar (calendar + subscribe coda)…</div>
</div>
```

Mobile gets: events first → sidebar coda. Desktop gets: events left, sidebar right —
`order-*` resets to source order at `lg:` since `lg:col-span-*` alone implies natural
flow position when `grid-cols-8` activates. Without the flip, a 400px-tall sidebar above
the events list pushes the H1 to y≈641 on a 812px viewport — a user landing on a page
about events sees a calendar widget first. With the flip, H1 lands at y≈148, first event
at y≈422 (both above the fold).

### Reviewer aside / trust strip

The "Reviewed by Afonso, Carlos & Malik" trust strip on `/events/submit` stacks
vertically on mobile, horizontally at `sm:+`:

```tsx
<aside className="flex flex-col sm:flex-row items-start gap-4 rounded-lg bg-navy-veil/40 p-5">
  <AvatarTrio />
  <div>…heading + body…</div>
</aside>
```

At 375px width the row layout leaves ~243px for the text column after avatars + gaps;
the vertical stack gives it the full ~303px, which lets the copy wrap on natural
editorial breaks instead of chopping to 4–5-word lines.

### Horizontal-scroll filter rows

City tabs, category chips, and the mobile calendar strip all share one mobile pattern:
single-row scroll with hidden scrollbar, breakout to screen edges, no-shrink chips.
Reverts to `flex-wrap` (or the original layout) at `sm:+`:

```tsx
<nav
  ref={cityNavRef}
  aria-label="City"
  className="flex items-center gap-x-6 gap-y-1 overflow-x-auto -mx-4 px-4
             [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
             sm:flex-wrap sm:overflow-x-visible sm:-mx-0 sm:px-0
             border-b border-navy-frame"
>
  {chips.map((chip) => (
    <Link aria-current={isActive ? "page" : undefined}
          className={cn(baseChipClass, "shrink-0 whitespace-nowrap")}>
      …
    </Link>
  ))}
</nav>
```

Key bits:
- `overflow-x-auto -mx-4 px-4` — the negative margin + matching padding lets the row
  break out to the screen edge (not the page-padding edge), so the scroll-clip reads as
  *"continues offscreen"* instead of *"clipped mid-chip by an arbitrary inset."*
- `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` — hide the scrollbar; the
  fade overlay (below) carries the affordance.
- `shrink-0 whitespace-nowrap` on each chip — flex items default to `shrink: 1`, which
  would squish chips in a forced-overflow context; `whitespace-nowrap` keeps multi-word
  labels on one line.
- `sm:flex-wrap sm:overflow-x-visible sm:-mx-0 sm:px-0` — revert above 640px where
  content fits comfortably.

### Scroll-cue gradient overlay

When the scrollbar is hidden, users have no signal that the row scrolls. Wrap the
scroll container in a `relative` parent and overlay a 32px gradient on the right
edge that fades from `from-background` to transparent — always on, mirrors the
iOS / Material affordance:

```tsx
<div className="relative -mx-3">
  <div className="flex … overflow-x-auto px-3" role="listbox">
    {items}
  </div>
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-y-0 right-0 w-8
               bg-gradient-to-l from-background to-transparent"
  />
</div>
```

This is "always on" rather than scroll-position-aware: JS detection of `scrollLeft`
adds complexity for marginal UX benefit — the fade reads as natural editorial trail-off
whether or not the user has scrolled. The trade-off is mild dishonesty at end-of-scroll
(the fade still hints at more content); we accept that for the simpler implementation.

### Active-chip auto-center

Horizontal scroll rows mount with `scrollLeft: 0` — so the active chip lands off-screen
on deep-link landings (`/events/coimbra` puts "Coimbra" as the 6th of 7 city tabs;
`/events/ai` puts "AI" as the rightmost category chip). On mount and on route change,
scroll the active chip into view within its container — *not* the page:

```tsx
const cityNavRef = useRef<HTMLElement>(null);
const categoryNavRef = useRef<HTMLElement>(null);

useEffect(() => {
  const centerActiveChip = (nav: HTMLElement | null) => {
    if (!nav) return;
    const active = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
    if (!active) return;
    const target = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    nav.scrollLeft = Math.max(0, target);
  };
  centerActiveChip(cityNavRef.current);
  centerActiveChip(categoryNavRef.current);
}, [activeHref]);
```

Manual `scrollLeft` instead of `Element.scrollIntoView({ inline: 'center' })` — the
latter bubbles up the ancestor chain and would shift the whole page horizontally.
Selector relies on `aria-current="page"`, not `aria-pressed` — see *Pill chips* for
why `aria-pressed` is invalid on a link.

### Touch targets

Tailwind defaults aim for cursors, not thumbs. Three places where mobile tap zones
matter:

- **Footer text links**: add `inline-block py-1.5` to grow a `text-sm` link from ~17px
  to ~32px tall. See *Footer › Clickability conventions*.
- **Coda buttons** ("Message Malik on WhatsApp", "Get the picks"): the
  `-mx-2 -my-1 px-2 py-1` *Inline-action-with-hover-background* pattern gives a ~28px
  zone; bump to `py-2` for primary mobile CTAs where the action is consequential.
- **MobileTabBar**: uses 46px-tall touch zones (Apple HIG 44pt minimum) — see
  `styles/globals.css` `.mobile-tab-bar__tab`.

We aim for HIG 44pt on standalone CTAs (submit pills, MobileTabBar tabs) and accept
~28–36pt for inline editorial links where the surrounding text serves as a navigation
context cue.

### MobileTabBar palette — a worked example of the cyan rule

The mobile bottom tab bar is a worked example of the *cyan is dark-mode-only* rule
(see *Color usage rules*). Two-tier styling, light vs dark:

| Slot | Light mode | Dark mode |
|---|---|---|
| Bar background | `rgba(255, 255, 255, 0.92)` + `backdrop-blur(20px)` | `hsla(201, 72%, 8%, 0.92)` + `backdrop-blur(20px)` |
| Inactive tab text/icon | `#4D7689` (navy.tone) | `rgba(158, 210, 225, 0.82)` (≈ cyan.dim) |
| Active tab text/icon | `#104357` (navy.shade) | `#4CE4F0` (cyan.glow) |
| Active pill background | `rgba(167, 225, 252, 0.55)` (navy.tint @ 55%) | `rgba(4, 201, 216, 0.18)` (cyan @ 18%) |
| Active pill border | `rgba(16, 67, 87, 0.14)` (navy.shade @ 14%) | `rgba(76, 228, 240, 0.4)` (cyan.glow @ 40%) |

The light-mode bar originally used `#04C9D8` (cyan.hue) for the active state — a direct
violation of the "in light mode, use navy.tint for default highlights" rule documented
under the Cyan family. Stylistic legacy, corrected. **When you find a hand-tuned hex
starting with `#04…` or `#DFF6…` inside a light-mode style, treat it as legacy** —
migrate to the canonical *Pill chips › Active* pattern (`border-navy bg-navy-tint
text-navy`, optionally `font-semibold`).

The bar background was bumped from `rgba(255, 255, 255, 0.78)` to `rgba(…, 0.92)` —
the original frosted-glass look read too transparent over busy lists. 0.92 keeps a hint
of translucency via the backdrop-blur but anchors the bar visually.

## Motion

- **No default entry animation on SSR'd pages.** Server-rendered content is already painted; replaying a fade+slide on hydration creates perceived jank ("the page jumps in after it was already there"). Reserve entry motion for content that genuinely appears after empty state: modals, popovers, route transitions that show `loading.tsx` first.
- **Hover & focus**: 150ms color/background transitions on interactive surfaces.
- **Always** honor `prefers-reduced-motion` with `motion-reduce:transition-none` (or a no-motion variant).
- Animate `transform` and `opacity` only — never `transition: all`.
- **Form-to-success swap.** When a form submission replaces the form with a success state, coordinate the two as a paired exit/enter (not an instant swap). Form fades out 150ms `ease-out` — opacity → 0 + slight `-translate-y-1` + `pointer-events-none` mid-flight. After the timeout, the success header mounts with `motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:ease-out`. Total perceived swap ~450ms with no visual gap. Underlying principles (enter/exit → `ease-out`, under 300ms per leg, exit ~20% faster than entry, animate transform + opacity only) come from the `web-animation-design` skill.

## Component conventions

### Buttons

- **Primary action** — high-signal "do this thing now" (form submits, conversion CTAs). One per page. Guardian-style pill with an arrow icon on the right.
  ```tsx
  className="rounded-full bg-gold-hue text-white font-semibold hover:bg-gold-shade"
  // with: <ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
  ```
  Pill shape (`rounded-full`) distinguishes primary from secondary actions (`rounded-lg` lozenge) — the visual hierarchy reinforces the role hierarchy.

- **Inline subscribe action** — editorial "join this list" / "continue" CTAs (sidebar Subscribe blocks, prose-embedded actions). No fill; warmth comes from the arrow-tip icon.
  ```tsx
  className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:underline"
  // with: <ArrowRightIcon className="h-4 w-4 text-orange-hue" />
  ```

- **Inline action with hover-background** — high-leverage inline CTA that triggers a *consequential* interaction (opening a contact channel like WhatsApp, launching a one-click subscribe, kicking off a multi-step flow). Same type and color as the inline subscribe action, but the hover affordance shifts to a `navy-wash` background highlight so the CTA reads as "clickable thing" rather than "follow a thread." Use sparingly — when the inline-subscribe hover-color-change feels too quiet for the weight of the action.
  ```tsx
  className="-mx-2 -my-1 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-navy transition-colors hover:bg-navy-wash"
  // with: <ArrowRightIcon className="h-4 w-4 text-orange-hue" /> and an optional leading icon
  ```
  The `-mx-2 -my-1 px-2 py-1` pair gives the hover background room to extend without shifting the text's resting position — the link sits exactly where the inline-subscribe sibling would, until you hover and the navy-wash highlight blooms outward.

- **Secondary action** — "submit another", "go back", outlined neutral actions.
  ```tsx
  className="rounded-lg border border-navy text-navy hover:bg-navy-wash"
  ```

- **Tertiary / inline link** — editorial CTAs embedded in prose ("Submit it", coda links). The underline uses `decoration-navy-tint` (soft blue) at rest, deepens to `decoration-navy` on hover. Text color stays navy throughout — the underline carries the affordance.
  ```tsx
  className="font-medium text-navy underline underline-offset-4 decoration-navy-tint decoration-2 hover:decoration-navy"
  ```

- **Destructive**: shadcn destructive variant. White text on destructive fill.

### Pill chips

For column-level lens controls (category filters). Wrap-friendly, snug touch targets.

- **Inactive**:
  ```tsx
  className="inline-flex items-center rounded-full border border-navy-frame px-4 py-2 text-sm leading-none text-navy-tone hover:text-navy hover:border-navy-tone"
  ```
- **Active** (the light-mode highlight moment — `navy.tint`, not cyan):
  ```tsx
  className="inline-flex items-center rounded-full border border-navy bg-navy-tint px-4 py-2 text-sm leading-none text-navy font-semibold"
  ```

**Toggle behavior.** Chips on `/events` act as toggles, not radio buttons: clicking an inactive chip activates it; clicking the active chip clears the filter. There is **no "All" chip** — the empty (no active chip) state IS the unfiltered view. Use `aria-current="page"` to mark the active chip — these are `<Link>` elements that navigate to routes, so `aria-pressed` (button-only ARIA) is invalid here; `aria-current` reads correctly to AT users as "current page in a set of similar items." See *Mobile patterns* for the horizontal-scroll variant.

### Scope tabs

For page-level edition selectors (city tabs). Quieter than pill chips — these are persistent context, not active filters.

- Container: `flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-navy-frame`
- **Inactive**: `text-sm text-navy-tone border-b-2 border-transparent hover:text-navy`
- **Active**: `text-sm font-semibold text-navy border-b-2 border-navy` — navy underline. Used to use a teal hex (`#24acb5`) here; that legacy color has been retired in favor of the navy-only architectural rule.

### Site-level section nav

The strap directly below the masthead. Switches between the top-level surfaces of the publication (Articles · Events). Architectural — read as a permanent rail, not a frequently-touched filter. Hidden on mobile (`hidden md:block`); `MobileTabBar` handles small viewports.

- Container: `max-w-screen-xl mx-auto flex flex-wrap items-center gap-x-8 gap-y-1 px-8 border-b border-navy-frame` (32px horizontal inset at desktop to match `/events` content edge — see *Masthead* below)
- **Inactive**: `text-sm font-semibold uppercase tracking-[0.18em] text-navy-tone hover:text-navy border-b-2 border-transparent`
- **Active**: `text-sm font-semibold uppercase tracking-[0.18em] text-navy border-b-2 border-navy` — navy underline (architectural). The role distinction with the page-level scope tabs is now carried by typography (caps + tracking vs mixed case) and weight (semibold uppercase vs sentence-case) — both use navy active state since the cyan/teal kicker color was retired.

### Sidebar modules

Outlined editorial cards in a sidebar column (calendar block, subscribe block).

```tsx
className="rounded-lg border border-navy-frame p-5"
```
- Heading: `text-lg font-bold text-navy [font-family:var(--font-lora-bold)]`
- Body: `text-sm leading-relaxed text-muted-foreground`
- Action: inline subscribe button pattern (above)

### Empty states

Two distinct treatments, depending on cause.

- **Content-gap** (the route is genuinely empty — no events for this city/category yet). Editorial moment, organiser-acquisition opportunity.
  ```tsx
  className="rounded-lg border border-navy-frame bg-navy-veil/40 px-6 py-10 text-center"
  ```
  - Lora Bold heading: `"No upcoming [X] events"`
  - Body with inline action: `"Organising one? [Submit it] — it'll show up here."`

- **Filter-result** (transient — user filtered to nothing; just needs to clear the filter). Dashed border signals "this is a filter result, not the page's actual state."
  ```tsx
  className="rounded-md border border-dashed border-navy-frame px-6 py-10 text-center text-base leading-relaxed text-muted-foreground"
  ```

### Editorial inline link

For prose-embedded CTAs (the "Submit it →" coda, body emphasis links).
```tsx
className="font-medium text-navy underline underline-offset-4 decoration-navy-tint decoration-2 hover:decoration-navy"
```
The `navy-tint` decoration carries the affordance signal; hover deepens to `navy` for emphasis. Text stays navy throughout — reading flow uninterrupted.

### Muted reference link

For quiet inline URLs that are references, not CTAs — author bios, contributor org links inside dense paragraphs (e.g. *"named voices in the ecosystem: André Marquet (Productized)…"*), captions, partner-name lists. Editorial-print convention: dotted underline reads as "this is a reference" rather than "click me."

```tsx
className="text-navy-tone underline decoration-dotted decoration-2 underline-offset-4 transition-colors hover:text-navy dark:text-cyan-dim dark:hover:text-cyan-lifted"
```

The `navy-tone` resting colour recedes from `text-foreground` body copy so the link doesn't dominate the prose. Decoration colour tracks text colour (no explicit decoration colour needed) — hover deepens to navy and the dotted underline darkens with it. No `font-medium` weight bump so the link visually integrates with surrounding small text.

**When to reach for muted vs editorial inline link:**
- Single body CTA, the page-level "do this next" action → **editorial inline link** (solid, weighted)
- Multiple inline references stacked in one paragraph, or any link in small-text contexts (bios, captions, footnotes) → **muted reference link** (dotted, quieter)
- Six dotted links in one paragraph still works visually; six solid `editorialLink` would compete with body text.

### Badges

Meaning matters — pick the variant that communicates, don't default to "secondary."

- **Outlined gray** (`variant="outline"`): neutral categorization, no implied weight.
- **Filled navy-tint** (`bg-navy-tint text-navy`): this is the *highlighted* item. (Formerly used cyan; migrated to navy.tint per the cyan restriction.)
- **Filled green** (`bg-green-hue text-white`): approved / live / positive signal.
- **Filled orange** (`bg-orange-tint text-orange-shade`): editorial / opinion flag.

### Tables

- Header: Inter `font-medium`, `text-xs uppercase tracking-wide text-muted-foreground`
- Body: Inter
- Numerical columns: `tabular-nums`
- Hover row: `bg-navy-wash` (soft wash)
- Long text columns: `truncate max-w-[Npx]` + `title={value}` for accessibility

### Stat displays

- **Hero numbers** (page headlines): Lora Bold, `font-bold`, `text-5xl+`, `tabular-nums`, `text-navy`.
- **Secondary numbers** (section totals): Inter `text-2xl font-semibold`, `tabular-nums`.
- **Labels under numbers**: Inter, `text-xs uppercase tracking-wide text-muted-foreground`.
- **Growth deltas**: `text-green-hue` (positive) or `text-orange-hue` (decline) with arrow icon.

### Events subscribe / share coda

End-of-list moment on `/events` and its scoped variants ("you just browsed, now subscribe or share"). Two-block composition, each its own audience:

**Block 1 — Subscribe to {scope}** — personal subscription:
- Header: `Subscribe to {scope}` in caps + tracking (matches site-level section-nav register). Scope label re-points based on active city + category filter: e.g. *Software Engineering events in Lisboa*.
- Primary affordance: outlined-navy lozenge "Add to Google Calendar" (the *Secondary action* button pattern; not gold because the page's one-gold-pill is owned by the navbar Subscribe). Links to `https://www.google.com/calendar/render?cid=<encoded ics URL>` for one-click subscribe.
- Quieter alternatives below the primary: `text-xs` muted text-link row for RSS feed · Other calendars (.ics) · Copy feed URL. Each carries a small leading icon (Rss, CalendarDays, Copy/Check).

**Block 2 — Run a community or building something?** — distribution ask:
- Header: same caps + tracking treatment as block 1 for visual parity.
- Lead paragraph: benefit-framed copy that mentions the scope explicitly ("your members get curated {scope} delivered to the channel — no extra work for you").
- Direct contact: WhatsApp link in the *Inline action with hover-background* pattern, pointing at Malik's URL shortener `https://piara.li/wa?text=<encoded scope-aware message>` so the destination phone number stays out of page source. Pre-filled message survives the redirect because the `eos` Cloudflare Worker forwards inbound query params.
- Self-serve disclosure: `<details>` with `<summary>` "How to add this feed to Slack or Telegram." Inside, the `/feed subscribe <feed URL>` snippet is rendered as a click-to-copy button (a `<button>` wrapping the `<code>` with a Copy/Check icon swap and a 2s "Copied" state).

All feed URLs are scope-aware (`/events/feed.xml`, `/events/[city]/feed.xml`, `/events/[city]/[category]/feed.xml`, plus `calendar.ics` parallels). External destinations carry `target="_blank" rel="noopener"`. Hidden when filtering by a single date (date filter is transient) and when the filtered list is empty.

### Sections

A "section" is a meaningful grouping (Stats, By category, Recent activity). Each section:
- Has a heading in Inter `font-semibold`, `text-base` or `text-lg` (reserve Lora Bold for page titles, module headings, and hero numbers)
- May have a one-line subhead in `text-sm text-muted-foreground`
- Sits inside `space-y-8` (or larger) with previous/next section

### Author strap

A horizontal byline for editorial content with a known author (e.g. the "Adamastor Weekly" card on `/preferences` and `/subscribe`). Lifts the author *out* of the card so the card stays clean while still surfacing credit + credentials + a way to reach them.

- Container: `flex items-start gap-3`
- Avatar: `h-10 w-10 shrink-0 rounded-full object-cover` (~40px portrait)
- Byline: `text-xs leading-relaxed text-muted-foreground`, format `"By {Name} — {Credentials} · {SocialLink}"`
- Social link: Lucide icon + label, `inline-flex items-center gap-1`, navy color, **no underline**, `hover:underline`. The icon paired with the label (vs. an icon-only chip) keeps the link readable in body text register.

Sits between the section H2 ("Weekly Digest") and the card it credits.

### Community / credit strap

Section-level credit for content curated with sibling communities. Lives directly below the section heading + dek, above the card list.

- Pattern: `text-xs leading-relaxed text-muted-foreground` paragraph
- Copy: `"Curated with the {Community A}, {Community B}, and {Community C} communities."`
- Sits inside `space-y-4` with the H2/dek above and the card list below

Used on `/preferences` and `/subscribe` under "Topics to Follow" to credit LisboaUX, LisboaJS, and Lisbon AI Week. Parallel to the *author strap* — both are editorial credits, just at section vs item granularity.

### Sticky CTA bar

Bottom-of-viewport fixed bar that surfaces a primary form action when (a) the user has made a selection AND (b) the in-form primary action has scrolled off-screen.

- Container: `fixed inset-x-0 bottom-0 z-40 border-t border-navy-frame bg-background/95 shadow-[0_-1px_4px_-2px_rgba(8,41,58,0.05)] backdrop-blur-sm`
- Inner: `mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 md:px-8`
- Left: tight selection summary (e.g. "Adamastor Weekly + 1 topic"), `text-xs font-medium text-navy`
- Right: primary action — same gold pill as the in-form submit, with the `form="<form-id>"` attribute so the button submits the offscreen form
- Mount animation: `motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300 motion-safe:ease-out`
- Gating: visibility tracked via `IntersectionObserver` on the in-form submit row. Bar hides when submit re-enters the viewport. Also gated on `!leaving && !done` so it dismounts during the form fade-out and never lingers over the success state.

Subtle shadow only — never enough to compete with page content. Used on `/subscribe`.

### Editorial AlertDialog

The shadcn `AlertDialog` defaults visually emphasize the action button. For dialogs that should encourage the user to *stay* (leave-page guards, discard-changes prompts), flip the hierarchy.

- Title: Lora Bold, navy, `text-2xl font-bold leading-tight [font-family:var(--font-lora-bold)]`
- Description: surface concrete state ("You're one click away from Adamastor Weekly + 1 topic.") so the user sees what they'd lose, not just an abstract warning
- Content border: override to `border-navy-frame` to match the page-level border tone
- **Cancel button** (the wanted action — "Stay and subscribe"): gold pill, `rounded-full bg-gold-hue font-semibold text-white hover:bg-gold-shade`, includes the arrow icon (mirrors the in-form submit)
- **Action button** (the unwanted action — "Leave anyway"): quiet text link, `bg-transparent text-sm text-muted-foreground hover:bg-transparent hover:text-navy hover:underline` — never destructive red (red signals an error or harm; this is just the less-preferred path, not a destructive one)

Used on `/subscribe` as the in-app navigation guard, paired with a `beforeunload` listener for tab close + URL-bar nav (browsers show their generic prompt for those — we can only style what we render).

### Personalized greeting + pre-filled identity hint

Two paired patterns for surfaces that "remember" the visitor via `lib/user-identity.ts` localStorage (`adamastor:identity:v1`).

**Greeting in H1.** When a first name is known (from a previously-submitted form), the page H1 personalizes:

- `"Submit your event, Malik"` (on `/events/submit`)
- `"Subscribe to Adamastor, Malik"` (on `/subscribe`)
- `"Hi Malik — manage your subscriptions"` (on `/preferences`, token-loaded)

Snapshot the first name on mount so the H1 doesn't react to live edits in the form below it. Always falls back to the un-personalized H1 when no identity is saved.

**Pre-filled identity hint.** When form fields hydrate from saved identity, surface a small hint above them — pre-fill should never be silent (avoids stale-email risk + handles shared-device case honestly):

```tsx
<p className="text-xs text-muted-foreground">
  Pre-filled from your last visit.{" "}
  <button type="button" onClick={handleNotYou}
    className="font-medium text-navy underline underline-offset-4 decoration-navy-tint decoration-2 hover:decoration-navy">
    Not you?
  </button>
</p>
```

Gated on `isPrefilledNow` (saved identity matches current inputs) — disappears the moment the user edits a field. "Not you?" calls both `clearSavedIdentity()` and `clearSubscribed()` (different person = both flags reset) and empties the inputs.

**Auth precedence.** When the page has a profile-locked email (authenticated user), the locked email always wins over localStorage. Pre-fill the name from localStorage *only* when the saved identity's email matches the locked email — otherwise we'd put one person's name next to another person's email with no escape hatch.

## Page-level patterns

### Brand strip

Every page in the main layout starts with a 5px navy bar:
```tsx
<div className="bg-navy dark:bg-cyan-lifted w-full h-[5px]" />
```
This is the brand mark at the page level — architectural, restrained.

### Masthead

Three-column row immediately below the brand strip. Editorial / print-newspaper register — the publication's identity, not a control panel.

- **Left column**: editorial strapline (the publication's voice). Lora Bold italic, `text-sm`, `text-navy`, `max-w-48`, `[text-wrap:balance]` for clean two-line wrap. Cap-aligned with the centered wordmark via a small `translate-y` nudge.
- **Center column**: ADAMASTOR wordmark (`/adamastorLogotype.svg`, `w-40`) wrapped in a `Link href="/"`. The SVG fill is `#104357` (brand navy) — match this when commissioning new wordmark variants.
- **Right column**: gold Subscribe pill + Account dropdown. Gold pill is the page-level primary action moment (`bg-gold-hue rounded-full`); the Account `HoverCard` only renders for logged-in users.
- **Horizontal inset**: `px-4` on mobile, `md:px-8` on desktop (32px content edge — see *Spacing & layout* note on the doubled-padding convention).
- The Site-level section nav strap renders directly below this row.

```
─── 5px navy strip ─────────────────────────────────────
│ tagline (left)       ADAMASTOR        Subscribe·Acct │
─── site section strap (Articles · Events) ────────────
│  page content                                         │
```

### Page borders

Single border tone: `border-navy-frame`. Used by:
- Navbar bottom border
- Footer top border
- Sidebar module outlines
- Empty state containers
- Calendar card
- The events list rail
- Filter chip outlines (inactive)

Resist introducing other border tones (no orange borders, no green borders, no dashed-as-decoration). Cohesion comes from the one-tone rule.

### Footer

Three-row mid-weight editorial composition:

1. **Editorial ask** — top row on white. The page's secondary conversion ask, currently "Submit your event," rendered in the *Inline action with hover-background* button pattern.
2. **Three-column grid** — middle row, hairline-separated above and below. Composition: brand colophon (Adamastor sea-creature mark, ~48px) | "Our projects" (sibling community links with UTMs — `?utm_source=adamastor&utm_medium=footer&utm_campaign=cross_link`) | "Follow us" (social channels with Lucide icons inline). The Adamastor seal is an inlined SVG component (`<AdamastorMark>`) with a click-triggered Easter egg animation — see *Brand marks* below.
3. **Tagline strap** — Lora Bold italic centered editorial signature ("Only You Know Who You Can Be"). The publication's closing brand moment, distinct from the masthead tagline which describes *what we do*; this one says *what we believe*.
4. **Copyright row** — small utility row at the bottom: `© Adamastor` left, `About us` link right.

External social and project links carry `rel="noopener" target="_blank"` (plus `rel="me noopener"` on social profiles for IndieWeb h-card discovery). The horizontal inset matches the *Content edge on desktop = 32px* convention.

**Clickability conventions.** Most visible elements in the footer carry a click affordance, with one deliberate exception:
- The `AdamastorMark` is **NOT** wrapped in a Link, despite the universal footer-logo-to-home convention. The seal owns a click-triggered rainbow easter egg (SMIL animation inside `AdamastorMark.tsx`) — wrapping it in a Link would intercept the click and navigate before the animation fires. Brand moment > convention here.
- Section headings *link to their primary destination where one exists*: "Browse Events" → `/events`, "Follow Us" → `/subscribe`. "Our Projects" stays as a plain label because the projects below ARE the destinations — forcing a heading link would mis-direct.
- The tagline ("Only You Know Who You Can Be") wraps in a `<Link href="/about">` with a subtle hover-underline (`hover:underline underline-offset-4 decoration-navy-tint decoration-2`). The italic Lora register and centering stay — the affordance is restrained, the brand moment is preserved.
- Text-link touch targets: `FOOTER_LINK` is `inline-block py-1.5 …` so `text-sm` links grow from ~17px tall (text-only bounding box) to ~32px tall. Matches the *Touch targets* guidance under *Mobile patterns*.

### Brand marks

Four image assets in [`public/`](../public):

- `adamastorLogotype.svg` — light-mode wordmark, fill `#104357` (brand navy).
- `adamastorLogotypeDark.svg` — dark-mode wordmark, fill `#e3f3f7`.
- `adamastorMark.svg` — light-mode sea-creature symbol mark, fill `#104357`. The Adamastor of Camões' *Os Lusíadas* — the giant who guards the Cape, here repositioned as a gatekeeper for Portuguese startup discovery.
- `adamastorMarkDark.svg` — dark-mode sea-creature symbol mark, white fill for navy surfaces.

The **wordmark** anchors the masthead, centered, `w-40`. The **symbol mark** appears in the footer (~48px height, left of the three-column grid) as an inlined SVG component — `components/AdamastorMark.tsx` — driven by `currentColor` so it tracks light/dark mode via Tailwind text-utility classes. On click, the seal runs a sea-themed rainbow gradient animation (Easter egg) — see the component for the SMIL implementation. Don't recolor or restyle the marks per-page; use the component as-is.

### Editorial portrait duotone

For founder/contributor portraits in editorial mastheads (currently `/about`'s "Who Runs Adamastor" cards). Maps photo luminance to a two-stop navy gradient so all portraits read as one monotone editorial set, no matter the source photo's colour balance.

Inline at the top of the page that uses it (so the filter ships with that page only):

```tsx
<svg aria-hidden="true" focusable="false" className="absolute h-0 w-0" style={{ position: "absolute", width: 0, height: 0 }}>
  <defs>
    <filter id="duotone-navy-portrait" colorInterpolationFilters="sRGB">
      <feColorMatrix
        type="matrix"
        values="0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0      0      0      1 0"
      />
      <feComponentTransfer>
        <feFuncR type="table" tableValues="0.008 0.910" />
        <feFuncG type="table" tableValues="0.063 0.941" />
        <feFuncB type="table" tableValues="0.102 0.957" />
      </feComponentTransfer>
    </filter>
  </defs>
</svg>
```

Two-step pipeline:
1. **`feColorMatrix`** desaturates to grayscale using Rec. 709 luminance weights (perceptually accurate B&W, not the channel-average grayscale the `grayscale` CSS filter uses).
2. **`feComponentTransfer`** remaps the grayscale range per channel to a navy gradient: darks → `#02101A` (near-black extension of the navy family beyond `navy.deep`, crushes shadows), lights → `navy.frame` (`#E8F0F4`, the brand atmospheric near-white). Result: editorial punchy duotone in the brand palette.

Apply to `<Image>` via inline style: `style={{ filter: "url(#duotone-navy-portrait)" }}`. Works on already-B&W source photos because step 1 desaturates first.

**Why SVG over CSS `filter: grayscale(1)`**: CSS grayscale only desaturates; you can't remap the resulting tonal range to specific brand colours. Mix-blend-mode overlays approximate the look but muddy midtones. Per-channel `feComponentTransfer` is the only correct path to a real duotone.

### Navigation hierarchy

- **Site-level section nav** (chrome-level): "which surface of the publication am I in?" — Articles vs Events. Renders in the masthead strap. Style: site-level section nav pattern. Navy active underline + caps tracking.
- **Scope tabs** (page-level): "which edition am I in?" — city, language, region. Render outside the main grid. Style: scope-tab pattern. Navy active underline.
- **Lens chips** (column-level): "what am I filtering by?" — category, type, status. Render inside the main column. Style: pill-chip pattern (toggle behavior).
- **Inline link** (prose-level): "follow this thread" — embedded CTAs in body copy. Style: editorial inline link.

Don't conflate them — treating a scope tab the same as a lens chip makes the page feel control-panel-y instead of editorial. Each level has a distinct typographic and color signature so the eye can read the hierarchy at a glance.

### Editorial about page template

The canonical composition for the publication's masthead-and-manifesto page (currently `/about`). Editorial register first, no SaaS team grid.

```
─── 5px navy strip ─────────────────────────────
─── masthead + section strap ───────────────────
│  mx-auto max-w-screen-lg space-y-16 md:p-4    │
│  ┌──────────────────────────────────────────┐ │
│  │ Hero — manifesto                         │ │
│  │   <h1>Lora · text-4xl/5xl · balance</h1> │ │
│  │   <p>strapline · Lora italic · balance</p>│ │
│  │   3 prose paragraphs (cape myth, what    │ │
│  │   we follow, why we exist)               │ │
│  ├──────────────────────────────────────────┤ │
│  │ Editorial — What We Publish              │ │
│  │   2-col grid, Lora H3 + body + CTA       │ │
│  │   (the editorial highlight — sits        │ │
│  │   directly after manifesto)              │ │
│  ├──────────────────────────────────────────┤ │
│  │ Our Beats — What We Cover                │ │
│  │   2-col dl, Lora-sized dt + prose dd     │ │
│  ├──────────────────────────────────────────┤ │
│  │ The Masthead — Who Runs X                │ │
│  │   origin paragraph + 3-col founder grid  │ │
│  │   (duotone photo + name+icons + bio)     │ │
│  ├──────────────────────────────────────────┤ │
│  │ Wider Network — Curated with Community   │ │
│  │   single paragraph with mutedLink partners│ │
│  ├──────────────────────────────────────────┤ │
│  │ Get in Touch                             │ │
│  │   2-col card grid (rounded-lg            │ │
│  │   border-navy-frame p-5)                 │ │
│  └──────────────────────────────────────────┘ │
```

**Layout primitives:**
- Page wrapper: `mx-auto max-w-screen-lg space-y-16 md:p-4` (narrower than `/events` because this is text-heavy; reads more comfortably at publication line lengths)
- Section dividers: `border-t border-navy-frame pt-12` (every section after the hero)
- Section spacing: `space-y-6` (default), `space-y-8` for sections containing modular cards that need more breathing room
- Section heading group: kicker label (`text-xs uppercase tracking-[0.18em] text-navy-tone`) + Lora H2 (`text-2xl md:text-3xl font-bold text-navy [font-family:var(--font-lora-bold)] [text-wrap:balance]`)
- Paragraph max-widths: `65ch` for hero body, `60-65ch` for section paragraphs (keep reading-line lengths editorial)

**Masthead card pattern:**
- Photo: square `rounded-md` with `border border-navy-frame` ring, `object-cover`, runs through the `duotone-navy-portrait` SVG filter
- Name row: `flex flex-wrap items-baseline justify-between` — Lora Bold name on the left, social-icon row on the right (`text-navy-tone hover:text-navy`, icons `h-4 w-4` from `lucide-react: Linkedin, Twitter, Globe`)
- Bio: prose paragraph (`text-base leading-relaxed text-muted-foreground`) incorporating external roles narratively, not a role list. Per the *AI-tic red flags* section: no closer aphorism on the bio
- Origin paragraph above the founder grid carries the "how we came to be" beat with attributed contributions

**Editorial output cards (What We Publish):**
- Each as an `<article>` with Lora H3 (`text-xl font-bold text-navy [font-family:var(--font-lora-bold)] [text-wrap:balance]`)
- Body paragraph (`text-base leading-relaxed text-foreground`) max-w-[55ch]
- Optional inline CTA underneath

**Don't bring in:**
- SaaS-y team-page elements (job titles in big chips, "We're hiring!" CTAs, social-link buttons as full pills)
- Role lists with bullet points — incorporate external roles into prose bios
- Marketing buzzword closers ("X is more than Y, it's Z") — see *AI-tic red flags*

### Form-page template

The canonical composition for standalone form pages — currently `/events/submit`, `/subscribe`, and `/preferences`. Encodes the relationship between H1, optional trust aside, outlined form module, and the primary submit row.

```
─── 5px navy strip ─────────────────────────────
─── masthead + section strap ───────────────────
│  mx-auto max-w-2xl space-y-8 md:p-4           │
│  ┌──────────────────────────────────────────┐ │
│  │ <header>                                 │ │
│  │   <h1>Lora Bold · text-3xl · navy</h1>   │ │
│  │   <p>dek · text-base muted</p>           │ │
│  │ </header>                                │ │
│  ├──────────────────────────────────────────┤ │
│  │ <aside> (optional trust strip)           │ │
│  │   bg-navy-veil/40 p-5                    │ │
│  ├──────────────────────────────────────────┤ │
│  │ <form>                                   │ │
│  │   space-y-6 rounded-lg                   │ │
│  │   border-navy-frame p-6                   │ │
│  │   [sections, <Separator/>, etc.]         │ │
│  │   ┌──────────────────────────────────┐   │ │
│  │   │ submit row · justify-end         │   │ │
│  │   │   gold pill + ArrowRightIcon     │   │ │
│  │   └──────────────────────────────────┘   │ │
│  │ </form>                                  │ │
│  └──────────────────────────────────────────┘ │
```

**Layout primitives:**
- Page wrapper: `mx-auto max-w-2xl space-y-6 md:space-y-8 md:p-4` — 24px outer rhythm on mobile, 32px on desktop with the doubled-padding 32px content edge
- Header: `space-y-3 pb-2 pt-2` containing Lora H1 (`text-2xl md:text-3xl font-bold tracking-tight leading-tight text-navy [text-wrap:pretty] [font-family:var(--font-lora-bold)]`) + dek (`text-sm md:text-base leading-snug md:leading-relaxed text-muted-foreground max-w-[60ch] [text-wrap:pretty]`) — compacted type on mobile per *Mobile patterns*
- Optional trust aside (`/events/submit` uses one with founder faces; `/preferences` skips it): `flex flex-col sm:flex-row items-start gap-4 rounded-lg bg-navy-veil/40 p-5` — stacks vertically on mobile so the text column gets full width (otherwise the avatar trio crowds it to ~243px)
- Form module: `space-y-6 md:rounded-lg md:border md:border-navy-frame md:p-6` — outlined card *at `md:+` only*. On mobile the form renders unframed, edge-to-edge against the page padding, so it reads as the page rather than a card-in-a-page. Sections inside are separated by their own `<h3>` heads (Inter `text-sm font-semibold text-navy`), **not** by `<Separator />` — the heading carries the break.
- Submit row: `flex justify-end` with the gold pill (`rounded-full bg-gold-hue font-semibold text-white hover:bg-gold-shade`) + `ArrowRightIcon className="ml-2 h-4 w-4"`

**Why this composition.** The H1 + dek lead. The aside (when present) carries trust/context (e.g. "Reviewed by Afonso, Carlos & Malik" on `/events/submit`). The outlined module contains the whole form so it reads as one editorial card, not a stack of sub-cards. The gold pill submit is the page's one conversion moment.

**Variants:**
- **Submit-only** (`/subscribe`, `/events/submit`): single form module, single gold pill, success state replaces the form via the *form-to-success swap* motion pattern.
- **Manage-existing** (`/preferences`): adds a quiet inline destructive secondary action ("Unsubscribe from everything") next to the gold pill — destructive treatment lives in the confirmation dialog, not the trigger.
- **Sticky-CTA-augmented** (`/subscribe`): adds the *Sticky CTA bar* when the in-form Subscribe is off-screen and the user has selections.

**Identity-aware behavior.** Form-page templates that collect name + email integrate with `lib/user-identity.ts` for the *personalized greeting + pre-filled identity hint* pattern. Auth-locked email (from an authenticated profile) always wins over localStorage; pre-fill the name from localStorage *only* when the saved identity matches the locked email.

## Implementation

### Where tokens live

- **Tailwind tokens** in [`tailwind.config.ts`](../tailwind.config.ts) — extends the default color theme with the brand keys (`navy-*`, `cyan-*`, `gold-*`, `orange-*`, `green-*`) using painter's-vocabulary variants. Use as utility classes.
- **Fonts** in [`styles/fonts.ts`](../styles/fonts.ts), wired via CSS variables. Use as `[font-family:var(--font-lora-bold)]` etc.
- **Shadcn theme tokens** (background, foreground, muted, etc.) in [`styles/globals.css`](../styles/globals.css). Use as `bg-background`, `text-muted-foreground`.

### Adding a new color

1. Confirm it's actually needed — the existing palette is wide. Most "new color" requests should resolve into a `tint` or `wash` of an existing family.
2. If you do need a new variant, define it in OKLCH first to ensure the character matches the system (target L=0.88 C=0.07 for tints, L=0.94 C=0.03 for washes), then convert to hex.
3. Add the token + hex to the family table above with a clear "use" column.
4. Wire it in `tailwind.config.ts` under the appropriate family.
5. Note its dark-mode behavior in the table if non-trivial.

### Adding a new component convention

1. Add a short section to "Component conventions" above with the visual rule.
2. Implement once in shared components if it's truly reusable; otherwise document the inline pattern so future uses match.

### Outbound link UTM tracking

All outbound cross-links to partner orgs and the founders' sibling projects use a consistent UTM scheme so destinations can attribute Adamastor traffic correctly in their analytics:

```
?utm_source=adamastor.blog&utm_medium=<page>&utm_campaign=cross_link
```

- **`utm_source=adamastor.blog`** — the canonical source identifier. Matches the actual domain (third-party analytics tools typically aggregate by domain string, so destinations see Adamastor's traffic correctly attributed even when many referrers are mixed in their reports).
- **`utm_medium=<page>`** — names the page the link came from (`footer`, `about`, etc.).
- **`utm_campaign=cross_link`** — the campaign value used across all editorial cross-link contexts. Distinguishes our partnership/credit cross-links from any future paid or campaign-specific traffic.

**Apply UTMs to:**
- Partner / community org links in the Wider Network section, Opinion-contributor org callouts, footer "Our projects" column.
- Founder personal sites and projects surfaced in masthead bios (e.g. `moonwith.com`, `hackaboa.com`).

**Skip UTMs on:**
- Personal social profiles (LinkedIn, X, GitHub) — these are identity pages, not analytics destinations, and UTM params clutter personal-profile URLs in a way users may find off-putting.
- Internal links (`/subscribe`, `/events/submit`, etc.) — own-domain.
- `mailto:` links.

Site-wide instance count as a reference: ~16 outbound UTM-tagged links across the about page and footer at time of writing. If that grows past ~30, consider centralising the UTM builder into a small helper (`buildCrossLinkUrl(href, medium)`) rather than inlining the query string everywhere.

## Known limitations / open questions

- **Cyan deprecation.** Cyan is currently restricted to dark-mode anchoring and rare brand-moment hues. Open question: should we deprecate it entirely (move dark-mode anchors to navy-family tones via a different naming scheme), or keep cyan as a specifically-cool brand counterpoint that's reserved for hero / "wow" beats only?
- **Stray colors in 3rd-party tool CSS.** `styles/prosemirror.css` (TipTap selected-node outline = `#5abbf7`), `styles/globals.css` HighlightJS keyword color (`#70cff8`), and the mobile-tab-bar dark active state (`#4ce4f0`, which is `cyan-glow`'s hex but in raw CSS) — all outside the Tailwind token system. Pending decision: introduce CSS variables in `globals.css` `:root` / `.dark` blocks so these can reference brand tokens.
- **`event-category-selector.tsx` chip.** Still uses hardcoded brand-cyan hex values in its className (`bg-[#DFF6F8]`, `border-[#04C9D8]/30`). Should migrate to use brand tokens with Tailwind opacity syntax.
- **`#24acb5` retired** (was the legacy teal kicker color). All usages migrated to `text-navy-tone` / `text-navy` / `border-navy`. Watch for re-introduction.
- **Dark mode coverage** is currently handled per-usage with `dark:` variants. If usage grows further, migrate to HSL CSS variables defined in `.dark` blocks for cleaner theme switching.
- **No semantic alias layer** (e.g., `bg-success` → `bg-green-hue`). Worth adding if components want to be theme-agnostic; not needed today.
- **Shadcn `<Card>`** still appears in some legacy surfaces — prefer the sidebar-module outlined pattern for new work and migrate Card usage opportunistically.
- **`navy-deep`, `green-tint`, `green-wash`** have zero current consumers. Defined for system consistency; OK to use when needed.
- **Sub-CTA link pattern inconsistency** (flagged on `/about`'s Editorial section + Get-in-Touch cards). Three patterns currently used for "go to this form" CTAs:
  - *Inline action with hover-background* (`-mx-2 -my-1 px-2 py-1 rounded-md hover:bg-navy-wash` + arrow): the footer "Submit your event" link and the About-page Events card. Heaviest affordance.
  - *Editorial inline link* (solid `decoration-2 navy-tint` underline + arrow): the About-page "Subscribe to the Weekly" link and the Editorial card's email.
  - *Muted reference link* (dotted, navy-tone): everywhere else.

  Open question: should "Subscribe to the Weekly" use the same hover-background pattern as "Submit your event" (consistent register for sub-CTAs that route to forms), or keep the underline-led editorial inline link? Currently leaning toward inline-action-with-hover-background for both, since they're parallel actions structurally. Resolve before any new sub-CTA lands so we don't pile up a third precedent.
