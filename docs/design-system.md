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
| **Lora Bold** (serif display) | `--font-lora-bold` | Page titles, headlines, headline numbers. Max weight is 700 — pair with Tailwind `font-bold` so the weight resolves. |
| **Inter** (sans body) | `--font-inter` | UI labels, table content, body copy, form controls. The default body font (see `globals.css`). |
| **Inconsolata** (mono) | `--font-inconsolata` (400) and `--font-inconsolata-bold` (700) | Code blocks, technical content, env var names. |

Reference fonts via Tailwind arbitrary value:
```tsx
<h1 className="font-bold [font-family:var(--font-lora-bold)]">Newsletter Subscribers</h1>
<p className="[font-family:var(--font-inter)]">42 subscribers</p>
```

**Type usage:**
- Page title (h1/h2): Lora Bold + `font-bold` + `text-3xl` or larger
- Section headers (h3): Inter `font-semibold`
- Body, labels, table cells: Inter (the default)
- Numerical displays (stat headlines, pull-quotes): Lora Bold + `font-bold` + `tabular-nums`
- Code / env var / technical token: Inconsolata, `text-xs`, `bg-muted` padded

**Why Lora and not CalSans or Crimson Text?** CalSans (modern startup display font) and Crimson Text (classical book serif) were both dropped because neither matched Adamastor's "contemporary digital publication" voice. CalSans read too "SaaS product"; Crimson read too "Victorian literary magazine." Lora Bold is designed for screen reading, sits between them in feel, and pairs cleanly with Inter for body.

## Color tokens

Each token has a single purpose. Don't reach for a hex outside this scale.

### Navy — architectural

Used for: headings, structural text, framing, dividers. Adamastor's primary brand color.

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `navy-darker` | `#08293A` | `bg-navy-darker` | Deepest navy. Reserved — high-emphasis text on light bg. |
| `navy` | `#104357` | `bg-navy` | Primary navy. Headings, structural elements, dark frame. |
| `navy-pastel` | `#4D7689` | `bg-navy-pastel` | Muted navy. Secondary text, decorative borders. |
| `navy-faded` | `#E8F0F4` | `bg-navy-faded` | Soft navy wash. Section backgrounds, hover states. |

### Cyan — highlight

Used for: **emphasis only**. The single most important data point on a page, primary CTAs, active states. **Never decoration.** Treat cyan exactly like the Guardian uses yellow — one cyan moment per fold, used to direct the eye.

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `cyan-darker` | `#028E97` | `bg-cyan-darker` | Deep cyan. Pressed states, accents on dark backgrounds. |
| `cyan` | `#04C9D8` | `bg-cyan` | Brand cyan. CTAs, the headline number, the active filter. |
| `cyan-pastel` | `#9DE8EF` | `bg-cyan-pastel` | Soft cyan. Secondary highlights, "currently selected" badges. |
| `cyan-faded` | `#DFF6F8` | `bg-cyan-faded` | Soft cyan wash. Selected rows, accent backgrounds. |

### Orange — editorial warmth

Used for: editorial voice. Opinion pieces, founder interviews, "from the editor" notes, anywhere warmth is the point. **Not** a generic UI accent.

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `orange-dark` | `#BD5318` | `bg-orange-dark` | Deep orange. Opinion kicker, byline accent. |
| `orange-main` | `#E05E00` | `bg-orange-main` | Primary orange. Warm accent. |
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

1. **One highlight per fold.** A page should have one cyan moment (and only one) that demands the eye. Multiple cyan accents compete and the highlight value dies.
2. **Navy frames, cyan emphasizes, orange/green signal.** Don't mix orange and green on the same screen unless the content explicitly warrants both signals (e.g., a content type indicator + a growth delta).
3. **Pastels and faded shades are atmosphere**, never primary signal. Use them as washes, hovers, soft backgrounds.
4. **Test in dark mode.** Each color must have a working dark-mode counterpart, even if a page primarily renders light. Today this is handled per-usage with `dark:` variants; if pain accumulates, migrate to HSL CSS variables wired into the `.dark` block in [`globals.css`](../styles/globals.css).

## Spacing & layout

- Vertical rhythm: **32px (2rem)** between major sections, **16px (1rem)** within.
- Public surfaces capped at `max-w-screen-lg` (1024px); admin uses available width up to `max-w-screen-2xl`.
- **Section dividers**: `navy-faded` hairline OR a cyan hairline for "active section." Never both on the same page.
- **Modular cards** (Guardian-inspired): cards expand and contract to their content. Don't force uniform heights unless presenting genuinely comparable data (stat grids, comparison tables).

## Motion

- **Entry**: `animate-in fade-in-0 slide-in-from-bottom-2 duration-300` on the content wrapper. One staggered reveal beats scattered micro-interactions.
- **Hover**: 150ms color/background transitions on interactive surfaces.
- **Always** honor `prefers-reduced-motion` with `motion-reduce:transition-none` (or a no-motion variant).
- Animate `transform` and `opacity` only — never `transition: all`.

## Component conventions

### Buttons

- **Primary**: `bg-cyan text-navy-darker font-semibold rounded-lg` — the lozenge from the Guardian system. Sturdy. Icons on the right (arrow) sit centrally in an imaginary circle at the button's edge.
- **Secondary**: `outline border-navy text-navy rounded-lg`.
- **Destructive**: shadcn destructive variant. White text on destructive fill.
- **Tertiary / inline**: text link with underline-offset.

### Badges

Meaning matters — pick the variant that communicates, don't default to "secondary."

- **Outlined gray** (`variant="outline"`): neutral categorization, no implied weight.
- **Filled cyan** (`bg-cyan text-navy-darker`): this is the *highlighted* item.
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

### Sections

A "section" is a meaningful grouping (Stats, By category, Recent activity). Each section:
- Has a heading in Inter `font-semibold`, `text-base` or `text-lg` (reserve Lora Bold for page titles / hero numbers)
- May have a one-line subhead in `text-sm text-muted-foreground`
- Sits inside `space-y-8` (or larger) with previous/next section

## Implementation

### Where tokens live

- **Tailwind tokens** in [`tailwind.config.ts`](../tailwind.config.ts) — extends the default color theme with the brand keys. Use as utility classes (`bg-navy`, `text-cyan-pastel`, `border-orange-dark`).
- **Fonts** in [`styles/fonts.ts`](../styles/fonts.ts), wired via CSS variables. Use as `[font-family:var(--font-lora-bold)]` etc.
- **Shadcn theme tokens** (background, foreground, muted, etc.) in [`styles/globals.css`](../styles/globals.css). Use as `bg-background`, `text-muted-foreground`.

### Adding a new color

1. Add the token + hex to the table above with a clear "use" column.
2. Wire it in `tailwind.config.ts` under the matching color family (don't collide with numeric scale keys).
3. Note its dark-mode behavior in the table if non-trivial.

### Adding a new component convention

1. Add a short section to "Component conventions" above with the visual rule.
2. Implement once in shared components if it's truly reusable; otherwise document the inline pattern so future uses match.

## Known limitations / open questions

- **Dark mode coverage** for the new palette tokens is handled per-usage today. If usage grows, migrate to HSL CSS variables defined in `.dark` blocks.
- **No `tailwind-merge` rules** for the brand tokens yet. Class conflicts (e.g., `bg-navy` overridden by `bg-cyan`) resolve to last-wins as normal.
- **No semantic alias layer** (e.g., `bg-success` → `bg-green-main`). Worth adding if components want to be theme-agnostic; not needed today.
