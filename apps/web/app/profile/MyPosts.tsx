import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CopyButton } from "./CopyButton";
import { DeleteButton } from "./DeleteButton";
import { PublishButton } from "./PublishButton";

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
    <div className="space-y-4">
      {posts?.length === 0 ? (
        <p className="text-gray-500 text-center py-8">You haven't created any posts yet.</p>
      ) : (
        posts?.map((post) => (
          <div
            key={post.id}
            className="bg-white shadow rounded-lg p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <h2 className="text-xl font-medium text-gray-900">{post.title}</h2>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/posts/${post.id}`}
                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors hover:cursor-pointer hover:underline"
              >
                Preview
              </Link>
              <Link
                href={`/posts/${post.id}/edit`}
                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors hover:cursor-pointer hover:underline"
              >
                Edit
              </Link>
              <CopyButton postId={post.id} />
              <PublishButton postId={post.id} isPublic={post.is_public} />
              <DeleteButton postId={post.id} />
            </div>
          </div>
        ))
      )}
    </div>
  );
} 