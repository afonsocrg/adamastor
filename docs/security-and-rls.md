# Security & RLS

How Adamastor's auth, RLS, and trust boundaries fit together. Read this before adding a new mutating endpoint or table.

## Auth model

- Supabase Auth handles identity (email/password, OAuth).
- `public.profiles` mirrors users with a `role` column: `'admin' | 'user'`.
- [`lib/supabase/authentication.ts`](../lib/supabase/authentication.ts) exposes `getUserProfile(client)` and `assertAuthenticated(client)`. Use these in route handlers, not raw `supabase.auth.getUser()`.

## Supabase clients

We have three:

| Client | Source | Auth context | When to use |
|---|---|---|---|
| **SSR client** | [`lib/supabase/server.ts`](../lib/supabase/server.ts) → `createClient()` | Cookie-based user session (anon if logged out) | Default for API routes and server components. RLS enforces whatever the user can see. |
| **Public anon** | [`lib/supabase/public.ts`](../lib/supabase/public.ts) → `createPublicClient()` | Always anon, no cookies | Read-only public surfaces (sitemap, RSS feed, fetch-public events) |
| **Service role** | [`lib/supabase/service-role.ts`](../lib/supabase/service-role.ts) → `createServiceRoleClient()` | None — bypasses RLS entirely | Server-only paths that must accept anonymous writes (currently: event submissions) |

The service-role client carries an `import "server-only"` guard so it throws at build time if imported into a client component.

## RLS layout on `public.events`

After both migrations apply, `events` has four policies:

| Policy | Role | Operation | Constraint |
|---|---|---|---|
| `Approved events are publicly readable` | (any) | SELECT | `status = 'approved'` |
| `Users can read their own event submissions` | authenticated | SELECT | `submitted_by = auth.uid()` |
| `Admins can manage events` | authenticated | ALL | `profiles.role = 'admin'` |
| `Anyone can submit a pending event` | anon, authenticated | INSERT | `status='pending'` AND no reviewer fields AND `submitter_email` not null AND `submitted_by` is null OR matches `auth.uid()` |

The last policy is defense-in-depth. The submissions API uses the service role and enforces validation itself; if that gate ever has a bug, the INSERT policy at least confines damage to "creates a pending submission" rather than "creates an approved event with arbitrary fields."

## Threat model for `/api/events/submissions`

Anonymous public submissions are spam-attractive. The route stacks four layers in order, designed so each catches a different attacker:

1. **Cloudflare Turnstile** ([`lib/turnstile.ts`](../lib/turnstile.ts)) — catches automated browser sessions. Skipped in dev when `TURNSTILE_SECRET_KEY` is unset.
2. **Honeypot field** — a hidden `website` input. Naïve form-fillers populate it and get silently 200'd (no signal that they were caught).
3. **Zod schema** — catches malformed payloads, bad emails, missing required fields.
4. **Duplicate detection** ([`lib/events/check-duplicates.ts`](../lib/events/check-duplicates.ts)) — catches double-submits and same-event-different-source duplicates.

If all four pass, the row is inserted with `status='pending'`. The defense-in-depth RLS policy is the last line of defense if validation is bypassed.

## Why service-role for submissions specifically

The anon Supabase key ships in the browser bundle (`NEXT_PUBLIC_SUPABASE_ANON_KEY`). If we let the `anon` role INSERT events directly, anyone could `curl` Supabase's REST API and bypass Turnstile entirely:

```
POST <SUPABASE_URL>/rest/v1/events
Authorization: Bearer <anon-key>
{ "title": "...", "status": "pending" }
```

RLS can constrain the *shape* of an insert ("must be pending, must have email") but not the *provenance* ("must have passed our captcha"). To make Turnstile load-bearing, the only path to a write must be through our route — hence service role.

## Adding a new mutating endpoint

Checklist:
1. Decide which client you need (default: SSR; service role only if you must accept anonymous writes).
2. Authenticate and authorize in the route. Use `assertAuthenticated` + role check, don't trust the client.
3. Validate input with Zod (look at existing routes for the pattern).
4. If the route handles a public form, add Turnstile + honeypot.
5. Add RLS policies that match your route's behaviour, even if the route is the primary enforcement layer — they're a backstop.
6. Handle errors via [`lib/errors.ts`](../lib/errors.ts) → `handleError` so you never leak stack traces to the client.

## Where else to look

- [`docs/migrations.md`](./migrations.md) — schema change workflow.
- [`docs/event-submissions.md`](./event-submissions.md) — concrete walkthrough of the four-layer model in production.
