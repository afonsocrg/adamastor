"use client";

import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { Button } from "@/components/tailwind/ui/button";
import { type Post, updatePost } from "@/lib/posts";
import type { JSONContent } from "novel";
import { useState } from "react";

interface EditPostClientProps {
  post: Post;
}

export default function EditPostClient({ post }: EditPostClientProps) {
  const [titleState, setTitleState] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [editorSaved, setEditorSaved] = useState(true);
  const [changesSinceLastSave, setChangesSinceLastSave] = useState(false);

  const handleSavePost = async () => {
    const response = await updatePost({ id: post.id, title: titleState, content });
    setChangesSinceLastSave(false);
  };

  const handlePublishPost = async () => {
    const response = await updatePost({ id: post.id, title: titleState, content, is_public: true });
    setChangesSinceLastSave(false);
  };

  const handleEditorUpdate = () => {
    setEditorSaved(false);
    setChangesSinceLastSave(true);
  };

  const handleEditorSave = (content: JSONContent) => {
    setContent(content);
    setEditorSaved(true);
    setChangesSinceLastSave(true);
  };

  const buttonsDisabled = !editorSaved || !changesSinceLastSave;

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-4 flex gap-2 items-center">
        <input
          placeholder="The title of your post..."
          type="text"
          value={titleState}
          onChange={(e) => setTitleState(e.target.value)}
          className="flex-1 p-2 rounded-md border border-neutral-300 text-3xl font-bold border-none focused:border-none"
        />
        {!post.is_public ? (
          <>
            <Button onClick={handleSavePost} variant="outline" disabled={buttonsDisabled}>
              Save Draft
            </Button>
            <Button onClick={handlePublishPost} variant="outline" disabled={buttonsDisabled}>
              Publish
            </Button>
          </>
        ) : (
          <Button onClick={handleSavePost} variant="outline" disabled={buttonsDisabled}>
            Save
          </Button>
        )}
      </div>
      <TailwindAdvancedEditor
        initialContent={content}
        savePost={handleEditorSave}
        onUpdate={handleEditorUpdate}
        showSaveStatus={false}
      />
    </div>
  );
}
