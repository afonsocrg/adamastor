begin;

-- ============================================================================
-- Optional end_time on events
-- ----------------------------------------------------------------------------
-- The dashboard calendar already reads end_time and is wired to render
-- duration blocks via react-big-calendar; it just had nowhere to read from.
-- This adds the column, nullable, no backfill.
--
-- Why nullable: organisers don't always know when an event will end. The
-- calendar fallback (start_time + 2h) lives in the page layer rather than the
-- DB so admins can see "no end set" via NULL rather than a fake value that
-- looks authoritative.
-- ============================================================================

alter table public.events
    add column if not exists end_time timestamp with time zone;

-- Cross-column sanity check: end_time, when set, must be after start_time.
-- NULL end_time is fine (organiser didn't specify).
do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'events_end_after_start_check'
    ) then
        alter table public.events
            add constraint events_end_after_start_check
            check (end_time is null or end_time > start_time);
    end if;
end $$;

commit;
