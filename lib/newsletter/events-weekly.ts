import { EVENT_CATEGORIES, type EventCategorySlug } from "@/lib/events/categories";

/**
 * Pure logic for the personalised weekly events email: one email per reader
 * covering the union of their categories, instead of one broadcast per
 * category (which sent a five-category reader five emails the same minute,
 * with multi-category events repeated across them).
 *
 * No I/O here so it's unit-testable; lib/newsletter/send-events-weekly.ts does
 * the fetching and sending.
 */

/** Editorial cap per email. Past this the CTA carries "N more this week". */
export const MAX_EVENTS_PER_EMAIL = 10;
/**
 * Don't cap just to hide one or two events: "See 1 more this week" costs a
 * click to reveal less than it saves. Only cap when it hides at least this many.
 */
export const MIN_HIDDEN_TO_CAP = 3;

export interface DigestEvent {
	id: string;
	title: string;
	description: string;
	start_time: string;
	city: string;
	url: string;
	banner_url?: string;
	categorySlugs: string[];
}

export interface DigestSubscriber {
	email: string;
	categories: string[];
	preference_token: string;
}

export interface EventDigest {
	email: string;
	preferenceToken: string;
	/** The reader's categories that actually had events this week, in canonical order. */
	matchedCategories: EventCategorySlug[];
	/** Events to render (capped, chronological). */
	events: DigestEvent[];
	/** All matching events this week, before the cap. */
	totalCount: number;
}

const CATEGORY_ORDER = EVENT_CATEGORIES.map((c) => c.slug) as readonly string[];

function lisbonDayKey(iso: string): string {
	// en-CA formats as YYYY-MM-DD, so keys sort chronologically as strings.
	return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
}

/**
 * Pick up to `cap` events, spread across the week. Taking the first N
 * chronologically would fill a busy week with Monday and Tuesday and never
 * show Thursday, so we round-robin across days (earliest event of each day
 * first), then return the picks in date order.
 */
export function spreadAcrossDays(events: DigestEvent[], cap: number): DigestEvent[] {
	const sorted = [...events].sort((a, b) => a.start_time.localeCompare(b.start_time));
	if (sorted.length <= cap) return sorted;

	const byDay = new Map<string, DigestEvent[]>();
	for (const event of sorted) {
		const key = lisbonDayKey(event.start_time);
		const bucket = byDay.get(key);
		if (bucket) bucket.push(event);
		else byDay.set(key, [event]);
	}

	const days = [...byDay.values()];
	const picked: DigestEvent[] = [];
	for (let round = 0; picked.length < cap; round++) {
		let tookAny = false;
		for (const day of days) {
			if (picked.length >= cap) break;
			if (round < day.length) {
				picked.push(day[round]);
				tookAny = true;
			}
		}
		if (!tookAny) break;
	}

	return picked.sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/**
 * Build one digest per eligible subscriber. A subscriber is skipped when:
 *   - they're not in `eligibleEmails` (no Resend contact, or unsubscribed there), or
 *   - none of their categories has an event this week (never send an empty email).
 * Events are deduplicated by construction: each event appears once even if it
 * matches several of the reader's categories.
 */
export function buildEventDigests({
	subscribers,
	events,
	eligibleEmails,
	cap = MAX_EVENTS_PER_EMAIL,
}: {
	subscribers: DigestSubscriber[];
	events: DigestEvent[];
	eligibleEmails: Set<string>;
	cap?: number;
}): EventDigest[] {
	const digests: EventDigest[] = [];

	for (const subscriber of subscribers) {
		if (!eligibleEmails.has(subscriber.email)) continue;
		const wanted = new Set(subscriber.categories);
		if (wanted.size === 0) continue;

		const matching = events.filter((event) => event.categorySlugs.some((slug) => wanted.has(slug)));
		if (matching.length === 0) continue;

		const matched = new Set(matching.flatMap((event) => event.categorySlugs.filter((slug) => wanted.has(slug))));
		const matchedCategories = CATEGORY_ORDER.filter((slug) => matched.has(slug)) as EventCategorySlug[];

		digests.push({
			email: subscriber.email,
			preferenceToken: subscriber.preference_token,
			matchedCategories,
			events: spreadAcrossDays(matching, matching.length - cap >= MIN_HIDDEN_TO_CAP ? cap : matching.length),
			totalCount: matching.length,
		});
	}

	return digests;
}

export function categoryName(slug: string): string {
	return EVENT_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

/** "AI" · "AI and Design" · "AI, Design and Product Management" · "AI, Design and 3 more" */
export function formatCategoryList(slugs: readonly string[]): string {
	const names = slugs.map(categoryName);
	if (names.length <= 1) return names[0] ?? "";
	if (names.length <= 3) return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
	return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
}

export function buildEventsWeeklySubject(digest: Pick<EventDigest, "totalCount" | "matchedCategories">): string {
	const noun = digest.totalCount === 1 ? "event" : "events";
	return `${digest.totalCount} ${noun} this week in ${formatCategoryList(digest.matchedCategories)}`;
}
