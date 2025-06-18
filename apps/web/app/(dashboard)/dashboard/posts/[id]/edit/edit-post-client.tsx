"use client";

import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { type Post, updatePost, publishPost, unpublishPost } from "@/lib/posts";
import type { JSONContent } from "novel";
import { ActionButton } from "@/components/ActionButton";
import { useMemo, useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/tailwind/ui/skeleton"; // Assuming this is where your skeleton component is

interface EditPostClientProps {
  post: Post;
}

const murmurHash = (str: string) => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h1 >>> 0).toString(16).padStart(8, "0") +
    (h2 >>> 0).toString(16).padStart(8, "0")
  );
};

function hashPost(title: string, content: JSONContent) {
  const data = JSON.stringify({
    title,
    content,
  });
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const result = murmurHash(new TextDecoder().decode(dataBuffer));
  return result;
}

export default function EditPostClient({ post }: EditPostClientProps) {
  const [titleState, setTitleState] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [isPublished, setIsPublished] = useState(post.is_public);
  const [isEditorLoading, setIsEditorLoading] = useState(true);

  // Using a ref to track if editor has been initialized
  const editorInitialized = useRef(false);

  // Fallback timeout in case onUpdate never fires
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isEditorLoading) {
        setIsEditorLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isEditorLoading]);

  // This state is true when `content` contains the most up to date content
  // from the novel editor.
  const [editorSaved, setEditorSaved] = useState(true);

  const [initialPostHash, setInitialPostHash] = useState(
    hashPost(post.title, post.content),
  );

  const currentHash = useMemo(() => {
    return hashPost(titleState, content);
  }, [titleState, content]);

  const handleSavePost = async () => {
    const response = await updatePost({
      id: post.id,
      title: titleState,
      content,
    });
    setInitialPostHash(hashPost(titleState, content));
  };

  const handlePublishPost = async () => {
    const response = await publishPost({ id: post.id });
    setIsPublished(true);
  };

  const handleUnpublishPost = async () => {
    const response = await unpublishPost({ id: post.id });
    setIsPublished(false);
  };

  // This function is called whenever there is a change in the editor
  const handleEditorUpdate = () => {
    setEditorSaved(false);
    // Remove the loading state when editor first updates
    if (!editorInitialized.current) {
      editorInitialized.current = true;
      setIsEditorLoading(false);
    }
  };

  // This function is called when the editor gives us the most up to date content
  const handleEditorSave = (content: JSONContent) => {
    setContent(content);
    setEditorSaved(true);
  };

  const hasChanges = initialPostHash !== currentHash;
  const saveDisabled = !editorSaved || !hasChanges;
  const publishDisabled = !editorSaved || hasChanges || isPublished;

  return (
    <div className="min-h-screen p-8">
      {/* Action buttons - fixed position */}
      <div className="fixed top-4 right-4 z-10 flex gap-2">
        <ActionButton
          onClick={handleSavePost}
          variant="outline"
          disabled={saveDisabled}
          label={hasChanges ? (isPublished ? "Save" : "Save Draft") : "Saved"}
          loadingLabel="Saving..."
        />
        
        {!isPublished && (
          <ActionButton
            onClick={handlePublishPost}
            variant="outline"
            label="Publish"
            disabled={publishDisabled}
            loadingLabel="Publishing..."
          />
        )}
        {isPublished && (
          <ActionButton
            onClick={handleUnpublishPost}
            variant="outline"
            label="Unpublish"
            loadingLabel="Unpublishing..."
          />
        )}
      </div>

      {/* Main content container - centered with consistent width */}
      <div className="mx-auto max-w-[750px] space-y-6">
        {/* Title input */}
        <div className="relative">
          {isEditorLoading ? (
            <Skeleton className="h-12 w-full rounded-md" />
          ) : (
            <input
              placeholder="The title of your post..."
              type="text"
              value={titleState}
              onChange={(e) => {
                setTitleState(e.target.value);
              }}
              className="title-input w-full resize-none overflow-hidden rounded-md border-0 bg-transparent p-0 text-3xl font-bold text-[#104357] placeholder:text-neutral-400 focus:outline-none focus:ring-0 dark:text-[#E3F2F7] dark:placeholder:text-neutral-600"
              style={{
                // Prevent layout shift by setting a min-height
                minHeight: "48px",
              }}
            />
          )}
        </div>

        {/* Editor container */}
        <div className="relative">
          {isEditorLoading && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-64 w-full rounded-md" />
            </div>
          )}
          
          <div className={isEditorLoading ? "invisible absolute inset-0" : "visible editor-fade-in"}>
            <TailwindAdvancedEditor
              initialContent={content}
              savePost={handleEditorSave}
              onUpdate={handleEditorUpdate}
              showSaveStatus={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}