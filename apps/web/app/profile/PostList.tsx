"use client";

import { Button } from "@/components/tailwind/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tailwind/ui/dropdown-menu";
import { Copy, Eye, EyeOff, Globe, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { PublishedTag } from "@components/PublishedTag";

interface Post {
  id: string;
  title: string;
  is_public: boolean;
}

interface PostListProps {
  posts: Post[] | null;
  emptyMessage: string;
}

export function PostList({ posts, emptyMessage }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts?.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">{emptyMessage}</p>
      ) : (
        posts?.map((post) => (
          <div
            key={post.id}
            className="bg-white shadow rounded-lg p-6 flex flex-col sm:flex-row justify-between items-center gap-4"
          >
            <div className="flex items-center gap-2 flex-1">
              <PublishedTag is_public={post.is_public} />
              <h2 className="text-xl font-semibold text-neutral-900 truncate">
                {post.title}
              </h2>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Actions</Button>
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
                  onSelect={() =>
                    navigator.clipboard.writeText(
                      window.location.origin + `/posts/${post.id}`,
                    )
                  }
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4" /> Duplicate
                </DropdownMenuItem>
                {post.is_public ? (
                  <DropdownMenuItem
                    onSelect={() => alert("Unpublish logic here")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <EyeOff className="w-4 h-4" /> Unpublish
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => alert("Publish logic here")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Globe className="w-4 h-4" /> Publish
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={() => alert("Delete logic here")}
                  className="flex items-center gap-2 text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))
      )}
    </div>
  );
}
