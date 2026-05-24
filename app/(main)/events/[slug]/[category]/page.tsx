import { EVENT_CATEGORIES } from "@/lib/events/categories";
import { fetchPublicEvents } from "@/lib/events/fetch-public";
import { KNOWN_CITY_SLUGS, isKnownCategorySlug, isKnownCitySlug } from "@/lib/events/route-slugs";
import {
	buildBreadcrumbListJsonLd,
	buildEventsRouteBreadcrumbs,
	buildEventsRouteJsonLd,
	buildEventsRouteMetadata,
	getEventsRouteIntro,
} from "@/lib/events/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import EventsPageClient from "../../EventsPageClient";

export const revalidate = 3600;

interface CombinedEventsPageProps {
	// Parent segment is the city, child segment is the category. The slug
	// shape is shared because Next.js requires the first dynamic segment
	// under /events to use a single name across siblings ([slug]).
	params: Promise<{ slug: string; category: string }>;
}

/**
 * Pre-render every known city × category combination at build time. Empty
 * combinations are fine — they render an empty state and don't get listed
 * in the sitemap, but stay crawlable if linked directly.
 */
export function generateStaticParams() {
	const params: { slug: string; category: string }[] = [];
	for (const citySlug of KNOWN_CITY_SLUGS) {
		for (const category of EVENT_CATEGORIES) {
			params.push({ slug: citySlug, category: category.slug });
		}
	}
	return params;
}

async function resolveParams({ params }: CombinedEventsPageProps) {
	const { slug, category } = await params;

	// Enforce canonical order: position 1 MUST be a city, position 2 MUST be
	// a category. Reversed combinations (/events/design/lisboa) 404 — one
	// canonical URL per filter means no duplicate-content fight.
	if (!isKnownCitySlug(slug) || !isKnownCategorySlug(category)) {
		return null;
	}

	return { city: slug, category };
}

export async function generateMetadata(props: CombinedEventsPageProps): Promise<Metadata> {
	const resolved = await resolveParams(props);

	if (!resolved) {
		return { robots: { index: false, follow: false } };
	}

	const metadata = buildEventsRouteMetadata({
		city: resolved.city,
		category: resolved.category,
		pathname: `/events/${resolved.city}/${resolved.category}`,
	});

	// Combined routes are the highest thin-content risk in the matrix —
	// most city × category combinations will be sparse. noindex when empty
	// so Google sees only the meaningful subset.
	const { events } = await fetchPublicEvents(resolved.city, resolved.category);
	if (events.length === 0) return { ...metadata, robots: { index: false, follow: true } };
	return metadata;
}

export default async function CombinedEventsPage(props: CombinedEventsPageProps) {
	const resolved = await resolveParams(props);

	if (!resolved) {
		notFound();
	}

	const { events, categoryFilteringEnabled } = await fetchPublicEvents(resolved.city, resolved.category);
	const pathname = `/events/${resolved.city}/${resolved.category}`;
	const itemListJsonLd = buildEventsRouteJsonLd(events, `https://adamastor.blog${pathname}`);
	const breadcrumbJsonLd = buildBreadcrumbListJsonLd(
		buildEventsRouteBreadcrumbs({ city: resolved.city, category: resolved.category }),
	);
	const intro = getEventsRouteIntro({ city: resolved.city, category: resolved.category });

	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema markup
				dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema markup
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
			/>
			<Suspense fallback={null}>
				<EventsPageClient
					initialEvents={events}
					categoryFilteringEnabled={categoryFilteringEnabled}
					lockedFilter={{ city: resolved.city, category: resolved.category }}
					intro={intro}
				/>
			</Suspense>
		</>
	);
}
