import { createClient } from "@/lib/supabase/server";
import { PostList } from "./PostList";

interface MyPostsProps {
  userId: string;
}

export async function MyPosts({ userId }: MyPostsProps) {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  return (
    <PostList
      posts={posts}
      emptyMessage="You haven't created any posts yet."
    />
  );
} 