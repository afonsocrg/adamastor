import type { Contact, Resend } from "resend";

const CONTACTS_PAGE_SIZE = 100;
const RESEND_API_BASE_URL = "https://api.resend.com";

type ListContactsOptions = {
	audienceId?: string;
};

export async function listAllContacts(resend: Resend, { audienceId }: ListContactsOptions = {}) {
	if (audienceId) {
		return listAudienceContacts(audienceId);
	}

	const contacts: Contact[] = [];
	let after: string | undefined;
	let hasMore = true;

	while (hasMore) {
		const { data, error } = await resend.contacts.list({
			limit: CONTACTS_PAGE_SIZE,
			...(after ? { after } : {}),
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

async function listAudienceContacts(audienceId: string) {
	const apiKey = process.env.RESEND_API_KEY;

	if (!apiKey) {
		throw new Error("RESEND_API_KEY is not configured");
	}

	const contacts: Contact[] = [];
	let after: string | undefined;
	let hasMore = true;

	while (hasMore) {
		const searchParams = new URLSearchParams({
			limit: String(CONTACTS_PAGE_SIZE),
		});

		if (after) {
			searchParams.set("after", after);
		}

		const response = await fetch(
			`${RESEND_API_BASE_URL}/audiences/${audienceId}/contacts?${searchParams.toString()}`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to list Resend audience contacts: ${errorText}`);
		}

		const data = (await response.json()) as {
			data?: Contact[];
			has_more?: boolean;
		};
		const page = data.data ?? [];
		contacts.push(...page);
		hasMore = Boolean(data.has_more);

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
