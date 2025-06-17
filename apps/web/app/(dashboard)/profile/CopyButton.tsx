"use client";

import { copyPost } from "@/lib/posts";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CopyButton({ postId }: { postId: string }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleCopy() {
    setIsPending(true);

    try {
      const response = await copyPost({ id: postId });

      if (!response.ok) throw new Error("Failed to copy post");

      router.refresh();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={isPending}
      className={`
        inline-flex items-center px-3 py-1.5 bg-neutral-100 text-neutral-700 
        rounded-md hover:bg-neutral-200 transition-colors
        ${isPending ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {isPending ? "Creating copy..." : "Create copy"}
    </button>
  );
}
