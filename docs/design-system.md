# Adamastor Design System

The source of truth for how Adamastor looks and feels. Update this doc when we change a brand decision; treat it as canonical when in doubt.

## Voice

Editorial / publication-grade. Adamastor is a digital publication, not a SaaS dashboard — the UI should feel **written, not generated**.

- Generous whitespace
- Distinctive typography
- Color used with intention, never as decoration
- Modular containers that breathe with their content (not forced uniformity)
- Headings carry the page; numbers are pull-quotes

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

## Color tokens

Each token has a single purpose. Don't reach for a hex outside this scale.

### Navy — architectural

Used for: headings, structural text, framing, dividers, links, dots, all page-level borders. Adamastor's primary brand color.

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `navy-darker` | `#08293A` | `bg-navy-darker` | Deepest navy. Reserved — high-emphasis text on light bg. |
| `navy` | `#104357` | `bg-navy` | Primary navy. Headings, links, structural elements, brand strip. |
| `navy-pastel` | `#4D7689` | `bg-navy-pastel` | Muted navy. Secondary text (inactive tabs, calendar weekday headers, table headers). |
| `navy-faded` | `#E8F0F4` | `bg-navy-faded` | Soft navy wash. All page-level borders, hover backgrounds, empty-state fills. |

### Cyan — emphasis

Used for: **active state and emphasis only**. Active filter chip, selected calendar day, body-emphasis underlines. **Never decoration.** Treat cyan exactly like the Guardian uses yellow.

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `cyan-darker` | `#028E97` | `bg-cyan-darker` | Active-state text on cyan-faded fills. Selected calendar day text. |
| `cyan` | `#04C9D8` | `bg-cyan` | Active-state border. Editorial inline-link underline decoration. |
| `cyan-pastel` | `#9DE8EF` | `bg-cyan-pastel` | Soft cyan. Rarely used; secondary highlights. |
| `cyan-faded` | `#DFF6F8` | `bg-cyan-faded` | Active-state fill (chips, selected calendar cell). |

> **Open: `#24acb5` legacy hex.** Article kicker labels (e.g. "WEEKLY DIGEST" on `/`) and the active city scope tab on `/events` currently use the hardcoded hex `#24acb5` — a mid-tone cyan that sits between `cyan-darker` and `cyan` but does not match either. It predates the token consolidation. Three close-but-distinct cyans now exist on the brand surface (this hex + `cyan-darker` + `cyan`); pending decision is whether to fold `#24acb5` into the scale, replace it with `cyan-darker`, or move the kicker role to `orange-dark` per rule 3 below. See *Known limitations / open questions*.

### Gold — primary action

Used for: **primary action button fill** — the high-signal "do this thing" moments (form submits, conversion CTAs). One per page, max. Warm, editorial, distinct from orange's accent role.

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `gold-dark` | `#B8893A` | `bg-gold-dark` | Hover/pressed state of primary action buttons. |
| `gold-main` | `#D4A657` | `bg-gold-main` | Primary action button background. Form submits. |
| `gold-pastel` | `#EDD2A0` | `bg-gold-pastel` | Soft gold. Rare — atmospheric warmth on a "you did it" moment. |
| `gold-faded` | `#FAF3E2` | `bg-gold-faded` | Pale wash. Section backgrounds for confirmation/success surfaces. |

### Orange — editorial accent

Used for: **inline accent** — arrow-tip icons on Subscribe/Continue links, opinion-piece kickers, "from the editor" notes. **Not a button fill** (that's gold's role). Not a generic UI accent.

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `orange-dark` | `#BD5318` | `bg-orange-dark` | Deep orange. Opinion kicker, byline accent. |
| `orange-main` | `#E05E00` | `bg-orange-main` | Primary orange. Inline accent (arrow-tip icon on Subscribe). |
| `orange-bright` | `#FF7F0F` | `bg-orange-bright` | Bright orange. High-emphasis warmth. |
| `orange-pastel` | `#F9B376` | `bg-orange-pastel` | Soft orange. Subtle warmth, hover. |
| `orange-faded` | `#FEF9F5` | `bg-orange-faded` | Cream wash. Section background for opinion content. |

### Green — positive momentum

Used for: growth deltas (`+5 this week`), success states, approval signals, "event live" badges. **Not** for generic "online/ok" — too dilute. Reserved for *good news*.

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `green-dark` | `#236925` | `bg-green-dark` | Deep green. Growth headings, success kicker. |
| `green-main` | `#3DB540` | `bg-green-main` | Primary green. Growth deltas, success badges, approvals. |

### Neutrals

Use Tailwind's built-in `gray-*` and the existing shadcn theme tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`). Don't invent custom neutrals.

## Color usage rules

1. **One cyan moment per fold.** A page should have one cyan signal that demands the eye — typically the active filter chip or the selected calendar day. Multiple persistent cyan accents compete and the highlight value dies. *Hover states don't count* — hover emphasis is transient; the rule is about always-on visual signal. **Open exception:** kicker labels on `/` ("WEEKLY DIGEST" on every article) currently render in a cyan-ish hex (`#24acb5`) — one cyan-ish moment per card, multiple per fold. Pending decision: revise the rule to allow a separate "kicker" cyan role, soften it to "one cyan *highlight* moment per fold," or move kickers to `orange-dark` per rule 3.
2. **Gold is the action color.** Form-submit buttons and the rare high-signal conversion CTA use `bg-gold-main`. One per page, max. Hover to `bg-gold-dark`.
3. **Orange is an inline accent, never a button fill.** Use `text-orange-main` for the arrow-tip on a Subscribe link, an opinion kicker, or a byline accent. Don't use `bg-orange-main` as a button background — that's gold's job.
4. **Navy frames everything.** All page-level borders (navbar, footer, modules, rails, calendar card) use `border-navy-faded`. Links and structural lines use `text-navy` / `bg-navy`. One consistent border tone across the page.
5. **Don't mix orange and green** on the same screen unless the content explicitly warrants both signals (e.g., a content type indicator + a growth delta).
6. **Pastels and faded shades are atmosphere**, never primary signal. Use them as washes, hovers, soft backgrounds.
7. **Test in dark mode.** Each color must have a working dark-mode counterpart, even if a page primarily renders light. Today this is handled per-usage with `dark:` variants; if pain accumulates, migrate to HSL CSS variables wired into the `.dark` block in [`globals.css`](../styles/globals.css).

## Spacing & layout

- Vertical rhythm: **32px (2rem)** between major sections, **16px (1rem)** within.
- Public surfaces cap at `max-w-screen-xl` (1280px); text-heavy pages (single articles, forms) cap further at `max-w-screen-lg` (1024px) or narrower. Admin uses available width up to `max-w-screen-2xl`.
- **Section dividers**: `navy-faded` hairline. Never multiple border tones on the same page.
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

## Motion

- **No default entry animation on SSR'd pages.** Server-rendered content is already painted; replaying a fade+slide on hydration creates perceived jank ("the page jumps in after it was already there"). Reserve entry motion for content that genuinely appears after empty state: modals, popovers, route transitions that show `loading.tsx` first.
- **Hover & focus**: 150ms color/background transitions on interactive surfaces.
- **Always** honor `prefers-reduced-motion` with `motion-reduce:transition-none` (or a no-motion variant).
- Animate `transform` and `opacity` only — never `transition: all`.

## Component conventions

### Buttons

- **Primary action** — high-signal "do this thing now" (form submits, conversion CTAs). One per page. Guardian-style pill with an arrow icon on the right.
  ```tsx
  className="rounded-full bg-gold-main text-white font-semibold hover:bg-gold-dark"
  // with: <ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
  ```
  Pill shape (`rounded-full`) distinguishes primary from secondary actions (`rounded-lg` lozenge) — the visual hierarchy reinforces the role hierarchy.

- **Inline subscribe action** — editorial "join this list" / "continue" CTAs (sidebar Subscribe blocks, prose-embedded actions). No fill; warmth comes from the arrow-tip icon.
  ```tsx
  className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-cyan-darker"
  // with: <ArrowRightIcon className="h-4 w-4 text-orange-main" />
  ```

- **Inline action with hover-background** — high-leverage inline CTA that triggers a *consequential* interaction (opening a contact channel like WhatsApp, launching a one-click subscribe, kicking off a multi-step flow). Same type and color as the inline subscribe action, but the hover affordance shifts to a `navy-faded` background highlight so the CTA reads as "clickable thing" rather than "follow a thread." Use sparingly — when the inline-subscribe hover-color-change feels too quiet for the weight of the action.
  ```tsx
  className="-mx-2 -my-1 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-navy transition-colors hover:bg-navy-faded"
  // with: <ArrowRightIcon className="h-4 w-4 text-orange-main" /> and an optional leading icon
  ```
  The `-mx-2 -my-1 px-2 py-1` pair gives the hover background room to extend without shifting the text's resting position — the link sits exactly where the inline-subscribe sibling would, until you hover and the navy-faded highlight blooms outward.

- **Secondary action** — "submit another", "go back", outlined neutral actions.
  ```tsx
  className="rounded-lg border border-navy text-navy hover:bg-navy-faded"
  ```

- **Tertiary / inline link** — editorial CTAs embedded in prose ("Submit it", coda links).
  ```tsx
  className="font-medium text-navy underline underline-offset-4 decoration-cyan decoration-2 hover:text-cyan-darker"
  ```

- **Destructive**: shadcn destructive variant. White text on destructive fill.

### Pill chips

For column-level lens controls (category filters). Wrap-friendly, snug touch targets.

- **Inactive**:
  ```tsx
  className="inline-flex items-center rounded-full border border-navy-faded px-4 py-2 text-sm leading-none text-navy-pastel hover:text-navy hover:border-navy-pastel"
  ```
- **Active** (the cyan moment):
  ```tsx
  className="inline-flex items-center rounded-full border border-cyan bg-cyan-faded px-4 py-2 text-sm leading-none text-cyan-darker font-semibold"
  ```

**Toggle behavior.** Chips on `/events` act as toggles, not radio buttons: clicking an inactive chip activates it; clicking the active chip clears the filter. There is **no "All" chip** — the empty (no active chip) state IS the unfiltered view. Use `aria-pressed` to communicate toggle state on the `<Link>`.

### Scope tabs

For page-level edition selectors (city tabs). Quieter than pill chips — these are persistent context, not active filters.

- Container: `flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-navy-faded`
- **Inactive**: `text-sm text-navy-pastel border-b-2 border-transparent hover:text-navy`
- **Active**: `text-sm font-semibold text-[#24acb5] border-b-2 border-[#24acb5]` — cyan-ish underline. This carries the page-level "one cyan moment" because the site-level section nav above it now owns the navy underline (see *Site-level section nav* below).

> **Open:** the active hex `#24acb5` is the legacy kicker color, not a brand token. See the open question on `#24acb5` in the *Cyan* section.

### Site-level section nav

The strap directly below the masthead. Switches between the top-level surfaces of the publication (Articles · Events). Architectural — read as a permanent rail, not a frequently-touched filter. Hidden on mobile (`hidden md:block`); `MobileTabBar` handles small viewports.

- Container: `max-w-screen-xl mx-auto flex flex-wrap items-center gap-x-8 gap-y-1 px-8 border-b border-navy-faded` (32px horizontal inset at desktop to match `/events` content edge — see *Masthead* below)
- **Inactive**: `text-sm font-semibold uppercase tracking-[0.18em] text-navy-pastel hover:text-navy border-b-2 border-transparent`
- **Active**: `text-sm font-semibold uppercase tracking-[0.18em] text-navy border-b-2 border-navy` — navy underline (architectural). The role distinction with the page-level scope tabs is carried by typography (caps + tracking vs mixed case) and color (navy active vs cyan-ish active).

### Sidebar modules

Outlined editorial cards in a sidebar column (calendar block, subscribe block).

```tsx
className="rounded-lg border border-navy-faded p-5"
```
- Heading: `text-lg font-bold text-navy [font-family:var(--font-lora-bold)]`
- Body: `text-sm leading-relaxed text-muted-foreground`
- Action: inline subscribe button pattern (above)

### Empty states

Two distinct treatments, depending on cause.

- **Content-gap** (the route is genuinely empty — no events for this city/category yet). Editorial moment, organiser-acquisition opportunity.
  ```tsx
  className="rounded-lg border border-navy-faded bg-navy-faded/40 px-6 py-10 text-center"
  ```
  - Lora Bold heading: `"No upcoming [X] events"`
  - Body with inline action: `"Organising one? [Submit it] — it'll show up here."`

- **Filter-result** (transient — user filtered to nothing; just needs to clear the filter). Dashed border signals "this is a filter result, not the page's actual state."
  ```tsx
  className="rounded-md border border-dashed border-navy-faded px-6 py-10 text-center text-base leading-relaxed text-muted-foreground"
  ```

### Editorial inline link

For prose-embedded CTAs (the "Submit it →" coda, body emphasis links).
```tsx
className="font-medium text-navy underline underline-offset-4 decoration-cyan decoration-2 hover:text-cyan-darker"
```
The cyan-decoration underline is the body-emphasis signal — it works inline without breaking reading flow.

### Badges

Meaning matters — pick the variant that communicates, don't default to "secondary."

- **Outlined gray** (`variant="outline"`): neutral categorization, no implied weight.
- **Filled cyan** (`bg-cyan-faded text-cyan-darker`): this is the *highlighted* item.
- **Filled green** (`bg-green-main text-white`): approved / live / positive signal.
- **Filled orange** (`bg-orange-pastel text-orange-dark`): editorial / opinion flag.

### Tables

- Header: Inter `font-medium`, `text-xs uppercase tracking-wide text-muted-foreground`
- Body: Inter
- Numerical columns: `tabular-nums`
- Hover row: `bg-navy-faded` (soft wash)
- Long text columns: `truncate max-w-[Npx]` + `title={value}` for accessibility

### Stat displays

- **Hero numbers** (page headlines): Lora Bold, `font-bold`, `text-5xl+`, `tabular-nums`, `text-navy`.
- **Secondary numbers** (section totals): Inter `text-2xl font-semibold`, `tabular-nums`.
- **Labels under numbers**: Inter, `text-xs uppercase tracking-wide text-muted-foreground`.
- **Growth deltas**: `text-green-main` (positive) or `text-orange-main` (decline) with arrow icon.

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

## Page-level patterns

### Brand strip

Every page in the main layout starts with a 5px navy bar:
```tsx
<div className="bg-navy dark:bg-[#E3F2F7] w-full h-[5px]" />
```
This is the brand mark at the page level — architectural, restrained. (It was cyan early on; switched to navy to stop competing with in-content cyan emphasis.)

### Masthead

Three-column row immediately below the brand strip. Editorial / print-newspaper register — the publication's identity, not a control panel.

- **Left column**: editorial strapline (the publication's voice). Lora Bold italic, `text-sm`, `text-navy`, `max-w-48`, `[text-wrap:balance]` for clean two-line wrap. Cap-aligned with the centered wordmark via a small `translate-y` nudge.
- **Center column**: ADAMASTOR wordmark (`/adamastorLogotype.svg`, `w-40`) wrapped in a `Link href="/"`. The SVG fill is `#104357` (brand navy) — match this when commissioning new wordmark variants.
- **Right column**: gold Subscribe pill + Account dropdown. Gold pill is the page-level primary action moment (`bg-gold-main rounded-full`); the Account `HoverCard` only renders for logged-in users.
- **Horizontal inset**: `px-4` on mobile, `md:px-8` on desktop (32px content edge — see *Spacing & layout* note on the doubled-padding convention).
- The Site-level section nav strap renders directly below this row.

```
─── 5px navy strip ─────────────────────────────────────
│ tagline (left)       ADAMASTOR        Subscribe·Acct │
─── site section strap (Articles · Events) ────────────
│  page content                                         │
```

### Page borders

Single border tone: `border-navy-faded`. Used by:
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
2. **Three-column grid** — middle row, hairline-separated above and below. Composition: brand colophon (Adamastor sea-creature mark, ~48px) | "Our projects" (sibling community links with UTMs — `?utm_source=adamastor&utm_medium=footer&utm_campaign=cross_link`) | "Follow us" (social channels with Lucide icons inline).
3. **Tagline strap** — Lora Bold italic centered editorial signature ("Only You Know Who You Can Be"). The publication's closing brand moment, distinct from the masthead tagline which describes *what we do*; this one says *what we believe*.
4. **Copyright row** — small utility row at the bottom: `© Adamastor` left, `About us` link right.

External social and project links carry `rel="noopener" target="_blank"` (plus `rel="me noopener"` on social profiles for IndieWeb h-card discovery). The horizontal inset matches the *Content edge on desktop = 32px* convention.

### Brand marks

Four image assets in [`public/`](../public):

- `adamastorLogotype.svg` — light-mode wordmark, fill `#104357` (brand navy).
- `adamastorLogotypeDark.svg` — dark-mode wordmark, fill `#e3f3f7`.
- `adamastorMark.svg` — light-mode sea-creature symbol mark, fill `#104357`. The Adamastor of Camões' *Os Lusíadas* — the giant who guards the Cape, here repositioned as a gatekeeper for Portuguese startup discovery.
- `adamastorMarkDark.svg` — dark-mode sea-creature symbol mark, white fill for navy surfaces.

The **wordmark** anchors the masthead, centered, `w-40`. The **symbol mark** is the footer colophon (~48px height, left of the three-column grid). The mark has future homes — `/about` hero, email templates, favicon — open. Don't recolor or restyle the marks per-page; use as-is. When the SVG fill needs adjustment (e.g. masthead navy mismatch was fixed this session by editing the file in place), update both the light and dark variant together.

### Navigation hierarchy

- **Site-level section nav** (chrome-level): "which surface of the publication am I in?" — Articles vs Events. Renders in the masthead strap. Style: site-level section nav pattern. Navy active underline + caps tracking.
- **Scope tabs** (page-level): "which edition am I in?" — city, language, region. Render outside the main grid. Style: scope-tab pattern. Cyan-ish active underline.
- **Lens chips** (column-level): "what am I filtering by?" — category, type, status. Render inside the main column. Style: pill-chip pattern (toggle behavior).
- **Inline link** (prose-level): "follow this thread" — embedded CTAs in body copy. Style: editorial inline link.

Don't conflate them — treating a scope tab the same as a lens chip makes the page feel control-panel-y instead of editorial. Each level has a distinct typographic and color signature so the eye can read the hierarchy at a glance.

## Implementation

### Where tokens live

- **Tailwind tokens** in [`tailwind.config.ts`](../tailwind.config.ts) — extends the default color theme with the brand keys (`navy-*`, `cyan-*`, `gold-*`, `orange-*`, `green-*`). Use as utility classes.
- **Fonts** in [`styles/fonts.ts`](../styles/fonts.ts), wired via CSS variables. Use as `[font-family:var(--font-lora-bold)]` etc.
- **Shadcn theme tokens** (background, foreground, muted, etc.) in [`styles/globals.css`](../styles/globals.css). Use as `bg-background`, `text-muted-foreground`.

### Adding a new color

1. Add the token + hex to the table above with a clear "use" column.
2. Wire it in `tailwind.config.ts` under a named family (don't collide with numeric scale keys).
3. Note its dark-mode behavior in the table if non-trivial.

### Adding a new component convention

1. Add a short section to "Component conventions" above with the visual rule.
2. Implement once in shared components if it's truly reusable; otherwise document the inline pattern so future uses match.

## Known limitations / open questions

- **Three competing cyans.** The codebase currently uses `#24acb5` (legacy hex, on `/` kicker labels and the active city scope tab), `cyan-darker` (`#028E97`, the brand token), and `cyan` (`#04C9D8`, also a brand token). These are close enough to read as "all cyan" at a glance but visibly different side by side. Decisions to make: (a) fold `#24acb5` into the scale as a new token, (b) replace all `#24acb5` callsites with `cyan-darker`, or (c) move the kicker role to `orange-dark` and keep cyan strictly for emphasis.
- **Kicker color role.** The current Orange tokens table says `orange-dark` is for "opinion kicker, byline accent" — but in practice the home feed kickers ("WEEKLY DIGEST" per article) are rendered in `#24acb5` (cyan-ish), not orange. Either the doc is aspirational and the implementation needs to follow, or the kicker really should be cyan-ish and the role assignment in the Orange table should be revised. Tied to the cyans question above.
- **"One cyan moment per fold" needs softening.** The current rule (color usage rule 1) doesn't accommodate the cyan-ish kicker labels (multiple per page on `/`). Either revise the rule to permit a separate kicker-cyan role, narrow it to "one cyan *highlight* moment per fold" (where highlight ≠ kicker), or change the kicker color so the rule stays clean.
- **Logo SVG color.** The light-mode wordmark (`adamastorLogotype.svg`) was using `#0f0d2a` (a dark navy with a violet undertone) and was swapped to `#104357` (brand navy) this session. The dark-mode variant (`adamastorLogotypeDark.svg`) uses `#e3f3f7` which matches the dark brand strip — not touched. Verify on dark-mode review.
- **Dark mode coverage** for the brand tokens is handled per-usage today. If usage grows, migrate to HSL CSS variables defined in `.dark` blocks.
- **No `tailwind-merge` rules** for the brand tokens yet. Class conflicts (e.g., `bg-navy` overridden by `bg-cyan`) resolve to last-wins as normal.
- **No semantic alias layer** (e.g., `bg-success` → `bg-green-main`). Worth adding if components want to be theme-agnostic; not needed today.
- **Shadcn `<Card>`** still appears in some legacy surfaces — prefer the sidebar-module outlined pattern for new work and migrate Card usage opportunistically.
