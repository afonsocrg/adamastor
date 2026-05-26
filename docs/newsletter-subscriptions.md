# Newsletter subscriptions & per-category newsletters

Source-of-truth model for "what does this email address want to receive?", plus the per-category broadcast pipeline that drops out of it.

## Why it exists

Adamastor has the weekly editorial digest *and* five category-specific event newsletters (AI, Software Engineering, Design, Product, Startups & Fundraising). The category newsletters are a distribution channel for organiser acquisition — see [`memory/project_event_categories.md`](../.claude/projects/-Users-malik-Code-Adamastor-adamastor-backup/memory/project_event_categories.md).

Subscriber preferences live in **Supabase** (`public.newsletter_subscriptions`). Resend is a projection of that table:

- One **base segment** ("All Subscribers") that every contact lands in.
- One **digest segment** ("Adamastor Weekly") for the existing weekly editorial.
- Five **Topics** (one per category) with `defaultSubscription: opt_out` — the per-category opt-in/opt-out lives in Resend's Topics primitive, not in segments. This sidesteps Resend's 3-segment cap on the free plan and matches the opt-in semantics natively.

Per-category broadcasts target `{ segmentId: ALL_SUBSCRIBERS, topicId: <category> }` — the segment is the recipient universe, the topic narrows to opted-in contacts.

We chose Supabase-as-source-of-truth so we can:
- Show a real preferences page (`/preferences`) and per-category subscriber counts later.
- Query our own subscriber base for analytics without a Resend round-trip.
- Swap providers without losing the underlying preference data.

## Data model

`public.newsletter_subscriptions`:

| Column | Type | Notes |
|---|---|---|
| `email` | text PK | Always lowercased before insert. |
| `first_name` | text, nullable | Captured at signup when the form provides it (footer signup does; category-only CTA does not). Never overwritten by a later anonymous subscribe. Used for `Hi {firstName}` greetings. |
| `categories` | text[] | Subset of `event_categories.slug`. Trigger blocks unknown slugs. |
| `digest_subscribed` | bool | True ⇒ in the weekly editorial digest segment. |
| `preference_token` | uuid | Embedded in `/preferences?token=…` magic links. Long-lived. |
| `created_at` / `updated_at` | timestamptz | `updated_at` maintained by trigger. |
| `unsubscribed_at` | timestamptz | Set when the row goes to zero opt-ins; cleared on re-subscribe. |

**RLS:** enabled with **no policies**. Every read/write goes through API routes that use `createServiceRoleClient()`. The token grants account-equivalent access — leaking even existence is a privacy issue.

**Strict opt-in for legacy subscribers:** existing weekly-digest subscribers were NOT backfilled. They keep receiving the digest via Resend until they engage with the preference system. See "Migrating legacy subscribers" below.

## End-to-end flows

### Per-category subscribe (organiser acquisition path)

```
Visitor on /events/design ──→ CategoryNewsletterCta (email-only form)
                                      │
                                      ▼
                              POST /api/subscribe
                              { email, categories: ["design"], digest: false }
                                      │
                          ┌───────────┼───────────────────────┐
                          ▼           ▼                       ▼
              upsertSubscription   syncResendPreferences   WelcomeEmail (first-time only)
              (Supabase row)       - add to All Subscribers segment
                                   - bulk-update topic subscriptions
                                     (opt_in for chosen categories,
                                      opt_out for the rest)
```

### Full subscribe flow (chrome-driven, name + categories)

```
Navbar gold "Subscribe" pill ──→ /subscribe (SubscribePageClient)
                                      │
                                      ▼
                              Form: name, email, digest, categories[]
                                      │
                                      ▼
                              POST /api/subscribe
                              { name, email, digest, categories, pageUrl, pageTitle }
                                      │
                          ┌───────────┼───────────────────────────────┐
                          ▼           ▼                               ▼
              upsertSubscription   syncResendPreferences         WelcomeEmail / CategoryWelcomeEmail
              (Supabase row)       - segments + topics            (variant by what they opted into;
                                                                   first-time only — `created` flag)
                                      │
                                      ▼
                              Response carries `created` boolean
                                      │
                              Client branches success state:
                                created=true  → "You're in"   header + CTA to /events
                                created=false → "Welcome back" header + CTA to /events
                              + saveIdentity({ name, email })
                              + setSubscribed()  ← localStorage flag, hides navbar Subscribe
```

The page mirrors `/preferences` visually (Lora H1, outlined module, gold pill submit) — see the *Form-page template* in [design-system.md](./design-system.md). Sticky CTA bar appears when the user has selections + the in-form Subscribe is off-screen; a leave-page guard (`beforeunload` + in-app `<Link>` interceptor + shadcn AlertDialog) protects against accidental abandonment once the user has invested name + email + at least one opt-in.

### Managing preferences (no login)

```
Subscriber clicks "Manage preferences" link in any email
            │
            ▼
   /preferences?token=<uuid>   ── token resolves to email via Supabase ──→ PreferencesForm
            │                                                                   │
            │                                                                   ▼
            ▼                                                  PATCH /api/preferences
   No/invalid token → RequestLinkForm                          { token, categories, digest_subscribed }
            │                                                                   │
            ▼                                                                   ▼
   Enter email → POST /api/preferences/request-link            updatePreferencesByToken + syncResendSegments
            │
            ▼
   Always 200. If email is in DB, send PreferencesLinkEmail.
```

### Per-category broadcast

```
Admin POST /api/sendNewsletter { category: "design", broadcast: true, confirmBroadcast: true }
                                      │
                                      ▼
                       Fetch events (10-day window, category-filtered)
                                      │
                                      ▼
                       NewsletterTemplate({ events, category, preferencesUrl })
                                      │
                                      ▼
                       resend.broadcasts.create({
                         segmentId: RESEND_SEGMENT_ALL_SUBSCRIBERS,
                         topicId: RESEND_TOPIC_DESIGN,
                         ...
                       })
                                      │
                                      ▼
                       resend.broadcasts.send(broadcastId)
```

## Client-side localStorage hints

Two browser-only flags layer on top of the Supabase source of truth. Both are UI hints, not authoritative state — the server (Supabase + Resend) decides who's subscribed; localStorage decides how the UI greets them. Worst-case staleness is harmless: a flag-says-subscribed user clicking Subscribe still lands on the `created=false` branch of `/api/subscribe` (the "Welcome back" message) without duplicate sends.

| Key | Shape | Set by | Cleared by | Read by |
|---|---|---|---|---|
| `adamastor:identity:v1` | `{ name, email, savedAt }` | `/subscribe` success path, `/events/submit` success path, category widget (`saveEmail()` — email-only, preserves name) | Any "Not you?" affordance | Form pages (pre-fill name + email); sidebar widgets (personalize headings via `getFirstNameForGreeting`) |
| `adamastor:subscribed:v1` | `"1"` if set | `/subscribe` success, category widget success | Any "Not you?", `/preferences` unsubscribe-all | Navbar Subscribe CTA (`navbar-subscribe-cta.tsx`) — hides the pill when set |

**Identity uses an auth precedence rule.** When a form has an auth-locked email (`/events/submit` for logged-in users), the locked email always wins over localStorage. The localStorage *name* only pre-fills if the saved identity's email matches the locked email — otherwise the name pre-fill is skipped (avoids "Joao" appearing next to a locked `malik@hey.com`).

**Navbar pill re-reads on every pathname change** via `usePathname` + a `useEffect` so a successful subscribe in tab 1 reflects on the next nav, without requiring a full reload. Cross-tab updates lag until next nav (could be fixed with a `storage` event listener — skipped today since it's a rare case).

All helpers live in [`lib/user-identity.ts`](../lib/user-identity.ts) — versioned storage keys, SSR-safe (`typeof window !== "undefined"` guards), silent on quota/private-browsing failures.

## File map

| Concern | Path |
|---|---|
| Migration | [`supabase/migrations/20260524200000_add_newsletter_subscriptions.sql`](../supabase/migrations/20260524200000_add_newsletter_subscriptions.sql) |
| Subscription helpers (DB) | [`lib/newsletter/subscriptions.ts`](../lib/newsletter/subscriptions.ts) |
| Resend preference sync (segments + topics) | [`lib/newsletter/sync.ts`](../lib/newsletter/sync.ts) |
| Segment IDs (digest + All Subscribers) | [`lib/newsletter/segments.ts`](../lib/newsletter/segments.ts) |
| Per-category Topic IDs (env-var driven) | [`lib/newsletter/topics.ts`](../lib/newsletter/topics.ts) |
| Preferences URL builder | [`lib/newsletter/preferences-url.ts`](../lib/newsletter/preferences-url.ts) |
| Subscribe endpoint (extended for categories) | [`app/api/subscribe/route.ts`](../app/api/subscribe/route.ts) |
| Preferences endpoints (GET/PATCH, request-link) | [`app/api/preferences/`](../app/api/preferences/) |
| Broadcast endpoint (digest + per-category) | [`app/api/sendNewsletter/route.ts`](../app/api/sendNewsletter/route.ts) |
| Per-category inline CTA | [`components/category-newsletter-cta.tsx`](../components/category-newsletter-cta.tsx) |
| Subscribe page (chrome-driven full signup) | [`app/(main)/subscribe/`](../app/(main)/subscribe/) |
| Preferences page | [`app/(main)/preferences/`](../app/(main)/preferences/) |
| Client-side identity + subscription hints (localStorage) | [`lib/user-identity.ts`](../lib/user-identity.ts) |
| Navbar Subscribe CTA (hides on subscribed) | [`components/navbar-subscribe-cta.tsx`](../components/navbar-subscribe-cta.tsx) |
| Email templates | [`components/email/newsletter-template.tsx`](../components/email/newsletter-template.tsx), [`components/email/preferences-link.tsx`](../components/email/preferences-link.tsx), [`components/email/category-welcome.tsx`](../components/email/category-welcome.tsx) |

## Env vars

The weekly digest segment uses the existing `RESEND_SEGMENT_ID`. Per-category broadcasts need the base segment plus one Topic per category:

```
# Base segment for every contact (broadcasts require a segmentId even
# when filtering by topic). Create one segment in Resend that matches
# all contacts in your audience.
RESEND_SEGMENT_ALL_SUBSCRIBERS=

# One Topic per category — create in Resend dashboard:
#   Defaults to: Opt-out  (cannot be changed later)
#   Visibility:  Public
RESEND_TOPIC_AI=
RESEND_TOPIC_SOFTWARE_ENGINEERING=
RESEND_TOPIC_DESIGN=
RESEND_TOPIC_PRODUCT=
RESEND_TOPIC_STARTUPS_FUNDRAISING=
```

The All Subscribers segment is a one-time setup; Topics are also created once in the Resend dashboard. A missing topic env var is treated as "this category isn't wired up yet" — the sync layer logs a warning and skips, so local dev doesn't need all five.

**Why Topics and not segments?** Resend's free plan caps at 3 segments. Topics have no documented limit and natively model opt-in/opt-out per category, which is exactly the preference primitive we need. Broadcasts can combine a base segment with a Topic filter, so we get per-category targeting with one segment slot used.

**One subtle gotcha — the vestigial "Adamastor Weekly" Topic.** When Topics were enabled on this account, Resend auto-created an "Adamastor Weekly" Topic with `defaultSubscription: opt_in`. Every contact (including new per-category subscribers) is auto-opted-in to that Topic. This is harmless today because the weekly digest broadcast targets the *segment* with the same name (`RESEND_SEGMENT_ID`), not the topic — so a Design-only subscriber who's opt-in on the Adamastor Weekly Topic still won't receive the digest, because they were never added to the Adamastor Weekly segment.

If we ever migrate the digest to topic-based broadcasting (`{ segmentId: ALL_SUBSCRIBERS, topicId: ADAMASTOR_WEEKLY_TOPIC }`), per-category subscribers would suddenly start getting the digest. At that point either: (a) explicitly opt them out of the digest Topic when `digest_subscribed = false`, or (b) rebuild the digest Topic with `opt_out` defaults and backfill opt-ins from the existing segment.

## Sending a per-category broadcast

```bash
# Test send (your own inbox)
curl -X POST $APP_URL/api/sendNewsletter \
  -H 'Content-Type: application/json' \
  -d '{ "category": "design", "testEmail": "you@example.com" }'

# Broadcast (irreversible — sent to everyone in the Design segment)
curl -X POST $APP_URL/api/sendNewsletter \
  -H 'Content-Type: application/json' \
  -d '{ "category": "design", "broadcast": true, "confirmBroadcast": true }'
```

The digest call is the same as before — just omit `category`.

## Migrating legacy subscribers

A subscriber who joined the weekly digest before `2026-05-24` exists in Resend's segment but has **no row** in `newsletter_subscriptions`. They:

- Keep receiving the weekly digest (Resend is the source for that send).
- Can't currently self-serve their preferences — `/api/preferences/request-link` only finds rows that exist in Supabase.

When this matters, run a one-off migration: read the digest segment via `resend.contacts.list`, insert a row per contact with `digest_subscribed: true` and an empty `categories[]`. Each row will get a fresh `preference_token` automatically and can be emailed the `PreferencesLinkEmail` afterward. Deliberately deferred from v1 to keep the launch small.

## Analytics & the B→A decision

The `/preferences` flow is instrumented end-to-end so we can decide later whether to graduate from the current two-step magic-link model (B) to a per-recipient-token model (A — token embedded directly in broadcast emails). Events fire to PostHog:

| Event | Fired from | Notes |
|---|---|---|
| `preferences_request_link_submitted` | client (RequestLinkForm) | Anonymous capture, `email_domain` only. No PII before we've authenticated the email. |
| `preferences_request_link_email_sent` | server (request-link route) | `distinct_id = email`. Only when the email exists in `newsletter_subscriptions`. |
| `preferences_request_link_email_skipped` | server (request-link route) | `distinct_id = normalized email`. Visible signal of how many requests come from non-subscribers. |
| `preferences_loaded` | client (PreferencesForm useEffect) | `posthog.identify(email)` first, then capture. Tied via session to the prior `submitted` event. |
| `preferences_saved` | client (PreferencesForm after PATCH) | Previous and next state in properties, so we can build "what changed" funnels. |
| `preferences_unsubscribe_all` | client (PreferencesForm) | Tracked separately from `preferences_saved` so unsubscribe momentum doesn't muddy "engagement" metrics. |

The `subscribed_newsletter` event (already in `/api/subscribe`) carries `categories` and `digest_subscribed` properties, so per-category subscribe conversion is measurable from the per-category CTA without new instrumentation.

**Decision trigger for graduating to A:** if `preferences_saved / preferences_request_link_submitted < 10%` over a meaningful sample (a few broadcast cycles), the two-step UX is killing conversion and per-recipient tokens become worth the leakage risk. Implementation cost when that happens: add a one-way Resend contact-attribute sync inside `syncResendSegments`, change the broadcast template footer to `{{contact.preference_token}}`. Roughly half a day. The Supabase data model already supports it — every row has a `preference_token`.

## Production deploy checklist

Before per-category newsletters work in prod, the following must be set in Vercel (or wherever the app is hosted):

```
RESEND_SEGMENT_ID                       # existing — weekly digest segment
RESEND_SEGMENT_ALL_SUBSCRIBERS          # base segment for per-category broadcasts
RESEND_TOPIC_AI
RESEND_TOPIC_SOFTWARE_ENGINEERING
RESEND_TOPIC_DESIGN
RESEND_TOPIC_PRODUCT
RESEND_TOPIC_STARTUPS_FUNDRAISING
```

Missing topic env vars degrade gracefully: the sync layer logs a warning and skips that category, the broadcast route rejects sends to that category with a 500 + actionable message. Missing `RESEND_SEGMENT_ALL_SUBSCRIBERS` blocks all per-category broadcasts; the weekly digest still works because it uses `RESEND_SEGMENT_ID` directly.

**Migrations to apply via the Supabase dashboard SQL editor before first use:**
- `supabase/migrations/20260524200000_add_newsletter_subscriptions.sql`
- `supabase/migrations/20260524210000_add_newsletter_first_name.sql`

## Known limitations (v1)

Things that work today but have a known sharp edge. None are blocking; each has a stated mitigation when it becomes worth the lift.

- **Concurrent subscribes for the same email can race.** `upsertSubscription` reads then writes. Two parallel POSTs from the same email could each see `existing = null`, compute their own next-categories, and the second write would overwrite the first. Mitigation: rewrite the merge as an SQL-side `array_distinct(existing || incoming)` via an `rpc` function. Not done yet because the race window is small and subscribers re-clicking a form button is rare.

- **Request-link timing oracle.** `POST /api/preferences/request-link` always returns 200 (no enumeration via status), but the found-in-DB path takes longer because it triggers `resend.emails.send`. A determined attacker timing responses could distinguish subscribed vs not-subscribed emails. Mitigation: pad the not-found path with an artificial delay matching the typical send latency.

- **No way to set first_name from `/preferences`.** Subscribers who came in through the category CTA (email-only form) have `first_name = null` and stay nameless on `/preferences`. Fix: add an editable name field to the preferences form and accept it in the PATCH endpoint.

- **"Unsubscribe from everything" has no confirmation dialog.** Destructive action one click away. Adding a confirm step is a 10-line change.

- **Vestigial "Adamastor Weekly" Topic.** Covered above — auto-created opt-in topic that's harmless today because the digest broadcasts target the segment. Matters only if/when we migrate the digest to topic-based broadcasting.

- **Legacy weekly-digest subscribers don't have rows in `newsletter_subscriptions`.** They keep receiving the digest via Resend and can't currently self-serve preferences through `/api/preferences/request-link`. Mitigation: a one-off admin script that reads the digest segment and inserts rows with `digest_subscribed = true` for each contact.

- **Subscriber email validation is loose** (`email.includes("@")`). Lets through obvious garbage like `a@b`. Fine for friction reduction; tighten with a Zod schema if abuse becomes a problem.

## Privacy & safety notes

- **No enumeration**: `/api/preferences/request-link` always returns `{ ok: true }` regardless of whether the email exists. The UI says "If we have you on file…" so a non-subscriber can't tell from response timing or content.
- **Tokens are auth**: anyone with a `preference_token` can change that email's subscription state. Treat them like password equivalents — don't log them, don't include them in URLs that leak via referer (we don't link from `/preferences` to anywhere external).
- **Service-role only writes**: there are no RLS policies on `newsletter_subscriptions`. An accidental client-side query returns zero rows / errors, instead of leaking email addresses.
- **Sync is best-effort**: `syncResendSegments` catches per-segment failures and logs them. Supabase is the source of truth — if Resend drifts (failed call, missing segment), the next preference change re-syncs the changed slugs. We don't currently auto-reconcile periodically; not needed at our scale.
