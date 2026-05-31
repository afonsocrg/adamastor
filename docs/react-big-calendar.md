# Customizing react-big-calendar

A portable guide to bending `react-big-calendar` (rbc) into a design system, written so it can be lifted into another app with minimal edits. Adamastor's admin calendar is the reference implementation, but the **patterns and gotchas are app-agnostic** — only the tokens and category slugs are local.

**Companion docs** (don't duplicate them, read them alongside):
- [`react-big-calendar-loading-stability.md`](./react-big-calendar-loading-stability.md) — the SSR-skeleton → live cross-fade, and how to keep their geometry identical.
- [`animations.md`](./animations.md) § *Calendar navigation* — the directional slide/fade/blur on nav and the view-switch opacity hold.

**Reference files in this repo:**
- `app/(dashboard)/dashboard/calendar/calendar-custom.css` — the entire override stylesheet (TOC'd by view).
- `app/(dashboard)/dashboard/calendar/CalendarTestClient.tsx` — the client component (custom toolbar, slot renderers, prop getters, transitions).
- `styles/globals.css` — the `--cat-*` category color tokens + the `cal-*` keyframes.

---

## 1. The mental model

**rbc is a layout engine you theme by class — not a styled component you pass props to.** It renders a fixed DOM tree of `.rbc-*` nodes and runs the date math, overflow math (`+N more`), and time-grid measurement. You customize it three ways, none of which involve forking it:

1. **CSS overrides** keyed on its `.rbc-*` class names (the bulk of the work).
2. **Slot renderers** via the `components` prop — swap rbc's default header/event/wrapper for your own JSX.
3. **Per-element decorators** via `eventPropGetter` / `dayPropGetter` — attach a className and/or inline style to each event or day cell.

Everything else (the toolbar, the date anchor, formats) is plain props. We render our **own** toolbar (`toolbar={false}`) and drive `PREV/NEXT/TODAY` ourselves, because rbc's built-in toolbar can't be styled to a design system cleanly.

### The class-name map (the load-bearing selectors)

| Selector | What it is |
|---|---|
| `.rbc-calendar` | Outer container. Owns the surface bg + font. |
| `.rbc-month-view` / `.rbc-time-view` | Month grid vs. week/day time-grid. |
| `.rbc-month-header` | The weekday-name row (MON TUE …). **Static every month** — never animate it. |
| `.rbc-month-row` | One week row in month view. The unit that slides on nav. |
| `.rbc-row-bg` / `.rbc-day-bg` | The background cells behind a row / a single day. |
| `.rbc-date-cell` + `.rbc-now` / `.rbc-off-range` | The date-number cell; `.rbc-now` = today, `.rbc-off-range` = spill days. |
| `.rbc-time-header` / `.rbc-time-content` | Time-grid header (day columns) vs. the scrollable body. |
| `.rbc-time-header-content` / `.rbc-timeslot-group` | Header cell wrapper / one hour band. |
| `.rbc-day-slot` | A single day's column in a time view (where events stack). |
| `.rbc-event` + `.rbc-event-content` / `.rbc-event-label` | An event block; its title wrapper; its time label. |
| `.rbc-current-time-indicator` | The "now" line in time views. |
| `.rbc-agenda-view table` | Agenda is a `<table>`, styled separately. |
| `.rbc-overlay` / `.rbc-show-more` | The "+N more" popover and its trigger link. |

Keep the override stylesheet **TOC'd by view** (container → month → week/day → events → toolbar → time indicators → agenda → misc → animations). rbc's own CSS is broad; a flat override file becomes unmaintainable fast.

---

## 2. Setup that prevents flashes

```css
/* calendar-custom.css — base import FIRST, then overrides */
@import "react-big-calendar/lib/css/react-big-calendar.css";
```

- **Import the stylesheet at the _page_ level, not inside the dynamically-imported client component.** If the live `<Calendar>` is lazy-loaded (it usually is, to keep the bundle off the critical path) and the CSS rides along in that chunk, the calendar paints unstyled for a frame when it mounts. Importing `calendar-custom.css` from `page.tsx` ships rbc's base CSS with the initial document.
- **Monday-first (or any week config) must be set before any date math runs.** `moment.updateLocale("en", { week: { dow: 1, doy: 4 } })` at module scope. The SSR skeleton renders *before* this runs, so the skeleton must use `startOf("isoWeek")` explicitly rather than the unconfigured `startOf("week")` — see the loading-stability doc.

---

## 3. The four customization seams

### a. `components` — swap slot renderers

Define them at **module level**, not in a `useMemo` inside the component — they close over no state, so hoisting saves a per-render allocation and keeps the `components` reference stable (rbc re-mounts children when it changes identity).

```tsx
const calendarComponents = {
  eventWrapper: CalendarEventWrapper,            // a11y: inject tabIndex/role/aria-label
  week:  { header: WeekHeader },                 // stacked DOW-cap + numeral pill
  month: { header: MonthHeader, event: MonthEventRow },  // custom inline event row
};
```

The custom **month event row** is `dot · time · title` (high-density scannability) instead of a filled block — the category color moves from the block background onto the leading dot. The custom **week header** stacks a weekday cap over a date numeral, with today's numeral wearing a pill. (rbc gives you `{ date }` and you return whatever JSX you want.)

> Truncation trap: the title span needs `min-w-0` (Tailwind) / `min-width: 0`. Without it a flex child's min-width defaults to its content width, so `truncate`/`text-overflow` never engages and a long title pushes the whole row — and the toolbar — off-screen.

### b. `eventPropGetter` — decorate each event

Return a className **and** an inline style. The split is deliberate:

```tsx
const eventPropGetter = (event) => {
  const slug = event.categorySlugs?.[0];
  const category = isSlug(slug) ? `cat-${slug}` : "cat-none";
  const isPast = event.end.getTime() < Date.now();
  if (!isPast) return { className: category };
  return { className: `${category} rbc-event--past`, style: { opacity: 0.42 } };
};
```

- **className** is what your CSS rules (and `:hover`/`:has` rules that need `!important`) target.
- **inline style** guarantees the visual is in the **SSR HTML**, so first paint is already correct. Without it, past events render full-strength until the custom CSS loads, then snap to faded — a visible flash. (Same reason `dayPropGetter` below mirrors its wash inline.)

### c. `dayPropGetter` — decorate each day cell

```tsx
const dayPropGetter = (date) => {
  const isPast = moment(date).startOf("day").isBefore(moment().startOf("day"));
  return isPast ? { className: "rbc-day--past", style: { backgroundColor: "rgba(232,240,244,0.6)" } } : {};
};
```

Past days get a quiet wash so elapsed time reads as backgrounded. The class applies across month all-day cells **and** week/day time columns.

### d. `formats` — date/time display

Plain object of format strings or `({start,end}, culture, localizer) => string` functions. Drives the time gutter (`h A`), agenda times, and day headers.

---

## 4. Theming via CSS custom properties (the portable bit)

**Don't hardcode colors in the `.rbc-*` rules. Reference design tokens.** Category tints live as custom properties — light in `:root`, dark in `.dark` — and the per-category rules just point at them:

```css
/* styles/globals.css */
:root  { --cat-design-fill: oklch(0.94 0.045 31); --cat-design-edge: …; --cat-design-ink: …; }
.dark  { --cat-design-fill: oklch(0.75 0.11 31 / 0.18); --cat-design-ink: #cfe4ef; … }

/* calendar-custom.css */
.rbc-event.cat-design {
  background-color: var(--cat-design-fill);
  border-color:     var(--cat-design-edge);
  color:            var(--cat-design-ink);
}
```

The payoff — **dark mode "just works."** Because the value lives behind one indirection point, the `.dark` block flips every category at once; there are **no `dark:` variants scattered across the event rules**. The same `--cat-*` tokens also back the React side (`EVENT_CATEGORY_COLORS` in `lib/events/categories.ts` exposes `bg-[var(--cat-*-fill)]` classes for the agenda pills and month dots), so the calendar, the agenda list, and any chip elsewhere read from one source. (Email is the one exception — it can't use CSS vars, so it carries a hardcoded hex copy.)

> A custom property is a single indirection point, so theming becomes a property swap rather than a per-component edit. This is the general principle worth carrying to any rbc integration: define a small token set, point the `.rbc-*` rules at it, and you get theming + dark mode for the cost of one `.dark` block.

See [`design-system.md`](./design-system.md) § *Event category colours* for the palette rationale.

---

## 5. The gotchas (rbc internals worth knowing)

These are the non-obvious behaviors that cost real time. Most stem from rbc measuring layout **after** first paint and updating the grid **in place**.

### View-switch layout shift (`measureGutter` runs in a rAF)

Switching month → week, the day-header row starts wide then snaps narrower 1–2 frames later. **Why:** rbc's `TimeGrid` measures the vertical scrollbar gutter inside a `requestAnimationFrame` *after* the new view's first paint (`measureGutter` → `checkOverflow`), then reserves that width — so the header resizes late. The toolbar resizes too (its width tracks the card's content box).

You can't *smooth* a width change (animating `width` breaks the transform/opacity rule). **Mask it:** hold the whole card content — toolbar **and** view — at `opacity: 0` for ~90ms (covering the late rAF), then fade in. A plain immediate fade-in fails: ease-out climbs too fast and the reflow shows through at ~30% opacity. The mask must wrap the toolbar too, not just the calendar viewport. See `.cal-view-enter` and animations.md.

### Don't use `scrollbar-gutter: stable` to fix the column jump

Tempting, wrong. It reserves a gutter on `.rbc-time-content` that the **header** row doesn't have, so the content's day columns sit one scrollbar-width off from the header's — and any full-column paint (e.g. a past-day wash that hits both the header all-day cell and the body column) jogs at that seam, a visible 1px misalignment. rbc already keeps header and content aligned via its own overflow-gutter margin. The opacity hold above is the entire fix; leave the gutter alone.

### Header `overflow: hidden` clips custom JSX

rbc sets `overflow: hidden` on `.rbc-header`. A custom stacked header (weekday cap + numeral pill) gets clipped to rbc's intrinsic ~42px row. Fix both: `overflow: visible` on the header **and** floor the row (`.rbc-time-header-content .rbc-time-header-cell { min-height: 3.5rem }`) — rbc's intrinsic sizing ignores your taller child otherwise.

### In-place updates don't replay CSS animations

rbc swaps the grid contents **in place** on navigation (no remount), so a CSS keyframe won't re-fire on its own. Re-fire it imperatively:

```tsx
useLayoutEffect(() => {
  el.style.setProperty("--cal-nav-from", direction === 1 ? "20px" : "-20px");
  el.classList.remove("cal-nav-enter");
  void el.offsetWidth;          // force reflow so the animation restarts
  el.classList.add("cal-nav-enter");
}, [navCount]);
```

`useLayoutEffect`, not `useEffect` — the class must apply **before** the browser paints the new grid, or it paints once correct then jumps back and replays.

### Anchor motion to the data, not the chrome

When sliding on nav, target the rows that changed (`.rbc-month-row`, `.rbc-time-content`, `.rbc-time-header`) and leave the static weekday header (`.rbc-month-header`) put. The fixed chrome is the reference the eye measures the slide against; sliding it too reads as noise and makes the data look like it starts from the wrong place. (Agenda has none of those nodes — fall back to animating the whole list.)

### First-paint flash (the recurring theme)

Any visual applied only by a custom CSS class will flash on SSR'd content: the class loads a tick after the HTML, so the cell/event renders un-decorated then snaps. **Mirror the key visual inline** via the prop getter (see §3b/§3c) so the SSR HTML is already in the final state.

---

## 6. Accessibility

- `eventWrapper` injects `tabIndex={0}`, `role` (`link` if the event has a URL, else `group`), and an `aria-label` so events are keyboard-reachable and announced.
- `onKeyPressEvent` handles Enter/Space to activate (opens the source URL), matching click.
- Every animation has a `@media (prefers-reduced-motion: reduce)` path that drops it to `none`.

---

## 7. Lifting this into another app

**Portable as-is** (copy, then swap tokens):
- `calendar-custom.css` structure + the `.rbc-*` override rules.
- The `--cat-*` custom-property scheme and the `.cat-{slug}` → `var(--cat-*)` rules (rename slugs to your domain).
- The `eventPropGetter` / `dayPropGetter` className+inline-style pattern.
- The nav/view transition helpers (`.cal-nav-enter`, `.cal-view-enter` + the `useLayoutEffect` re-fire).
- The custom toolbar (render your own, `toolbar={false}`).

**App-specific — expect to change:**
- The actual color values / design tokens (here: the navy ramp + the seal-rainbow category tints).
- The fixed `740px` calendar height and the skeleton geometry that mirrors it (loading-stability doc).
- Week config (`dow`/`doy`) and localizer (we use moment; date-fns/luxon localizers exist).
- The category slug set and `EVENT_CATEGORY_COLORS`.

**Gotchas that travel with the library** (re-read §5 in any new integration): the rAF gutter measurement, the `scrollbar-gutter` trap, header `overflow: hidden`, in-place updates not replaying animations, and the SSR first-paint flash. None are app-specific — they're how rbc works.
