"use client";

import { Button } from "@/components/tailwind/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tailwind/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/tailwind/ui/alert-dialog";
import {
  Copy,
  Ellipsis,
  Trash2,
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
    router.push(`/dashboard/posts/${newPost.id}/edit`);
  };

  const handleAction = async (
    e: React.MouseEvent | Event,
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
            href={`/posts/${post.slug}`}
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
            href={`/dashboard/posts/${post.id}/edit`}
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
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
          }}
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div className="flex items-center gap-2 text-red-600 cursor-pointer">
                <Trash2 className="w-4 h-4" />
                Delete
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the post "{post.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => handleAction(e, 'delete', onDelete)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={loadingAction === 'delete'}
                >
                  {loadingAction === 'delete' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
