import { buildEventsRss, feedUtmCampaign } from "@/lib/events/feed";
import { fetchPublicEvents } from "@/lib/events/fetch-public";
import { getEventsRouteTitleAndDescription } from "@/lib/events/seo";

const SITE_URL = "https://adamastor.blog";

export const revalidate = 3600;

export async function GET() {
	const { events } = await fetchPublicEvents();
	const { title, description } = getEventsRouteTitleAndDescription({});

	const xml = buildEventsRss({
		events,
		feedTitle: `Adamastor — ${title}`,
		feedDescription: description,
		feedUrl: `${SITE_URL}/events/feed.xml`,
		htmlUrl: `${SITE_URL}/events`,
		utmCampaign: feedUtmCampaign({}),
	});

	return new Response(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
		},
	});
}
