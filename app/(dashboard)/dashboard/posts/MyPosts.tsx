import { createClient } from "@/lib/supabase/server";
import { PostsTableClient } from "./PostsTableClient";

interface MyPostsProps {
	userId: string;
}

/**
 * Fetches view counts from PostHog for a list of post IDs.
 *
 * @param postIds - Array of post IDs to fetch views for
 * @returns Object mapping post ID to view count, e.g., { "147": 42, "148": 18 }
 */
async function fetchViewCounts(postIds: string[]): Promise<Record<string, number>> {
	if (postIds.length === 0) return {};

	try {
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const url = `${baseUrl}/api/analytics/post-views?ids=${postIds.join(",")}`;

		const response = await fetch(url, {
			next: { revalidate: 300 },
		});

		if (!response.ok) {
			console.error("Failed to fetch view counts:", response.status);
			return {};
		}

		const data = await response.json();
		return data.views || {};
	} catch (error) {
		console.error("Error fetching view counts:", error);
		return {};
	}
}

/**
 * Fetches subscription counts from PostHog for a list of post IDs.
 *
 * Queries the "subscribed_newsletter" custom event, grouped by page_url.
 *
 * @param postIds - Array of post IDs to fetch subscriptions for
 * @returns Object mapping post ID to subscription count
 */
async function fetchSubscriptionCounts(postIds: string[]): Promise<Record<string, number>> {
	if (postIds.length === 0) return {};

	try {
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const url = `${baseUrl}/api/analytics/post-subscriptions?ids=${postIds.join(",")}`;

		const response = await fetch(url, {
			next: { revalidate: 300 },
		});

		if (!response.ok) {
			console.error("Failed to fetch subscription counts:", response.status);
			return {};
		}

		const data = await response.json();
		return data.subscriptions || {};
	} catch (error) {
		console.error("Error fetching subscription counts:", error);
		return {};
	}
}

/**
 * MyPosts - Server Component
 *
 * Fetches the current user's posts along with view and subscription counts,
 * then passes the combined data to the client component for rendering.
 */
export async function MyPosts({ userId }: MyPostsProps) {
	const supabase = await createClient();

	// -------------------------------------------------------------------------
	// 1. FETCH POSTS FROM SUPABASE
	// -------------------------------------------------------------------------
	const { data: posts, error } = await supabase
		.from("posts")
		.select("*")
		.eq("created_by", userId)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error fetching posts:", error);
	}

	// -------------------------------------------------------------------------
	// 2. FETCH ANALYTICS FROM POSTHOG (IN PARALLEL)
	// -------------------------------------------------------------------------
	/**
	 * Using Promise.all to fetch views and subscriptions concurrently.
	 *
	 * Why this matters:
	 * - Sequential: 200ms + 200ms = 400ms total
	 * - Parallel:   max(200ms, 200ms) = 200ms total
	 */
	const postIds = posts?.map((post) => String(post.id)) || [];

	const [viewCounts, subscriptionCounts] = await Promise.all([
		fetchViewCounts(postIds),
		fetchSubscriptionCounts(postIds),
	]);

	// -------------------------------------------------------------------------
	// 3. MERGE DATA
	// -------------------------------------------------------------------------
	const postsWithAnalytics = posts?.map((post) => ({
		...post,
		views: viewCounts[String(post.id)] ?? 0,
		subscriptions: subscriptionCounts[String(post.id)] ?? 0,
	}));

	return (
		<PostsTableClient
			posts={postsWithAnalytics || null}
			emptyMessage="You haven't created any posts yet."
			showAuthor={false}
		/>
	);
}
