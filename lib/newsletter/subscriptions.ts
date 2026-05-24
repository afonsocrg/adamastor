import "server-only";

import { type EventCategorySlug, sanitizeEventCategorySlugs } from "@/lib/events/categories";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Shape of a row in public.newsletter_subscriptions.
 */
export interface NewsletterSubscription {
	email: string;
	first_name: string | null;
	categories: EventCategorySlug[];
	digest_subscribed: boolean;
	preference_token: string;
	created_at: string;
	updated_at: string;
	unsubscribed_at: string | null;
}

/**
 * Lowercase + trim. Email is the primary key, so we MUST normalize before
 * every read/write or "Foo@bar.com" and "foo@bar.com" become two rows.
 */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export async function getSubscriptionByEmail(email: string): Promise<NewsletterSubscription | null> {
	const client = createServiceRoleClient();
	const { data, error } = await client
		.from("newsletter_subscriptions")
		.select("*")
		.eq("email", normalizeEmail(email))
		.maybeSingle();

	if (error) {
		throw new Error(`Failed to load subscription: ${error.message}`);
	}

	return data as NewsletterSubscription | null;
}

export async function getSubscriptionByToken(token: string): Promise<NewsletterSubscription | null> {
	const client = createServiceRoleClient();
	const { data, error } = await client
		.from("newsletter_subscriptions")
		.select("*")
		.eq("preference_token", token)
		.maybeSingle();

	if (error) {
		throw new Error(`Failed to load subscription: ${error.message}`);
	}

	return data as NewsletterSubscription | null;
}

interface UpsertSubscriptionInput {
	email: string;
	/**
	 * Optional first name. Only written on insert or when the existing row
	 * has no first_name yet — we never overwrite a name the user already
	 * provided with a later empty value.
	 */
	firstName?: string | null;
	addCategories?: EventCategorySlug[];
	setCategories?: EventCategorySlug[];
	digestSubscribed?: boolean;
}

/**
 * Insert-or-update a subscription. Use `addCategories` to merge into an
 * existing row (per-category subscribe form: "add design to whatever they
 * already have"); use `setCategories` to replace the array wholesale
 * (preferences page: "this is the new full set").
 */
export async function upsertSubscription(input: UpsertSubscriptionInput): Promise<{
	subscription: NewsletterSubscription;
	previousCategories: EventCategorySlug[];
	previousDigestSubscribed: boolean;
	created: boolean;
}> {
	const email = normalizeEmail(input.email);
	const client = createServiceRoleClient();

	const existing = await getSubscriptionByEmail(email);

	const nextCategories = input.setCategories
		? sanitizeEventCategorySlugs(input.setCategories)
		: input.addCategories
			? sanitizeEventCategorySlugs([...(existing?.categories ?? []), ...input.addCategories])
			: (existing?.categories ?? []);

	const nextDigest = input.digestSubscribed ?? existing?.digest_subscribed ?? false;

	// If the user is opting back in to anything, clear the unsubscribe flag.
	const hasAnySubscription = nextCategories.length > 0 || nextDigest;
	const nextUnsubscribedAt = hasAnySubscription ? null : (existing?.unsubscribed_at ?? null);

	// Only set first_name when we have a non-empty value AND the existing row
	// doesn't already have one. Prevents a later anonymous subscribe (category
	// form, which doesn't collect a name) from blanking out a name the user
	// gave us through an earlier form.
	const trimmedFirstName = input.firstName?.trim() || null;
	const nextFirstName = existing?.first_name ?? trimmedFirstName;

	const { data, error } = await client
		.from("newsletter_subscriptions")
		.upsert(
			{
				email,
				first_name: nextFirstName,
				categories: nextCategories,
				digest_subscribed: nextDigest,
				unsubscribed_at: nextUnsubscribedAt,
			},
			{ onConflict: "email" },
		)
		.select("*")
		.single();

	if (error) {
		throw new Error(`Failed to upsert subscription: ${error.message}`);
	}

	return {
		subscription: data as NewsletterSubscription,
		previousCategories: (existing?.categories ?? []) as EventCategorySlug[],
		previousDigestSubscribed: existing?.digest_subscribed ?? false,
		created: !existing,
	};
}

/**
 * Replace the preferences on a row, returning what changed for downstream
 * Resend sync. If `unsubscribeAll` is true (every input flag off), records
 * unsubscribed_at so analytics can distinguish "never picked anything" from
 * "deliberately unsubscribed".
 */
export async function updatePreferencesByToken(input: {
	token: string;
	categories: EventCategorySlug[];
	digestSubscribed: boolean;
}): Promise<{
	subscription: NewsletterSubscription;
	previousCategories: EventCategorySlug[];
	previousDigestSubscribed: boolean;
} | null> {
	const existing = await getSubscriptionByToken(input.token);
	if (!existing) return null;

	const nextCategories = sanitizeEventCategorySlugs(input.categories);
	const hasAnySubscription = nextCategories.length > 0 || input.digestSubscribed;

	const client = createServiceRoleClient();
	const { data, error } = await client
		.from("newsletter_subscriptions")
		.update({
			categories: nextCategories,
			digest_subscribed: input.digestSubscribed,
			unsubscribed_at: hasAnySubscription ? null : new Date().toISOString(),
		})
		.eq("preference_token", input.token)
		.select("*")
		.single();

	if (error) {
		throw new Error(`Failed to update preferences: ${error.message}`);
	}

	return {
		subscription: data as NewsletterSubscription,
		previousCategories: existing.categories as EventCategorySlug[],
		previousDigestSubscribed: existing.digest_subscribed,
	};
}
