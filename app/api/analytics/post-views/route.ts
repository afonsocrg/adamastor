import { type NextRequest, NextResponse } from "next/server";

/**
 * Fetches unique view counts for posts from PostHog using the Query API.
 *
 * Query Parameters:
 * - ids: Comma-separated list of post IDs (e.g., "147,148,149")
 *
 * Example:
 * GET /api/analytics/post-views?ids=147,148,149
 *
 * Returns:
 * {
 *   views: {
 *     "147": 42,
 *     "148": 18,
 *     "149": 7
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
		const host = process.env.POSTHOG_API_HOST || "https://app.posthog.com";

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
		const pathnamesList = pathnames.map((p) => `'${p}'`).join(", ");

		const hogqlQuery = `
    SELECT
        properties.$pathname AS pathname,
        count(DISTINCT distinct_id) AS unique_views
    FROM events
    WHERE
        event = '$pageview'
        AND properties.$pathname IN (${pathnamesList})
    GROUP BY properties.$pathname
`;

		// -------------------------------------------------------------------------
		// 4. CALL POSTHOG QUERY API
		// -------------------------------------------------------------------------
		const url = `${host}/api/projects/${projectId}/query`;

		const response = await fetch(url, {
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
			return NextResponse.json({ error: `PostHog API error: ${response.status}` }, { status: response.status });
		}

		const data = await response.json();

		// -------------------------------------------------------------------------
		// 5. TRANSFORM RESPONSE
		// -------------------------------------------------------------------------
		/**
		 * PostHog Query API returns data in this format:
		 * {
		 *   results: [
		 *     ["/posts/147", 42],
		 *     ["/posts/148", 18],
		 *   ],
		 *   columns: ["pathname", "unique_views"]
		 * }
		 *
		 * We transform it to a more usable format:
		 * {
		 *   views: {
		 *     "147": 42,
		 *     "148": 18
		 *   }
		 * }
		 */
		const views: Record<string, number> = {};

		// Initialize all requested IDs with 0 (in case some have no views)
		for (const id of postIds) {
			views[id] = 0;
		}

		// Fill in actual view counts from results
		if (data.results && Array.isArray(data.results)) {
			for (const row of data.results) {
				const pathname = row[0] as string; // e.g., "/posts/147"
				const count = row[1] as number; // e.g., 42

				// Extract post ID from pathname
				const match = pathname.match(/\/posts\/(\d+)/);
				if (match) {
					const postId = match[1];
					views[postId] = count;
				}
			}
		}

		return NextResponse.json({ views });
	} catch (error) {
		console.error("Error fetching post views:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch post views",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

// Cache for 5 minutes to reduce API calls
export const revalidate = 300;
