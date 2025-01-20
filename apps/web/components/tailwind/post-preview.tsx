"use client";
import type { JSONContent } from "novel";
import RichTextEditor from "./rich-text-editor";

const PostPreview = ({ initialContent }: { initialContent: JSONContent }) => {
  if (!initialContent) return null;
  return <RichTextEditor initialContent={initialContent} editorProps={{ editable: () => false }} />;
};

export default PostPreview;
