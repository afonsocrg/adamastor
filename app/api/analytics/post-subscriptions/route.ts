import { buildPostPathnameSql, parsePostRefsParam } from "@/lib/analytics/post-pathnames";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 300;

/**
 * API Route: /api/analytics/post-subscriptions
 *
 * Fetches subscription counts per post from PostHog using the Query API.
 *
 * This queries the "subscribed_newsletter" custom event captured in
 * /api/subscribe, which records `page_url` as the pathname the user subscribed
 * from (e.g. "/posts/147" or "/posts/my-post").
 *
 * Query Parameters:
 * - posts: Comma-separated `id:slug` pairs (slug optional), e.g.
 *   "147:my-post,148:another-post,149". Falls back to the legacy bare-id
 *   `ids` param ("147,148,149") when `posts` is absent.
 *
 * Why both id and slug: a post is linked as `/posts/{slug ?? id}`, so
 * subscriptions land under BOTH `/posts/147` and `/posts/my-post`. We match
 * both and sum per post, otherwise the count misses whichever form readers
 * actually used.
 *
 * Returns:
 * {
 *   subscriptions: { "147": 5, "148": 2, "149": 0 }
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
		/**
		 * Key differences from the views query:
		 * - event = 'subscribed_newsletter' (custom event, not '$pageview')
		 * - properties.page_url (the property we set, not $pathname)
		 * - COUNT(*) — each subscription event is a distinct signup
		 *
		 * `postIdExpr` maps each matched page_url (numeric id OR slug) to its post
		 * id so subscriptions on either URL form sum into the same post.
		 */
		const sql = buildPostPathnameSql(refs, "page_url");
		if (!sql) {
			return NextResponse.json({ subscriptions: {} });
		}

		const hogqlQuery = `
			SELECT
				post_id,
				COUNT(*) AS subscription_count
			FROM (
				SELECT
					${sql.postIdExpr} AS post_id
				FROM events
				WHERE
					event = 'subscribed_newsletter'
					AND properties.page_url IN (${sql.inClause})
			)
			WHERE post_id IS NOT NULL
			GROUP BY post_id
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
		 * PostHog returns rows of [post_id, subscription_count]. We seed every
		 * requested id with 0 so posts with no subscriptions are still present.
		 */
		const subscriptions: Record<string, number> = {};
		for (const ref of refs) {
			subscriptions[ref.id] = 0;
		}

		if (data.results && Array.isArray(data.results)) {
			for (const row of data.results) {
				const postId = row[0] as string;
				const count = row[1] as number;
				if (postId != null) {
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
