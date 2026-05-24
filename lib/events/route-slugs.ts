import { CITY_MAPPINGS } from "@/app/(dashboard)/dashboard/add-event/city-mappings";
import { EVENT_CATEGORIES, type EventCategorySlug } from "./categories";

/**
 * Canonical city slugs that the public events routes accept as the first
 * path segment (e.g. /events/lisboa, /events/lisboa/design).
 */
export const KNOWN_CITY_SLUGS: readonly string[] = Object.keys(CITY_MAPPINGS);
const KNOWN_CITY_SLUG_SET = new Set<string>(KNOWN_CITY_SLUGS);

/**
 * Set of category slugs that the public events routes accept as the second
 * path segment (or as a category-only route via /events/[slug]).
 */
const KNOWN_CATEGORY_SLUG_SET = new Set<string>(EVENT_CATEGORIES.map((category) => category.slug));

export function isKnownCitySlug(slug: string): boolean {
	return KNOWN_CITY_SLUG_SET.has(slug);
}

export function isKnownCategorySlug(slug: string): slug is EventCategorySlug {
	return KNOWN_CATEGORY_SLUG_SET.has(slug);
}

/**
 * Build-time guard: ensure no city slug collides with a category slug. The
 * single-segment route `/events/[slug]` disambiguates by checking cities
 * first; if a future category ever shared a name with a city, the city would
 * silently shadow it. Throwing at module-load time means the build (and any
 * dev-server boot) fails immediately, forcing a rename before anything ships.
 */
const collidingSlugs = KNOWN_CITY_SLUGS.filter((citySlug) => KNOWN_CATEGORY_SLUG_SET.has(citySlug));
if (collidingSlugs.length > 0) {
	throw new Error(
		`Event route slug collision between cities and categories: ${collidingSlugs.join(
			", ",
		)}. Rename one side before continuing — the /events/[slug] route cannot disambiguate them.`,
	);
}

export type EventsRouteFilter =
	| { kind: "none" }
	| { kind: "city"; city: string }
	| { kind: "category"; category: EventCategorySlug }
	| { kind: "city-and-category"; city: string; category: EventCategorySlug };

/**
 * Build a canonical /events route path from the locked filter shape used by
 * EventsPageClient. Centralised so route handlers and the filter UI stay in
 * sync — change the URL scheme here, propagation is automatic.
 */
export function buildEventsRoutePath(filter: { city?: string | null; category?: EventCategorySlug | null }): string {
	const city = filter.city ?? null;
	const category = filter.category ?? null;

	if (city && category) return `/events/${city}/${category}`;
	if (city) return `/events/${city}`;
	if (category) return `/events/${category}`;
	return "/events";
}
