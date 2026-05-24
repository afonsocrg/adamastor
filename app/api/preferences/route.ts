/**
 * Token-scoped preferences API.
 *
 *   GET   /api/preferences?token=...   → { email, categories[], digest_subscribed }
 *   PATCH /api/preferences             → body: { token, categories[], digest_subscribed }
 *
 * The token in the URL/body is the only auth — it's an unguessable UUID
 * embedded in every preferences-link email. No session, no cookie. Treat
 * invalid tokens as Not Found rather than Forbidden so we don't leak whether
 * a given token has ever existed.
 */

import { sanitizeEventCategorySlugs } from "@/lib/events/categories";
import { getSubscriptionByToken, updatePreferencesByToken } from "@/lib/newsletter/subscriptions";
import { syncResendPreferences } from "@/lib/newsletter/sync";
import type { NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
	const token = request.nextUrl.searchParams.get("token");

	if (!token) {
		return Response.json({ error: "Missing token" }, { status: 400 });
	}

	const subscription = await getSubscriptionByToken(token);
	if (!subscription) {
		return Response.json({ error: "Not found" }, { status: 404 });
	}

	return Response.json({
		email: subscription.email,
		categories: subscription.categories,
		digest_subscribed: subscription.digest_subscribed,
	});
}

export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		const { token, categories, digest_subscribed: digestSubscribed } = body ?? {};

		if (typeof token !== "string" || token.length === 0) {
			return Response.json({ error: "Missing token" }, { status: 400 });
		}

		const nextCategories = sanitizeEventCategorySlugs(categories);
		const nextDigest = Boolean(digestSubscribed);

		const result = await updatePreferencesByToken({
			token,
			categories: nextCategories,
			digestSubscribed: nextDigest,
		});

		if (!result) {
			return Response.json({ error: "Not found" }, { status: 404 });
		}

		await syncResendPreferences({
			resend,
			email: result.subscription.email,
			previous: {
				categories: result.previousCategories,
				digestSubscribed: result.previousDigestSubscribed,
			},
			next: {
				categories: result.subscription.categories,
				digestSubscribed: result.subscription.digest_subscribed,
			},
		});

		return Response.json({
			email: result.subscription.email,
			categories: result.subscription.categories,
			digest_subscribed: result.subscription.digest_subscribed,
		});
	} catch (error) {
		console.error("Preferences PATCH error:", error);
		return Response.json(
			{ error: error instanceof Error ? error.message : "An error occurred" },
			{ status: 500 },
		);
	}
}
