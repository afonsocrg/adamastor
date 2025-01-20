"use client";
import { type Post, postsService } from "@/lib/posts";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    postsService.initialize();
    setPosts(postsService.getAllPosts());
  }, []);

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          className="block p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <h2 className="text-xl font-semibold">{post.title}</h2>
          <p className="text-muted-foreground">{post.date}</p>
        </Link>
      ))}
    </div>
  );
}
