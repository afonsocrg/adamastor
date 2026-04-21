import { ForbiddenError, handleError } from "@/lib/errors";
import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const WEEKLY_ACTIVE_USERS_QUERY = `
	SELECT
		count(DISTINCT distinct_id) AS weekly_active_users
	FROM events
	WHERE
		event = '$pageview'
		AND timestamp >= now() - INTERVAL 7 DAY
`;

export async function GET() {
	try {
		const supabase = await createClient();
		const profile = await assertAuthenticated(supabase);

		if (profile.role !== "admin") {
			throw new ForbiddenError("Admin access required");
		}

		const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
		const projectId = process.env.POSTHOG_PROJECT_ID;
		const host = process.env.POSTHOG_API_HOST || "https://eu.posthog.com";

		if (!apiKey || !projectId) {
			return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
		}

		const response = await fetch(`${host}/api/projects/${projectId}/query`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: {
					kind: "HogQLQuery",
					query: WEEKLY_ACTIVE_USERS_QUERY,
				},
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("PostHog Query API error:", response.status, errorText);
			return NextResponse.json(
				{ error: `PostHog API error: ${response.status}` },
				{ status: response.status },
			);
		}

		const data = (await response.json()) as {
			results?: unknown[][];
		};
		const wau = Number(data.results?.[0]?.[0] ?? 0);

		return NextResponse.json(
			{
				wau: Number.isFinite(wau) ? wau : 0,
				period: "last_7_days",
				lastRefresh: new Date().toISOString(),
			},
			{
				headers: {
					"Cache-Control": "no-store",
				},
			},
		);
	} catch (error) {
		return handleError(error);
	}
}
