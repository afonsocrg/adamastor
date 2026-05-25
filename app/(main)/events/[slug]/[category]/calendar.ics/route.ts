import { buildEventsIcs, calendarUtmCampaign } from "@/lib/events/calendar";
import { fetchPublicEvents } from "@/lib/events/fetch-public";
import { isKnownCategorySlug, isKnownCitySlug } from "@/lib/events/route-slugs";
import { getEventsRouteTitleAndDescription } from "@/lib/events/seo";

export const revalidate = 3600;

interface RouteContext {
	params: Promise<{ slug: string; category: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
	const { slug, category } = await params;

	// Same canonical-order enforcement as the page + RSS handlers: position 1
	// must be a city, position 2 must be a category. Reversed combinations 404.
	if (!isKnownCitySlug(slug) || !isKnownCategorySlug(category)) {
		return new Response("Not Found", { status: 404 });
	}

	const { events } = await fetchPublicEvents(slug, category);
	const { title, description } = getEventsRouteTitleAndDescription({ city: slug, category });

	const ics = buildEventsIcs({
		events,
		calendarName: `Adamastor — ${title}`,
		calendarDescription: description,
		utmCampaign: calendarUtmCampaign({ city: slug, category }),
	});

	return new Response(ics, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
		},
	});
}
