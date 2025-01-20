"use client";

import { postsService } from "@/lib/posts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./tailwind/ui/button";

const Navbar = () => {
  const router = useRouter();

  const handleNewPost = () => {
    const newPost = postsService.createPost();
    router.push(`/posts/${newPost.id}/edit`);
  };

  return (
    <nav className="bg-accent p-4 mb-6">
      <div className="max-w-screen-lg mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Ureno
        </Link>
        <Button onClick={handleNewPost} variant="outline">
          New Post
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
