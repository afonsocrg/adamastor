begin;

-- ============================================================================
-- Defense-in-depth INSERT policy for event submissions
-- ----------------------------------------------------------------------------
-- The /api/events/submissions route uses the service role to bypass RLS so
-- it can validate input, run Turnstile, and dedup-check before inserting.
-- This policy is a *backstop*: if anything else tries to insert via the
-- anon/authenticated client (e.g. an accidental client-side call or a future
-- code path), the row is still constrained to a safe shape.
--
-- A submission via this policy can only:
--   - have status='pending'
--   - leave reviewed_by / reviewed_at / rejection_reason null
--   - include a non-empty submitter_email (so we can contact the submitter)
--   - claim submitted_by only if the value matches auth.uid() (no impersonation)
-- ============================================================================

drop policy if exists "Anyone can submit a pending event" on public.events;
create policy "Anyone can submit a pending event"
    on public.events
    for insert
    to anon, authenticated
    with check (
        status = 'pending'
        and reviewed_by is null
        and reviewed_at is null
        and rejection_reason is null
        and submitter_email is not null
        and char_length(submitter_email) > 0
        and (submitted_by is null or submitted_by = auth.uid())
    );

commit;
