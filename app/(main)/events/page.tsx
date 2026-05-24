import { fetchPublicEvents } from "@/lib/events/fetch-public";
import {
	buildBreadcrumbListJsonLd,
	buildEventsRouteBreadcrumbs,
	buildEventsRouteJsonLd,
	buildEventsRouteMetadata,
	getEventsRouteIntro,
} from "@/lib/events/seo";
import type { Metadata } from "next";
import { Suspense } from "react";
import EventsPageClient from "./EventsPageClient";

export const revalidate = 3600;

const ROUTE_PATH = "/events";

export async function generateMetadata(): Promise<Metadata> {
	const metadata = buildEventsRouteMetadata({ pathname: ROUTE_PATH });
	const { events } = await fetchPublicEvents();
	// The base route never goes "thin" — it always shows everything we have —
	// but we honour the noindex pattern for consistency in case the DB is empty.
	if (events.length === 0) {
		return { ...metadata, robots: { index: false, follow: true } };
	}
	return metadata;
}

export default async function EventsPage() {
	const { events, categoryFilteringEnabled } = await fetchPublicEvents();
	const itemListJsonLd = buildEventsRouteJsonLd(events, `https://adamastor.blog${ROUTE_PATH}`);
	const breadcrumbJsonLd = buildBreadcrumbListJsonLd(buildEventsRouteBreadcrumbs({}));
	const intro = getEventsRouteIntro({});

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
					intro={intro}
				/>
			</Suspense>
		</>
	);
}
