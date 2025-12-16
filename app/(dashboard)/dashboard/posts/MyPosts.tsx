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
async function getPostViewCounts(postIds: string[]): Promise<Record<string, number>> {
	// Don't make API call if no posts
	if (postIds.length === 0) {
		return {};
	}

	try {
		// Build the API URL with post IDs
		// Note: In server components, we need the full URL
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const url = `${baseUrl}/api/analytics/post-views?ids=${postIds.join(",")}`;

		const response = await fetch(url, {
			// Cache for 5 minutes (matches the API route's revalidate)
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
		// Return empty object on error - table will show 0 or "—"
		return {};
	}
}

/**
 * MyPosts - Server Component
 *
 * Fetches the current user's posts and their view counts, then passes
 * the combined data to the client component for rendering.
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
	// 2. FETCH VIEW COUNTS FROM POSTHOG
	// -------------------------------------------------------------------------
	const postIds = posts?.map((post) => String(post.id)) || [];
	const viewCounts = await getPostViewCounts(postIds);

	// -------------------------------------------------------------------------
	// 3. MERGE DATA
	// -------------------------------------------------------------------------
	/**
	 * We add the `views` property to each post object.
	 * This keeps the data fetching in the server component while
	 * the client component just receives the complete data.
	 */
	const postsWithViews = posts?.map((post) => ({
		...post,
		views: viewCounts[String(post.id)] || 0,
	}));

	return (
		<PostsTableClient
			posts={postsWithViews || null}
			emptyMessage="You haven't created any posts yet."
			showAuthor={false}
		/>
	);
}
