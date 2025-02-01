import PostPreview from "@/components/tailwind/post-preview";
import { Button } from "@/components/tailwind/ui/button";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/datetime";
import { assertAuthenticated } from '@/lib/supabase/authentication'
import Link from "next/link";
import { PublishButton } from "./PublishButton";
import { DeleteButton } from "./DeleteButton";

export default async function ProfilePage() {
  const supabase = await createClient();

  const user = await assertAuthenticated(supabase);
  const { data: posts, error } = await supabase.from('posts').select('*').eq('author_id', user.id).order('created_at', { ascending: false });
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Posts</h1>
        <Link
          href="/posts/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Post
        </Link>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            You haven't created any posts yet.
          </p>
        ) : (
          posts.map((post) => (
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
                
                <PublishButton
                  postId={post.id}
                  isPublic={post.is_public}
                />
                
                <DeleteButton
                  postId={post.id}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
