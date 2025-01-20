"use client";

import { defaultEditorContent } from "@/lib/content";
import type { JSONContent } from "novel";
import { useEffect, useState } from "react";
import RichTextEditor from "./rich-text-editor";

const PostPreview = () => {
  const [initialContent, setInitialContent] = useState<null | JSONContent>(null);

  useEffect(() => {
    const content = window.localStorage.getItem("novel-content");
    if (content) setInitialContent(JSON.parse(content));
    else setInitialContent(defaultEditorContent);
  }, []);

  if (!initialContent) return null;
  return <RichTextEditor initialContent={initialContent} editorProps={{ editable: () => false }} />;
};

export default PostPreview;
