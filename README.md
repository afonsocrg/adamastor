# Building Adamastor

A publication covering the Portuguese startup ecosystem. It features a blog, an event discovery page (with **community submissions**), and a weekly newsletter.

**Live at [adamastor.blog](https://adamastor.blog)**

## Our Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Editor:** [Novel](https://novel.sh/) (Tiptap-based)
- **Email:** [Resend](https://resend.com/) + [React Email](https://react.email/)
- **Analytics:** [PostHog](https://posthog.com/)
- **Deployment:** [Vercel](https://vercel.com/)
- **DNS:** [Cloudflare](https://cloudflare.com/)

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) (v9.5.0+)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/adamastor.git
cd adamastor

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Then fill in your values in .env.local
```

### Development

```bash
# Start the dev server
pnpm dev

# Run type checking
pnpm typecheck

# Lint and format
pnpm lint
pnpm format
```

### Email Development

We're using React Email for newsletter and transactional email templates. To preview and develop the templates in real time use the following command:

```bash
pnpm email
```

This starts a local preview server at `http://localhost:3001` where you can see live updates to templates in `components/email/`.

## Project Structure

```
app/
├── (main)/          # Public-facing pages (blog, events, about)
├── (dashboard)/     # Admin dashboard (posts, events, subscribers)
├── api/             # API routes
└── login/           # Auth pages

components/
├── email/           # React Email templates
├── tailwind/ui/     # shadcn/ui components
└── ...              # Shared components

lib/
├── supabase/        # Supabase client utilities
└── ...              # Helper functions
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run Biome linter |
| `pnpm format` | Run Biome formatter |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm email` | Start React Email preview server |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values. See the example file for required variables.

Key services you'll need accounts for:
- **Supabase** — Database and authentication
- **Resend** — Email delivery and newsletter broadcasts
- **PostHog** — Product analytics
- **Vercel** — Deployment (optional for local dev)

### Event Submissions Notes

- The public submission form at `/events/submit` requires three additional env vars: `SUPABASE_SERVICE_ROLE_KEY` (server-only, bypasses RLS), and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` (Cloudflare Turnstile). If Turnstile isn't configured, captcha verification is skipped with a warning — fine for dev, **never** in prod.
- Optionally set `EVENT_SUBMISSIONS_NOTIFY_EXTRA` (comma-separated emails) to cc additional recipients on new-submission notifications beyond the `profiles.role='admin'` set.
- The admin review queue lives at `/dashboard/event-submissions` with a pending-count badge in the sidebar.
- See [`docs/event-submissions.md`](docs/event-submissions.md) for the full flow and threat model.

### Operations Notes

- Newsletter subscribers are tracked against the `Adamastor Weekly` Resend segment. Set `RESEND_SEGMENT_ID` to override it, or keep the legacy `RESEND_AUDIENCE_ID` for backward compatibility.
- New newsletter signups are always added to the newsletter segment, even when the contact already exists globally in Resend.
- The subscribers API and analytics API are admin-only dashboard routes. Keep `RESEND_API_KEY`, `POSTHOG_PERSONAL_API_KEY`, and `POSTHOG_PROJECT_ID` server-side only.
- Weekly active users on `/dashboard/analytics` come from PostHog pageview events over the last seven days.
- Public route motion should stay subtle and fast: prefer opacity-only page entrances, color transitions around 150ms for hover states, and no list-dimming during frequent filters.

## Documentation

Atomic docs covering individual subsystems. Start with whichever is closest to what you're touching:

| Doc | What's in it |
|---|---|
| [`docs/event-submissions.md`](docs/event-submissions.md) | Public submission + admin approval feature end-to-end. File map, status model, env vars, future work. |
| [`docs/security-and-rls.md`](docs/security-and-rls.md) | Auth model, Supabase clients (SSR / anon / service-role), RLS policies on `events`, threat model for the submissions API. Read before adding a mutating endpoint. |
| [`docs/migrations.md`](docs/migrations.md) | Schema migration workflow: how to write them, how Malik applies them (Supabase dashboard SQL editor), idempotency conventions. |
| [`docs/duplicate-detection.md`](docs/duplicate-detection.md) | How event dedup scores matches, severity levels (block/warning), stopword list, how to extend. |
| [`docs/scrape-endpoint.md`](docs/scrape-endpoint.md) | `/api/scrape` — platform-specific extractors (Eventbrite, Luma, default), in-process cache, failure modes, how to add a platform. |
| [`docs/emails.md`](docs/emails.md) | Resend integration, template list, admin recipient resolution, `waitUntil` background sending. |
| [`docs/newsletter-subscriptions.md`](docs/newsletter-subscriptions.md) | Per-category newsletter preferences: Supabase as source of truth, Resend segment sync, `/preferences` magic-link UX, broadcast workflow. |
| [`docs/release-smoke-checklist.md`](docs/release-smoke-checklist.md) | Manual QA pass before shipping changes that touch public surfaces. |

## Dependency Updates

We're using [Dependabot](https://docs.github.com/en/code-security/dependabot) to keep dependencies up to date. It automatically opens PRs for outdated packages weekly. Review these PRs, check the changelog for breaking changes, and merge when CI passes.
