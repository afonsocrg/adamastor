"use client";
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { Button } from "@/components/tailwind/ui/button";
import { postsService } from "@/lib/posts";
import { useRouter } from "next/navigation";
import type { JSONContent } from "novel";
import { use } from "react";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id } = use<{ id: string }>(params);
  const router = useRouter();

  const post = postsService.getPost(id);

  const handleSavePost = (content: JSONContent) => {
    postsService.updatePost({ ...post, content });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-4 flex gap-2 justify-end">
        <Button onClick={() => router.push(`/posts/${id}`)} variant="outline">
          Done editing
        </Button>
      </div>
      <TailwindAdvancedEditor initialContent={post.content} savePost={handleSavePost} />
    </div>
  );
}
