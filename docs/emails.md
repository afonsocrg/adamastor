# Transactional & notification emails

How Adamastor sends email, where templates live, and how to add a new one.

## Provider

[Resend](https://resend.com/) via the official SDK. API key in `RESEND_API_KEY`. All emails ship from `Adamastor <hi@digest.adamastor.blog>`.

Newsletter broadcast also uses Resend's segment API. See README's "Operations Notes" for the segment env vars.

## Templates

Templates are React Email components in [`components/email/`](../components/email/):

| Template | Trigger | Sent to |
|---|---|---|
| `email-template.tsx` | New newsletter signup | Subscriber |
| `newsletter-template.tsx` | Weekly digest broadcast | Newsletter segment |
| `team/subscribe-alert.tsx` | New newsletter signup | Hardcoded team list in `app/api/subscribe/route.ts` |
| `event-submission-received.tsx` | Public form submission | All admins (see below) |
| `event-submission-confirmation.tsx` | Public form submission | Submitter |
| `event-submission-approved.tsx` | Admin approves a submission | Submitter |
| `event-submission-rejected.tsx` | Admin rejects a submission | Submitter |

Every template defines `PreviewProps` so you can develop it in isolation:

```bash
pnpm email
# Open http://localhost:3001
```

## Send helpers

Event-submission emails are wrapped in [`lib/events/notifications.ts`](../lib/events/notifications.ts). Use the helpers rather than calling `resend.emails.send` directly — they handle:

- Date formatting in Europe/Lisbon timezone
- City label capitalisation
- Admin recipient resolution (next section)
- Try/catch logging so a Resend hiccup doesn't tank the parent request

## Admin recipient resolution

`notifyAdminsOfSubmission` builds the recipient list by:

1. Querying `profiles` for `role = 'admin'` (service role, bypasses RLS).
2. Calling `supabase.auth.admin.listUsers({ perPage: 1000 })` to map those IDs to emails.
3. Adding any addresses from `EVENT_SUBMISSIONS_NOTIFY_EXTRA` (comma-separated env var).
4. Deduplicating and lowercasing.

**Known limit**: step 2 caps at 1000 users. Fine while the user base is small; to scale, store `email` directly on `profiles` (auto-populated by a Postgres trigger from `auth.users`) and skip the auth-side lookup.

## Background sending

The submissions API uses `waitUntil` from `@vercel/functions` so emails fire after the HTTP response returns:

```ts
waitUntil(
  Promise.allSettled([
    notifyAdminsOfSubmission(emailContext),
    sendSubmissionConfirmationEmail(emailContext),
  ]),
);
```

This keeps the response fast and means a Resend error doesn't fail the submission. The trade-off: on non-Vercel runtimes, `waitUntil` is a no-op and emails *might* be lost if the request finishes before they send. We deploy to Vercel, so this is fine today.

## Adding a new email

1. Add a `.tsx` template in `components/email/` (or `components/email/team/` if it's for staff). Export `PreviewProps`.
2. If it's a one-off send, call `resend.emails.send` directly with the React component.
3. If it's part of a feature (multiple triggers, shared context type), add a helper next to its caller — pattern from `lib/events/notifications.ts`.
4. Verify in the Email preview (`pnpm email`) before shipping.
