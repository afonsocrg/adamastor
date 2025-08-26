"use client";

import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { Button } from "@/components/tailwind/ui/button";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Label } from "@/components/tailwind/ui/label";
import { SlugInput } from "@/components/SlugInput";
import { generateSlug } from "@/lib/slug-utils";
import { useRouter } from "next/navigation";
import type { JSONContent } from "novel";
import { useState, useEffect, useRef } from "react";
import { publishPost, saveDraft } from "./actions";

const SAVED_DRAFT_KEY = "savedDraft";
const SAVED_TITLE_KEY = "savedTitle";
const SAVED_SLUG_KEY = "savedSlug";

export default function NewPostPage() {
  const [title, setTitle] = useLocalStorage<string>(SAVED_TITLE_KEY, "");
  const [slug, setSlug] = useLocalStorage<string>(SAVED_SLUG_KEY, "");
  const [savedDraft, setSavedDraft] = useLocalStorage<JSONContent>(SAVED_DRAFT_KEY, {});
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const router = useRouter();

  // Using a ref to track if editor has been initialized
  const editorInitialized = useRef(false);

  // Automatically update slug when title changes
  useEffect(() => {
    if (title.trim()) {
      const generatedSlug = generateSlug(title);
      setSlug(prevSlug => {
        // Only update if the slug is actually different to prevent unnecessary re-renders
        return prevSlug !== generatedSlug ? generatedSlug : prevSlug;
      });
    } else {
      setSlug(prevSlug => prevSlug !== '' ? '' : prevSlug);
    }
  }, [title]);

  // Fallback timeout in case onUpdate never fires
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isEditorLoading) {
        setIsEditorLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isEditorLoading]);

  const handleSaveLocalContent = (content: JSONContent) => {
    setSavedDraft(content);
  };

  const handleEditorUpdate = () => {
    // Remove the loading state when editor first updates
    if (!editorInitialized.current) {
      editorInitialized.current = true;
      setIsEditorLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      const post = await saveDraft(title, savedDraft, slug);
      router.push(`/dashboard/posts/${post.id}/edit`);
      setTitle("");
      setSlug("");
      setSavedDraft({});
    } catch (error) {
      console.error('Error saving draft:', error);
      // You could add toast notification here
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishPost = async () => {
    try {
      setIsPublishing(true);
      const post = await publishPost(title, savedDraft, slug);
      console.log("Post published successfully", post);
      setTitle("");
      setSlug("");
      setSavedDraft({});
      router.push(`/`);
    } catch (error) {
      console.error('Error publishing post:', error);
      // You could add toast notification here
    } finally {
      setIsPublishing(false);
    }
  };

  // Check if we can save/publish
  const hasContent = title.trim() || (savedDraft && Object.keys(savedDraft).length > 0);
  const hasValidSlug = slug.trim().length > 0;
  const canSave = hasContent && !isSaving && !isPublishing;
  const canPublish = hasContent && hasValidSlug && !isSaving && !isPublishing;

  return (
    <div className="min-h-screen p-8">
      {/* Action buttons - fixed position */}
      <div className="fixed top-4 right-4 z-10 flex gap-2">
        <Button 
          onClick={handleSaveDraft} 
          variant="outline" 
          className="rounded-lg"
          disabled={!canSave}
        >
          {isSaving ? "Saving..." : "Save Draft"}
        </Button>
        <Button 
          onClick={handlePublishPost} 
          variant="outline" 
          className="rounded-lg"
          disabled={!canPublish}
        >
          {isPublishing ? "Publishing..." : "Publish"}
        </Button>
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="title-input w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-2xl font-bold text-[#104357] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:text-[#E3F2F7] dark:placeholder:text-neutral-600"
                style={{
                  minHeight: "48px",
                }}
                autoFocus
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
                  value={slug}
                  onChange={setSlug}
                  title="" // Don't auto-generate from title since we handle it in parent
                  placeholder="url-slug"
                />
                <p className="text-sm text-muted-foreground">
                  Your post will be available at{' '}
                  <span className="font-mono">
                    https://adamastor.blog/posts/{slug || 'your-slug'}
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
              initialContent={savedDraft} 
              savePost={handleSaveLocalContent}
              onUpdate={handleEditorUpdate}
              showSaveStatus={false} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}