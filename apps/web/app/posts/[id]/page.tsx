import AuthorCard from "@/components/authorCard";
import ShareWidget from "@/components/shareWidget";
import PostPreview from "@/components/tailwind/post-preview";
import { Button } from "@/components/tailwind/ui/button";
import { formatDate } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DeleteButton } from "./DeleteButton";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post, error } = await supabase.from("posts").select("*").eq("id", id).single();

  if (error || !post) {
    notFound();
  }

  const formattedPublishedDate = formatDate(post.created_at);

  return (
    <div className="max-w-[750px] mx-auto md:px-4 animate-in">
      <div className="mb-4 flex gap-2 justify-end">
        {(user?.id === post.author_id || process.env.NEXT_ALLOW_BAD_UI === "true") && (
          <>
            <Button variant="outline" asChild>
              <a href={`/posts/${id}/edit`}>Edit Post</a>
            </Button>
            <DeleteButton id={id} />
          </>
        )}
      </div>
      <div className="mb-4">
        <h2 className="md:text-4xl scroll-m-20 tracking-tight !leading-tight text-3xl font-extrabold text-[#104357] dark:text-[#E3F2F7]">
          {post.title}
        </h2>
      </div>

      <div className="flex justify-between items-start mt-6">
        <AuthorCard publishedAt={formattedPublishedDate} />
        <ShareWidget />
      </div>

      <PostPreview initialContent={post.content} />
    </div>
  );
}

export async function generateMetadata({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase.from("posts").select("*").eq("id", id).single();

  if (error || !post) {
    notFound();
  }

  // TODO: @afonso I wanted to slice the content but it seems this is an object. Can you help?
  const contentPreview =
    typeof post.content === "string" ? post.content.slice(0, 160) : "Check out this post on our blog.";

  // TODO: Generate Open Graph image with post title dynamically @malik.
  return {
    title: post.title,
    description: contentPreview,
  };
}
