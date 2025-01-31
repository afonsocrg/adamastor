"use client";

import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { Button } from "@/components/tailwind/ui/button";
import { useRouter } from "next/navigation";
import type { JSONContent } from "novel";
import { useLocalStorage } from "@uidotdev/usehooks";
import { createPost } from "@/lib/posts";

const SAVED_DRAFT_KEY = 'savedDraft';
const SAVED_TITLE_KEY = 'savedTitle';

export default function NewPostPage() {
  const [title, setTitle] = useLocalStorage<string>(SAVED_TITLE_KEY, '');
  const [savedDraft, setSavedDraft] = useLocalStorage<JSONContent>(SAVED_DRAFT_KEY, {});
  const router = useRouter();

  const handleSavePost = (content: JSONContent) => {
    setSavedDraft(content);
  };

  const handlePublishPost = async () => {
    try {
      createPost({ title, content: savedDraft });

      setTitle('');
      setSavedDraft({});

      router.push(`/`);
    } catch (error) {
      console.error('Error publishing post:', error);
      // Add error handling (e.g., show an error message to the user)
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-4 flex gap-2 items-center">
          <input
            placeholder="The title of your post..."
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)} 
            className="flex-1 p-2 rounded-md border border-gray-300 text-3xl font-bold border-none focused:border-none"
          />
        {/* <Button onClick={handleSaveDraft} variant="outline">
          Save Draft
        </Button> */}
        <Button onClick={handlePublishPost} variant="outline">
          Publish
        </Button>
      </div>
      <TailwindAdvancedEditor
        initialContent={savedDraft}
        savePost={handleSavePost}
        showSaveStatus={false}
      />
    </div>
  );
}
