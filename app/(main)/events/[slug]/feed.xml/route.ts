import { buildEventsRss, feedUtmCampaign } from "@/lib/events/feed";
import { fetchPublicEvents } from "@/lib/events/fetch-public";
import { isKnownCategorySlug, isKnownCitySlug } from "@/lib/events/route-slugs";
import { getEventsRouteTitleAndDescription } from "@/lib/events/seo";

const SITE_URL = "https://adamastor.blog";

export const revalidate = 3600;

interface RouteContext {
	params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
	const { slug } = await params;

	// Same disambiguation as /events/[slug]/page.tsx — cities take precedence
	// on collision (guarded against at module load in route-slugs.ts).
	if (isKnownCitySlug(slug)) {
		const { events } = await fetchPublicEvents(slug, null);
		const { title, description } = getEventsRouteTitleAndDescription({ city: slug });

		const xml = buildEventsRss({
			events,
			feedTitle: `Adamastor — ${title}`,
			feedDescription: description,
			feedUrl: `${SITE_URL}/events/${slug}/feed.xml`,
			htmlUrl: `${SITE_URL}/events/${slug}`,
			utmCampaign: feedUtmCampaign({ city: slug }),
		});

		return new Response(xml, {
			headers: {
				"Content-Type": "application/rss+xml; charset=utf-8",
				"Cache-Control": "public, max-age=3600, s-maxage=3600",
			},
		});
	}

	if (isKnownCategorySlug(slug)) {
		const { events } = await fetchPublicEvents(null, slug);
		const { title, description } = getEventsRouteTitleAndDescription({ category: slug });

		const xml = buildEventsRss({
			events,
			feedTitle: `Adamastor — ${title}`,
			feedDescription: description,
			feedUrl: `${SITE_URL}/events/${slug}/feed.xml`,
			htmlUrl: `${SITE_URL}/events/${slug}`,
			utmCampaign: feedUtmCampaign({ category: slug }),
		});

		return new Response(xml, {
			headers: {
				"Content-Type": "application/rss+xml; charset=utf-8",
				"Cache-Control": "public, max-age=3600, s-maxage=3600",
			},
		});
	}

	return new Response("Not Found", { status: 404 });
}
