import "server-only";

import { type PostRef, encodePostRefsParam } from "@/lib/analytics/post-pathnames";

/**
 * Server-side helpers that fetch per-post view and subscription counts from our
 * internal PostHog-backed analytics routes. Shared by the dashboard's MyPosts
 * and OthersPosts so the `?posts=` wire format (id + slug) is built in exactly
 * one place — both URL forms of a post must reach PostHog or counts read low.
 */

// Match the routes' own `revalidate` so the dashboard and PostHog stay in step.
const REVALIDATE_SECONDS = 300;

function getBaseUrl(): string {
	return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function fetchCounts(
	endpoint: "post-views" | "post-subscriptions",
	resultKey: "views" | "subscriptions",
	refs: PostRef[],
): Promise<Record<string, number>> {
	if (refs.length === 0) return {};

	try {
		const param = encodeURIComponent(encodePostRefsParam(refs));
		const url = `${getBaseUrl()}/api/analytics/${endpoint}?posts=${param}`;

		const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });

		if (!response.ok) {
			console.error(`Failed to fetch ${endpoint}:`, response.status);
			return {};
		}

		const data = await response.json();
		return data[resultKey] || {};
	} catch (error) {
		console.error(`Error fetching ${endpoint}:`, error);
		return {};
	}
}

/** Unique view counts keyed by post id. */
export const fetchPostViewCounts = (refs: PostRef[]) => fetchCounts("post-views", "views", refs);

/** Newsletter subscription counts keyed by post id. */
export const fetchPostSubscriptionCounts = (refs: PostRef[]) =>
	fetchCounts("post-subscriptions", "subscriptions", refs);
