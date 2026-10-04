/**
 * Adamastor newsletter cron worker.
 *
 * On its cron schedule (see wrangler.toml), this calls the app's secured
 * /api/cron/send-newsletter endpoint, passing the shared secret.
 *
 * NEWSLETTER_PRODUCT picks what it sends:
 *   "events-weekly" (default) → ONE call; the app sends each reader a single
 *                               email covering every category they follow.
 *   "per-category"            → legacy: one call (= one broadcast) per slug in
 *                               NEWSLETTER_CATEGORIES. A reader on five categories
 *                               got five emails. Kept only as a rollback switch. The endpoint owns all the actual send logic and safety gates;
 * this worker is just the scheduler + authenticated caller.
 *
 * Nothing is sent until BOTH:
 *   - NEWSLETTER_CRON_SECRET is set here (`wrangler secret put …`) and matches
 *     the app, AND
 *   - NEWSLETTER_CRON_ENABLED === "true" on the app (otherwise the endpoint
 *     dry-runs every call).
 *
 * Deploy / test instructions live in ./README.md.
 */

export interface Env {
	APP_URL: string;
	NEWSLETTER_PRODUCT?: string;
	NEWSLETTER_CATEGORIES: string;
	NEWSLETTER_CRON_SECRET: string;
}

// Per-category ONLY. The weekly Adamastor digest is sent manually by Carlos —
// the cron must never trigger it — so an empty NEWSLETTER_CATEGORIES means
// "nothing to send", not "send the digest".
function parseCategories(raw: string | undefined): string[] {
	return (raw ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

type SendBody = { product: "events-weekly" } | { category: string };

/** The request bodies this run should POST, one per send. */
function plannedSends(env: Env): SendBody[] {
	if ((env.NEWSLETTER_PRODUCT ?? "events-weekly") === "events-weekly") {
		return [{ product: "events-weekly" }];
	}
	return parseCategories(env.NEWSLETTER_CATEGORIES).map((category) => ({ category }));
}

async function triggerSend(env: Env, sendBody: SendBody): Promise<void> {
	const label = "product" in sendBody ? sendBody.product : sendBody.category;
	const endpoint = new URL("/api/cron/send-newsletter", env.APP_URL).toString();
	try {
		const res = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${env.NEWSLETTER_CRON_SECRET}`,
			},
			body: JSON.stringify(sendBody),
		});
		const text = await res.text();
		console.log(`[newsletter-cron] ${label} → ${res.status} ${text}`);
	} catch (error) {
		console.error(`[newsletter-cron] ${label} failed`, error);
	}
}

export default {
	// Scheduled (cron) entry point.
	async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		const sends = plannedSends(env);
		if (sends.length === 0) {
			console.warn("[newsletter-cron] NEWSLETTER_CATEGORIES is empty — nothing to send (digest is manual).");
			return;
		}
		for (const sendBody of sends) {
			ctx.waitUntil(triggerSend(env, sendBody));
		}
	},

	// Manual trigger for testing (`wrangler dev`, then GET the local URL).
	// Requires ?key=<NEWSLETTER_CRON_SECRET> so a deployed worker's fetch
	// handler can't be poked anonymously. Defaults to a dry run unless the
	// app has NEWSLETTER_CRON_ENABLED=true.
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		if (url.searchParams.get("key") !== env.NEWSLETTER_CRON_SECRET) {
			return new Response("Unauthorized", { status: 401 });
		}
		const sends = plannedSends(env);
		if (sends.length === 0) {
			return new Response("No categories configured — nothing to send (digest is manual).\n", { status: 200 });
		}
		for (const sendBody of sends) {
			ctx.waitUntil(triggerSend(env, sendBody));
		}
		const labels = sends.map((b) => ("product" in b ? b.product : b.category));
		return new Response(`Triggered: ${labels.join(", ")}\n`, { status: 202 });
	},
};
