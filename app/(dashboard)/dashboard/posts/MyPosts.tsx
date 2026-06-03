import { fetchPostSubscriptionCounts, fetchPostViewCounts } from "@/lib/analytics/post-metrics";
import { createClient } from "@/lib/supabase/server";
import { PostsTableClient } from "./PostsTableClient";

interface MyPostsProps {
	userId: string;
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
	// Pass id + slug so PostHog matches both URL forms a post is viewed under
	// (`/posts/{id}` and `/posts/{slug}`). Promise.all keeps the two reads
	// concurrent: max(views, subs) instead of their sum.
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

	return (
		<PostsTableClient
			posts={postsWithAnalytics || null}
			emptyMessage="You haven't created any posts yet."
			showAuthor={false}
		/>
	);
}
