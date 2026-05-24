import { EVENT_CATEGORIES, type EventCategorySlug } from "@/lib/events/categories";
import { ForbiddenError, handleError } from "@/lib/errors";
import { getAllSubscribersSegmentId, getDigestSegmentId } from "@/lib/newsletter/segments";
import { getCategoryTopicEnvName, getCategoryTopicId } from "@/lib/newsletter/topics";
import { listAllContacts } from "@/lib/resend/contacts";
import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { Contact } from "resend";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EnrichedContact {
	id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	created_at: string;
	unsubscribed: boolean;
	/** Per-category opt-ins from Supabase. Empty array if no Supabase row yet (legacy digest contacts). */
	categories: EventCategorySlug[];
	/** True if subscribed to the weekly editorial digest. */
	digest_subscribed: boolean;
	/** True when the contact has no row in `newsletter_subscriptions` — they predate the per-category system. */
	legacy_only: boolean;
}

export interface NewsletterConfigStatus {
	allSubscribersSegment: { configured: boolean; envName: string };
	digestSegment: { configured: boolean; envName: string };
	categoryTopics: Array<{ slug: EventCategorySlug; name: string; configured: boolean; envName: string }>;
}

export async function GET() {
	try {
		const supabase = await createClient();
		const profile = await assertAuthenticated(supabase);

		if (profile.role !== "admin") {
			throw new ForbiddenError("Admin access required");
		}

		// ============================================
		// Newsletter config status (visible diagnostics)
		// ============================================
		const config: NewsletterConfigStatus = {
			allSubscribersSegment: {
				configured: !!getAllSubscribersSegmentId(),
				envName: "RESEND_SEGMENT_ALL_SUBSCRIBERS",
			},
			digestSegment: {
				configured: !!getDigestSegmentId(),
				envName: "RESEND_SEGMENT_ID",
			},
			categoryTopics: EVENT_CATEGORIES.map((category) => ({
				slug: category.slug,
				name: category.name,
				configured: !!getCategoryTopicId(category.slug),
				envName: getCategoryTopicEnvName(category.slug),
			})),
		};

		// ============================================
		// Pull Resend contacts from both segments
		// ----------------------------------------------
		// "All Subscribers" = the universe new code adds every contact to.
		// "Adamastor Weekly" (digest) = predates this work; legacy subscribers
		// only live here. Union the two so the dashboard reflects everyone.
		// ============================================
		const allSubscribersSegmentId = getAllSubscribersSegmentId();
		const digestSegmentId = getDigestSegmentId();

		const [allSubsContacts, digestContacts] = await Promise.all([
			allSubscribersSegmentId ? listAllContacts(resend, { segmentId: allSubscribersSegmentId }) : Promise.resolve([] as Contact[]),
			digestSegmentId ? listAllContacts(resend, { segmentId: digestSegmentId }) : Promise.resolve([] as Contact[]),
		]);

		// Build the digest membership set BEFORE merging — used to infer
		// digest_subscribed for legacy contacts with no Supabase row.
		const digestEmails = new Set(digestContacts.map((c) => c.email.toLowerCase()));

		// Dedupe Resend contacts by email — prefer the All Subscribers copy
		// (richer metadata for newer contacts) but fall back to digest copy
		// when a legacy contact isn't in All Subscribers.
		const contactsByEmail = new Map<string, Contact>();
		for (const c of digestContacts) contactsByEmail.set(c.email.toLowerCase(), c);
		for (const c of allSubsContacts) contactsByEmail.set(c.email.toLowerCase(), c);

		// ============================================
		// Pull Supabase preferences rows
		// ============================================
		const sb = createServiceRoleClient();
		const { data: prefRows, error: prefError } = await sb
			.from("newsletter_subscriptions")
			.select("email,first_name,categories,digest_subscribed");

		if (prefError) {
			console.error("Subscribers page: failed to load preferences:", prefError);
		}

		const prefsByEmail = new Map<
			string,
			{ first_name: string | null; categories: EventCategorySlug[]; digest_subscribed: boolean }
		>();
		for (const row of prefRows ?? []) {
			prefsByEmail.set((row.email as string).toLowerCase(), {
				first_name: row.first_name ?? null,
				categories: (row.categories ?? []) as EventCategorySlug[],
				digest_subscribed: !!row.digest_subscribed,
			});
		}

		// ============================================
		// Merge into the enriched shape the dashboard consumes
		// ============================================
		const contacts: EnrichedContact[] = [];
		for (const [emailKey, contact] of contactsByEmail) {
			const prefs = prefsByEmail.get(emailKey);
			contacts.push({
				id: contact.id,
				email: contact.email,
				first_name: prefs?.first_name ?? contact.first_name ?? null,
				last_name: contact.last_name ?? null,
				created_at: contact.created_at,
				unsubscribed: contact.unsubscribed,
				categories: prefs?.categories ?? [],
				// If we have a Supabase row, trust it. Otherwise fall back to
				// Resend digest-segment membership so legacy contacts don't
				// appear as "subscribed to nothing".
				digest_subscribed: prefs ? prefs.digest_subscribed : digestEmails.has(emailKey),
				legacy_only: !prefs,
			});
		}

		// Sort newest first for the dashboard view.
		contacts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

		return NextResponse.json(
			{ contacts, config },
			{ headers: { "Cache-Control": "no-store" } },
		);
	} catch (error) {
		return handleError(error);
	}
}
