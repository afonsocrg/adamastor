import type { Metadata } from "next";
import { EVENT_CATEGORIES, type EventCategorySlug } from "./categories";

const SITE_NAME = "Adamastor";
const SITE_URL = "https://adamastor.blog";
const SOCIAL_PREVIEW = "/socialPreview2.jpg";

function formatCityLabel(city: string) {
	return city.charAt(0).toUpperCase() + city.slice(1);
}

function categoryName(slug: EventCategorySlug) {
	return EVENT_CATEGORIES.find((category) => category.slug === slug)?.name ?? slug;
}

export interface EventsRouteSeoInput {
	city?: string | null;
	category?: EventCategorySlug | null;
	/** Canonical pathname for this route (e.g. "/events/lisboa/design"). */
	pathname: string;
}

/**
 * Per-city intro paragraphs. Only the cities we have something specific to
 * say about — smaller cities fall back to no city-specific copy. The goal
 * is to give each route a chunk of distinguishing content beyond the events
 * list itself, which programmatic-SEO best practice says is essential to
 * avoid thin-content penalties across the route matrix.
 */
const CITY_INTROS: Partial<Record<string, string>> = {
	lisboa:
		"Lisboa is Portugal's startup capital — Web Summit anchors the year, and weekly meetups run year-round from Founder Institute Portugal, Startup Grind, and the local community. Adamastor curates them here.",
	porto:
		"Porto's startup community has grown into a tight-knit network, anchored by founder co-working spaces, a strong open-source culture, and the country's second-largest tech ecosystem.",
	online:
		"Portugal's startup community is increasingly distributed — Lisboa, Porto, and a growing diaspora. Online events bridge them: virtual meetups, webinars, AMAs, and remote pitch nights curated by Adamastor.",
};

/**
 * Per-category intro paragraphs. Used both on category-only routes
 * (/events/design) and on combined routes (/events/lisboa/design) — the
 * city context is already in the h1 and breadcrumb on combined pages.
 *
 * Where a sibling community (LisboaJS, LisboaUX) anchors a category's local
 * scene, the intro names and links to it — both for editorial honesty and
 * for the cross-domain topic-cluster signal Google rewards.
 */
const CATEGORY_INTROS: Record<EventCategorySlug, string> = {
	ai: "AI events for builders and operators in Portugal — LLM applications, ML systems, agentic workflows, evals, and the practical edge of generative AI in product.",
	"software-engineering":
		"Developer events across Portugal — dev meetups, conferences, cloud and security talks, and open-source gatherings. Many JavaScript events are hosted by LisboaJS, Adamastor's sibling community in Lisbon.",
	design:
		"Design events for Portugal's UX, product, and creative-tech communities — Figma talks, user-research meetups, design system showcases, and creative workshops. Many hosted by LisboaUX, Adamastor's sibling community in Lisbon.",
	product:
		"Product events for PMs and founders building software — product strategy, discovery, growth tactics, and the craft of building things people actually use.",
	"startups-fundraising":
		"Fundraising and startup-building events in Portugal — pitch nights, demo days, investor sessions, and accelerator programs from Founder Institute Portugal, Startup Grind Lisbon, and beyond. Adamastor's co-founders Carlos Resende and Afonso Gonçalves run those programs locally; the calendar surfaces the wider scene.",
};

const BASE_INTRO =
	"Curated startup events across Portugal — meetups, conferences, workshops, and founder gatherings. Filter by city or category below.";

/**
 * Return a single intro paragraph for any events route variant. Falls back
 * gracefully when no city-specific copy exists (smaller cities), preferring
 * to combine signals where both are available rather than dropping context.
 */
export function getEventsRouteIntro({
	city,
	category,
}: {
	city?: string | null;
	category?: EventCategorySlug | null;
}): string {
	if (category && city) {
		// Combined route — category intro is more interesting; the page title
		// already establishes the city.
		return CATEGORY_INTROS[category];
	}
	if (category) {
		return CATEGORY_INTROS[category];
	}
	if (city) {
		return CITY_INTROS[city] ?? BASE_INTRO;
	}
	return BASE_INTRO;
}

const PUBLICATION_ATTRIBUTION = "Curated by Adamastor — a digital publication for all things startup in Portugal.";

/**
 * Compute the core human-readable title + description for any /events route
 * variant. Shared by `buildEventsRouteMetadata` (HTML head) and the RSS
 * feed builder so page metadata and feed channel metadata stay aligned.
 *
 * Title strategy: city-only pages use "Startup Events in X" (startup-first
 * brand positioning), category pages use the category name ("Design Events",
 * "AI Events"), combined pages stack category + city.
 */
export function getEventsRouteTitleAndDescription({
	city,
	category,
}: {
	city?: string | null;
	category?: EventCategorySlug | null;
}): { title: string; description: string } {
	const cityLabel = city ? formatCityLabel(city) : null;
	const categoryLabel = category ? categoryName(category) : null;
	const isOnline = city === "online";

	if (cityLabel && categoryLabel) {
		return {
			title: isOnline ? `Online ${categoryLabel} Events` : `${categoryLabel} Events in ${cityLabel}`,
			description: isOnline
				? `Upcoming online ${categoryLabel.toLowerCase()} events. ${PUBLICATION_ATTRIBUTION}`
				: `Upcoming ${categoryLabel.toLowerCase()} events in ${cityLabel}. ${PUBLICATION_ATTRIBUTION}`,
		};
	}
	if (categoryLabel) {
		return {
			title: `${categoryLabel} Events`,
			description: `Upcoming ${categoryLabel.toLowerCase()} events across Portugal. ${PUBLICATION_ATTRIBUTION}`,
		};
	}
	if (cityLabel) {
		return {
			title: isOnline ? "Online Startup Events" : `Startup Events in ${cityLabel}`,
			description: isOnline
				? `Upcoming online startup events. Meetups, conferences, workshops, and fundraising events. ${PUBLICATION_ATTRIBUTION}`
				: `Upcoming startup events in ${cityLabel}. Meetups, conferences, workshops, and fundraising events. ${PUBLICATION_ATTRIBUTION}`,
		};
	}
	return {
		title: "Startup Events in Portugal",
		description: `Discover upcoming startup events across Portugal. Meetups, conferences, workshops, and founder gatherings. ${PUBLICATION_ATTRIBUTION}`,
	};
}

/**
 * Pathname of the RSS feed for any events route variant. Matches the
 * sibling `/feed.xml` route segment under each events page.
 */
export function eventsRouteFeedPath({
	city,
	category,
}: {
	city?: string | null;
	category?: EventCategorySlug | null;
}): string {
	if (city && category) return `/events/${city}/${category}/feed.xml`;
	if (city) return `/events/${city}/feed.xml`;
	if (category) return `/events/${category}/feed.xml`;
	return "/events/feed.xml";
}

/**
 * Produce the metadata for any /events route variant. Includes a per-route
 * `<link rel="alternate" type="application/rss+xml">` so feed readers and
 * discovery tools find the right feed from any events URL.
 */
export function buildEventsRouteMetadata({ city, category, pathname }: EventsRouteSeoInput): Metadata {
	const { title, description } = getEventsRouteTitleAndDescription({ city, category });

	const canonical = pathname;
	const fullTitle = `${title} | ${SITE_NAME}`;
	const ogUrl = `${SITE_URL}${pathname}`;
	const feedPath = eventsRouteFeedPath({ city, category });
	const feedTitle = `Adamastor — ${title} (RSS)`;

	return {
		title: fullTitle,
		description,
		alternates: {
			canonical,
			types: {
				"application/rss+xml": [{ url: feedPath, title: feedTitle }],
			},
		},
		openGraph: {
			title: fullTitle,
			description,
			url: ogUrl,
			type: "website",
			siteName: SITE_NAME,
			images: [{ url: SOCIAL_PREVIEW, width: 1200, height: 630, alt: title }],
		},
		twitter: {
			card: "summary_large_image",
			title: fullTitle,
			description,
			images: [SOCIAL_PREVIEW],
		},
	};
}

export interface EventForJsonLd {
	id: string | number;
	title: string;
	description: string;
	start_time: string;
	city: string;
	url?: string | null;
	banner_url?: string | null;
}

/**
 * Build a Schema.org Event JSON-LD object for a single event. Maps Adamastor's
 * city field to a Place / VirtualLocation, with "online" treated as virtual.
 */
function buildEventJsonLd(event: EventForJsonLd) {
	const isOnline = event.city.trim().toLowerCase() === "online";
	const location = isOnline
		? { "@type": "VirtualLocation", url: event.url ?? `${SITE_URL}/events` }
		: {
				"@type": "Place",
				name: formatCityLabel(event.city.trim().toLowerCase()),
				address: {
					"@type": "PostalAddress",
					addressLocality: formatCityLabel(event.city.trim().toLowerCase()),
					addressCountry: "PT",
				},
			};

	return {
		"@context": "https://schema.org",
		"@type": "Event",
		name: event.title,
		description: event.description,
		startDate: event.start_time,
		eventAttendanceMode: isOnline
			? "https://schema.org/OnlineEventAttendanceMode"
			: "https://schema.org/OfflineEventAttendanceMode",
		eventStatus: "https://schema.org/EventScheduled",
		location,
		url: event.url ?? `${SITE_URL}/events`,
		...(event.banner_url ? { image: [event.banner_url] } : {}),
		organizer: {
			"@type": "Organization",
			name: SITE_NAME,
			url: SITE_URL,
		},
	};
}

/**
 * Build the JSON-LD blob to inject into a route. Emits an ItemList wrapping
 * per-event Event objects, so a single <script> tag covers both rich-result
 * eligibility for the page (ItemList) and per-event rich results (Event).
 */
export function buildEventsRouteJsonLd(events: EventForJsonLd[], pageUrl: string) {
	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		url: pageUrl,
		numberOfItems: events.length,
		itemListElement: events.map((event, index) => ({
			"@type": "ListItem",
			position: index + 1,
			item: buildEventJsonLd(event),
		})),
	};
}

export interface ArticleAuthorInput {
	name: string;
	bio?: string | null;
	image_url?: string | null;
	website_url?: string | null;
	/** Free-form JSON column on `authors`; we extract URL-shaped values for sameAs. */
	social_links?: unknown;
}

export interface ArticleJsonLdInput {
	/** Canonical pathname for the post (e.g. "/posts/my-slug"). */
	pathname: string;
	title: string;
	/** Short text description, typically the first ~160 chars of post content. */
	description: string;
	/** ISO timestamp of original publication. */
	datePublished: string;
	/** ISO timestamp of last update; falls back to datePublished if absent. */
	dateModified?: string | null;
	/** Optional cover/banner image; falls back to the site social preview. */
	imageUrl?: string | null;
	author: ArticleAuthorInput;
}

/**
 * Extract URL-shaped values from a free-form social_links column. Tolerant
 * of object-shaped (`{ twitter: "https://…" }`), array-of-strings, and
 * array-of-objects (`[{ url: "…" }]`) data. Anything that doesn't look like
 * an HTTP(S) URL is dropped.
 */
function extractSocialUrls(socialLinks: unknown): string[] {
	const urls: string[] = [];

	const visit = (value: unknown): void => {
		if (typeof value === "string" && /^https?:\/\//i.test(value)) {
			urls.push(value);
			return;
		}
		if (Array.isArray(value)) {
			for (const entry of value) visit(entry);
			return;
		}
		if (value && typeof value === "object") {
			for (const entry of Object.values(value)) visit(entry);
		}
	};

	visit(socialLinks);
	return [...new Set(urls)];
}

/**
 * Build a Schema.org BlogPosting JSON-LD object for a single post. Uses the
 * author table's `website_url` + `social_links` for the Person's `url` and
 * `sameAs` — to enrich a founder's authority signal further (e.g. linking
 * Carlos to Founder Institute Portugal), populate those fields on the
 * authors row in the database.
 */
export function buildArticleJsonLd(input: ArticleJsonLdInput) {
	const articleUrl = `${SITE_URL}${input.pathname}`;
	const sameAs = extractSocialUrls(input.author.social_links);

	const authorPerson: Record<string, unknown> = {
		"@type": "Person",
		name: input.author.name,
	};
	if (input.author.website_url) authorPerson.url = input.author.website_url;
	if (input.author.image_url) authorPerson.image = input.author.image_url;
	if (input.author.bio) authorPerson.description = input.author.bio;
	if (sameAs.length > 0) authorPerson.sameAs = sameAs;

	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
		headline: input.title,
		description: input.description,
		image: [input.imageUrl ?? `${SITE_URL}${SOCIAL_PREVIEW}`],
		datePublished: input.datePublished,
		dateModified: input.dateModified ?? input.datePublished,
		author: authorPerson,
		publisher: {
			"@type": "Organization",
			name: SITE_NAME,
			url: SITE_URL,
			logo: {
				"@type": "ImageObject",
				url: `${SITE_URL}/adamastorLogotype.svg`,
			},
		},
		url: articleUrl,
	};
}

export interface BreadcrumbItemInput {
	/** Display name as it should appear in the SERP breadcrumb. */
	name: string;
	/** Absolute pathname (we prepend SITE_URL). */
	pathname: string;
}

/**
 * Build a Schema.org BreadcrumbList JSON-LD object. Cross-cutting helper —
 * lives in events/seo.ts for now since that's where the other SEO helpers
 * are, but works for any route (posts, static pages, future per-event pages).
 *
 * The last item's `item` field is omitted per Schema.org convention (the
 * current page is implicit and shouldn't be a link back to itself).
 */
export function buildBreadcrumbListJsonLd(items: BreadcrumbItemInput[]) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => {
			const isLast = index === items.length - 1;
			return {
				"@type": "ListItem",
				position: index + 1,
				name: item.name,
				...(isLast ? {} : { item: `${SITE_URL}${item.pathname}` }),
			};
		}),
	};
}

/**
 * Compute the breadcrumb trail for any /events route variant. Naming aligns
 * with the page-title strategy so SERP display (title + breadcrumb together)
 * reads consistently.
 */
export function buildEventsRouteBreadcrumbs({
	city,
	category,
}: {
	city?: string | null;
	category?: EventCategorySlug | null;
}): BreadcrumbItemInput[] {
	const cityLabel = city ? formatCityLabel(city) : null;
	const categoryLabel = category ? categoryName(category) : null;
	const isOnline = city === "online";

	const items: BreadcrumbItemInput[] = [
		{ name: "Home", pathname: "/" },
		{ name: "Startup Events in Portugal", pathname: "/events" },
	];

	if (cityLabel && categoryLabel) {
		items.push({
			name: isOnline ? "Online Startup Events" : `Startup Events in ${cityLabel}`,
			pathname: `/events/${city}`,
		});
		items.push({
			name: isOnline ? `Online ${categoryLabel} Events` : `${categoryLabel} Events in ${cityLabel}`,
			pathname: `/events/${city}/${category}`,
		});
	} else if (categoryLabel) {
		items.push({
			name: `${categoryLabel} Events`,
			pathname: `/events/${category}`,
		});
	} else if (cityLabel) {
		items.push({
			name: isOnline ? "Online Startup Events" : `Startup Events in ${cityLabel}`,
			pathname: `/events/${city}`,
		});
	}

	return items;
}
