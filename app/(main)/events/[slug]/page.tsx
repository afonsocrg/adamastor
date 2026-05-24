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
import EventsPageClient from "../EventsPageClient";

export const revalidate = 3600;

interface EventsSlugPageProps {
	params: Promise<{ slug: string }>;
}

/**
 * Pre-generate one page per known city and per known category. Next.js will
 * cache them at build time; unknown slugs fall through to runtime and hit
 * notFound() in the page handler.
 */
export function generateStaticParams() {
	return [
		...KNOWN_CITY_SLUGS.map((slug) => ({ slug })),
		...EVENT_CATEGORIES.map((category) => ({ slug: category.slug })),
	];
}

export async function generateMetadata({ params }: EventsSlugPageProps): Promise<Metadata> {
	const { slug } = await params;

	if (isKnownCitySlug(slug)) {
		const metadata = buildEventsRouteMetadata({ city: slug, pathname: `/events/${slug}` });
		const { events } = await fetchPublicEvents(slug, null);
		// noindex thin pages — programmatic SEO best practice. The page still
		// renders for direct visitors; Google just doesn't index it, which
		// avoids dragging down site-wide quality signals via dozens of
		// near-empty city/category combinations.
		if (events.length === 0) return { ...metadata, robots: { index: false, follow: true } };
		return metadata;
	}

	if (isKnownCategorySlug(slug)) {
		const metadata = buildEventsRouteMetadata({ category: slug, pathname: `/events/${slug}` });
		const { events } = await fetchPublicEvents(null, slug);
		if (events.length === 0) return { ...metadata, robots: { index: false, follow: true } };
		return metadata;
	}

	return { robots: { index: false, follow: false } };
}

export default async function EventsSlugPage({ params }: EventsSlugPageProps) {
	const { slug } = await params;

	// Cities take precedence on collision — see the build-time assertion in
	// lib/events/route-slugs.ts which guarantees this is unreachable, but
	// keeping the order explicit makes the intent visible.
	if (isKnownCitySlug(slug)) {
		const { events, categoryFilteringEnabled } = await fetchPublicEvents(slug, null);
		const pathname = `/events/${slug}`;
		const itemListJsonLd = buildEventsRouteJsonLd(events, `https://adamastor.blog${pathname}`);
		const breadcrumbJsonLd = buildBreadcrumbListJsonLd(buildEventsRouteBreadcrumbs({ city: slug }));
		const intro = getEventsRouteIntro({ city: slug });

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
						lockedFilter={{ city: slug }}
						intro={intro}
					/>
				</Suspense>
			</>
		);
	}

	if (isKnownCategorySlug(slug)) {
		const { events, categoryFilteringEnabled } = await fetchPublicEvents(null, slug);
		const pathname = `/events/${slug}`;
		const itemListJsonLd = buildEventsRouteJsonLd(events, `https://adamastor.blog${pathname}`);
		const breadcrumbJsonLd = buildBreadcrumbListJsonLd(buildEventsRouteBreadcrumbs({ category: slug }));
		const intro = getEventsRouteIntro({ category: slug });

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
						lockedFilter={{ category: slug }}
						intro={intro}
					/>
				</Suspense>
			</>
		);
	}

	notFound();
}
