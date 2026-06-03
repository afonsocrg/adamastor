"use server";

import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

interface SendNewsletterInput {
	postId: string;
	eventIds: string[];
	/** true = broadcast to every subscriber; false/undefined = test send. */
	broadcast?: boolean;
	/** Recipient for a test send (ignored when broadcasting). */
	testEmail?: string;
}

/**
 * Trigger a manual newsletter send from the dashboard.
 *
 * The send engine (/api/sendNewsletter) is secret-gated and fails closed — it
 * requires `Authorization: Bearer ${NEWSLETTER_SEND_SECRET}` for every mode.
 * That secret is server-only and must NEVER reach the browser, so the dashboard
 * can't call the engine directly. This server action is the bridge: it runs in
 * the admin-gated dashboard context, attaches the secret server-side, and
 * delegates exactly like the cron route does (lib/newsletter/internal-auth.ts).
 */
export async function sendNewsletter(input: SendNewsletterInput) {
	// Authorize. The dashboard layout already gates the page to admins, but a
	// server action is its own POST endpoint, so re-check here (defense in depth).
	const supabase = await createClient();
	const profile = await assertAuthenticated(supabase);
	if (profile.role !== "admin") {
		throw new Error("Not authorized to send the newsletter.");
	}

	const secret = process.env.NEWSLETTER_SEND_SECRET;
	if (!secret) {
		throw new Error("NEWSLETTER_SEND_SECRET is not configured on the server.");
	}

	// Resolve an absolute origin for the server-to-server call. Prefer the
	// configured app URL; fall back to the incoming request host (|| catches an
	// empty-string env var, which ?? would not).
	const requestHeaders = await headers();
	const host = requestHeaders.get("host");
	const proto = requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
	const origin = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : "");
	if (!origin) {
		throw new Error("Could not resolve the app origin to reach the send engine.");
	}

	const body = {
		postId: input.postId,
		eventIds: input.eventIds,
		...(input.broadcast ? { broadcast: true, confirmBroadcast: true } : { testEmail: input.testEmail }),
	};

	const res = await fetch(new URL("/api/sendNewsletter", origin).toString(), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${secret}`,
		},
		body: JSON.stringify(body),
	});

	const result = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error(result?.error || "Failed to send");
	}
	return result as {
		success?: boolean;
		mode?: "test" | "broadcast";
		sentTo?: string;
		eventCount?: number;
		[key: string]: unknown;
	};
}
