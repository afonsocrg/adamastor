"use client";

import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { Button } from "@/components/tailwind/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useRouter } from "next/navigation";
import type { JSONContent } from "novel";
import { publishPost, saveDraft } from "./actions";

const SAVED_DRAFT_KEY = "savedDraft";
const SAVED_TITLE_KEY = "savedTitle";

export default function NewPostPage() {
  const [title, setTitle] = useLocalStorage<string>(SAVED_TITLE_KEY, "");
  const [savedDraft, setSavedDraft] = useLocalStorage<JSONContent>(SAVED_DRAFT_KEY, {});
  const router = useRouter();

  const handleSaveLocalContent = (content: JSONContent) => {
    setSavedDraft(content);
  };

  const handleSaveDraft = async () => {
    await saveDraft(title, savedDraft);
    setTitle("");
    setSavedDraft({});
    router.push(`/profile`, {});
  };

  const handlePublishPost = async () => {
    // try {
    //   await createPost(title, savedDraft);

    //   setTitle('');
    //   setSavedDraft({});

    //   // router.push(`/`, { });
    // } catch (error) {
    //   console.error('Error publishing post:', error);
    //   // Add error handling (e.g., show an error message to the user)
    // }
    const post = await publishPost(title, savedDraft);
    console.log("Post published successfully", post);
    setTitle("");
    setSavedDraft({});
    router.push(`/`, {});
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-4 flex gap-2 items-center">
        <input
          placeholder="The title of your post..."
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 p-2 rounded-md border border-neutral-300 text-3xl font-bold border-none focused:border-none"
        />
        <Button onClick={handleSaveDraft} variant="outline">
          Save Draft
        </Button>
        <Button onClick={handlePublishPost} variant="outline">
          Publish
        </Button>
      </div>
      <TailwindAdvancedEditor initialContent={savedDraft} savePost={handleSaveLocalContent} showSaveStatus={false} />
    </div>
  );
}
