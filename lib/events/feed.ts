import type { EventCategorySlug } from "./categories";
import { withUtm } from "./utm";

const SITE_URL = "https://adamastor.blog";
const FEED_LANGUAGE = "en";
const EVENTS_TIMEZONE = "Europe/Lisbon";

interface FeedEvent {
	id: number | string;
	title: string;
	description: string;
	start_time: string;
	city: string;
	url: string;
	banner_url?: string | null;
	created_at?: string | null;
}

interface BuildEventsRssOptions {
	events: FeedEvent[];
	/** Channel `<title>` (e.g. "Adamastor — Design Events"). */
	feedTitle: string;
	/** Channel `<description>`. */
	feedDescription: string;
	/** Absolute URL of this feed (used by `<atom:link rel="self">`). */
	feedUrl: string;
	/** Absolute URL of the human-readable page (`<link>` in the channel). */
	htmlUrl: string;
	/** utm_campaign value applied to outbound event links. */
	utmCampaign: string;
}

/** XML-escape a string for use inside an element body or attribute. */
function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function wrapCdata(html: string): string {
	const safe = html.replace(/\]\]>/g, "]]]]><![CDATA[>");
	return `<![CDATA[${safe}]]>`;
}

function formatCityLabel(city: string): string {
	const trimmed = city.trim().toLowerCase();
	return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Friendly date/time formatter for the event description, in Europe/Lisbon
 * regardless of where the request is served from. Matches what users see on
 * the events page so RSS reader display lines up with the website.
 */
function formatEventDateTime(value: string): string {
	return new Intl.DateTimeFormat("en-GB", {
		dateStyle: "full",
		timeStyle: "short",
		timeZone: EVENTS_TIMEZONE,
	}).format(new Date(value));
}

/**
 * Build a CDATA-wrapped HTML body for an event RSS item. Pulls the event
 * details into a structure feed readers (Feedly, NetNewsWire, Slack RSS app)
 * render readably — the user knows WHEN/WHERE/WHAT without leaving the
 * reader.
 */
function buildEventBody(event: FeedEvent, outboundUrl: string): string {
	const when = escapeXml(formatEventDateTime(event.start_time));
	const where = escapeXml(formatCityLabel(event.city));
	const description = escapeXml(event.description ?? "").replace(/\n/g, "<br>");

	const bannerHtml = event.banner_url
		? `<p><img src="${escapeXml(event.banner_url)}" alt="" style="max-width:100%;height:auto;border-radius:6px;"></p>`
		: "";

	return wrapCdata(
		`${bannerHtml}<p><strong>When:</strong> ${when}<br><strong>Where:</strong> ${where}</p><p>${description}</p><p><a href="${escapeXml(outboundUrl)}">View event details and RSVP →</a></p>`,
	);
}

export function buildEventsRss({
	events,
	feedTitle,
	feedDescription,
	feedUrl,
	htmlUrl,
	utmCampaign,
}: BuildEventsRssOptions): string {
	const items = events
		.map((event) => {
			// Stable identifier for the RSS reader's seen-set. Prefer Adamastor's
			// canonical event id over the external URL so RSVP-platform URL
			// changes don't re-notify subscribers about already-seen events.
			const guid = `${SITE_URL}/events#event-${event.id}`;
			const outboundUrl = withUtm(event.url, { medium: "rss", campaign: utmCampaign });

			// Use Adamastor's date-added (created_at) as pubDate so RSS readers
			// notify on "newly announced events" rather than re-sorting whenever
			// the calendar advances. Fall back to start_time if created_at is
			// unavailable — at minimum the order remains meaningful.
			const pubDate = new Date(event.created_at ?? event.start_time).toUTCString();
			// Slice BEFORE escaping — otherwise a 500-char cut can land inside
			// an entity like `&amp;` and produce invalid XML.
			const rawDescription = (event.description ?? "").slice(0, 500);
			const description = escapeXml(rawDescription);

			return `    <item>
      <title>${escapeXml(event.title)}</title>
      <link>${escapeXml(outboundUrl)}</link>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <content:encoded>${buildEventBody(event, outboundUrl)}</content:encoded>
    </item>`;
		})
		.join("\n");

	const lastBuildDate = new Date().toUTCString();

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${escapeXml(htmlUrl)}</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>${FEED_LANGUAGE}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

/**
 * UTM campaign value for the route's RSS feed. Maps to a stable analytics
 * dimension on destination platforms (Luma, Eventbrite) so per-feed traffic
 * can be measured (e.g. "rss_events_design" vs "rss_events_lisboa_design").
 */
export function feedUtmCampaign({
	city,
	category,
}: {
	city?: string | null;
	category?: EventCategorySlug | null;
}): string {
	const parts: string[] = ["rss_events"];
	if (city) parts.push(city);
	if (category) parts.push(category);
	return parts.join("_");
}
