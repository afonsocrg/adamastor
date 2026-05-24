/**
 * Decorates an outbound event URL with UTM parameters so destination platforms
 * (Luma, Eventbrite, Meetup, Substack, etc.) attribute the click back to
 * Adamastor.
 *
 * Why surface this as a helper instead of baking UTMs into the stored URL:
 *   - We want one canonical URL per event in the DB (duplicate detection,
 *     edits, comparisons). Tracking decoration is a render-time concern.
 *   - Different surfaces (listing, newsletter, RSS, embeds) need different
 *     campaign labels — bake them in at the render site that knows the
 *     context.
 *
 * Behavior:
 *   - Empty / nullish input → empty string (safe to drop into href).
 *   - Non-http(s) protocols (mailto:, tel:, …) → returned as-is.
 *   - Malformed URLs → returned as-is.
 *   - Pre-existing utm_* params on the URL are NOT overwritten — admins can
 *     paste a URL with their own UTMs (e.g. for a partner-specific campaign)
 *     and we'll respect them.
 */
export const DEFAULT_UTM_SOURCE = "adamastor.blog";

export interface UtmParams {
	/**
	 * Overrides utm_source. Defaults to "adamastor.blog" — matching the
	 * referrer hostname so destination analytics dashboards unify our
	 * traffic into one row instead of splitting it across "adamastor"
	 * (UTM) and "adamastor.blog" (referer fallback).
	 */
	source?: string;
	/** utm_medium, e.g. "referral", "email", "rss", "embed". */
	medium: string;
	/** utm_campaign, e.g. "events_listing", "newsletter_2026_05". */
	campaign: string;
	/** utm_content, optional finer-grained identifier (event id, partner, …). */
	content?: string;
	/** utm_term, optional. */
	term?: string;
}

export function withUtm(url: string | null | undefined, params: UtmParams): string {
	if (!url) return "";

	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return url;
	}

	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		return url;
	}

	const utm: Record<string, string> = {
		utm_source: params.source ?? DEFAULT_UTM_SOURCE,
		utm_medium: params.medium,
		utm_campaign: params.campaign,
	};
	if (params.content) utm.utm_content = params.content;
	if (params.term) utm.utm_term = params.term;

	for (const [key, value] of Object.entries(utm)) {
		if (!parsed.searchParams.has(key)) {
			parsed.searchParams.set(key, value);
		}
	}

	return parsed.toString();
}
