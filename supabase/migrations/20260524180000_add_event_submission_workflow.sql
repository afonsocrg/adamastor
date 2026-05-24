begin;

-- ============================================================================
-- Submission / approval workflow for events
-- ----------------------------------------------------------------------------
-- Adds a moderation queue to public.events so that non-admin users can submit
-- events from a public form, and admins review them before they show up on
-- the site. Existing rows are backfilled to status='approved' so nothing
-- disappears from the public surface on deploy.
-- ============================================================================

alter table public.events
    add column if not exists status text not null default 'pending',
    add column if not exists submitted_by uuid references auth.users(id) on delete set null,
    add column if not exists submitter_name text,
    add column if not exists submitter_email text,
    add column if not exists submitted_at timestamp with time zone not null default now(),
    add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
    add column if not exists reviewed_at timestamp with time zone,
    add column if not exists rejection_reason text;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'events_status_check'
    ) then
        alter table public.events
            add constraint events_status_check
            check (status in ('pending', 'approved', 'rejected'));
    end if;
end $$;

-- Backfill: every event that existed before this migration was admin-created
-- and immediately published, so mark them approved and set reviewed_at to the
-- backfilled submitted_at so the audit trail is internally consistent.
--
-- The where-clause matches every pre-existing row by construction (the three
-- new columns it tests are being added by this same migration with NULL
-- defaults). It reads as a filter but is really a safety belt: if the
-- migration is ever re-run partially or in a weird state, we won't clobber
-- real submissions someone else has inserted in the meantime.
update public.events
set
    status = 'approved',
    reviewed_at = coalesce(reviewed_at, submitted_at)
where status = 'pending'
    and submitted_by is null
    and submitter_email is null;

create index if not exists events_status_idx
    on public.events (status);

create index if not exists events_submitted_at_idx
    on public.events (submitted_at desc);

-- ============================================================================
-- Row-level security
-- ----------------------------------------------------------------------------
-- Public reads only see approved events. Authenticated users see their own
-- submissions (any status) so a future "my submissions" view can render
-- without extra plumbing. Admins manage everything.
-- ============================================================================

alter table public.events enable row level security;

drop policy if exists "Events are publicly readable" on public.events;
drop policy if exists "Public can read events" on public.events;
drop policy if exists "Public read events" on public.events;
drop policy if exists "Approved events are publicly readable" on public.events;
create policy "Approved events are publicly readable"
    on public.events
    for select
    using (status = 'approved');

drop policy if exists "Users can read their own event submissions" on public.events;
create policy "Users can read their own event submissions"
    on public.events
    for select
    to authenticated
    using (submitted_by = auth.uid());

drop policy if exists "Admins can manage events" on public.events;
create policy "Admins can manage events"
    on public.events
    for all
    to authenticated
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
                and profiles.role = 'admin'
        )
    )
    with check (
        exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
                and profiles.role = 'admin'
        )
    );

commit;
