/**
 * Secured entry point for the Cloudflare cron worker (workers/newsletter-cron).
 * The worker hits this on a schedule with a shared secret; this route then
 * triggers the existing /api/sendNewsletter broadcast.
 *
 * TWO independent safety gates stand between a cron tick and a real send:
 *   1. NEWSLETTER_CRON_SECRET must match (set on both the worker and here).
 *   2. NEWSLETTER_CRON_ENABLED must be the string "true" — otherwise EVERY
 *      call is a dry run that only reports what it WOULD send. Flip it to
 *      "true" once you're ready for automated sends to actually go out.
 *
 * Scope: cron automates the PER-CATEGORY EVENTS newsletters (no editorial post
 * to choose). The weekly digest needs a human to pick the post, so it stays
 * manual — calling this with no category is allowed but discouraged (see the
 * worker README).
 */

import { isEventCategorySlug } from "@/lib/events/categories";
import { verifyInternalSecret } from "@/lib/newsletter/internal-auth";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	// Gate 1: the worker must present NEWSLETTER_CRON_SECRET.
	const auth = verifyInternalSecret(request, process.env.NEWSLETTER_CRON_SECRET, "NEWSLETTER_CRON_SECRET");
	if (!auth.ok) {
		return NextResponse.json({ error: auth.error }, { status: auth.status });
	}

	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const categoryInput = typeof body.category === "string" ? body.category : null;

	// Per-category ONLY. The weekly Adamastor digest is sent manually by Carlos
	// (it needs editorial post selection), so the cron must never trigger it —
	// a request with no category is rejected outright.
	if (!categoryInput) {
		return NextResponse.json(
			{ error: "This endpoint only sends per-category event newsletters. The weekly digest is sent manually." },
			{ status: 400 },
		);
	}
	if (!isEventCategorySlug(categoryInput)) {
		return NextResponse.json({ error: `Unknown category: ${categoryInput}` }, { status: 400 });
	}

	const enabled = process.env.NEWSLETTER_CRON_ENABLED === "true";
	const dryRun = body.dryRun === true || !enabled;

	const sendBody = { category: categoryInput, broadcast: true, confirmBroadcast: true };

	if (dryRun) {
		return NextResponse.json({
			dryRun: true,
			enabled,
			category: categoryInput,
			wouldSend: sendBody,
			note: enabled
				? "dryRun requested — nothing was sent."
				: "NEWSLETTER_CRON_ENABLED is not 'true' — nothing was sent. Set it to go live.",
		});
	}

	// Real send: delegate to the existing broadcast pipeline so send logic stays
	// in one place. Server-to-server call within the same deployment, carrying
	// the send engine's own secret (NEWSLETTER_SEND_SECRET) — distinct from the
	// cron secret that got us into THIS route.
	const sendSecret = process.env.NEWSLETTER_SEND_SECRET;
	if (!sendSecret) {
		return NextResponse.json(
			{ error: "NEWSLETTER_SEND_SECRET is not configured — cannot delegate to the send engine." },
			{ status: 500 },
		);
	}
	const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
	try {
		const res = await fetch(new URL("/api/sendNewsletter", origin).toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${sendSecret}`,
			},
			body: JSON.stringify(sendBody),
		});
		const result = await res.json().catch(() => ({}));
		return NextResponse.json({ triggered: true, category: categoryInput, status: res.status, result }, { status: res.status });
	} catch (error) {
		console.error("[cron/send-newsletter] delegate call failed", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to trigger newsletter send" },
			{ status: 502 },
		);
	}
}
