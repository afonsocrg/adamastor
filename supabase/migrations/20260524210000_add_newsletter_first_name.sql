begin;

-- ============================================================================
-- Optional first_name on newsletter_subscriptions
-- ----------------------------------------------------------------------------
-- Captured at signup time when the form provides it (the footer signup form
-- on /posts/[id] does; the email-only category CTA on /events/[slug] doesn't).
-- Nullable — no backfill needed. Used by the /preferences page to render
-- "Hi {firstName}" greetings and by category welcome emails for a
-- personalized opening.
-- ============================================================================

alter table public.newsletter_subscriptions
    add column if not exists first_name text;

commit;
