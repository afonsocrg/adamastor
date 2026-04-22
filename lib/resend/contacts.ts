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
