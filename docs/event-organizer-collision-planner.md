# Event Organizer Collision Planner Ideas

This document captures product ideas for a user-facing calendar that helps Lisbon community builders and event organizers avoid audience overlap.

## Product Thesis

Most event calendars are passive listings. This should be a planning tool.

The core job is not only "show me events." It is:

- help me pick a date that gives my event a better chance
- show whether my audience is already busy
- explain which nearby dates are less crowded
- reduce accidental competition between community organizers

The calendar should make collision awareness obvious without making the page feel punitive or over-engineered.

## Target Users

- community builders planning meetups, dinners, workshops, talks, or recurring gatherings
- event organizers choosing dates for public Lisbon events
- coworking spaces and venues deciding when to host category-specific programming
- sponsors or partners scanning the local event landscape

## Core Questions To Answer

- Is this date crowded?
- Is this category crowded?
- Are there events competing for the same audience?
- Are nearby dates safer?
- Which days of the week are usually better for this category?
- Are there recurring conflicts I should know about?
- If I move my event by one or two days, does overlap improve?

## Calendar Modes

### Browse Mode

For scanning the market:

- month view with category density cues
- filters for category, location, format, and audience type
- event details on hover or click
- "crowded" and "quiet" day signals

### Planning Mode

For choosing a date:

- organizer selects category, expected audience, format, and possible date range
- calendar highlights direct and adjacent conflicts
- system suggests better dates
- optional score per candidate date

### Compare Mode

For choosing between dates:

- compare two or more candidate dates
- show overlapping events by category and audience
- show event count, category count, and likely audience competition
- explain tradeoffs in plain language

## Collision Signals

Useful signals:

- same category events on the same day
- adjacent category events with overlapping audience
- large events that may absorb attention even outside the exact category
- same venue or same neighborhood conflicts
- same time window conflicts
- recurring event patterns
- public holidays and major city events

Potential severity levels:

- Low: some activity, likely fine
- Medium: notable overlap, review details
- High: direct audience conflict
- Unknown: missing category, time, or attendance data

## Visual Ideas

Use calm decision-support visuals, not alarm-heavy warnings.

- subtle heat per day for event density
- category chips inside day cells
- conflict badges like "3 design events"
- a quiet "better nearby" marker on alternate dates
- side panel with "Why this date is risky"
- side panel with "Better options"
- timeline view for same-day time overlap

Avoid:

- making every busy day look bad
- using red as the default density color
- overwhelming month cells with too many labels
- hiding the reasoning behind a score

## Date Recommendation Model

A simple first version can score dates with transparent heuristics:

- direct same-category event count
- adjacent-category event count
- time overlap
- venue/neighborhood overlap
- historical day-of-week suitability
- major event or holiday penalties
- recency of data

The UI should explain the score:

> Thursday has 4 startup events, including 2 in the same evening window. Tuesday has 1 adjacent event and no direct category conflict.

## Organizer Workflow

Possible flow:

1. Choose event category.
2. Choose rough audience or tags.
3. Choose candidate date range.
4. Calendar highlights crowded and open dates.
5. User clicks a candidate date.
6. Detail panel explains conflicts and suggests alternatives.
7. User saves, shares, or copies a planning summary.

## Public Trust Requirements

For organizers to trust planning advice:

- loading must be stable and not visually uncertain
- category definitions must be clear
- conflict labels must be explainable
- missing data should be acknowledged
- event source and freshness should be visible
- recommendations should feel advisory, not absolute

## MVP Scope

Good first public version:

- month calendar
- category filter
- day density
- conflict panel for selected day
- suggested nearby dates
- shareable date-planning summary

Defer:

- account creation
- organizer submissions inside the planner
- predictive attendance modeling
- complex ML scoring
- venue availability

## Open Questions

- What categories matter most for overlap in Lisbon?
- Which categories share audiences?
- Do organizers care more about same-day or same-week conflicts?
- Should private/unlisted draft events be supported?
- Should organizers be able to announce "tentative" dates?
- How should event size be estimated when attendance data is missing?
- Should the planner bias toward collaboration, e.g. "partner with this event" instead of "avoid this date"?
