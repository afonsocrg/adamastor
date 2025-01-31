"use client";

import { deletePost } from "@/lib/posts";
import { Button } from "@/components/tailwind/ui/button";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  id: string;
}
export function DeleteButton({id}: DeleteButtonProps) {
  const router = useRouter();
  const handleDeletePost = async () => {
    const response = await deletePost({ id });
    console.log({data: await response.json()});
    if (response.ok) {
      router.push('/');
    }
  }

  return (
    <Button variant="destructive" onClick={() => handleDeletePost()}>
      Delete Post
    </Button>
  )
}