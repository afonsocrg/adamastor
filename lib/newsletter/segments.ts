import { getNewsletterSegmentId } from "@/lib/resend/segment";

/**
 * Resend segment IDs the application targets. We use only two segments:
 *
 *   - Digest segment: the existing "Adamastor Weekly" list. Targeted by the
 *     weekly editorial broadcast.
 *   - All Subscribers segment: the base segment for per-category broadcasts.
 *     Broadcasts always require a base `segmentId`; the per-category send
 *     additionally passes `topicId` to narrow it to opted-in contacts. See
 *     lib/newsletter/topics.ts for the topic IDs.
 *
 * Keeping us at two segments means we stay under the 3-segment cap on
 * Resend's free plan, with one slot spare.
 */

export function getDigestSegmentId(): string | null {
	return getNewsletterSegmentId() || null;
}

export function getAllSubscribersSegmentId(): string | null {
	return process.env.RESEND_SEGMENT_ALL_SUBSCRIBERS?.trim() || null;
}
