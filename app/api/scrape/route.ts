import { detectCityFromText } from "@/app/(dashboard)/dashboard/add-event/city-mappings";
import type { MetadataResult } from "@/app/types";
import { type CheerioAPI, load } from "cheerio";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Represents the structured event data extracted from a webpage.
 * All fields except title are optional since not all pages will have complete metadata.
 */
interface Event {
	title: string;
	description?: string;
	url?: string;
	bannerUrl?: string;
	startTime?: string; // -M: changed this from Date to string.
	city?: string;
}

/**
 * Capitalizes the first letter of a string.
 * Used for converting metadata property names to camelCase.
 */
function capitalizeFirstLetter(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts snake_case strings to camelCase.
 * Example: "start_time" -> "startTime"
 */
function snakeCaseToCamelCase(str: string) {
	return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts an Open Graph or Twitter meta property name to a camelCase key.
 * Handles namespaced properties like "og:image" -> "ogImage"
 *
 * @param property - The meta property name (e.g., "og:image", "twitter:card")
 * @returns camelCase key for use in the metadata object
 */
function getPropertyKey(property: string) {
	const parts = property.split(":").map((part) => capitalizeFirstLetter(snakeCaseToCamelCase(part)));

	// Ensure first character is lowercase for proper camelCase
	return parts.join("").charAt(0).toLowerCase() + parts.join("").slice(1);
}

/**
 * Extracts Open Graph metadata from the parsed HTML.
 * Open Graph tags are used by Facebook and many other platforms.
 * Format: <meta property="og:title" content="..." />
 *
 * @param $ - Cheerio instance with loaded HTML
 * @returns Object containing extracted OG metadata
 */
function extractOGMetadata($: CheerioAPI) {
	const metadata: MetadataResult = {};

	// Select all meta tags with property starting with "og:"
	$('meta[property^="og:"]').each((_, element) => {
		const property = $(element).attr("property");
		const content = $(element).attr("content");

		if (property && content) {
			const key = getPropertyKey(property);
			// Handle og:image specially since pages can have multiple images
			if (property === "og:image") {
				metadata.ogImage = metadata.ogImage || [];
				metadata.ogImage.push({ url: content });
			} else {
				(metadata as any)[key] = content;
			}
		}
	});
	return metadata;
}

/**
 * Extracts Twitter Card metadata from the parsed HTML.
 * Twitter uses a similar but slightly different format than Open Graph.
 * Format: <meta name="twitter:title" content="..." />
 *
 * @param $ - Cheerio instance with loaded HTML
 * @returns Object containing extracted Twitter metadata
 */
function extractTwitterMetadata($: CheerioAPI) {
	const metadata: MetadataResult = {};

	// Select all meta tags with name starting with "twitter:"
	$('meta[name^="twitter:"]').each((_, element) => {
		const name = $(element).attr("name");
		const content = $(element).attr("content");

		if (name && content) {
			const key = getPropertyKey(name);

			// Handle twitter:image specially since pages can have multiple images
			if (name === "twitter:image") {
				metadata.twitterImage = metadata.twitterImage || [];
				metadata.twitterImage.push({ url: content });
			} else {
				(metadata as any)[key] = content;
			}
		}
	});
	return metadata;
}

/**
 * Main metadata extraction function.
 * Combines standard HTML metadata, Open Graph, and Twitter Card data.
 *
 * @param html - Raw HTML string to parse
 * @returns Combined metadata from all sources
 */
function extractMetadata(html: string): MetadataResult {
	const $ = load(html);

	// Extract event-specific meta tags (used by Eventbrite and some other platforms)
	const eventStartTime = $('meta[property="event:start_time"]').attr("content") || undefined;
	const eventEndTime = $('meta[property="event:end_time"]').attr("content") || undefined;

	// Build metadata object with fallback chain:
	// 1. Standard HTML tags (title, meta description)
	// 2. Open Graph tags (override standard)
	// 3. Twitter Card tags (fill gaps)
	const metadata: MetadataResult = {
		title: $("title")?.text()?.trim(),
		description: $('meta[name="description"]').attr("content")?.trim(),
		eventStartTime: eventStartTime,
		eventEndTime: eventEndTime,
		...extractOGMetadata($),
		...extractTwitterMetadata($),
	};
	return metadata;
}

/**
 * Default extraction strategy for generic websites.
 * Used when the URL doesn't match any known event platform.
 *
 * @param html - Raw HTML string
 * @param originalUrl - The original URL (used as fallback if og:url is missing)
 * @returns Structured event data
 */
function extractDefaultEventData(html: string, originalUrl: string): Event {
	const metadata = extractMetadata(html);
	return {
		title: metadata.title,
		description: metadata.description,
		// Fall back to original URL if og:url meta tag is missing
		url: metadata.ogUrl || originalUrl,
		// Try OG image first, then Twitter image
		bannerUrl: metadata.ogImage?.[0]?.url || metadata.twitterImage?.[0]?.url,
	};
}

/**
 * Specialized extraction for Eventbrite event pages.
 * Eventbrite includes event:start_time meta tags that we can use.
 *
 * @param html - Raw HTML string from Eventbrite
 * @returns Structured event data with start time
 */
function extractEventbriteData(html: string, originalUrl: string): Event {
	const metadata = extractMetadata(html);
	const $ = load(html);

	// Extract location from the address section using stable heading ID
	let city: string | undefined;
	const locationSection = $("#location-heading").parent().next();
	if (locationSection.length > 0) {
		const addressLines: string[] = [];
		locationSection.find("p").each((_, el) => {
			const text = $(el).text().trim();
			if (text) addressLines.push(text);
		});
		const fullAddress = addressLines.join(" ");
		city = detectCityFromText(fullAddress)?.value;
	}

	return {
		// Prefer og:title over page title for Eventbrite
		title: metadata.ogTitle || metadata.title,
		description: metadata.ogDescription || metadata.description,
		url: metadata.ogUrl || originalUrl,
		bannerUrl: metadata.ogImage?.[0]?.url || metadata.twitterImage?.[0]?.url,
		startTime: metadata.eventStartTime, // M: I'm now keeping this as a string.
		city,
	};
}

/**
 * Specialized extraction for Luma event pages.
 * Luma appends " · Luma" to page titles which we want to remove.
 *
 * @param html - Raw HTML string from Luma
 * @returns Structured event data with cleaned title
 */
function extractLumaData(html: string, originalUrl: string): Event {
	const metadata = extractMetadata(html);
	const $ = load(html);

	let city: string | undefined;
	let startTime: string | undefined;

	// Luma uses JSON-LD structured data
	const jsonLdScript = $('script[type="application/ld+json"]').first().html();
	if (jsonLdScript) {
		try {
			const jsonLd = JSON.parse(jsonLdScript);

			// Extract city from location
			const address =
				jsonLd?.location?.address?.addressLocality ||
				jsonLd?.location?.address?.addressRegion ||
				jsonLd?.location?.name;
			if (address) {
				city = detectCityFromText(address)?.value;
			}

			// Extract start time (Schema.org uses startDate)
			if (jsonLd?.startDate) {
				startTime = jsonLd.startDate;
			}
		} catch (e) {
			// JSON parse failed, continue with fallbacks
		}
	}

	return {
		title: metadata.title.replace(" · Luma", ""),
		description: metadata.description,
		url: metadata.ogUrl || originalUrl,
		bannerUrl: metadata.ogImage?.[0]?.url || metadata.twitterImage?.[0]?.url,
		startTime: startTime || metadata.eventStartTime,
		city,
	};
}

/**
 * POST endpoint for scraping event metadata from a URL.
 *
 * Request body: { url: string }
 * Response: { data: Event } or { error: string }
 *
 * The endpoint detects the event platform from the URL and uses
 * the appropriate extraction strategy for best results.
 */
export async function POST(request: NextRequest) {
	try {
		const { url } = await request.json();

		if (!url) {
			return NextResponse.json({ error: "URL is required" }, { status: 400 });
		}

		// Fetch the page HTML with a simple user agent
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; MetadataScraper/1.0)",
			},
		});

		if (!response.ok) {
			return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: 500 });
		}

		const html = await response.text();

		// Route to the appropriate extractor based on URL pattern
		let metadata: Event;
		if (url.includes("eventbrite.")) {
			console.log("Detected Eventbrite URL. Scraping Eventbrite data...");
			metadata = extractEventbriteData(html, url);
		} else if (url.includes("luma")) {
			console.log("Detected Lu.ma URL. Scraping Lu.ma data...");
			metadata = extractLumaData(html, url);
		} else {
			console.log("Did not detect any special event URL. Using default metadata extraction...");
			metadata = extractDefaultEventData(html, url);
		}

		return NextResponse.json({ data: metadata });
	} catch (error) {
		console.error("Error in scrape API:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
