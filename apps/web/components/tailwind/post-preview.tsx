"use client";

import { urenoContent } from "@/lib/customContent";
import type { JSONContent } from "novel";
import { useEffect, useState } from "react";
import RichTextEditor from "./rich-text-editor";

const PostPreview = () => {
  const [initialContent, setInitialContent] = useState<null | JSONContent>(null);

  useEffect(() => {
    const content = window.localStorage.getItem("novel-content");
    if (content) setInitialContent(JSON.parse(content));
    else setInitialContent(urenoContent);
  }, []);

  if (!initialContent) return null;
  return <RichTextEditor initialContent={initialContent} editorProps={{ editable: () => false }} />;
};

export default PostPreview;
