# Building Adamastor

A publication covering the Portuguese startup ecosystem. It features a blog, an event discovery page and a weekly newsletter.

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

## Dependency Updates

We're using [Dependabot](https://docs.github.com/en/code-security/dependabot) to keep dependencies up to date. It automatically opens PRs for outdated packages weekly. Review these PRs, check the changelog for breaking changes, and merge when CI passes.