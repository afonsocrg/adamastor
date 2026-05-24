import { createPublicClient } from "@/lib/supabase/public";
import { cache } from "react";
import type { EventCategorySlug } from "./categories";

export interface PublicEvent {
	id: string;
	title: string;
	description: string;
	start_time: string;
	city: string;
	url: string;
	banner_url?: string;
	event_category_assignments?: { category_slug: string }[];
}

export interface FetchPublicEventsResult {
	events: PublicEvent[];
	categoryFilteringEnabled: boolean;
}

/**
 * Fetch upcoming events for any public events route, applying server-side
 * filters so the SSR'd HTML only contains events matching the requested
 * city / category. Falls back gracefully if the category join is unavailable.
 *
 * Wrapped in React's `cache()` and uses positional primitive args so that
 * `generateMetadata` and the page handler (which both call this with the
 * same args within a single request) share one underlying DB query instead
 * of firing two. Primitives compare by value so caching actually deduplicates;
 * object literals would not (different references each call).
 */
export const fetchPublicEvents = cache(
	async (city: string | null = null, category: EventCategorySlug | null = null): Promise<FetchPublicEventsResult> => {
		const supabase = createPublicClient();
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		let query = supabase
			.from("events")
			.select("*, event_category_assignments(category_slug)")
			.gte("start_time", today.toISOString())
			.order("start_time", { ascending: true });

		if (city) {
			query = query.ilike("city", city);
		}

		const { data, error } = await query;

		if (error) {
			console.error("fetchPublicEvents: category-aware query failed, falling back:", error);

			let fallback = supabase
				.from("events")
				.select("*")
				.gte("start_time", today.toISOString())
				.order("start_time", { ascending: true });

			if (city) {
				fallback = fallback.ilike("city", city);
			}

			const { data: fallbackData, error: fallbackError } = await fallback;
			if (fallbackError) {
				throw fallbackError;
			}

			// Category filter can't be honoured in the fallback path — surface that
			// to the caller via categoryFilteringEnabled = false. The category
			// filter UI gets hidden in that case to avoid lying to users.
			return {
				events: (fallbackData ?? []) as PublicEvent[],
				categoryFilteringEnabled: false,
			};
		}

		const allEvents = (data ?? []) as PublicEvent[];

		if (!category) {
			return { events: allEvents, categoryFilteringEnabled: true };
		}

		const filtered = allEvents.filter((event) =>
			(event.event_category_assignments ?? []).some((assignment) => assignment.category_slug === category),
		);

		return { events: filtered, categoryFilteringEnabled: true };
	},
);
