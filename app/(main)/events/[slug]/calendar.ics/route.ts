import { buildEventsIcs, calendarUtmCampaign } from "@/lib/events/calendar";
import { fetchPublicEvents } from "@/lib/events/fetch-public";
import { isKnownCategorySlug, isKnownCitySlug } from "@/lib/events/route-slugs";
import { getEventsRouteTitleAndDescription } from "@/lib/events/seo";

export const revalidate = 3600;

interface RouteContext {
	params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
	const { slug } = await params;

	// Same disambiguation as the RSS route + page handler — cities take
	// precedence on collision (guarded against at module load in route-slugs.ts).
	if (isKnownCitySlug(slug)) {
		const { events } = await fetchPublicEvents(slug, null);
		const { title, description } = getEventsRouteTitleAndDescription({ city: slug });

		const ics = buildEventsIcs({
			events,
			calendarName: `Adamastor — ${title}`,
			calendarDescription: description,
			utmCampaign: calendarUtmCampaign({ city: slug }),
		});

		return new Response(ics, {
			headers: {
				"Content-Type": "text/calendar; charset=utf-8",
				"Cache-Control": "public, max-age=3600, s-maxage=3600",
			},
		});
	}

	if (isKnownCategorySlug(slug)) {
		const { events } = await fetchPublicEvents(null, slug);
		const { title, description } = getEventsRouteTitleAndDescription({ category: slug });

		const ics = buildEventsIcs({
			events,
			calendarName: `Adamastor — ${title}`,
			calendarDescription: description,
			utmCampaign: calendarUtmCampaign({ category: slug }),
		});

		return new Response(ics, {
			headers: {
				"Content-Type": "text/calendar; charset=utf-8",
				"Cache-Control": "public, max-age=3600, s-maxage=3600",
			},
		});
	}

	return new Response("Not Found", { status: 404 });
}
