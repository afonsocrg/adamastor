import { buildPostPathnameSql, parsePostRefsParam } from "@/lib/analytics/post-pathnames";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 300;

/**
 * Fetches unique view counts for posts from PostHog using the Query API.
 *
 * Query Parameters:
 * - posts: Comma-separated `id:slug` pairs (slug optional), e.g.
 *   "147:my-post,148:another-post,149". Falls back to the legacy bare-id
 *   `ids` param ("147,148,149") when `posts` is absent.
 *
 * Why both id and slug: posts are linked across the site as `/posts/{slug ?? id}`,
 * so a post accrues views under BOTH `/posts/147` and `/posts/my-post`. We match
 * both pathnames and dedupe unique viewers per post (a reader who hit both URLs
 * counts once), otherwise recent posts — whose traffic is mostly on the slug —
 * read near zero.
 *
 * Returns:
 * {
 *   views: { "147": 42, "148": 18, "149": 0 }
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
		const refs = parsePostRefsParam(searchParams.get("posts") ?? searchParams.get("ids"));

		if (refs.length === 0) {
			return NextResponse.json({ error: "Missing or invalid 'posts' query parameter" }, { status: 400 });
		}

		// -------------------------------------------------------------------------
		// 3. BUILD HOGQL QUERY
		// -------------------------------------------------------------------------
		// `postIdExpr` maps each matched pathname (numeric id OR slug) back to its
		// post id; the outer query then dedupes unique viewers per post.
		const sql = buildPostPathnameSql(refs, "$pathname");
		if (!sql) {
			return NextResponse.json({ views: {} });
		}

		const hogqlQuery = `
    SELECT
        post_id,
        count(DISTINCT distinct_id) AS unique_views
    FROM (
        SELECT
            distinct_id,
            ${sql.postIdExpr} AS post_id
        FROM events
        WHERE
            event = '$pageview'
            AND properties.$pathname IN (${sql.inClause})
    )
    WHERE post_id IS NOT NULL
    GROUP BY post_id
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
		 * PostHog returns rows of [post_id, unique_views]. We seed every requested
		 * id with 0 so posts with no views are still present in the response.
		 */
		const views: Record<string, number> = {};
		for (const ref of refs) {
			views[ref.id] = 0;
		}

		if (data.results && Array.isArray(data.results)) {
			for (const row of data.results) {
				const postId = row[0] as string;
				const count = row[1] as number;
				if (postId != null) {
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
