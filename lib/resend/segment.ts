import type { Resend } from "resend";

export const DEFAULT_NEWSLETTER_SEGMENT_ID = "22162b04-057b-479c-a5a6-a052e99adc27";

export function getNewsletterSegmentId() {
	return (
		process.env.RESEND_SEGMENT_ID?.trim() || process.env.RESEND_AUDIENCE_ID?.trim() || DEFAULT_NEWSLETTER_SEGMENT_ID
	);
}

export async function ensureContactInSegment(resend: Resend, email: string, segmentId: string) {
	const { error } = await resend.contacts.segments.add({
		email,
		segmentId,
	});

	if (error && !error.message?.toLowerCase().includes("already")) {
		throw new Error(error.message);
	}
}
