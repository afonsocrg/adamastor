import type { EventCategorySlug } from "./categories";

/**
 * Minimal shape the calendar scope needs. The real calendar event carries more
 * (id, title, start, end, url); the generic in filterCalendarEvents preserves
 * those, so callers keep their full event type out the other side.
 */
export interface FilterableCalendarEvent {
	city?: string;
	categorySlugs?: string[];
}

/** Normalize a stored city value to its comparable slug form (trim + lowercase). */
export function normalizeCitySlug(city: string | null | undefined): string | null {
	if (!city) return null;
	const slug = city.trim().toLowerCase();
	return slug.length > 0 ? slug : null;
}

/**
 * Scope a calendar's events to a single city and/or category. Pure: never
 * mutates its input.
 *
 * - `city: null` means "Everywhere" — no city filtering at all.
 * - City match is exact on the normalized slug. Events store canonical slugs
 *   ("lisboa", "porto", "online"), so this mirrors how the public listing
 *   routes scope via ilike("city", slug). "online" is just another city scope.
 * - When a category is active, matching events get that category hoisted to the
 *   front of their slug list: the calendar colours an event by categorySlugs[0],
 *   so without the hoist a multi-category event (e.g. [design, ai]) filtered
 *   under "AI" would still render in the design colour.
 */
export function filterCalendarEvents<T extends FilterableCalendarEvent>(
	events: T[],
	{ city, category }: { city: string | null; category: EventCategorySlug | null },
): T[] {
	let scoped = events;

	if (city) {
		const target = normalizeCitySlug(city);
		scoped = scoped.filter((event) => normalizeCitySlug(event.city) === target);
	}

	if (category) {
		scoped = scoped
			.filter((event) => (event.categorySlugs ?? []).includes(category))
			.map((event) => ({
				...event,
				categorySlugs: [category, ...(event.categorySlugs ?? []).filter((slug) => slug !== category)],
			}));
	}

	return scoped;
}
