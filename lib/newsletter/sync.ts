import "server-only";

import { EVENT_CATEGORIES, type EventCategorySlug } from "@/lib/events/categories";
import { getAllSubscribersSegmentId, getDigestSegmentId } from "@/lib/newsletter/segments";
import { getCategoryTopicEnvName, getCategoryTopicId } from "@/lib/newsletter/topics";
import type { Resend } from "resend";

interface SyncInput {
	resend: Resend;
	email: string;
	previous: {
		categories: EventCategorySlug[];
		digestSubscribed: boolean;
	};
	next: {
		categories: EventCategorySlug[];
		digestSubscribed: boolean;
	};
}

interface SyncResult {
	/** Segment names the contact was added to in this call. */
	addedToSegments: string[];
	/** Segment names the contact was removed from in this call. */
	removedFromSegments: string[];
	/** Number of per-category topics whose subscription was reasserted. */
	topicsUpdated: number;
	/** Per-piece failures (missing env var, Resend error) so callers can log. */
	skipped: Array<{ what: string; reason: string }>;
}

/**
 * Reconcile Resend membership against the new preference state.
 *
 * Three things happen:
 *   1. Ensure the contact is in the All Subscribers segment (idempotent).
 *      This is the base segment every per-category broadcast targets, so
 *      missing this entry means our broadcasts wouldn't reach the contact.
 *   2. Add/remove the contact from the digest segment if `digestSubscribed`
 *      changed.
 *   3. Re-assert the contact's subscription for every per-category Topic.
 *      We send the FULL desired topic state in one bulk `contacts.topics.update`
 *      call — Resend's topics API is a write-the-truth update, not a diff,
 *      and the per-category set is small (5 topics) so always-writing-all is
 *      cheaper than diffing.
 *
 * Missing env vars and per-call Resend errors are caught and reported via
 * `skipped` rather than thrown — a Resend hiccup shouldn't poison the
 * subscription, which is already saved in Supabase.
 */
export async function syncResendPreferences({ resend, email, previous, next }: SyncInput): Promise<SyncResult> {
	const result: SyncResult = {
		addedToSegments: [],
		removedFromSegments: [],
		topicsUpdated: 0,
		skipped: [],
	};

	// 1. Ensure contact is in the All Subscribers base segment. Resend treats
	// adding an already-present contact as a benign error ("already in segment")
	// so we swallow that case but surface anything else.
	const allSegmentId = getAllSubscribersSegmentId();
	if (!allSegmentId) {
		result.skipped.push({ what: "all-subscribers", reason: "RESEND_SEGMENT_ALL_SUBSCRIBERS not set" });
		console.warn("[newsletter:sync] Skipped All Subscribers: RESEND_SEGMENT_ALL_SUBSCRIBERS is not set");
	} else {
		try {
			await resend.contacts.segments.add({ email, segmentId: allSegmentId });
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			if (!msg.toLowerCase().includes("already")) {
				console.error("[newsletter:sync] All Subscribers add failed:", error);
				result.skipped.push({ what: "all-subscribers", reason: msg });
			}
		}
	}

	// 2. Digest segment membership (only touch on change).
	if (previous.digestSubscribed !== next.digestSubscribed) {
		const digestSegmentId = getDigestSegmentId();
		if (!digestSegmentId) {
			result.skipped.push({ what: "digest-segment", reason: "RESEND_SEGMENT_ID not set" });
		} else {
			try {
				if (next.digestSubscribed) {
					await resend.contacts.segments.add({ email, segmentId: digestSegmentId });
					result.addedToSegments.push("digest");
				} else {
					await resend.contacts.segments.remove({ email, segmentId: digestSegmentId });
					result.removedFromSegments.push("digest");
				}
			} catch (error) {
				console.error("[newsletter:sync] Digest segment update failed:", error);
				result.skipped.push({
					what: "digest-segment",
					reason: error instanceof Error ? error.message : "unknown error",
				});
			}
		}
	}

	// 3. Bulk topic subscription update for every configured category.
	const nextCategorySet = new Set(next.categories);
	const topicUpdates: Array<{ id: string; subscription: "opt_in" | "opt_out" }> = [];
	for (const category of EVENT_CATEGORIES) {
		const topicId = getCategoryTopicId(category.slug);
		if (!topicId) {
			result.skipped.push({
				what: category.slug,
				reason: `${getCategoryTopicEnvName(category.slug)} not set`,
			});
			console.warn(`[newsletter:sync] Skipped topic ${category.slug}: ${getCategoryTopicEnvName(category.slug)} not set`);
			continue;
		}
		topicUpdates.push({
			id: topicId,
			subscription: nextCategorySet.has(category.slug) ? "opt_in" : "opt_out",
		});
	}

	if (topicUpdates.length > 0) {
		try {
			await resend.contacts.topics.update({ email, topics: topicUpdates });
			result.topicsUpdated = topicUpdates.length;
		} catch (error) {
			console.error("[newsletter:sync] Topic bulk update failed:", error);
			result.skipped.push({
				what: "topics-update",
				reason: error instanceof Error ? error.message : "unknown error",
			});
		}
	}

	return result;
}
