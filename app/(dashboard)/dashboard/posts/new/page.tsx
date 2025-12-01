"use client";

import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { Button } from "@/components/tailwind/ui/button";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useRouter } from "next/navigation";
import type { JSONContent } from "novel";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { publishPost, saveDraft } from "./actions";

const SAVED_DRAFT_KEY = "savedDraft";
const SAVED_TITLE_KEY = "savedTitle";

export default function NewPostPage() {
  const [title, setTitle] = useLocalStorage<string>(SAVED_TITLE_KEY, "");
  const [savedDraft, setSavedDraft] = useLocalStorage<JSONContent>(SAVED_DRAFT_KEY, {});
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const router = useRouter();

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
      const post = await saveDraft(title, savedDraft);
      toast.success("Draft saved successfully");
      router.push(`/dashboard/posts/${post.id}/edit`);
      setTitle("");
      setSavedDraft({});
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishPost = async () => {
    try {
      setIsPublishing(true);
      const post = await publishPost(title, savedDraft);
      toast.success("Post published successfully");
      setTitle("");
      setSavedDraft({});
      router.push(`/`);
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error("Failed to publish post");
    } finally {
      setIsPublishing(false);
    }
  };

  // Check if we can save/publish
  const hasContent = title.trim() || (savedDraft && Object.keys(savedDraft).length > 0);
  const canSave = hasContent && !isSaving && !isPublishing;
  const canPublish = hasContent && !isSaving && !isPublishing;

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
        {/* Title input */}
        <div className="relative">
          {isEditorLoading ? (
            <Skeleton className="h-12 w-full rounded-md" />
          ) : (
            <input
              placeholder="The title of your post..."
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="title-input w-full resize-none overflow-hidden rounded-md border-0 bg-transparent p-0 text-3xl font-bold text-[#104357] placeholder:text-neutral-400 focus:outline-none focus:ring-0 dark:text-[#E3F2F7] dark:placeholder:text-neutral-600"
              style={{
                minHeight: "48px",
              }}
              autoFocus
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