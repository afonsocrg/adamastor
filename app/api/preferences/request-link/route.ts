/**
 * POST /api/preferences/request-link
 * Body: { email }
 *
 * Sends the requester a magic link to their /preferences page. We always
 * return 200 regardless of whether the email is in the database — leaking
 * "this email is/isn't subscribed" via a status code or error message would
 * let an attacker enumerate our subscriber list.
 *
 * Legacy subscribers who joined the weekly digest before this feature
 * shipped won't have a row in newsletter_subscriptions, so they won't
 * receive a link here. They can be migrated lazily via a one-off admin
 * script when needed (tracked as a follow-up — see
 * docs/newsletter-subscriptions.md).
 */

import { PreferencesLinkEmail } from "@/components/email/preferences-link";
import { buildPreferencesUrl } from "@/lib/newsletter/preferences-url";
import { normalizeEmail, getSubscriptionByEmail } from "@/lib/newsletter/subscriptions";
import { capturePostHogEvent } from "@/lib/posthog-server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json();

		if (typeof email !== "string" || !email.includes("@")) {
			return Response.json({ error: "Invalid email address" }, { status: 400 });
		}

		const normalized = normalizeEmail(email);
		const subscription = await getSubscriptionByEmail(normalized);

		if (subscription) {
			const preferencesUrl = buildPreferencesUrl(subscription.preference_token);

			const { error: emailError } = await resend.emails.send({
				from: "Adamastor <hi@digest.adamastor.blog>",
				to: [subscription.email],
				subject: "Your Adamastor preferences link",
				react: PreferencesLinkEmail({ preferencesUrl }),
			});

			if (emailError) {
				console.error("Preferences link send error:", emailError);
				// Still 200 below — we don't want the client to learn whether the
				// email was in our database based on the response.
			}

			await capturePostHogEvent({
				event: "preferences_request_link_email_sent",
				distinctId: subscription.email,
				properties: {
					email: subscription.email,
					send_error: emailError?.message ?? null,
				},
			});
		} else {
			await capturePostHogEvent({
				event: "preferences_request_link_email_skipped",
				distinctId: normalized,
				properties: { reason: "email_not_in_db" },
			});
		}

		return Response.json({ ok: true });
	} catch (error) {
		console.error("Preferences request-link error:", error);
		// Still respond 200 for the same enumeration reason. Log + move on.
		return Response.json({ ok: true });
	}
}
