import { fetchPublicEvents, type PublicEvent } from "@/lib/events/fetch-public";

/**
 * Slice the next N upcoming events for the homepage sidebar teaser. Wraps
 * `fetchPublicEvents` (already React-cached, server-side filtered to
 * approved + future events ordered ascending) so the homepage and any other
 * route asking for upcoming events on a given request share one DB call.
 *
 * Online events are excluded: the teaser is framed as "events worth showing up
 * to" — physically — so it features in-person events only. Filtering before the
 * slice keeps the teaser at its full `limit` of in-person events.
 */
export async function getUpcomingEventsTeaser(limit = 3): Promise<PublicEvent[]> {
	const { events } = await fetchPublicEvents();
	return events.filter((event) => event.city?.toLowerCase() !== "online").slice(0, limit);
}
