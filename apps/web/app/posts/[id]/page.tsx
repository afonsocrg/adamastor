"use client";
import PostPreview from "@/components/tailwind/post-preview";
import { Button } from "@/components/tailwind/ui/button";
import { postsService } from "@/lib/posts";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default function PostPage({ params }: PostPageProps) {
  const router = useRouter();

  const { id } = use<{ id: string }>(params);
  const post = postsService.getPost(id);

  // Redirect to home if post is not found
  if (!post) {
    router.replace("/");
  }

  const handleDeletePost = () => {
    postsService.deletePost(id);
    router.push("/");
  };

  return (
    <>
      <div className="mb-4 flex gap-2 justify-end">
        <Button onClick={() => router.push(`/posts/${id}/edit`)} variant="outline">
          Edit Post
        </Button>
        <Button onClick={handleDeletePost} variant="destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <PostPreview initialContent={post.content} />
    </>
  );
}
