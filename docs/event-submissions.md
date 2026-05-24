# Event Submissions

User-submitted events with admin approval. Public form at `/events/submit`; admin review queue at `/dashboard/event-submissions`.

## Why it exists

Adamastor is acquiring **event organisers** as a user segment. The pitch to them: "post your event once on Adamastor and reach Portugal's tech and startup community." The flow has to feel low-friction and trustworthy or organisers churn before they convert. See [`memory/project_event_submissions.md`](../.claude/projects/-Users-malik-Code-Adamastor-adamastor-backup/memory/project_event_submissions.md) (if you have access) for the longer strategic note.

## End-to-end flow

```
Organiser pastes URL → /api/scrape pre-fills form → POST /api/events/submissions
       │                                                      │
       │                                                      ▼
       │                                  Turnstile + Zod + honeypot + dedup
       │                                                      │
       │                                                      ▼
       │                                           Insert as status='pending'
       │                                                      │
       │                  ┌───────────────────────────────────┤
       │                  ▼                                   ▼
       │      Email submitter (confirmation)     Email admins (review CTA)
       │
       ▼
Admin opens /dashboard/event-submissions
       │
       ▼
Edit then approve  ─→  status='approved' ─→ revalidate /events ─→ Email submitter (approved)
       │
       └→ Reject (with reason) ─→ status='rejected' ─→ Email submitter (rejected)
```

## File map

| Concern | Path |
|---|---|
| Public page (server) | [`app/(main)/events/submit/page.tsx`](../app/(main)/events/submit/page.tsx) |
| Public form (client) | [`app/(main)/events/submit/SubmitEventForm.tsx`](../app/(main)/events/submit/SubmitEventForm.tsx) |
| Submit API | [`app/api/events/submissions/route.ts`](../app/api/events/submissions/route.ts) |
| Review/decision API | [`app/api/events/submissions/[id]/route.ts`](../app/api/events/submissions/[id]/route.ts) |
| Admin queue | [`app/(dashboard)/dashboard/event-submissions/page.tsx`](../app/(dashboard)/dashboard/event-submissions/page.tsx) |
| Admin review form | [`app/(dashboard)/dashboard/event-submissions/[id]/ReviewSubmissionClient.tsx`](../app/(dashboard)/dashboard/event-submissions/[id]/ReviewSubmissionClient.tsx) |
| Email templates | [`components/email/event-submission-{received,confirmation,approved,rejected}.tsx`](../components/email/) |
| Email send helpers | [`lib/events/notifications.ts`](../lib/events/notifications.ts) |
| Schema migration | [`supabase/migrations/20260524180000_add_event_submission_workflow.sql`](../supabase/migrations/20260524180000_add_event_submission_workflow.sql) |
| Defense-in-depth RLS | [`supabase/migrations/20260524190000_add_event_submission_insert_policy.sql`](../supabase/migrations/20260524190000_add_event_submission_insert_policy.sql) |
| Turnstile helper | [`lib/turnstile.ts`](../lib/turnstile.ts) |
| Service-role client | [`lib/supabase/service-role.ts`](../lib/supabase/service-role.ts) |

## Status model

`events.status` is `'pending' | 'approved' | 'rejected'` (enforced by check constraint in the migration).

| Status | Visible publicly? | Set by |
|---|---|---|
| `pending` | No | Default for non-admin submissions |
| `approved` | Yes (RLS gate) | Admin clicks Approve, or admin-created via `/api/events` |
| `rejected` | No | Admin clicks Reject (with reason) |

The admin-only `/dashboard/add-event` route stays "instant publish" — it explicitly stamps `status='approved'` via [`app/api/events/route.ts`](../app/api/events/route.ts). The default-to-pending column behaviour is a safety net: any future code path that forgets to set status will land in the moderation queue, not the public site.

## Admin path (also auto-approves)

If a logged-in admin uses the *public* `/events/submit` form, the submission API treats it as instant-publish (`status='approved'`, immediate revalidation). Non-admin logged-in users and guests go through the queue.

## Environment variables

These belong in `.env.local` and Vercel:

| Var | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Used by the submissions API to bypass RLS so anonymous submitters can insert. Never expose to the browser. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public Cloudflare Turnstile site key. If unset, the captcha widget doesn't render and verification is skipped (dev convenience). |
| `TURNSTILE_SECRET_KEY` | Server. Required in prod. If unset, [`lib/turnstile.ts`](../lib/turnstile.ts) logs a warning and skips verification — fine for dev, dangerous for prod. |
| `EVENT_SUBMISSIONS_NOTIFY_EXTRA` | Optional. Comma-separated emails always cc'd on new-submission notifications, in addition to `profiles.role='admin'` users. |

## Threat model

See [`docs/security-and-rls.md`](./security-and-rls.md). Summary: Turnstile catches automated submission, honeypot catches naive bots, Zod catches malformed payloads, the dedup check catches double-submits, and the RLS INSERT policy caps damage radius if the API ever has a bug.

## Known limitations / future work

- **Admin email lookup scans all auth users** ([`lib/events/notifications.ts`](../lib/events/notifications.ts) `resolveAdminRecipients`). Fine while admin count is small. If we scale, store `email` on `profiles` and skip the `auth.admin.listUsers` join.
- **No "my submissions" page yet.** The RLS policy `"Users can read their own event submissions"` is already in place, so building this is just a UI on top.
- **No trusted-submitter tier.** Repeat organisers still go through review every time. A `profiles.trusted_submitter` flag + branch in the API would skip review for known-good organisers.
- **Approved email links to the city-filtered route, not a per-event page.** Per-event canonical URLs don't exist today. Update [`app/api/events/submissions/[id]/route.ts`](../app/api/events/submissions/[id]/route.ts) `sendSubmissionApprovedEmail` call when they do.
