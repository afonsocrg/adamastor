"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/tailwind/ui/button";
import type { JSONContent } from "novel";
import { updatePost } from "@/lib/posts";

interface EditPostClientProps {
  postId: string;
  title: string;
  initialContent: JSONContent;
}

export default function EditPostClient({ postId, title, initialContent }: EditPostClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [titleState, setTitleState] = useState(title);
  const [content, setContent] = useState(initialContent);

  const handleSavePost = () => {
    const response = updatePost({ id: postId, title: titleState, content });
    // console.log({response});
  };


  return (
    <div className="flex flex-col gap-4">
      <div className="mb-4 flex gap-2 items-center">
          <input
            placeholder="The title of your post..."
            type="text"
            value={titleState}
            onChange={(e) => setTitleState(e.target.value)} 
            className="flex-1 p-2 rounded-md border border-gray-300 text-3xl font-bold border-none focused:border-none"
          />
        <Button onClick={handleSavePost} variant="outline">
          Save
        </Button>
      </div>
      <TailwindAdvancedEditor 
        initialContent={content} 
        savePost={(newContent) => {
          setContent(newContent);
        }} 
        // showSaveStatus={false}
      />
    </div>
  );
} 