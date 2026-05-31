# React Big Calendar Loading Stability Notes

This document captures the findings from the admin calendar loading polish work. The goal is to preserve the rules behind the current implementation so future changes to `react-big-calendar` views, skeletons, or user-facing calendar variants do not reintroduce flashes, layout shifts, or misleading loading states.

> **Scope:** this doc is specifically about the SSR-skeleton → live cross-fade and geometry matching. For the broader customization layer (theming, slot renderers, prop getters, the rbc internals/gotchas), see [`react-big-calendar.md`](./react-big-calendar.md). For the nav/view-switch motion, see [`animations.md`](./animations.md) § *Calendar navigation*.

## Context

The dashboard calendar uses Next.js App Router, React 19, `react-big-calendar`, and the Moment localizer. The page is auth-gated and dynamic-rendered. The loading experience is a server-rendered month skeleton that cross-fades into the live calendar once the client bundle is ready.

The user-visible bug started as:

- skeleton paints correctly from SSR HTML
- live calendar cross-fades in
- calendar flashes white or appears to mount twice
- month cells shift during the fade
- dates and `+N more` labels appear in different positions between skeleton and live calendar

The root issue was not one animation. It was a set of geometry mismatches between the first painted UI and the final interactive UI.

## Core Principle

The first painted loading UI and the final hydrated UI must occupy the same geometry.

This is a synchronization rule, not a preservation rule. The live calendar design can absolutely change: event row height, padding, typography, density, overflow behavior, wrapper dimensions, and animation treatment are all fair game. The requirement is that the skeleton and any measured overflow assumptions change in the same patch. Do not keep an inferior live interaction just because the skeleton currently matches it.

For a calendar, this means matching:

- month anchor date
- week start convention
- visible week count
- wrapper height
- toolbar height
- date formatting
- row and cell layout model
- event row height
- overflow row behavior
- CSS availability before the live component mounts

If any of these differ, an opacity-only cross-fade will reveal a layout jump even though the animation itself is technically smooth.

## Current Architecture

The current wrapper uses a multi-phase load:

1. `skeleton`: only `MonthSkeleton` is visible. This renders on the server.
2. `mounting`: the live calendar component is imported and mounted at `opacity-0` under the skeleton.
3. `crossfade`: skeleton fades out while live calendar fades in.
4. `done`: skeleton unmounts.

Important rules:

- Do not use `next/dynamic(..., { ssr: false, loading: () => null })` for the final swap. It can yield `null` for a render tick and create a white frame.
- Use a manual `import("./CalendarTestClient")` and store the resolved component in state.
- Mount the live calendar hidden before starting the fade.
- Stack skeleton and live calendar with CSS Grid, not `absolute -> static` swaps.
- Keep `motion-reduce:transition-none` on the cross-fade wrappers.

## Date And Grid Rules

The admin calendar is Monday-first.

In `MonthSkeleton.tsx`:

- Use `monthStart.clone().startOf("isoWeek")`.
- Use `monthEnd.clone().endOf("isoWeek")`.
- Do not use unconfigured `startOf("week")` or `endOf("week")`, because the skeleton renders before `CalendarTestClient` calls `moment.updateLocale`.

The skeleton date format must match the live RBC month date format:

- Use `day.format("DD")`, not `day.format("D")`.
- This prevents `3 -> 03` shifts.

The live calendar must receive the same date anchor:

- Pass `serverNow` into `CalendarTestClient` as `initialDate`.
- Initialize live `date` state from `initialDate`.

## Layout Rules

The live calendar wrapper is currently fixed at `height: "740px"` for month/week/day views. The skeleton must reserve the same calendar box height.

If the live wrapper height or month-row density changes, update `MonthSkeleton.tsx` and its row-limit assumptions at the same time. Treat the skeleton as a mirror of the intended live UI, not as the source of truth.

The skeleton month grid should use RBC's own structural classes:

- `.rbc-calendar`
- `.rbc-month-view`
- `.rbc-month-header`
- `.rbc-month-row`
- `.rbc-row-bg`
- `.rbc-day-bg`
- `.rbc-row-content`
- `.rbc-date-cell`
- `.rbc-row-segment`
- `.rbc-show-more`

This is intentional. A plain CSS Grid approximation was close, but still produced displaced duplicate rows during the cross-fade. Reusing RBC's class structure lets the browser apply the same flex row math to both layers.

Toolbar skeleton details:

- Match the live select trigger height with `h-10`.
- Match date cell padding with `.rbc-date-cell` styling.
- Match header padding and right alignment with `.rbc-month-view .rbc-header`.

## Event Row And Overflow Rules

RBC's `+N more` behavior is not purely per-day.

Event row styling is allowed to evolve. When changing normal event row height, padding, margin, line-height, or visible row density, update both `calendar-custom.css` and `MonthSkeleton.tsx` together, then re-check the skeleton/live cross-fade in a quiet week and an overflowing week.

Mental model:

- RBC measures a row limit for the month row.
- In a quiet 5-week month row, the current 740px calendar can show 4 event rows.
- If a week needs any `+N more` control, RBC reserves one row for that overflow control across the week.
- Therefore an overflowing 5-week row behaves like `3 event rows + +N more`, not `4 event rows + +N more`.
- 6-week months have tighter row height and generally need a lower visible row cap.

Skeleton rule:

- Compute a measured row limit from the visible week count.
- For overflowing weeks, render `measuredRowLimit - 1` skeleton event rows, then the `+N more` row.
- For quiet weeks, render up to the measured row limit.
- Render overflow using `rbc-button-link rbc-show-more`, not a custom text div.
- Keep skeleton event bars close to live event line-height.

This rule explains why a day with 4 events may show 4 skeleton rows in one week, while another week with overflow shows 3 rows plus `+1 more`.

## CSS Rules

RBC's base stylesheet must be available before the live dynamic component mounts.

Current rule:

- Import `calendar-custom.css` at `page.tsx` level.
- `calendar-custom.css` imports `react-big-calendar/lib/css/react-big-calendar.css`.

Avoid:

- importing RBC CSS only inside the dynamically-loaded client component
- mount animations on `.rbc-month-view`
- extra `animate-in` utilities on the live calendar wrapper

Only animate opacity for the skeleton/live swap. Do not animate height, padding, margin, or layout-affecting properties.

## Validation Checklist

Use this checklist before declaring calendar loading stable:

- Hard refresh `/dashboard/calendar`.
- Confirm the first visible date grid matches the live date grid.
- Confirm no `30 -> 01` or `3 -> 03` date swaps.
- Confirm the Today button and Month select do not bob vertically.
- Confirm 5-week and 6-week months both preserve calendar height.
- Confirm `+N more` labels overlap their live positions during the fade.
- Confirm event skeleton row counts match live overflow behavior.
- Test with slow network throttling.
- Test `prefers-reduced-motion: reduce`.
- Run targeted lint, `pnpm typecheck`, `git diff --check`, and `pnpm build`.

## Watchouts For Other Views

The current work focused primarily on Month view. Week, Day, and Agenda can still need view-specific skeleton rules.

Before adding skeletons or transitions for other views:

- inspect RBC's live DOM and CSS for that view
- match the live wrapper height and row model
- avoid approximating measured layouts with unrelated CSS structures
- account for scroll containers in Week and Day views
- preserve Agenda's variable height if reintroducing skeletons there

## When To Stop Polishing

Users rarely notice this work consciously. They usually notice its absence.

This level of polish is most valuable when the UI supports a trust-sensitive decision, like choosing an event date based on expected audience overlap. Once the loading state feels stable and truthful, additional value should move toward better product signals: conflict density, category filters, date recommendations, and clear explanations.
