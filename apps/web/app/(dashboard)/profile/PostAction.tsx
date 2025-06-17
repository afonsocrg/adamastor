"use client";

import { Button } from "@/components/tailwind/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tailwind/ui/dropdown-menu";
import {
  Copy,
  Ellipsis,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { publishPost, unpublishPost, deletePost, copyPost } from "@/lib/posts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Post } from "./PostList";

interface PostActionsProps {
  post: Post;
}

export function PostActions({ post }: PostActionsProps) {
  const router = useRouter();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const onPublish = async (id: string) => {
    const response = await publishPost({ id });
    if (response.ok) {
      toast.success("Post published");
      router.refresh();
    } else {
      toast.error("Failed to publish post");
    }
  };

  const onUnpublish = async (id: string) => {
    const response = await unpublishPost({ id });
    if (response.ok) {
      toast.success("Post unpublished");
      router.refresh();
    } else {
      toast.error("Failed to unpublish post");
    }
  };

  const onDelete = async (id: string) => {
    const response = await deletePost({ id });
    if (response.ok) {
      toast.success("Post deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete post");
    }
  };

  const onDuplicatePost = async (id: string) => {
    const response = await copyPost({ id });
    if (response.ok) {
      toast.success("Post duplicated");
    }
    const { post: newPost } = await response.json();
    router.push(`/posts/${newPost.id}/edit`);
  };

  const handleAction = async (
    e: Event,
    action: string,
    handler: (id: string) => Promise<void>,
  ) => {
    e.stopPropagation();
    setLoadingAction(action);
    try {
      await handler(post.id);
    } finally {
      setLoadingAction(null);
    }
  };


  if (loadingAction) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Ellipsis className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          asChild
          className="flex items-center gap-2 cursor-pointer"
        >
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" /> Preview
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="flex items-center gap-2 cursor-pointer"
        >
          <Link
            href={`/posts/${post.id}/edit`}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => handleAction(e, "duplicate", onDuplicatePost)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Copy className="w-4 h-4" /> Duplicate
        </DropdownMenuItem>
        {post.is_public ? (
          <DropdownMenuItem
            onSelect={(e) => handleAction(e, "unpublish", onUnpublish)}
            className="flex items-center gap-2 cursor-pointer"
            disabled={loadingAction === "unpublish"}
          >
            {loadingAction === "unpublish" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}{" "}
            Unpublish
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => handleAction(e, "publish", onPublish)}
            className="flex items-center gap-2 cursor-pointer"
            disabled={loadingAction === "publish"}
          >
            {loadingAction === "publish" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}{" "}
            Publish
          </DropdownMenuItem>
        )}
        {/* <DropdownMenuItem
            onSelect={() => handleAction('delete', onDelete)}
            className="flex items-center gap-2 text-red-600 focus:bg-red-50 cursor-pointer"
            disabled={loadingAction === 'delete'}
          >
            {loadingAction === 'delete' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )} Delete
          </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
