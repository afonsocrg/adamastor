import { fetchPostSubscriptionCounts, fetchPostViewCounts } from "@/lib/analytics/post-metrics";
import { createClient } from "@/lib/supabase/server";
import { PostsTableClient } from "./PostsTableClient";

interface OthersPostsProps {
	currentUserId: string;
}

/**
 * OthersPosts - Server Component
 *
 * Fetches posts from OTHER users (not the current user) along with
 * view and subscription counts from PostHog.
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
	// 2. FETCH ANALYTICS FROM POSTHOG (IN PARALLEL)
	// -------------------------------------------------------------------------
	// Pass id + slug so PostHog matches both URL forms a post is viewed under
	// (`/posts/{id}` and `/posts/{slug}`).
	const refs = (posts ?? []).map((post) => ({ id: String(post.id), slug: post.slug as string | null }));

	const [viewCounts, subscriptionCounts] = await Promise.all([
		fetchPostViewCounts(refs),
		fetchPostSubscriptionCounts(refs),
	]);

	// -------------------------------------------------------------------------
	// 3. MERGE DATA
	// -------------------------------------------------------------------------
	const postsWithAnalytics = posts?.map((post) => ({
		...post,
		views: viewCounts[String(post.id)] ?? 0,
		subscriptions: subscriptionCounts[String(post.id)] ?? 0,
	}));

	return <PostsTableClient posts={postsWithAnalytics || null} emptyMessage="No other posts found." showAuthor={true} />;
}
