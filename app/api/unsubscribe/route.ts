/**
 * One-click unsubscribe for the personalised weekly events email.
 *
 *   POST /api/unsubscribe?token=...   → RFC 8058 one-click: drop every event
 *                                       category, keep the Weekly as-is.
 *   GET  /api/unsubscribe?token=...   → redirect to the preferences page.
 *
 * Mail clients (Gmail's "Unsubscribe" button, Apple Mail) POST to the URL in
 * the `List-Unsubscribe` header with `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
 * That has to work with no further interaction, and it should only remove the
 * list the message came from (the events email), not the Weekly.
 *
 * GET deliberately never mutates. Corporate link scanners fetch every URL in
 * an email before a human sees it; a GET that unsubscribed would quietly drop
 * readers who never clicked anything.
 *
 * Same auth model as /api/preferences: the unguessable token is the only
 * credential, and an unknown token is a 404.
 */

import { buildPreferencesUrl } from "@/lib/newsletter/preferences-url";
import { getSubscriptionByToken, updatePreferencesByToken } from "@/lib/newsletter/subscriptions";
import { syncResendPreferences } from "@/lib/newsletter/sync";
import { capturePostHogEvent } from "@/lib/posthog-server";
import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
	const token = request.nextUrl.searchParams.get("token") ?? undefined;
	return NextResponse.redirect(buildPreferencesUrl(token), 303);
}

export async function POST(request: NextRequest) {
	const token = request.nextUrl.searchParams.get("token");
	if (!token) {
		return Response.json({ error: "Missing token" }, { status: 400 });
	}

	try {
		const existing = await getSubscriptionByToken(token);
		if (!existing) {
			return Response.json({ error: "Not found" }, { status: 404 });
		}

		const result = await updatePreferencesByToken({
			token,
			categories: [],
			digestSubscribed: existing.digest_subscribed,
		});
		if (!result) {
			return Response.json({ error: "Not found" }, { status: 404 });
		}

		await syncResendPreferences({
			resend,
			email: result.subscription.email,
			previous: { categories: result.previousCategories, digestSubscribed: result.previousDigestSubscribed },
			next: { categories: [], digestSubscribed: result.subscription.digest_subscribed },
		});

		await capturePostHogEvent({
			event: "newsletter_one_click_unsubscribe",
			distinctId: "newsletter-system",
			properties: {
				list: "events_weekly",
				previous_category_count: result.previousCategories.length,
				kept_weekly: result.subscription.digest_subscribed,
			},
		});

		return Response.json({ success: true });
	} catch (error) {
		console.error("One-click unsubscribe error:", error);
		return Response.json({ error: "An error occurred" }, { status: 500 });
	}
}
