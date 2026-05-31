# Animation language

Adamastor motion should feel editorial, quiet, and precise: continuity over spectacle. Use animation to explain state changes that would otherwise feel abrupt, not to decorate static content.

## Principles

1. **Movement uses ease-in-out.** If an element is already on screen and moves or morphs, use `220ms cubic-bezier(0.77,0,0.175,1)`.
2. **Hover and color use ease.** Small hover/color feedback should stay near `150ms ease`.
3. **Entrances use ease-out.** Elements entering the viewport may use `150-250ms ease-out`; avoid entrance motion on high-frequency editorial surfaces unless it clarifies state.
4. **Prefer transform and opacity.** Moving rails, indicators, and overlays should animate `transform` and/or `opacity`, not `width`, `height`, `margin`, or `padding`.
5. **Honor reduced motion.** Every animated element needs `motion-reduce:transition-none` or an equivalent no-motion path.
6. **No bounce for editorial chrome.** Bouncy motion reads too playful for Adamastor's publication surfaces.
7. **Route transitions crossfade on opacity.** Page-to-page motion uses `opacity` only — never `translateY` or any transform. See "Route content settle".
8. **Reach for blur to mask a rough crossfade.** When a state swap reads as two distinct frames rather than one motion, a small `filter: blur()` (≤ 2px, small elements only) bridges the gap. See "Microtransitions".

## Motion tokens

| Token | Value | Use |
|---|---|---|
| `--ease-move` | `cubic-bezier(0.77,0,0.175,1)` | Existing on-screen elements moving between states |
| `--duration-state` | `220ms` | Standard tab/rail state movement |
| `--duration-feedback` | `150ms` | Hover color, border, and background feedback |

Until these are promoted to CSS variables, inline Tailwind arbitrary transitions should use:

```tsx
"[transition:transform_220ms_cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none"
```

## Active rails

The active rail pattern is used when a nav or scroll-spy needs a visible "you are here" line:

- Render semantic links normally.
- Keep inactive text and resting hairlines in the DOM.
- After measurement, make per-link active borders transparent.
- Render one `aria-hidden` absolute rail.
- For horizontal rails: `h-0.5 w-px origin-left` + `transform: translateX(x) scaleX(width)`.
- For vertical rails: `h-px w-px origin-top` + `transform: translateY(y) scaleY(height)`.
- Transition only `transform`.
- Keep a pre-measure active border fallback so the state is visible before layout metrics settle.

Current implementations:

| Surface | File | Pattern |
|---|---|---|
| Site section nav | `components/navbar-sections.tsx` | Horizontal active rail + clipped active text layer |
| Events city tabs | `app/(main)/events/EventsPageClient.tsx` | Horizontal active rail |
| Post table of contents | `app/(main)/posts/[id]/PostTOC.tsx` | Vertical active rail |

## Text masks

The site section nav uses a duplicated active text layer with `clip-path` to reveal active text cleanly between "Articles" and "Events". This is a deliberate exception to the transform-only preference because the effect is a mask, not a moving box.

Rules for text masks:

- Use only for small, stable tab sets.
- Pair mask timing with the rail timing: `220ms cubic-bezier(0.77,0,0.175,1)`.
- Keep the real underline/rail outside the clipped layer so the mask cannot reveal old/new line fragments.
- Include `motion-reduce:transition-none`.

## Route content settle

Public page-to-page navigation uses a small content-only entrance animation. The goal is to soften the moment when server-rendered route content swaps in, without making the navbar, footer, or mobile tab bar feel like they reload.

Rules:

- Scope the animation to persistent route layouts with `RouteTransitionFrame`: public `<main>` content, dashboard content below the topbar, and standalone auth pages.
- Do not use native shared-element View Transitions for article titles until the source and destination layouts have been visually validated.
- Use `180ms cubic-bezier(0.215,0.61,0.355,1)` (ease-out — content is entering).
- **Crossfade on `opacity` only: `opacity: 0 → 1`. Never `translateY` (or any transform) for route transitions.** A vertical slide implies the page physically moved between two places; it didn't. A crossfade reads as the same editorial surface settling in. Opacity is the default — and the only — channel for page-to-page motion.
- A crossfade can flash blank if the new route paints slowly. The route segment's `loading.tsx` skeleton is load-bearing here: it fills the data-fetch gap so the fade lands on real content, not an empty frame. Never ship a `RouteTransitionFrame` route without one.
- Do not animate the first direct page load; animate only client-side route changes after hydration.
- Disable entirely for `prefers-reduced-motion: reduce`.

## Microtransitions

Small, frequent interactions (button presses, state swaps). Keep them fast (100–180ms), `ease-out`, and reduced-motion-safe.

### Press feedback

Every interactive `Button` scales to `0.97` on `:active` — instant, tactile confirmation that the press registered. Applied in `components/tailwind/ui/button.tsx`:

```tsx
"transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
```

Rules:

- Use `scale-[0.97]`, not a smaller value — a deep press (e.g. `0.9`) reads as a bug, not feedback.
- Keep color transitions alongside transform; do not regress to `transition-all`.
- Always pair with `motion-reduce:active:scale-100` so reduced-motion users get no scale.

### Blur-masked state crossfade

When a small element swaps between two states (e.g. a copy button going `Copy → Copied`), an instant swap shows two distinct objects. A crossfade with a touch of blur "bridges the visual gap between the old and new states… it tricks the eye into seeing a smooth transition by blending the two states together" (Emil Kowalski, _Animations on the Web_).

Use the `.state-crossfade` utility (`styles/globals.css`) on a **keyed** wrapper so the animation re-fires on every state change:

```tsx
<span key={copied ? "copied" : "idle"} className="state-crossfade inline-flex items-center gap-1.5">
  {copied ? <Check … /> : <Copy … />}
  {copied ? "Copied" : "Copy feed URL"}
</span>
```

```css
.state-crossfade { animation: stateCrossfade 180ms cubic-bezier(0.215,0.61,0.355,1) both; }
@keyframes stateCrossfade {
  from { opacity: 0; filter: blur(2px); }
  to   { opacity: 1; filter: blur(0); }
}
```

Rules:

- **Blur only on small elements.** Full-surface blur (a whole page, a large card) is expensive — especially in Safari — and reads as a focus glitch. This is why route transitions crossfade on opacity *without* blur.
- Keep blur ≤ 2px. More than that calls attention to itself.
- The `key` is load-bearing: without a changing key the element never remounts and the animation never re-fires.

Current implementations:

| Surface | File | Pattern |
|---|---|---|
| Copy feed URL / Slack command buttons | `app/(main)/events/EventsPageClient.tsx` | `.state-crossfade` on keyed icon/label swap |
| All buttons | `components/tailwind/ui/button.tsx` | `active:scale-[0.97]` press feedback |

## Calendar navigation

Month / range navigation on the three calendars (events desktop grid, events mobile strip, dashboard big-calendar) shares one motion: the new content enters from the side it came from, with a crossfade and a small blur. This is the one place a directional slide is *right* — the user is moving through time (next / back), so spatial direction carries meaning. (Contrast route transitions, which are opacity-only — the page isn't moving anywhere.)

Rules:

- **Direction maps to the gesture.** "Next" → content enters from the right and settles left (`translateX(+14px) → 0`, ±20px on the denser big-calendar). "Back" → enters from the left. "Today" (big-calendar) → straight crossfade, no slide.
- **Anchor the slide to the data that changed, not the whole grid.** A calendar's static chrome — the month weekday-name header (`.rbc-month-header`), the time gutter — must stay put; it's the fixed reference the eye measures the slide against. Sliding it too reads as noise and makes the data look like it starts from the wrong place. Target the changing rows (`.rbc-month-row`, `.rbc-time-content`, `.rbc-time-header`), never the whole `.rbc-calendar`.
- **Blur belongs here.** A small `filter: blur(4px) → 0` bridges the in-place content swap. The grids update without remounting, so without blur the eye sees two distinct frames — this is the textbook case for the blur trick.
- **Re-fire imperatively.** react-day-picker and react-big-calendar both update the grid in place, so a CSS keyframe won't replay on its own. Track `{count, direction}` in state, then in a `useLayoutEffect` set `--cal-nav-from`, remove the class, force a reflow (`void el.offsetWidth`), and re-add it. Use `useLayoutEffect` (not `useEffect`) so the animation applies before the browser paints the new grid — otherwise it jumps back and replays.
- Use the shared `.cal-nav-enter` utility + `--cal-nav-from` (`styles/globals.css`), 280ms ease-out.
- The mobile strip pages by scrolling, not swapping, so it uses a lighter `.cal-strip-paging` blur pulse on the paged scroll instead of a slide.
- **View switches (month ↔ week ↔ day) fade; they don't slide.** react-big-calendar reserves the vertical scrollbar gutter inside a `requestAnimationFrame` *after* the new view's first paint (`measureGutter` → `checkOverflow` in `TimeGrid.js`), so the day-header resizes 1–2 frames late — a visible width snap. The toolbar resizes too (its width tracks the card's content box). You can't *smooth* a width change (animating layout breaks the transform/opacity golden rule), so mask it: `.cal-view-enter` **holds the whole card content — toolbar *and* view — at `opacity: 0` for the first ~90ms** (covering rbc's late rAF reflow) and only then fades in, so the snap never reaches the screen. Three traps: (1) a plain immediate fade-in does NOT work — ease-out climbs too fast and the reflow shows through at ~30% opacity; (2) masking only the calendar viewport leaves the *toolbar* (a sibling) unmasked — the mask must wrap both; (3) **do not reach for `scrollbar-gutter: stable` on `.rbc-time-content`** to stop the columns redistributing. It reserves a gutter the *header* row doesn't, so the content's day-columns sit one scrollbar-width off from the header's and the past-day wash (which paints both the header all-day cell and the content column) jogs at that seam — a visible 1px column misalignment. rbc already keeps header and content aligned via its own overflow-gutter margin; the opacity hold is the whole fix. (See [`docs/react-big-calendar.md`](./react-big-calendar.md) for the full breakdown.)
- Disable all of it for `prefers-reduced-motion: reduce`.

Current implementations:

| Surface | File | Trigger |
|---|---|---|
| Events desktop month grid | `components/event-calendar.tsx` | rdp `onMonthChange` → `.cal-nav-enter` on the day `<table>` |
| Events mobile day strip | `components/event-calendar.tsx` | `scrollByPage` → `.cal-strip-paging` blur pulse |
| Dashboard big-calendar | `app/(dashboard)/dashboard/calendar/CalendarTestClient.tsx` | toolbar `PREV / NEXT / TODAY` → `.cal-nav-enter` on the **data rows** (`.rbc-month-row` / `.rbc-time-*`); static weekday header held still |
| Big-calendar view switch | `CalendarTestClient.tsx` + `calendar-custom.css` | `onView` → `.cal-view-enter` opacity hold/mask over rbc's gutter reflow (no `scrollbar-gutter` — it misaligns the columns) |

## Review: May 2026 rail work

| Before | After |
|---|---|
| Site nav underline animated `transform` + `width` | Site nav underline animates `transform` only via `translateX(...) scaleX(...)` |
| Events city underline animated `transform` + `width` | Events city underline animates `transform` only via `translateX(...) scaleX(...)` |
| Post TOC rail animated `transform` + `height` | Post TOC rail animates `transform` only via `translateY(...) scaleY(...)` |
| TOC used `space-y-2`, which also offset the absolute rail | TOC uses `[&>li+li]:mt-2`, preserving item spacing without moving the rail |
| Clip-path text mask and underline lived too close conceptually | Text mask is documented as text-only; underline/rails stay separate measured spans |
