"use client";

import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { type Post, updatePost, publishPost, unpublishPost } from "@/lib/posts";
import type { JSONContent } from "novel";
import { ActionButton } from "@/components/ActionButton";
import { useMemo, useState } from "react";

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
    // const { post } = await response.json();
  };

  const handleUnpublishPost = async () => {
    const response = await unpublishPost({ id: post.id });
    setIsPublished(false);
    // setInitialPostHash(currentHash);
  };

  // This function is called whenever there is a change in the editor
  // For performance reasons, Novel does not return the content
  const handleEditorUpdate = () => {
    // console.log("handleEditorUpdate");
    setEditorSaved(false);
  };

  // This function is called when the editor gives us the most up to date content
  const handleEditorSave = (content: JSONContent) => {
    // console.log("handleEditorSave");
    setContent(content);
    setEditorSaved(true);
  };

  const hasChanges = initialPostHash !== currentHash;
  const saveDisabled = !editorSaved || !hasChanges;
  const publishDisabled = !editorSaved || hasChanges || isPublished;

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="mb-4 flex gap-2 items-center">
        <input
          placeholder="The title of your post..."
          type="text"
          value={titleState}
          onChange={(e) => {
            setTitleState(e.target.value);
          }}
          className="flex-1 p-2 rounded-md border border-neutral-300 text-3xl font-bold border-none focused:border-none outline-none text-[#104357] dark:text-[#E3F2F7]"
        />

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
          <>
            <ActionButton
              onClick={handleUnpublishPost}
              variant="outline"
              label="Unpublish"
              loadingLabel="Unpublishing..."
            />
          </>
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
