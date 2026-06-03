import { EVENT_CATEGORIES, type EventCategorySlug } from "@/lib/events/categories";
import { createPublicClient } from "@/lib/supabase/public";
import type { MetadataRoute } from "next";

const SITE_URL = "https://adamastor.blog";

interface SitemapEvent {
	start_time: string;
	city: string;
	// Real, past-dated modification timestamps for the event row. `submitted_at`
	// is NOT NULL (defaults to now() on insert); `reviewed_at` is set when an
	// admin approves. These are what `lastmod` should reflect — when the listing
	// entry last changed — NOT `start_time`, which is when the event happens
	// (often in the future).
	submitted_at: string;
	reviewed_at: string | null;
	event_category_assignments?: { category_slug: string }[];
}

function normalizeCity(city: string) {
	return city.trim().toLowerCase();
}

/** Latest of two ISO timestamps; tolerant of undefined on either side. */
function maxIso(a: string | undefined, b: string | undefined): string | undefined {
	if (a === undefined) return b;
	if (b === undefined) return a;
	return a < b ? b : a;
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const supabase = createPublicClient();
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Pull every upcoming event with its categories. We compute which routes
	// are populated client-side rather than firing N queries. A city/category/
	// combo route is indexable iff it has >=1 upcoming event (see the noindex
	// logic in app/(main)/events/[slug]/page.tsx), so building these maps only
	// from upcoming events keeps the sitemap == the set of indexable URLs.
	const { data: upcomingEvents, error: eventsError } = await supabase
		.from("events")
		.select("start_time, city, submitted_at, reviewed_at, event_category_assignments(category_slug)")
		.eq("status", "approved")
		.gte("start_time", today.toISOString());

	if (eventsError) {
		console.error("sitemap: failed to fetch events", eventsError);
		// Fall through with whatever we have — better an incomplete sitemap
		// than no sitemap at all.
	}

	const events = (upcomingEvents ?? []) as SitemapEvent[];

	const cityToLastModified = new Map<string, string>();
	const categoryToLastModified = new Map<EventCategorySlug, string>();
	const comboToLastModified = new Map<string, string>();
	// Most recent real change across ALL upcoming events — used as the freshness
	// signal for the homepage and the /events hub.
	let latestEventChange: string | undefined;

	function bumpIfLater<K>(map: Map<K, string>, key: K, candidate: string) {
		const existing = map.get(key);
		if (existing === undefined || existing < candidate) {
			map.set(key, candidate);
		}
	}

	for (const event of events) {
		const city = normalizeCity(event.city);
		const eventCategories = (event.event_category_assignments ?? []).map(
			(assignment) => assignment.category_slug as EventCategorySlug,
		);

		// `lastmod` must be when the page content last changed, not when the
		// event happens. Prefer the approval time, fall back to submission time;
		// both are real and in the past. Using `start_time` here produced
		// future-dated `lastmod` values, which crawlers distrust (and which can
		// make them discount the whole sitemap's freshness signal).
		const modifiedAt = event.reviewed_at ?? event.submitted_at;
		if (!modifiedAt) continue;

		latestEventChange = maxIso(latestEventChange, modifiedAt);
		bumpIfLater(cityToLastModified, city, modifiedAt);

		for (const category of eventCategories) {
			bumpIfLater(categoryToLastModified, category, modifiedAt);
			bumpIfLater(comboToLastModified, `${city}/${category}`, modifiedAt);
		}
	}

	// Published posts (the `is_public` column gates visibility in this schema).
	const postEntries: MetadataRoute.Sitemap = [];
	let latestPostChange: string | undefined;

	const { data: posts, error: postsError } = await supabase
		.from("posts")
		.select("id, slug, updated_at, is_public")
		.eq("is_public", true);

	if (postsError) {
		console.error("sitemap: failed to fetch posts", postsError);
	} else if (posts) {
		for (const post of posts as { id: string; slug?: string | null; updated_at?: string | null }[]) {
			const path = post.slug ?? post.id;
			const lastModified = post.updated_at ?? undefined;
			latestPostChange = maxIso(latestPostChange, lastModified);
			postEntries.push({
				url: `${SITE_URL}/posts/${path}`,
				lastModified,
				changeFrequency: "monthly",
				priority: 0.6,
			});
		}
	}

	// Static pages. The homepage and events hub reflect the freshest underlying
	// content, so we stamp them with a real derived `lastmod` instead of leaving
	// them blank. Truly static surfaces (forms, about) carry no `lastmod`.
	const homepageLastModified = maxIso(latestEventChange, latestPostChange);

	const entries: MetadataRoute.Sitemap = [
		{ url: `${SITE_URL}/`, lastModified: homepageLastModified, changeFrequency: "daily", priority: 1.0 },
		{ url: `${SITE_URL}/events`, lastModified: latestEventChange, changeFrequency: "daily", priority: 0.9 },
		// Public events calendar (big-calendar view, filterable by category).
		{
			url: `${SITE_URL}/events/calendar`,
			lastModified: latestEventChange,
			changeFrequency: "daily",
			priority: 0.7,
		},
		// Organiser-acquisition surface — submits feed the editorial queue
		// behind the public events listing. Indexable so organisers searching
		// "submit event Portugal" / "list event Lisbon" can find it.
		{ url: `${SITE_URL}/events/submit`, changeFrequency: "monthly", priority: 0.6 },
		// Newsletter subscribe page (robots index:true) — a primary distribution
		// surface, so it belongs in the sitemap.
		{ url: `${SITE_URL}/subscribe`, changeFrequency: "monthly", priority: 0.6 },
		{ url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
	];

	for (const [city, lastModified] of cityToLastModified) {
		entries.push({
			url: `${SITE_URL}/events/${city}`,
			lastModified,
			changeFrequency: "daily",
			priority: 0.8,
		});
	}

	for (const category of EVENT_CATEGORIES) {
		const lastModified = categoryToLastModified.get(category.slug);
		if (!lastModified) continue;
		entries.push({
			url: `${SITE_URL}/events/${category.slug}`,
			lastModified,
			changeFrequency: "daily",
			priority: 0.8,
		});
	}

	for (const [comboKey, lastModified] of comboToLastModified) {
		entries.push({
			url: `${SITE_URL}/events/${comboKey}`,
			lastModified,
			changeFrequency: "daily",
			priority: 0.7,
		});
	}

	return [...entries, ...postEntries];
}
