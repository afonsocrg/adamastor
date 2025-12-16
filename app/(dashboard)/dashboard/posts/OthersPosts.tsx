import { createClient } from "@/lib/supabase/server";
import { PostsTableClient } from "./PostsTableClient";

interface OthersPostsProps {
	currentUserId: string;
}

/**
 * Fetches view counts from PostHog for a list of post IDs.
 */
async function getPostViewCounts(postIds: string[]): Promise<Record<string, number>> {
	if (postIds.length === 0) {
		return {};
	}

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
 * OthersPosts - Server Component
 *
 * Fetches posts from OTHER users (not the current user) along with view counts.
 */
export async function OthersPosts({ currentUserId }: OthersPostsProps) {
	const supabase = await createClient();

	// -------------------------------------------------------------------------
	// 1. FETCH POSTS WITH AUTHOR INFO
	// -------------------------------------------------------------------------
	const { data: posts, error } = await supabase
		.from("posts")
		.select(`
			*,
			authors (
				id,
				name
			)
		`)
		.neq("created_by", currentUserId)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error fetching others' posts:", error);
	}

	// -------------------------------------------------------------------------
	// 2. FETCH VIEW COUNTS FROM POSTHOG
	// -------------------------------------------------------------------------
	const postIds = posts?.map((post) => String(post.id)) || [];
	const viewCounts = await getPostViewCounts(postIds);

	// -------------------------------------------------------------------------
	// 3. MERGE DATA
	// -------------------------------------------------------------------------
	const postsWithViews = posts?.map((post) => ({
		...post,
		views: viewCounts[String(post.id)] || 0,
	}));

	return <PostsTableClient posts={postsWithViews || null} emptyMessage="No other posts found." showAuthor={true} />;
}
