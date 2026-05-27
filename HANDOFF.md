# Hand-off — 2026-05-27 (late evening): homepage redesign + cross-route consistency + SEO sweep

Two sessions of work landed in this branch: the prior session's `/posts/[id]` editorial redesign (already documented in the previous handoff and now committed in the same sweep) and this session's homepage redesign + cross-route consistency + SEO sweep + icon migration + UTM decoration on outbound article links.

Touched files:

**New components / surfaces:**

- `app/(main)/page.tsx` — full restructure
- `app/(main)/page/[page]/page.tsx` — paginated archive route, reusing the same composition without the hero
- `components/home/Masthead.tsx` — Lora-quiet editorial nameplate (text-xl/2xl)
- `components/home/FeaturedHero.tsx` — kind-aware hero card (currently rendered hidden — held back for revisit)
- `components/home/PostRiver.tsx` — uniform card pattern + pagination
- `components/home/HomeSidebar.tsx` — sticky 2-module sidebar (Opinion stack + Upcoming events teaser)
- `lib/home/upcoming-events.ts` — thin wrapper around `fetchPublicEvents` for the sidebar
- `app/(main)/posts/[id]/ArticleLinkDecorator.tsx` — MutationObserver-based UTM decoration for outbound article-body links

**Lifted / migrated:**

- `components/SubscribeForm.tsx` — was `app/(main)/posts/[id]/SubscribeForm.tsx`, now shared between the post page and the homepage subscribe coda
- `public/social/index.tsx` — added `WhatsAppIcon`; the existing `BlueskyIcon` / `LinkedInIcon` / `TwitterIcon` (X glyph) are now used everywhere lucide's `Linkedin` / `Twitter` used to live

**Modified for cross-route consistency:**

- `app/(main)/posts/[id]/page.tsx` — metadata rewrite (clean title via `getDisplayTitle`, canonical, `og:type=article`, `article:published_time`, `article:modified_time`, `article:author`, twitter card, dropped legacy `keywords`); JSON-LD breadcrumb + article schema now use the cleaned title; mounts `<ArticleLinkDecorator postSlug={…}/>` sibling-of `<PostPreview>`
- `app/(main)/posts/[id]/ShareRow.tsx` — added WhatsApp share button, explicit `className="h-4 w-4"` per icon so the inner shape centers in the 36px button
- `app/(main)/posts/[id]/AuthorStrap.tsx` — switched to branded `BlueskyIcon`/`LinkedInIcon`/`TwitterIcon`; deleted the duplicated inline Bluesky path; replaced the `typeof Linkedin` type hack with a clean `IconComponent = (props: SVGProps) => JSX.Element` type
- `app/(main)/posts/[id]/PostHero.tsx` + `Byline.tsx` — accept `publishedAtIso` prop, visible date wrapped in `<time datetime="…">`
- `app/(main)/posts/[id]/ReadNext.tsx` — orange Opinion kicker (cross-route consistency), small duotone author avatar per item, hover-bg normalized to `navy-veil/40`
- `app/(main)/about/page.tsx` — `linkIconMap` uses branded `LinkedInIcon`/`TwitterIcon`
- `app/(main)/layout.tsx` — footer "Follow Us" column uses branded icons
- `app/(main)/preferences/PreferencesPageClient.tsx` + `subscribe/SubscribePageClient.tsx` — branded LinkedIn icon
- `app/layout.tsx` — RSS `<link rel="alternate">` title normalized to `"The Adamastor Weekly"` (was `"Adamastor — Weekly Digest"`)
- `lib/home-posts.ts` — fetches `bio`, `image_url`, `slug` so the hero byline + sidebar have what they need
- `lib/posts/kind.ts` — `getFeedCardLabel` returns `"The Adamastor Weekly" | "Opinion"` (was `"Weekly Digest" | "Guest Article"`)
- `lib/posts/related.ts` — adds `image_url` to the select + the `RelatedPost` type

**Deleted:**

- `components/home-posts-feed.tsx` — replaced by `components/home/PostRiver.tsx`
- `components/authorCard.tsx`, `components/nav-projects.tsx`, `components/nav-secondary.tsx`, `components/shareWidget.tsx` — orphaned by the prior session's `/posts/[id]` redesign

**Docs updated:**

- `docs/design-system.md` — added the Editorial homepage template, Cross-route consistency rules (lexicon canon, photo treatment policy, hover-bg token, hairlines, kicker geometry, navbar left-edge alignment), article-body UTM decoration pattern, plus six new entries under Known limitations / open questions
- `.agents/product-marketing.md` — added the lexicon canon section; retired "Weekly Digest" / "Guest Article" with a row in the banned-words table

---

## What landed — design and editorial decisions worth remembering

### Cross-route geometry is locked

The homepage now mirrors `/events`' 8-column grid exactly: `lg:grid-cols-8 gap-8 lg:gap-20`, with `lg:col-span-5` for the main column and `lg:col-span-3` for the sidebar. Same gap, same gutter, same content-left edge. A reader switching between `/` and `/events` lands on the same grid every time. Inside the main column the H1+dek live above the river so the sidebar top aligns with the H1 baseline — the same composition rule `/events` uses for its calendar + subscribe sidebar.

Left-edge alignment with the navbar wordmark is fixed via a second `md:p-4` on the grid wrapper (so 16px main padding + 16px page padding = 32px at md+, matching `navbar md:px-8`). The earlier-session misalignment is gone. Interactive cards inside the grid extend their hover surfaces outward via `-mx-4 px-4` so the surface hover bleeds 16px past the content edge without shifting content.

### Lora gradient is hierarchical

- Masthead H1 (`text-xl md:text-2xl`, 20/24px Lora Bold): the publication nameplate. Quiet. Doesn't compete with the river below.
- Hero title when rendered (`text-[1.75rem] md:text-[2.25rem]`, 28/36px Lora Bold): clearly larger than the masthead, but smaller than the post-page H1 (31/48px) — preview never out-shouts the destination.
- Sidebar module headings (`text-lg` Lora Bold): tertiary anchors. Lora earns its place by being structural.
- River card titles, sidebar item titles: Inter. Catalog mode.

The earlier dissonance (masthead at 36px Lora directly above a hero at 44px Lora) was resolved by dropping the masthead to its quiet nameplate size + keeping the hero text-anchor at a 12px scale gap. The post-page H1 is still the destination-emphasis moment.

### Lexicon canon

Single source of truth in `lib/posts/kind.ts` → `getFeedCardLabel`:

- Weekly → `"The Adamastor Weekly"` (card kicker), `"The Adamastor Weekly · Week N"` (hero / post-page kicker)
- Opinion → `"Opinion"` everywhere

`"Weekly Digest"` and `"Guest Article"` are retired. JSON-LD `Blog.name` and the RSS feed title also normalized to `"The Adamastor Weekly"`. The strapline `"A weekly read on Portugal's startup scene."` is the canonical line used verbatim on `/about`, the homepage Masthead dek, `/subscribe`, `/preferences`, and the SubscribeForm coda — same publication voice on every surface that describes the Weekly.

### Color carries meaning

- `text-orange-hue` on every Opinion kicker (river card, hero kicker if re-enabled, sidebar Opinion module heading, sidebar Opinion item kicker, ReadNext "More opinion" + per-item "Opinion"). Orange = named voice / personal take.
- Weekly kickers stay `text-navy-tone` (institutional editorial backbone).
- Arrow-tip icons stay `text-orange-hue` — the same warm accent used for outbound-action affordances (`More from Carlos →`, `Browse all events →`, `Read →`).
- One hover-background token (`hover:bg-navy-veil/40`) across hero, river card, ReadNext, "Browse all events", pagination buttons.
- Hairlines = `border-navy-frame` everywhere editorial. Shadcn's `<Separator/>` (grey `--border` token) is reserved for admin/form contexts.

### Photo treatment policy

Duotone (`url(#duotone-navy-portrait)`) is reserved for the earned editorial moments where a single face anchors a piece: `/about` Masthead cards, `/posts/[id]` AuthorStrap, and `/posts/[id]` ReadNext. Homepage portraits (the future hero, the sidebar Opinion stack) use clean `rounded-full` circles with no filter — duotone's contrast is too strong at sub-48px scale and the filter's calibration doesn't degrade gracefully there. The `DuotonePortraitFilter` SVG def ships only on pages that actually consume it; the homepage no longer mounts it.

### SEO scaffolding strengthened

Manual rubric scored both surfaces before and after (Lighthouse CLI was blocked by the sandbox classifier — see Open threads below):

- `/`: 14/20 → 16/20 (+10%). Added canonical, `<time datetime>` on all dates, enriched the Blog JSON-LD with `blogPost[]` of 10 BlogPostings (gives Google + AI engines explicit "/ is the canonical hub" relationships).
- `/posts/[id]`: 15/20 → 18.5/20 (+17.5%). Title cleaned via `getDisplayTitle`, canonical, `og:type=article`, `article:published_time`, `article:modified_time`, `article:author`, twitter card, dropped legacy `keywords`, BreadcrumbList + JSON-LD `headline` now use cleaned title, `<time datetime>` semantic in Byline.

The post-page title artefact (`"Founder vs. Reality Fit  | Week 21"` with double space, leaking into SERP titles + OG cards + breadcrumbs + JSON-LD headline simultaneously) was a single-fix cleanup that landed on all four surfaces at once.

`/page/[page]` carries `robots: { index: false, follow: true }` — archive pages shouldn't compete with `/` for entry-page ranking but should still pass crawl signals through to individual posts.

### UTM on outbound article links

`app/(main)/posts/[id]/ArticleLinkDecorator.tsx` decorates every external link inside `.article-prose` with `?utm_source=adamastor.blog&utm_medium=post&utm_campaign=<post-slug>`. Required a MutationObserver (TipTap renders article body AFTER mount, so a naive on-mount sweep finds zero anchors). Skips internal links, non-http(s) protocols, and anything already carrying `utm_*`. Also ensures `target="_blank"` and `rel` includes `noopener noreferrer`. Crawlers + AI bots reading SSR HTML see the original un-tagged destination — desired for SEO/AI canonical links; click attribution is via runtime decoration only.

### Icon system

Branded SVG icons from `/public/social/index.tsx` replace lucide's stroke-based icons in every editorial surface (footer, /about masthead, AuthorStrap, preferences, subscribe). `WhatsAppIcon` added there, plus a Share-on-WhatsApp button in `ShareRow`. Lucide still owns the line icons that aren't social-brand glyphs (`ArrowRightIcon`, `Globe`, `Github`, `Rss`, etc.).

---

## Open threads carried over

These didn't ship in this sweep. Priority order:

### From this session

1. **Lighthouse baseline.** Install `lighthouse` as a devDependency, run against `next build && next start` to get an objective production SEO/perf score. The manual rubric (above) is documented but a Lighthouse number is more defensible.
2. **FeaturedHero decision.** Currently hidden — held back for revisit. Either re-enable (3-line restore in `app/(main)/page.tsx`) or delete the component. Don't leave it dangling.
3. **`/llms.txt`** — surface `/`, `/events`, `/about` for AI agents. Adamastor meets the SEO fundamentals; this is the next layer up.
4. **`robots.txt` AI bot allowlist check.** Verify `GPTBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`/`anthropic-ai`, `Google-Extended` are not blocked. Blocking them prevents citation.
5. **`orange-hue` text contrast** at small kicker sizes (10–11px) — likely passes AA Large Text but unverified at AA Normal. Measure once Lighthouse is in place; if it fails, introduce `orange-shade` for text use.
6. **`SubscribeForm` sticky bar `max-w-screen-lg`** drifts from the site's `max-w-screen-xl` containers at xl+. Minor, fix in a polish pass.

### From the prior session (still open)

7. **Blockquote variant decision** — `QuoteVariantPicker` is currently mounted on every post page. Pick a variant (A Marginal Glyph, D Indent Margin, E Twin Apertures, F Tactile Broadside), promote it to unscoped `.article-prose blockquote`, delete the picker + the three unchosen variants. **Must remove before pushing to production.**
8. **`authors.role` column.** Opinion byline role line is currently derived from `authors.bio`'s first sentence via JS regex — uneven length (Stuart Cerne's first sentence is 122 chars; NYT-Opinion convention is 60–80). A dedicated `authors.role` column with controlled headline-style credentials would replace the heuristic. Migration is one column add + dashboard UI for editing.
9. **Reciprocity-flip feedback dek** ("You've just spent 7 minutes with Carlos. He'd like to hear back. Anonymous.") — held back from the copy refinements pass on the post page. Worth A/B-testing once analytics are in place.
10. **White-on-gold contrast** — known a11y issue, Malik's call: keep white text site-wide.

### Operations / not-yet-addressed

- SSL 526 on `www.adamastor.blog` (P0, three handoffs ago)
- JSON-LD validation against Rich Results Test
- Sitemap submission (Google Search Console + Bing)
- AI visibility baseline screenshots (manual citation check across ChatGPT / Perplexity / Google AI Overviews)
- `social_links` DB rows for Carlos / Afonso / Malik
- Public-facing calendar variant (perf plan documented two handoffs ago)
- Newsletter cron + workers (deployment phase)
- Email template tweaks (welcome / preferences-link / per-category)
- "Unsubscribe from everything" destination page
- Dynamic OG images per events route
- PostHog event tracking schema
- Existing image aspect-ratio warning on `adamastorLogotype.svg` in dev console (cosmetic, surfaced during this session's verification)

---

## Push reminder

Two sessions of unpushed work consolidate in the next commit:

- **Prior session**: `/posts/[id]` editorial redesign (PostHero, Byline, ShareRow, PostTOC, AuthorStrap, ReadNext, QuoteVariantPicker, DuotonePortraitFilter, kind/content/headings/related libs, prosemirror.css updates).
- **This session**: homepage redesign + cross-route consistency + SEO sweep + icon migration + UTM decoration.

Before pushing:

- `npm run build` — verify the new components + metadata changes compile cleanly under production.
- `npm test` — node:test cleaners.
- `npx tsc --noEmit` — typecheck (the `IconComponent` cast in AuthorStrap is intentional; lucide's icon component type isn't quite `(SVGProps) => JSX.Element`).
- Manual smoke on `/` (10 cards rendering, kicker `"THE ADAMASTOR WEEKLY"`, sidebar circles, no duotone), `/posts/175` (Weekly — clean title, ShareRow with 4 buttons including WhatsApp, ReadNext doesn't render), `/posts/165` (Opinion — orange kicker, ReadNext with duotone avatars), `/page/2` (paginated archive, no hero, `robots: noindex,follow`).
- Lighthouse on the post page once pushed to Vercel preview.

The `QuoteVariantPicker` should be removed before pushing to production. Pick a blockquote variant first.
