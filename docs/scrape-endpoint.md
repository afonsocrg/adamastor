# Event scrape endpoint

`POST /api/scrape` takes a URL and returns structured event metadata. Used by:

- Admin create form: [`app/(dashboard)/dashboard/add-event/AddEventForm.tsx`](../app/(dashboard)/dashboard/add-event/AddEventForm.tsx)
- Public submission form: [`app/(main)/events/submit/SubmitEventForm.tsx`](../app/(main)/events/submit/SubmitEventForm.tsx)

Code: [`app/api/scrape/route.ts`](../app/api/scrape/route.ts).

## Response shape

```ts
type ScrapeResponse =
  | { data: { title: string; description?: string; url?: string; bannerUrl?: string; startTime?: string; city?: string } }
  | { error: string }
```

`title` is always present; everything else is best-effort.

## Platform-specific extractors

The route inspects the final URL (after redirects) and picks an extractor:

| URL contains | Extractor | What it pulls |
|---|---|---|
| `eventbrite.` | `extractEventbriteData` | Title, description, banner, start time, city from Eventbrite's JSON-LD + meta |
| `luma` | `extractLumaData` | Same fields from Luma's JSON-LD + OG tags; title has `· Luma` stripped |
| anything else | `extractDefaultEventData` | Generic OG + JSON-LD + `og:event:start_time` extraction |

Default extraction relies on the page exposing reasonable Open Graph metadata. Pages that don't (most personal sites without a CMS) will return just a title.

## Caching

Two layers, with realistic expectations:

1. **In-process cache** — `Map<url, { data, expiresAt }>` with `SCRAPE_TTL_MS` (10 min) and soft cap `SCRAPE_CACHE_MAX` (200 entries). Response includes `X-Scrape-Cache: hit | miss`.
2. **HTTP `Cache-Control: public, max-age=300, s-maxage=300`** — browser and any intermediate cache can serve repeats.

**When this actually helps**: accidental double-clicks on "Fill from event link", two organisers from the same event submitting independently, dev/QA hitting the same URL repeatedly, and any future admin "refresh from source" button.

**When it doesn't**: the dominant case — an organiser pastes a unique URL once and never touches it again. Don't expect the cache to be load-bearing for typical traffic.

The in-process cache is per-Vercel-instance and isn't shared. For real cross-instance caching, swap the Map for KV/Redis. Today's traffic doesn't justify it.

## Failure modes

- **Upstream returns non-2xx** → 500 with `{ error: "Failed to fetch URL: ..." }`. The form surfaces this as "We couldn't read that page. You can still fill the form manually."
- **Upstream returns 2xx but no parseable metadata** → 200 with `data.title` populated to whatever the `<title>` tag had, others undefined. The form still pre-fills what it can.
- **Network error / DNS failure** → 500 with `{ error: "An unexpected error occurred" }`. Logged server-side.

The endpoint has no auth check by design — both the admin form and the public form need it, and the data is non-sensitive (it's already public on the source URL).

## Adding a new platform

If a third-party event platform has structured metadata worth extracting:
1. Add a helper function that takes `(html: string, originalUrl: string) => Event`.
2. Add a branch in the URL-detection chain in `POST` ordered above the `default`.
3. Test against a real URL from that platform; many platforms render event metadata only after client-side hydration, in which case the scrape will miss it (we don't run JS).
