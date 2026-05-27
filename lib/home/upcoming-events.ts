import { fetchPublicEvents, type PublicEvent } from "@/lib/events/fetch-public";

/**
 * Slice the next N upcoming events for the homepage sidebar teaser. Wraps
 * `fetchPublicEvents` (already React-cached, server-side filtered to
 * approved + future events ordered ascending) so the homepage and any other
 * route asking for upcoming events on a given request share one DB call.
 */
export async function getUpcomingEventsTeaser(limit = 3): Promise<PublicEvent[]> {
	const { events } = await fetchPublicEvents();
	return events.slice(0, limit);
}
