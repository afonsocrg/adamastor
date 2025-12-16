import { createClient } from "@/lib/supabase/server";
import { PostsTableClient } from "./PostsTableClient";

interface OthersPostsProps {
	currentUserId: string;
}

/**
 * OthersPosts - Server Component
 *
 * Fetches posts from OTHER users (not the current user).
 *
 * Key difference from MyPosts:
 * - Uses .neq() instead of .eq() to exclude current user's posts
 * - Includes author information via a JOIN
 * - Passes showAuthor={true} to display who wrote each post
 */
export async function OthersPosts({ currentUserId }: OthersPostsProps) {
	const supabase = await createClient();

	// ---------------------------------------------------------------------------
	// QUERY WITH JOIN
	// ---------------------------------------------------------------------------
	// The `authors (id, name)` syntax tells Supabase to JOIN with the authors table
	// It auto-detects the FK relationship (posts.author_id → authors.id)
	// The result will have an `authors` key with { id, name } or null
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

	return <PostsTableClient posts={posts} emptyMessage="No other posts found." showAuthor={true} />;
}
