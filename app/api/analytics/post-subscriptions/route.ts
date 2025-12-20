import { type NextRequest, NextResponse } from "next/server";

/**
 * API Route: /api/analytics/post-subscriptions
 *
 * Fetches subscription counts per post from PostHog using the Query API.
 *
 * This queries the "subscribed_newsletter" custom event that you capture
 * in your /api/subscribe route. Each subscription includes:
 * - page_url: The pathname where the user subscribed (e.g., "/posts/147")
 *
 * Query Parameters:
 * - ids: Comma-separated list of post IDs (e.g., "147,148,149")
 *
 * Example:
 * GET /api/analytics/post-subscriptions?ids=147,148,149
 *
 * Returns:
 * {
 *   subscriptions: {
 *     "147": 5,
 *     "148": 2,
 *     "149": 0
 *   }
 * }
 */

export async function GET(request: NextRequest) {
	try {
		// -------------------------------------------------------------------------
		// 1. VALIDATE ENVIRONMENT VARIABLES
		// -------------------------------------------------------------------------
		const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
		const projectId = process.env.POSTHOG_PROJECT_ID;
		const host = process.env.POSTHOG_API_HOST || "https://eu.posthog.com";

		if (!apiKey || !projectId) {
			console.error("Missing PostHog credentials");
			return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
		}

		// -------------------------------------------------------------------------
		// 2. PARSE REQUEST PARAMETERS
		// -------------------------------------------------------------------------
		const { searchParams } = new URL(request.url);
		const idsParam = searchParams.get("ids");

		if (!idsParam) {
			return NextResponse.json({ error: "Missing 'ids' query parameter" }, { status: 400 });
		}

		// Parse comma-separated IDs and build pathname patterns
		// e.g., "147,148" → ["/posts/147", "/posts/148"]
		const postIds = idsParam.split(",").map((id) => id.trim());
		const pathnames = postIds.map((id) => `/posts/${id}`);

		// Build the IN clause with properly escaped strings
		// e.g., "'/posts/147', '/posts/148'"
		const pathnamesList = pathnames.map((p) => `'${p}'`).join(", ");

		// -------------------------------------------------------------------------
		// 3. BUILD HOGQL QUERY
		// -------------------------------------------------------------------------
		/**
		 * HogQL Query for Subscription Counts
		 *
		 * Key differences from the views query:
		 * - event = 'subscribed_newsletter' (your custom event, not '$pageview')
		 * - properties.page_url (the property you set, not $pathname)
		 * - COUNT(*) because each subscription event is unique
		 *
		 * Note: Your /api/subscribe route captures:
		 *   page_url: window.location.pathname (e.g., "/posts/147")
		 */
		const hogqlQuery = `
			SELECT
				properties.page_url AS page_url,
				COUNT(*) AS subscription_count
			FROM events
			WHERE
				event = 'subscribed_newsletter'
				AND properties.page_url IN (${pathnamesList})
			GROUP BY properties.page_url
		`;

		// -------------------------------------------------------------------------
		// 4. CALL POSTHOG QUERY API
		// -------------------------------------------------------------------------
		const response = await fetch(`${host}/api/projects/${projectId}/query`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: {
					kind: "HogQLQuery",
					query: hogqlQuery,
				},
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("PostHog Query API error:", response.status, errorText);
			return NextResponse.json({ error: "Failed to query PostHog", details: errorText }, { status: response.status });
		}

		const data = await response.json();

		// -------------------------------------------------------------------------
		// 5. TRANSFORM RESPONSE
		// -------------------------------------------------------------------------
		/**
		 * PostHog returns results like:
		 * {
		 *   results: [
		 *     ["/posts/147", 5],
		 *     ["/posts/148", 2]
		 *   ]
		 * }
		 *
		 * We transform this to:
		 * {
		 *   subscriptions: {
		 *     "147": 5,
		 *     "148": 2,
		 *     "149": 0  // Posts with no subscriptions get 0
		 *   }
		 * }
		 */
		const subscriptions: Record<string, number> = {};

		// Initialize all requested IDs with 0
		for (const id of postIds) {
			subscriptions[id] = 0;
		}

		// Fill in actual subscription counts from results
		if (data.results && Array.isArray(data.results)) {
			for (const row of data.results) {
				const pageUrl = row[0] as string;
				const count = row[1] as number;

				// Extract post ID from page_url (e.g., "/posts/147" → "147")
				const match = pageUrl.match(/\/posts\/(.+)/);
				if (match) {
					const postId = match[1];
					subscriptions[postId] = count;
				}
			}
		}

		return NextResponse.json({ subscriptions });
	} catch (error) {
		console.error("Error fetching post subscriptions:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch post subscriptions",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

// Cache for 5 minutes to reduce API calls
export const revalidate = 300;
