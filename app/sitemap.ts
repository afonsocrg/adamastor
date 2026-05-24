import { EVENT_CATEGORIES, type EventCategorySlug } from "@/lib/events/categories";
import { createPublicClient } from "@/lib/supabase/public";
import type { MetadataRoute } from "next";

const SITE_URL = "https://adamastor.blog";

interface SitemapEvent {
	start_time: string;
	city: string;
	event_category_assignments?: { category_slug: string }[];
}

function normalizeCity(city: string) {
	return city.trim().toLowerCase();
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const supabase = createPublicClient();
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Static pages
	const entries: MetadataRoute.Sitemap = [
		{ url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1.0 },
		{ url: `${SITE_URL}/events`, changeFrequency: "daily", priority: 0.9 },
		{ url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
	];

	// Pull every upcoming event with its categories. We compute which routes
	// are populated client-side rather than firing N queries.
	const { data: upcomingEvents, error: eventsError } = await supabase
		.from("events")
		.select("start_time, city, event_category_assignments(category_slug)")
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

		bumpIfLater(cityToLastModified, city, event.start_time);

		for (const category of eventCategories) {
			bumpIfLater(categoryToLastModified, category, event.start_time);
			bumpIfLater(comboToLastModified, `${city}/${category}`, event.start_time);
		}
	}

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

	// Published posts (the `is_public` column gates visibility in this schema)
	const { data: posts, error: postsError } = await supabase
		.from("posts")
		.select("id, slug, updated_at, is_public")
		.eq("is_public", true);

	if (postsError) {
		console.error("sitemap: failed to fetch posts", postsError);
	} else if (posts) {
		for (const post of posts as { id: string; slug?: string | null; updated_at?: string | null }[]) {
			const path = post.slug ?? post.id;
			entries.push({
				url: `${SITE_URL}/posts/${path}`,
				lastModified: post.updated_at ?? undefined,
				changeFrequency: "monthly",
				priority: 0.6,
			});
		}
	}

	return entries;
}
