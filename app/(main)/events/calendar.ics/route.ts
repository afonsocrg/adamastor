import { buildEventsIcs, calendarUtmCampaign } from "@/lib/events/calendar";
import { fetchPublicEvents } from "@/lib/events/fetch-public";
import { getEventsRouteTitleAndDescription } from "@/lib/events/seo";

export const revalidate = 3600;

export async function GET() {
	const { events } = await fetchPublicEvents();
	const { title, description } = getEventsRouteTitleAndDescription({});

	const ics = buildEventsIcs({
		events,
		calendarName: `Adamastor — ${title}`,
		calendarDescription: description,
		utmCampaign: calendarUtmCampaign({}),
	});

	return new Response(ics, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
		},
	});
}
