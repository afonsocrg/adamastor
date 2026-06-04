import { CITY_MAPPINGS } from "@/app/(dashboard)/dashboard/add-event/city-mappings";
import { EVENT_CATEGORIES, type EventCategorySlug } from "./categories";

/**
 * Canonical city slugs that the public events routes accept as the first
 * path segment (e.g. /events/lisboa, /events/lisboa/design).
 */
export const KNOWN_CITY_SLUGS: readonly string[] = Object.keys(CITY_MAPPINGS);
const KNOWN_CITY_SLUG_SET = new Set<string>(KNOWN_CITY_SLUGS);

/**
 * Curated, ordered subset of cities surfaced as selectable scopes in the UI —
 * the persistent /events tab row (EventsLayoutShell) and the public calendar's
 * city filter both render exactly these. The routes still accept every entry in
 * KNOWN_CITY_SLUGS; these are just the ones we actively promote. Single source
 * of truth so the two surfaces never drift apart.
 */
export const SELECTABLE_CITIES = ["lisboa", "porto", "braga", "coimbra", "algarve", "online"] as const;
export type SelectableCity = (typeof SELECTABLE_CITIES)[number];
const SELECTABLE_CITY_SET = new Set<string>(SELECTABLE_CITIES);

export function isSelectableCity(slug: string): slug is SelectableCity {
	return SELECTABLE_CITY_SET.has(slug);
}

/** Title-case a city slug for display ("lisboa" -> "Lisboa"). */
export function formatCityLabel(city: string): string {
	return city.charAt(0).toUpperCase() + city.slice(1);
}

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

/**
 * Inverse of buildEventsRoutePath: given the route segments below /events
 * (as returned by useSelectedLayoutSegments), recover the active city +
 * category. Position is NOT assumed — we classify each segment by whether it's
 * a known city or category slug, so a single-segment route (/events/design or
 * /events/lisboa) resolves correctly. Unknown segments (calendar, submit,
 * edit, individual-event slugs) leave both null.
 */
export function parseEventsSegments(segments: string[]): {
	city: string | null;
	category: EventCategorySlug | null;
} {
	let city: string | null = null;
	let category: EventCategorySlug | null = null;
	for (const segment of segments) {
		if (!city && isKnownCitySlug(segment)) city = segment;
		else if (!category && isKnownCategorySlug(segment)) category = segment;
	}
	return { city, category };
}

/**
 * True when the segments describe a browsable filter route (the base /events,
 * or any combination of known city/category slugs) rather than a sibling page
 * under /events that happens to share the layout (calendar, submit, an event's
 * edit screen). The persistent filter bar renders only on filter routes.
 */
export function isEventsFilterRoute(segments: string[]): boolean {
	return segments.length === 0 || segments.every((segment) => isKnownCitySlug(segment) || isKnownCategorySlug(segment));
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
