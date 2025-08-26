"use client";

import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { type Post, updatePost, publishPost, unpublishPost } from "@/lib/posts";
import type { JSONContent } from "novel";
import { ActionButton } from "@/components/ActionButton";
import { useMemo, useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { Label } from "@/components/tailwind/ui/label";
import { SlugInput } from "@/components/SlugInput";
import { SlugChangeWarning } from "@/components/SlugChangeWarning"; // Assuming this is where your skeleton component is

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

function hashPost(title: string, content: JSONContent, slug: string) {
  const data = JSON.stringify({
    title,
    content,
    slug,
  });
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const result = murmurHash(new TextDecoder().decode(dataBuffer));
  return result;
}

export default function EditPostClient({ post }: EditPostClientProps) {
  const [titleState, setTitleState] = useState(post.title);
  const [slugState, setSlugState] = useState(post.slug || '');
  const [originalSlug] = useState(post.slug || '');
  const [content, setContent] = useState(post.content);
  const [isPublished, setIsPublished] = useState(post.is_public);
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [showSlugWarning, setShowSlugWarning] = useState(false);
  const [pendingSlugChange, setPendingSlugChange] = useState('');

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
    hashPost(post.title, post.content, post.slug || ''),
  );

  const currentHash = useMemo(() => {
    return hashPost(titleState, content, slugState);
  }, [titleState, content, slugState]);

  const handleSavePost = async () => {
    const response = await updatePost({
      id: post.id,
      title: titleState,
      content,
      slug: slugState,
    });
    setInitialPostHash(hashPost(titleState, content, slugState));
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

  // Handle slug change with warning for published posts
  const handleSlugChange = (newSlug: string) => {
    if (isPublished && originalSlug && newSlug !== originalSlug && newSlug !== slugState) {
      setPendingSlugChange(newSlug);
      setShowSlugWarning(true);
    } else {
      setSlugState(newSlug);
    }
  };

  const handleSlugChangeConfirm = () => {
    setSlugState(pendingSlugChange);
    setPendingSlugChange('');
  };

  const handleSlugChangeCancel = () => {
    setPendingSlugChange('');
  };

  return (
    <div className="min-h-screen p-8">
      <SlugChangeWarning
        isOpen={showSlugWarning}
        onOpenChange={setShowSlugWarning}
        onConfirm={handleSlugChangeConfirm}
        originalSlug={originalSlug}
        newSlug={pendingSlugChange}
      />
      
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
        {/* Title and Slug inputs */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-lg font-semibold mb-2 block">
              Title
            </Label>
            {isEditorLoading ? (
              <Skeleton className="h-12 w-full rounded-md" />
            ) : (
              <input
                id="title"
                placeholder="The title of your post..."
                type="text"
                value={titleState}
                onChange={(e) => {
                  setTitleState(e.target.value);
                }}
                className="title-input w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-2xl font-bold text-[#104357] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:text-[#E3F2F7] dark:placeholder:text-neutral-600"
                style={{
                  minHeight: "48px",
                }}
              />
            )}
          </div>

          <div>
            <Label htmlFor="slug" className="text-lg font-semibold mb-2 block">
              URL Slug
            </Label>
            {isEditorLoading ? (
              <Skeleton className="h-10 w-full rounded-md" />
            ) : (
              <div className="space-y-2">
                <SlugInput
                  id="slug"
                  value={slugState}
                  onChange={handleSlugChange}
                  title={titleState}
                  excludeId={post.id}
                  placeholder="url-slug"
                />
                <p className="text-sm text-muted-foreground">
                  Your post will be available at{' '}
                  <span className="font-mono">
                    https://adamastor.blog/posts/{slugState || 'your-slug'}
                  </span>
                </p>
              </div>
            )}
          </div>
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