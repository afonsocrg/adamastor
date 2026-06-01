begin;

-- ============================================================================
-- Same-day-alert opt-in for event submissions
-- ----------------------------------------------------------------------------
-- When an organiser submits an event they can ask to be told if we later
-- approve ANOTHER event that shares their day + city + category. This flag
-- records that opt-in on the event row itself, so when a new event B is
-- approved we can find the already-listed events A whose organisers opted in
-- and email them (see lib/events/notifications.ts → notifyOrganisersOfSameDayClash).
--
-- Default false: existing rows and non-opted-in submissions never trigger an
-- alert. The app code reads/writes this best-effort — submissions still
-- succeed if this migration hasn't run yet; the alerts simply stay dormant
-- until it does.
-- ============================================================================

alter table public.events
    add column if not exists notify_same_day boolean not null default false;

-- Partial index: the approval-time lookup only ever filters on opted-in rows,
-- which are the minority, so a partial index keeps it tiny.
create index if not exists events_notify_same_day_idx
    on public.events (notify_same_day)
    where notify_same_day = true;

commit;
