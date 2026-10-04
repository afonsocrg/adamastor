/**
 * Preview the personalised weekly events email against live data. Never sends
 * and never writes.
 *
 *   pnpm dlx tsx@4 --tsconfig scripts/tsconfig.json --env-file=.env.local scripts/preview-events-weekly.ts [reader@email]
 *
 * Prints the dry-run summary and writes one reader's rendered HTML (the given
 * email, or the broadest digest) to scripts/.preview/events-weekly.html.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { NewsletterTemplate } from "@/components/email/newsletter-template";
import { buildEventDigests, categoryName } from "@/lib/newsletter/events-weekly";
import { buildPreferencesUrl } from "@/lib/newsletter/preferences-url";
import { listResendContacts } from "@/lib/newsletter/reconcile-unsubscribes";
import { sendEventsWeekly } from "@/lib/newsletter/send-events-weekly";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { render } from "@react-email/components";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
	const summary = await sendEventsWeekly(resend, { kind: "dry-run" });
	console.log(JSON.stringify(summary, null, 2));

	// Re-derive one digest locally to render it (the engine doesn't return HTML).
	const contacts = await listResendContacts(resend);
	const db = createServiceRoleClient();
	const { data: subscribers } = await db
		.from("newsletter_subscriptions")
		.select("email, categories, preference_token")
		.is("unsubscribed_at", null);
	const since = new Date();
	since.setHours(0, 0, 0, 0);
	const until = new Date(since);
	until.setDate(until.getDate() + 7);
	const { data: rows } = await db
		.from("events")
		.select("id, title, description, start_time, city, url, banner_url, event_category_assignments(category_slug)")
		.eq("status", "approved")
		.gte("start_time", since.toISOString())
		.lte("start_time", until.toISOString());
	const events = (rows ?? []).map((e) => ({
		...e,
		id: String(e.id),
		banner_url: e.banner_url ?? undefined,
		categorySlugs: ((e.event_category_assignments ?? []) as { category_slug: string }[]).map((a) => a.category_slug),
	}));
	const digests = buildEventDigests({ subscribers: subscribers ?? [], events, eligibleEmails: contacts.subscribed });
	const target = process.argv[2]?.toLowerCase();
	const digest = digests.find((d) => d.email === target) ?? [...digests].sort((a, b) => b.totalCount - a.totalCount)[0];
	if (!digest) return console.log("No digests this week.");

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
	mkdirSync("scripts/.preview", { recursive: true });
	writeFileSync("scripts/.preview/events-weekly.html", html);
	console.log("Wrote scripts/.preview/events-weekly.html");
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
