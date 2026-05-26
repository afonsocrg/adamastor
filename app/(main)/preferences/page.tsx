/**
 * /preferences — no-login newsletter preference management.
 *
 * The page expects a `?token=...` query param embedded in preference-link
 * emails (see lib/newsletter/preferences-url.ts). With a valid token, we
 * load the subscription server-side and render a form pre-populated with
 * the current opt-ins. Without a token — or with an unknown token — we
 * render a small "enter your email" form that triggers
 * /api/preferences/request-link.
 *
 * Tokens are unguessable UUIDs and behave like long-lived magic links.
 * Invalid tokens look identical to missing tokens in the UI so we don't
 * leak whether any specific token has ever existed.
 */

import { getSubscriptionByToken } from "@/lib/newsletter/subscriptions";
import type { Metadata } from "next";
import { PreferencesForm, RequestLinkForm } from "./PreferencesPageClient";

export const metadata: Metadata = {
	title: "Preferences | Adamastor",
	robots: { index: false, follow: false },
};

interface PreferencesPageProps {
	searchParams: Promise<{ token?: string }>;
}

export default async function PreferencesPage({ searchParams }: PreferencesPageProps) {
	const { token } = await searchParams;

	// Swallow lookup failures (network blip, table not yet migrated, etc.) and
	// fall through to the request-link form. Invalid and missing tokens render
	// identically on purpose — see the file header.
	let subscription = null;
	if (token) {
		try {
			subscription = await getSubscriptionByToken(token);
		} catch (error) {
			console.error("Preferences page: subscription lookup failed", error);
		}
	}

	return (
		<div className="mx-auto max-w-2xl space-y-8 md:p-4">
			{subscription ? (
				<PreferencesForm
					initial={{
						email: subscription.email,
						firstName: subscription.first_name,
						categories: subscription.categories,
						digestSubscribed: subscription.digest_subscribed,
						token: subscription.preference_token,
					}}
				/>
			) : (
				<RequestLinkForm />
			)}
		</div>
	);
}
