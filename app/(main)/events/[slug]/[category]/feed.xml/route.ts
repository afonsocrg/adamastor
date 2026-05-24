import { buildEventsRss, feedUtmCampaign } from "@/lib/events/feed";
import { fetchPublicEvents } from "@/lib/events/fetch-public";
import { isKnownCategorySlug, isKnownCitySlug } from "@/lib/events/route-slugs";
import { getEventsRouteTitleAndDescription } from "@/lib/events/seo";

const SITE_URL = "https://adamastor.blog";

export const revalidate = 3600;

interface RouteContext {
	params: Promise<{ slug: string; category: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
	const { slug, category } = await params;

	// Same canonical-order enforcement as the page handler: position 1 must
	// be a city, position 2 must be a category. Reversed combinations 404.
	if (!isKnownCitySlug(slug) || !isKnownCategorySlug(category)) {
		return new Response("Not Found", { status: 404 });
	}

	const { events } = await fetchPublicEvents(slug, category);
	const { title, description } = getEventsRouteTitleAndDescription({ city: slug, category });

	const xml = buildEventsRss({
		events,
		feedTitle: `Adamastor — ${title}`,
		feedDescription: description,
		feedUrl: `${SITE_URL}/events/${slug}/${category}/feed.xml`,
		htmlUrl: `${SITE_URL}/events/${slug}/${category}`,
		utmCampaign: feedUtmCampaign({ city: slug, category }),
	});

	return new Response(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
		},
	});
}
