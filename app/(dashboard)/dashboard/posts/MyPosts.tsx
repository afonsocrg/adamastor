import { createClient } from "@/lib/supabase/server";
import { PostsTableClient } from "./PostsTableClient";

interface MyPostsProps {
	userId: string;
}

export async function MyPosts({ userId }: MyPostsProps) {
	const supabase = await createClient();

	const { data: posts, error } = await supabase
		.from("posts")
		.select("*")
		.eq("created_by", userId)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error fetching posts:", error);
	}

	return (
		<PostsTableClient
			posts={posts}
			emptyMessage="You haven't created any posts yet."
			showAuthor={false} // Don't show author column.
		/>
	);
}
