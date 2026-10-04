import "server-only";

import { NewsletterTemplate } from "@/components/email/newsletter-template";
import {
	type DigestEvent,
	type EventDigest,
	buildEventDigests,
	buildEventsWeeklySubject,
	categoryName,
} from "@/lib/newsletter/events-weekly";
import { buildOneClickUnsubscribeUrl, buildPreferencesUrl } from "@/lib/newsletter/preferences-url";
import { listResendContacts, reconcileResendUnsubscribes } from "@/lib/newsletter/reconcile-unsubscribes";
import { capturePostHogEvent } from "@/lib/posthog-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { render } from "@react-email/components";
import type { Resend } from "resend";

/**
 * The personalised weekly events send. Replaces the five per-category
 * broadcasts with one email per reader (see lib/newsletter/events-weekly.ts
 * for the why).
 *
 * Broadcasts render one HTML for everyone; personalising them meant one
 * broadcast per audience slice, and overlapping slices meant duplicate emails.
 * Here we render per recipient and send through the batch API instead. What
 * we give up, and take back on ourselves:
 *   - Resend's unsubscribe merge tag → our tokenised link + List-Unsubscribe headers.
 *   - Resend's contact `unsubscribed` check → listResendContacts allowlist + reconcile.
 *   - Broadcast billing → batch emails count toward the transactional quota.
 *
 * Modes:
 *   dry-run → compute who would get what. No writes, no sends.
 *   test    → send ONE real reader's digest to `testEmail`. No writes.
 *   live    → reconcile Resend unsubscribes into Supabase, then send to everyone.
 */

/** One week, matching the send cadence (same window the per-category broadcasts used). */
export const EVENTS_WINDOW_DAYS = 7;
/** Resend's batch endpoint takes at most 100 emails per call. */
const BATCH_SIZE = 100;
/** Resend's default rate limit is a few requests per second; stay well under it. */
const BATCH_PAUSE_MS = 600;

const FROM = "Adamastor <hi@digest.adamastor.blog>";
const REPLY_TO = "carlos@adamastor.blog";

export type EventsWeeklyMode =
	| { kind: "dry-run" }
	| { kind: "test"; testEmail: string; previewAs?: string }
	| { kind: "live" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const mask = (email: string) => email.replace(/^(.).*(@.*)$/, "$1***$2");

async function loadWeek(): Promise<{
	subscribers: { email: string; categories: string[]; preference_token: string }[];
	events: DigestEvent[];
}> {
	const client = createServiceRoleClient();

	const { data: subscribers, error: subscribersError } = await client
		.from("newsletter_subscriptions")
		.select("email, categories, preference_token")
		.is("unsubscribed_at", null);
	if (subscribersError) throw new Error(`Failed to load subscribers: ${subscribersError.message}`);

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const until = new Date(today);
	until.setDate(until.getDate() + EVENTS_WINDOW_DAYS);

	const { data: rows, error: eventsError } = await client
		.from("events")
		.select("id, title, description, start_time, city, url, banner_url, event_category_assignments(category_slug)")
		.eq("status", "approved")
		.gte("start_time", today.toISOString())
		.lte("start_time", until.toISOString())
		.order("start_time", { ascending: true });
	if (eventsError) throw new Error(`Failed to load events: ${eventsError.message}`);

	const events: DigestEvent[] = (rows ?? []).map((e) => ({
		id: String(e.id),
		title: e.title,
		description: e.description,
		start_time: e.start_time,
		city: e.city,
		url: e.url,
		banner_url: e.banner_url ?? undefined,
		categorySlugs: ((e.event_category_assignments ?? []) as { category_slug: string }[]).map((a) => a.category_slug),
	}));

	return { subscribers: subscribers ?? [], events };
}

async function renderDigest(digest: EventDigest): Promise<{ subject: string; html: string }> {
	const html = await render(
		NewsletterTemplate({
			events: digest.events,
			personal: {
				categoryNames: digest.matchedCategories.map(categoryName),
				moreCount: digest.totalCount - digest.events.length,
			},
			preferencesUrl: buildPreferencesUrl(digest.preferenceToken),
			unsubscribeUrl: buildPreferencesUrl(digest.preferenceToken),
		}),
	);
	return { subject: buildEventsWeeklySubject(digest), html };
}

export async function sendEventsWeekly(resend: Resend, mode: EventsWeeklyMode) {
	const contacts = await listResendContacts(resend);

	// Only a live send writes. Dry-run and test still exclude Resend
	// unsubscribes, because eligibility is the `subscribed` allowlist.
	const reconciled = mode.kind === "live" ? await reconcileResendUnsubscribes(contacts.unsubscribed) : { updated: [] };

	const { subscribers, events } = await loadWeek();
	const digests = buildEventDigests({ subscribers, events, eligibleEmails: contacts.subscribed });

	// What the old per-category broadcasts would have sent the same readers:
	// one email per matched category. Logged so the reduction stays visible.
	const legacyEmailCount = digests.reduce((sum, d) => sum + d.matchedCategories.length, 0);
	const summary = {
		eventsInWindow: events.length,
		eligibleSubscribers: subscribers.filter((s) => s.categories.length > 0 && contacts.subscribed.has(s.email)).length,
		emails: digests.length,
		legacyEmailCount,
		reconciledUnsubscribes: reconciled.updated.length,
	};

	if (mode.kind === "dry-run") {
		return {
			mode: "dry-run" as const,
			...summary,
			recipients: digests.map((d) => ({
				email: mask(d.email),
				subject: buildEventsWeeklySubject(d),
				shown: d.events.length,
				total: d.totalCount,
			})),
		};
	}

	if (mode.kind === "test") {
		// Preview a real reader's email; default to the broadest one, which
		// exercises the cap and the longest category list.
		const digest =
			digests.find((d) => d.email === mode.previewAs?.trim().toLowerCase()) ??
			[...digests].sort((a, b) => b.totalCount - a.totalCount)[0];
		if (!digest) return { mode: "test" as const, ...summary, sent: false, reason: "no_recipients" };

		const { subject, html } = await renderDigest(digest);
		const { data, error } = await resend.emails.send({
			from: FROM,
			to: [mode.testEmail],
			replyTo: REPLY_TO,
			subject: `[TEST] ${subject}`,
			html,
		});
		if (error) throw new Error(`Test send failed: ${error.message}`);
		return { mode: "test" as const, ...summary, sent: true, previewOf: mask(digest.email), emailId: data?.id };
	}

	// Live.
	if (digests.length === 0) {
		return { mode: "live" as const, ...summary, sent: 0, skipped: true, reason: "no_recipients" };
	}

	// Idempotency keys are scoped to the send day, so a retried cron tick or a
	// double-click can't email anyone twice (Resend keeps keys for 24h).
	const dayKey = new Date().toISOString().slice(0, 10);
	let sent = 0;
	const failures: { chunk: number; error: string }[] = [];

	for (let start = 0, chunk = 0; start < digests.length; start += BATCH_SIZE, chunk++) {
		const slice = digests.slice(start, start + BATCH_SIZE);
		const payload = await Promise.all(
			slice.map(async (digest) => {
				const { subject, html } = await renderDigest(digest);
				return {
					from: FROM,
					to: [digest.email],
					replyTo: REPLY_TO,
					subject,
					html,
					headers: {
						"List-Unsubscribe": `<${buildOneClickUnsubscribeUrl(digest.preferenceToken)}>`,
						"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
					},
					tags: [{ name: "product", value: "events_weekly" }],
				};
			}),
		);

		const { data, error } = await resend.batch.send(payload, { idempotencyKey: `events-weekly/${dayKey}/${chunk}` });
		if (error) {
			console.error(`[events-weekly] chunk ${chunk} failed`, error);
			failures.push({ chunk, error: error.message });
		} else {
			sent += data?.data.length ?? 0;
		}

		if (start + BATCH_SIZE < digests.length) await sleep(BATCH_PAUSE_MS);
	}

	await capturePostHogEvent({
		event: "newsletter_broadcast_sent",
		distinctId: "newsletter-system",
		properties: {
			product: "events_weekly",
			category: null,
			event_count: events.length,
			emails_sent: sent,
			legacy_email_count: legacyEmailCount,
			failed_chunks: failures.length,
		},
	});

	return { mode: "live" as const, ...summary, sent, failures };
}
