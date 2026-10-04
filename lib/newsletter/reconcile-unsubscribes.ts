import "server-only";

import { normalizeEmail } from "@/lib/newsletter/subscriptions";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { Resend } from "resend";

/**
 * Resend → Supabase unsubscribe reconciliation.
 *
 * Supabase (`newsletter_subscriptions`) is the source of truth for what a
 * reader wants, but a reader can also unsubscribe from the Resend side: the
 * Weekly broadcast carries `{{{RESEND_UNSUBSCRIBE_URL}}}`, and clicking it sets
 * `unsubscribed: true` on the Resend contact. Nothing tells Supabase. Broadcasts
 * still respect that flag, but our per-recipient sends (lib/newsletter/
 * events-weekly.ts) read recipients from Supabase and go out via the batch API,
 * which does NOT check it — so without this step they'd email people who opted
 * out.
 *
 * Contacts are account-wide in Resend (segments are just memberships), so one
 * paginated `contacts.list` without a segment sees every contact.
 */

/**
 * Every Resend contact, split by its `unsubscribed` flag. Emails normalized.
 * `subscribed` doubles as the send-time allowlist: a Supabase subscriber with
 * no Resend contact gets no broadcasts today, so the personalised send
 * shouldn't suddenly start emailing them either.
 */
export async function listResendContacts(
	resend: Resend,
): Promise<{ subscribed: Set<string>; unsubscribed: Set<string> }> {
	const subscribed = new Set<string>();
	const unsubscribed = new Set<string>();
	let after: string | undefined;

	for (;;) {
		const { data, error } = await resend.contacts.list({ limit: 100, ...(after ? { after } : {}) });
		if (error) {
			throw new Error(`Failed to list Resend contacts: ${error.message}`);
		}
		const page = data?.data ?? [];
		for (const contact of page) {
			(contact.unsubscribed ? unsubscribed : subscribed).add(normalizeEmail(contact.email));
		}
		if (!data?.has_more || page.length === 0) break;
		after = page[page.length - 1].id;
	}

	return { subscribed, unsubscribed };
}

/**
 * Mirror Resend unsubscribes into Supabase. Uses the same "unsubscribe all"
 * shape the preferences page writes (empty categories, digest off,
 * unsubscribed_at stamped), and only touches rows Supabase still considers
 * active, so it's idempotent and safe to run on every send.
 *
 * Takes the `unsubscribed` set from listResendContacts so callers that also
 * need the allowlist only page through Resend once. Returns the emails changed.
 */
export async function reconcileResendUnsubscribes(unsubscribedInResend: Set<string>): Promise<{ updated: string[] }> {
	if (unsubscribedInResend.size === 0) return { updated: [] };

	const client = createServiceRoleClient();
	const { data, error } = await client
		.from("newsletter_subscriptions")
		.update({ categories: [], digest_subscribed: false, unsubscribed_at: new Date().toISOString() })
		.in("email", [...unsubscribedInResend])
		.is("unsubscribed_at", null)
		.select("email");

	if (error) {
		throw new Error(`Failed to reconcile unsubscribes: ${error.message}`);
	}

	return { updated: (data ?? []).map((row) => row.email as string) };
}
