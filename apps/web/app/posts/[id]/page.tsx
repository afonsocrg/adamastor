import PostPreview from "@/components/tailwind/post-preview";
import { Button } from "@/components/tailwind/ui/button";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/datetime";
import { DeleteButton } from "./DeleteButton";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) {
    notFound();
  }

  return (
    <>
      <div className="mb-4 flex gap-2 justify-end">
        {(user?.id === post.author_id || process.env.NEXT_ALLOW_BAD_UI === 'true') && (
          <>
            <Button variant="outline" asChild>
              <a href={`/posts/${id}/edit`}>Edit Post</a>
            </Button>
            <DeleteButton id={id} />
          </>
        )}
      </div>
      <h2 className="text-2xl font-bold">{post.title}</h2>
      <small>{formatDate(post.created_at)}</small>
      <PostPreview initialContent={post.content} />
    </>
  );
}
