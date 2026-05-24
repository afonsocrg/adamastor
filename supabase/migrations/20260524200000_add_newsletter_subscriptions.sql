begin;

-- ============================================================================
-- Per-category newsletter subscription preferences
-- ----------------------------------------------------------------------------
-- Source of truth for "what does this email want?" — categories[] for the
-- per-category event newsletters, digest_subscribed for the existing weekly
-- editorial digest. Resend segments are kept in sync from this table by
-- application code in lib/newsletter/sync.ts.
--
-- preference_token grants no-login access to /preferences?token=... so
-- subscribers can change their opt-ins without an account.
--
-- Strict opt-in: existing weekly-digest subscribers are NOT backfilled into
-- this table. They keep receiving the weekly digest via Resend until they
-- engage with the preference system, at which point a row is created and
-- digest_subscribed is set from their current Resend segment membership.
-- ============================================================================

create table if not exists public.newsletter_subscriptions (
    email text primary key,
    categories text[] not null default '{}',
    digest_subscribed boolean not null default false,
    preference_token uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    unsubscribed_at timestamp with time zone
);

create unique index if not exists newsletter_subscriptions_preference_token_idx
    on public.newsletter_subscriptions (preference_token);

-- Defense-in-depth: categories[] must reference real event_categories slugs.
-- The API validates input, but if a bad value ever slips through (manual SQL,
-- future code path) the trigger blocks the write so the table never carries
-- a slug that won't sync to a Resend segment.
create or replace function public.newsletter_subscriptions_validate_categories()
returns trigger
language plpgsql
as $$
declare
    invalid_slug text;
begin
    select cat into invalid_slug
    from unnest(new.categories) as cat
    where cat not in (select slug from public.event_categories)
    limit 1;

    if invalid_slug is not null then
        raise exception 'Unknown category slug: %', invalid_slug;
    end if;

    return new;
end;
$$;

drop trigger if exists newsletter_subscriptions_validate_categories
    on public.newsletter_subscriptions;
create trigger newsletter_subscriptions_validate_categories
    before insert or update of categories on public.newsletter_subscriptions
    for each row execute function public.newsletter_subscriptions_validate_categories();

create or replace function public.newsletter_subscriptions_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists newsletter_subscriptions_touch_updated_at
    on public.newsletter_subscriptions;
create trigger newsletter_subscriptions_touch_updated_at
    before update on public.newsletter_subscriptions
    for each row execute function public.newsletter_subscriptions_touch_updated_at();

-- ============================================================================
-- Row-level security
-- ----------------------------------------------------------------------------
-- RLS is enabled with NO policies, so all non-service-role access is denied.
-- Every read/write must go through an API route that uses
-- createServiceRoleClient(). The table holds email addresses and a token that
-- grants account-equivalent access to preferences — leaking even a single row
-- would be a privacy incident, so this is locked tighter than `events`.
-- ============================================================================

alter table public.newsletter_subscriptions enable row level security;

commit;
