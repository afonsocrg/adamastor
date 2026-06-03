import type { Contact, Resend } from "resend";

const CONTACTS_PAGE_SIZE = 100;

type ListContactsOptions = {
	segmentId?: string;
};

export async function listAllContacts(resend: Resend, { segmentId }: ListContactsOptions = {}) {
	const contacts: Contact[] = [];
	let after: string | undefined;
	let hasMore = true;

	while (hasMore) {
		const { data, error } = await resend.contacts.list({
			limit: CONTACTS_PAGE_SIZE,
			...(after ? { after } : {}),
			...(segmentId ? { segmentId } : {}),
		});

		if (error) {
			throw new Error(error.message);
		}

		const page = data?.data ?? [];
		contacts.push(...page);
		hasMore = Boolean(data?.has_more);

		if (!hasMore) {
			break;
		}

		const lastContact = page[page.length - 1];
		if (!lastContact) {
			throw new Error("Resend returned an empty page with more contacts available");
		}

		after = lastContact.id;
	}

	return contacts;
}

export function countActiveSubscribers(contacts: Contact[]) {
	return contacts.filter((contact) => !contact.unsubscribed).length;
}

/**
 * Total active subscribers across several segments, deduped by email — the
 * genuine "how many people do we have" number. Pass the All Subscribers segment
 * (the universe every contact is added to) plus the legacy digest segment so
 * legacy-only contacts still count; a person in both segments is counted once.
 *
 * Mirrors the dashboard's headline total (see app/api/emailSubscribers/route.ts)
 * so the team-notification count never diverges from what the dashboard reports.
 * Null/undefined segment IDs (unset env vars) are skipped.
 */
export async function countTotalActiveSubscribers(
	resend: Resend,
	{ segmentIds }: { segmentIds: Array<string | null | undefined> },
) {
	const ids = segmentIds.filter((id): id is string => Boolean(id));
	const lists = await Promise.all(ids.map((segmentId) => listAllContacts(resend, { segmentId })));

	const byEmail = new Map<string, Contact>();
	for (const contact of lists.flat()) {
		byEmail.set(contact.email.toLowerCase(), contact);
	}

	return countActiveSubscribers([...byEmail.values()]);
}
