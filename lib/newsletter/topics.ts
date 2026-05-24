import { EVENT_CATEGORIES, type EventCategorySlug } from "@/lib/events/categories";

/**
 * Resend Topic IDs for the five per-category event newsletters. Topics are
 * Resend's opt-in/opt-out preference primitive — created once in the Resend
 * dashboard with `defaultSubscription: 'opt_out'` so contacts only receive
 * a category newsletter when they explicitly subscribe.
 *
 * Broadcasts target a base segment (the All Subscribers segment — see
 * lib/newsletter/segments.ts) plus a `topicId` to filter to opted-in
 * recipients. The sync layer (lib/newsletter/sync.ts) writes per-category
 * preferences via `contacts.topics.update`.
 *
 * A missing env var is treated as "this category isn't wired up yet" — the
 * sync layer logs a warning and skips, so local dev works without all five
 * being configured.
 */
const CATEGORY_TOPIC_ENV: Record<EventCategorySlug, string> = {
	ai: "RESEND_TOPIC_AI",
	"software-engineering": "RESEND_TOPIC_SOFTWARE_ENGINEERING",
	design: "RESEND_TOPIC_DESIGN",
	product: "RESEND_TOPIC_PRODUCT",
	"startups-fundraising": "RESEND_TOPIC_STARTUPS_FUNDRAISING",
};

export function getCategoryTopicId(slug: EventCategorySlug): string | null {
	return process.env[CATEGORY_TOPIC_ENV[slug]]?.trim() || null;
}

export function getCategoryTopicEnvName(slug: EventCategorySlug): string {
	return CATEGORY_TOPIC_ENV[slug];
}

export function getConfiguredCategoryTopics(): Array<{ slug: EventCategorySlug; topicId: string }> {
	return EVENT_CATEGORIES.flatMap((category) => {
		const topicId = getCategoryTopicId(category.slug);
		return topicId ? [{ slug: category.slug, topicId }] : [];
	});
}
