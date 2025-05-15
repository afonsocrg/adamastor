import { PublishButton } from "@/app/profile/PublishButton";
import AuthorCard from "@/components/authorCard";
import ShareWidget from "@/components/shareWidget";
import PostPreview from "@/components/tailwind/post-preview";
import { Button } from "@/components/tailwind/ui/button";
import { formatDate } from "@/lib/datetime";
import { getUserProfile } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@tiptap/core";
import { notFound } from "next/navigation";
import {
  Color,
  StarterKit,
  TaskItem,
  TaskList,
  TextStyle,
  TiptapImage,
  TiptapLink,
  TiptapUnderline,
  Youtube,
} from "novel";
import { DeleteButton } from "./DeleteButton";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getUserProfile(supabase);

  const { data: post, error } = await supabase.from("posts").select("*").eq("id", id).single();

  if (error || !post) {
    notFound();
  }

  const formattedPublishedDate = formatDate(post.created_at);

  return (
    <div className="max-w-[750px] mx-auto md:px-4 animate-in">
      <div className="mb-4 flex gap-2 justify-end">
        {(user?.id === post.author_id || user?.role === "admin" || process.env.NEXT_ALLOW_BAD_UI === "true") && (
          <>
            <Button variant="outline" asChild>
              <a href={`/posts/${id}/edit`}>Edit Post</a>
            </Button>
            <PublishButton postId={id} isPublic={post.is_public} />
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
  let contentPreview = "Check out this post on our blog.";
  try {
    const contentText = generateText(post.content, [
      StarterKit,
      TaskItem,
      TaskList,
      TiptapImage,
      TiptapUnderline,
      TextStyle,
      Color,
      TiptapLink,
      Youtube,
    ]).slice(0, 160);
    if (contentText.length > 0) {
      const lastSpaceIndex = contentText.lastIndexOf(" ");
      contentPreview = `${contentText.substring(0, lastSpaceIndex)}...`;
    }
  } catch (error) {
    console.error("Error generating content preview", error);
    console.log("Continuing with default content preview");
  }

  // TODO: Generate Open Graph image with post title dynamically @malik.
  // @malik, I think the best here would be to have a default metadata object
  // exported somewhere, and then override its properties in each page.
  return {
    title: post.title,
    description: contentPreview,
  };
}
