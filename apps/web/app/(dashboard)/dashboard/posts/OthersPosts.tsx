import { createClient } from "@/lib/supabase/server";
import { PostList } from "./PostList";

interface OthersPostsProps {
  currentUserId: string;
}

export async function OthersPosts({ currentUserId }: OthersPostsProps) {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .neq("author_id", currentUserId)
    .order("created_at", { ascending: false });

  return (
    <PostList
      posts={posts}
      emptyMessage="No other posts found."
    />
  );
} 