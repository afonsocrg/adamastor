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
| `preferences-link.tsx` | Visitor submits `/preferences` request-link form | The requester (if subscribed) |
| `category-welcome.tsx` | First-time per-category subscribe (no digest opt-in) | Subscriber |
| `event-same-day-alert.tsx` | A newly-approved event matches an organiser's category + day + city | Organiser of the existing event (opt-in) |

> **`event-same-day-alert.tsx` is template-only so far.** Fires to organiser A when admins approve organiser B's event that lands in the **same category, same day, AND same city** (online events excluded). Informational/caring register, not promotional — surface the clash early so A can adjust, coordinate, or cross-promote ("the call is yours"). Gold CTA → that day's lineup (`/events?date=…`). **Not yet wired:** the send helper in `lib/events/notifications.ts`, the opt-in preference field, and the detection at approval time. See memory `project_same_day_alert_email`.
| `event-same-day-alert.tsx` | A newly-approved event matches an organiser's category + day + city | Organiser of the existing event (opt-in) |

> **`event-same-day-alert.tsx` is template-only so far.** Fires to organiser A when admins approve organiser B's event that lands in the **same category, same day, AND same city** (online events excluded). Informational/caring register, not promotional — surface the clash early so A can adjust, coordinate, or cross-promote ("the call is yours"). Gold CTA → that day's lineup (`/events?date=…`). **Not yet wired:** the send helper in `lib/events/notifications.ts`, the opt-in preference field, and the same-category/same-day/same-city detection at approval time. See memory `project_same_day_alert_email`.

Every template defines `PreviewProps` so you can develop it in isolation:

```bash
pnpm email
# Open http://localhost:3001
```

## Visual design system

Email templates mirror the article-page design system (`docs/typography.md`, `docs/design-system.md`), translated for the hostile CSS environment of email clients. The **Adamastor Weekly** broadcast (`newsletter-template.tsx`) is the canonical implementation; new templates should follow it.

**Shared tokens live in [`components/email/_theme.ts`](../components/email/_theme.ts)** — the single source of truth every template imports: the `C` palette, `SERIF`/`SANS` stacks, `FONTS_HREF`, `kickerStyle`, `hairline`, `primaryCtaStyle` (gold pill), `secondaryCtaStyle` (outlined navy), and `ghostCtaStyle` (transparent). Don't redefine these per template; import them so a token change propagates everywhere. (Underscore-prefixed so the React Email dev server doesn't list it as a template.) **All templates consume it** — newsletter, welcome, category-welcome, preferences-link, the four event-submission emails, and the team subscribe-alert.

**Button tiers** (use the right weight for the action): `primaryCtaStyle` (gold pill) for the one primary action — always white text, never navy on gold; `secondaryCtaStyle` (outlined navy pill) for secondary/utility actions; `ghostCtaStyle` (transparent, navy text) for the quietest tier. Each pairs with a hover class in the template's `<style>` block (`.cta-primary` → gold.shade, `.cta-ghost` → navy.veil).

**WhatsApp contact pattern** — a quiet "Message Malik on WhatsApp" link (navy.bright, no arrow) on the subscriber/organiser-facing surfaces (preferences-link, the three submitter event-submission emails). Uses `https://piara.li/wa?text=<context-specific draft>` (Malik's shortener forwards `?text=` to wa.me and keeps the number out of source — same pattern as the events page). **No arrow** — the `→` reads pushy on a relaxed "reach out" offer.

**Palette** — the navy family, no cyan (cyan is being phased out site-wide). Tokens are mirrored as a `C` constant at the top of `newsletter-template.tsx`: `navy #104357` (body, headlines, byline name, event titles), `bright #1C6EB4` (links + Weekly pillar kicker), `tone #4D7689` (secondary text, kickers, dateline), `tint #A7E1FC` (list bullets, blockquote rule, event left-accent), `frame #E8F0F4` (hairlines), `veil #E1F2F9` (soft surfaces), `canvas #EDF3F6` (barely-navy email canvas).

**Fonts** — Lora (editorial display) + Inter (body) are attempted via a Google Fonts `<link>` (`Inter:ital,wght@0,400..700` + `Lora:ital,wght@0,600..700;1,400..500`, variable ranges so true 450 / 475 / 575 weights render). They **always** fall back: Lora → `Georgia` (the universal email serif), Inter → the system sans stack. Webfonts load in Apple Mail / iOS Mail and friends; Gmail and Outlook desktop strip them and get the fallbacks. The brand survives either way.

> **Gotcha — don't quote font-family names inside a `<style>` block.** React HTML-escapes text children, so `font-family: 'Lora'` inside `<style>{`…`}</style>` is rendered as `font-family: &#x27;Lora&#x27;`, which is invalid CSS — the declaration is silently dropped (sibling declarations like `font-size` still apply, which makes it look like a partial-cascade bug). Multi-word names are valid *unquoted* CSS identifiers (`font-family: Lora, Georgia, Times New Roman, serif`), so the `SERIF` / `SANS` constants omit quotes. Inline `style={{}}` props are attribute values, not text children, so they're unaffected — that's why the H1 (inline) worked while the blockquote (`<style>`) didn't.

**Chrome** — no masthead wordmark (removed; the email opens straight on the kicker). Two-pillar kicker row (`Adamastor Weekly` in `bright` ←→ `Week N` gutter in `tone`, parsed from the stored `"Title | Week N"` by `splitTitle`); Lora H1 with length-responsive sizing; byline with **Carlos's avatar** (a 48px circle, sourced from `authors.image_url` → absolute *raw* URL) + name `navy` 575 · dateline `tone`; navy-frame hairline section breaks; footer tagline `Only You Know Who You Can Be` in Lora italic. Article body HTML is styled by the `.adamastor-prose` rules in the `<style>` block — a 1:1 port of `.article-prose` (h2 with top hairline, `strong` 575, `em` italic 450, `navy.bright` links, navy-tint list markers, Lora-italic-475 blockquote with a navy-tint left rule).

> **Avatars / images — use raw `/<file>.jpeg`, never `/_next/image`.** Founder photos live at `https://adamastor.blog/carlos.jpeg` · `/malik.jpeg` · `/afonso.jpeg` (800×800, the same faces as `/events/submit`). Point email `<img>` at the raw file: the Next image optimizer content-negotiates to **WebP/AVIF**, which Outlook and several webmail clients can't render. Raw JPEG/PNG is larger but universal. The send route converts `authors.image_url` (a site-relative path) to an absolute raw URL.

**Festive milestone alert** — the team subscribe-alert (`team/subscribe-alert.tsx`) renders a celebratory variant when `total_subscribers` lands on a round number (`MILESTONES = [50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, …, 100000]`): a large gold count badge (a circle — "basic shapes", since a hexagon needs SVG which email strips — with a soft gold-tint `box-shadow` glow, white-on-gold) + "We just hit N subscribers". Regular signups get a modest version of the same badge. **This is a pure render-time branch on the existing `total_subscribers` prop — no send-logic change.** The badge degrades to a plain gold circle in Outlook (no `border-radius`/`box-shadow`).

No bespoke dark scheme: email dark mode is client-controlled and unreliable, so we ship the canonical light design and let clients invert.

### Known gap — content transforms aren't in the email path

The public post route runs `normalizeEmojiLists` + `normalizeTypography` on the TipTap JSON before rendering (emoji-led paragraph runs → `<ul>`, ASCII → curly quotes / em-dash / ellipsis). The email path (`lib/tiptap-to-html.ts` → `generateHTML`) does **not**. So a real Weekly send renders Carlos's emoji-prefixed lines as plain `<p>` paragraphs (not bulleted lists), and any straight quotes / `--` stay un-prettified. Closing the gap = compose those two JSON transforms into `tiptapToHtml` before `generateHTML`. Until then, source content must already use real Unicode characters (it usually does — see `docs/typography.md` → Character QA).

## Status & open follow-ups (email redesign, 2026-05-29)

All ten templates are on `_theme` and the design system above (9 cards + the newsletter; the 10th is the new `event-same-day-alert.tsx`). All carry the mobile-padding fix and the navy dark mode (see "Dark mode" above). Per-template notes:

| Template | Status |
|---|---|
| `newsletter-template.tsx` (Adamastor Weekly) | ✅ reference. Carries **parked exploration** — an events-page-card event variant + an "On the calendar" date-block/category-chip section — awaiting the calendar/category decisions (see below). |
| `email-template.tsx` (welcome) | ✅ reciprocity-first; CTA "Read the latest edition" falls back to homepage (see wiring). |
| `category-welcome.tsx` | ✅ per-topic signature (`SIGNERS_BY_CATEGORY`), organiser nudge, ghost manage button. |
| `preferences-link.tsx` | ✅ + WhatsApp ("Need a hand?"). |
| `event-submission-{received,confirmation,approved,rejected}.tsx` | ✅ submitter-facing three carry the WhatsApp line; admin `received` does not. |
| `team/subscribe-alert.tsx` | ✅ festive milestone variant. |

**Open follow-ups** (none blocking; Malik will return to *refine* the templates):

1. **Temp preview scaffolding — remove before any real commit.** `_tmp_fetch_post.ts` (repo root), `components/email/_fixtures/post-175.ts`, and the `post175` import wired into `newsletter-template.tsx`'s `PreviewProps`. These exist only to preview the Weekly with real post-175 content. Restore the synthetic `article` PreviewProps when removing.
2. **Parked calendar/category exploration** in the newsletter — the `EventItemNew` variant (applied to the first event) and the `EventItemCalendar` "On the calendar" section (date blocks + category chips, incl. the AI=cyan chip). Tabled until the calendar/category-colour decisions are made on the other calendars. The AI category chip reintroduces cyan, which the email otherwise drops — decide there.
3. **Production wiring** — the welcome's `latestEditionUrl` isn't passed yet (CTA falls back to the homepage). Wire `app/api/subscribe/route.ts` (or wherever welcome fires) to fetch the latest published Weekly and pass it. `authorImageUrl` (newsletter byline) and category signers already resolve from data.
4. **Content transforms in the email path** — see "Known gap" above (emoji-lists + smart typography).
5. **Carried "email template tweaks"** from the prior platform punch-list is now substantially done; remaining is *refinement* polish on the redesigned set.

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
