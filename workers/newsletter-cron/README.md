# Newsletter cron worker

A Cloudflare Worker on a cron trigger that fires Adamastor's **weekly events
email** on a schedule. It does no sending itself — it calls the
app's secured `POST /api/cron/send-newsletter` endpoint, which delegates to the
existing `/api/sendNewsletter` broadcast pipeline.

> Deployed as `adamastor-newsletter-cron` (Mondays 08:00 UTC). After any
> change, redeploy with `npx wrangler deploy` and run the dry-run below.

## Architecture

```
Cloudflare cron  ──Bearer secret──▶  /api/cron/send-newsletter  ──▶  /api/sendNewsletter
 (this worker)                        (auth + safety gates)            (existing send logic)
```

`NEWSLETTER_PRODUCT` (in `wrangler.toml`) picks what a run sends:

- **`events-weekly`** (default): **one** call. The app sends each reader a single
  personalised email covering every category they follow
  (`lib/newsletter/send-events-weekly.ts`).
- **`per-category`**: legacy rollback. One call (= one Resend broadcast) per
  slug in `NEWSLETTER_CATEGORIES`, so a reader on five categories gets five
  emails. Switch back and redeploy the worker only if events-weekly misbehaves;
  the app still supports both.

The **weekly digest** is intentionally left manual (it needs a human to pick
the editorial post), so don't drive it from cron.

**Deploy order:** ship the app first, then the worker. An old worker against a
new app keeps sending per-category; a new worker against an old app gets a 400.

## Two safety gates (both required to actually send)

1. **`NEWSLETTER_CRON_SECRET`** — shared secret. Must be set on the worker
   (`wrangler secret put`) **and** as an env var on the Next app, and they must
   match. A request without it gets a 401.
2. **`NEWSLETTER_CRON_ENABLED`** — env var on the **Next app**. Until it equals
   the string `"true"`, every cron call is a **dry run** that just reports what
   it would have sent. This is the master switch.

So even after deploy, sends stay off until you flip `NEWSLETTER_CRON_ENABLED`.

## One-time setup

1. **On the Next app (Vercel)** set env vars:
   - `NEWSLETTER_SEND_SECRET` — a long random string (`openssl rand -hex 32`).
     Gates `/api/sendNewsletter`; the cron route forwards it. **Required** —
     sends fail closed without it.
   - `NEWSLETTER_CRON_SECRET` — a different long random string. Gates the cron
     entry point; also set on the worker (next step).
   - `NEWSLETTER_CRON_ENABLED` — leave unset / `"false"` until you're ready.
2. **In this directory:**
   ```bash
   pnpm install
   npx wrangler login
   npx wrangler secret put NEWSLETTER_CRON_SECRET   # paste the SAME value
   ```
3. Review `wrangler.toml` — `crons` (UTC!), `APP_URL`, `NEWSLETTER_CATEGORIES`.

## Test without sending (recommended first)

With `NEWSLETTER_CRON_ENABLED` unset, every call dry-runs:

```bash
npx wrangler dev
# in another shell:
curl "http://localhost:8787/?key=YOUR_SECRET"
```

You can also dry-run the endpoint directly against production safely. For
events-weekly the dry run calls the real send engine in dry-run mode, so the
response lists every recipient (masked), their subject line, and how many
emails the old per-category setup would have sent (`legacyEmailCount`):

```bash
curl -X POST https://adamastor.blog/api/cron/send-newsletter \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"product":"events-weekly","dryRun":true}'
```

Locally, `scripts/preview-events-weekly.ts` prints the same summary and writes
one reader's rendered HTML to `scripts/.preview/` (never sends, never writes).

## Deploy

```bash
npx wrangler deploy
```

Verify the schedule in the Cloudflare dashboard (Workers → this worker →
Triggers). When you're confident, set `NEWSLETTER_CRON_ENABLED="true"` on the
app to arm real sends. Watch a run with `npx wrangler tail`.

## Notes / follow-ups

- ⚠️ **Weekday gotcha:** Cloudflare's cron weekday field is the Quartz scheme —
  `1 = Sunday`, `2 = Monday` … `7 = Saturday` — **not** standard Unix cron
  (`1 = Monday`). `0 8 * * 1` fires **Sunday**. Always use the three-letter
  abbreviation (`MON`, `TUE`, …) in `wrangler.toml` to avoid the off-by-one.
- **Never the digest.** The endpoint *rejects* a call with neither `product`
  nor `category` (400). The weekly Adamastor digest is sent manually by Carlos.
- **events-weekly** skips readers with no events in their categories this week,
  and only emails readers who are active in Supabase **and** a subscribed
  Resend contact (same audience the broadcasts reached). Before each live run it
  copies Resend-side unsubscribes into Supabase. Sends go through the batch API
  with per-day idempotency keys, so a retried run can't double-send. Batch
  emails count toward Resend's **transactional** quota, not broadcast billing.
- A legacy category send is **skipped** server-side if that category has **no
  events** in the window or **no opted-in subscribers**.
- `/api/sendNewsletter` is now **secret-gated** too (`NEWSLETTER_SEND_SECRET`,
  separate from the cron secret) and fails closed. You must set
  `NEWSLETTER_SEND_SECRET` on the app — the cron route forwards it when it
  delegates, so without it the cron's real sends return 500. (See step 1.)
- Cron cadence is per-worker, not per-category. If you want different schedules
  per category, split into multiple `crons` entries + branch on the trigger
  time, or run multiple workers.
