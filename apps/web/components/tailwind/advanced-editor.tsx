"use client";
import {
  type EditorInstance,
  type JSONContent,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
} from "novel";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { uploadFn } from "./image-upload";
import RichTextEditor from "./rich-text-editor";

const hljs = require("highlight.js");

interface TailwindAdvancedEditorProps {
  initialContent: JSONContent;
  savePost: (content: JSONContent) => void;
}

const TailwindAdvancedEditor = ({ initialContent, savePost }: TailwindAdvancedEditorProps) => {
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [charsCount, setCharsCount] = useState();

  //Apply Codeblock Highlighting on the HTML from editor.getHTML()
  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, "text/html");
    doc.querySelectorAll("pre code").forEach((el) => {
      // @ts-ignore
      // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
      hljs.highlightElement(el);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  const debouncedUpdates = useDebouncedCallback(async (editor: EditorInstance) => {
    const json = editor.getJSON();
    setCharsCount(editor.storage.characterCount.words());
    // window.localStorage.setItem("html-content", highlightCodeblocks(editor.getHTML()));
    // window.localStorage.setItem("novel-content", JSON.stringify(json));
    // window.localStorage.setItem("markdown", editor.storage.markdown.getMarkdown());
    savePost(json);
    setSaveStatus("Saved");
  }, 500);

  if (!initialContent) return null;

  return (
    <div className="relative w-full">
      <div className="flex absolute right-5 top-5 z-10 mb-5 gap-2">
        <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">{saveStatus}</div>
        <div className={charsCount ? "rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground" : "hidden"}>
          {charsCount} Words
        </div>
      </div>
      <RichTextEditor
        initialContent={initialContent}
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },
          handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
          handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
        }}
        onUpdate={({ editor }) => {
          debouncedUpdates(editor);
          setSaveStatus("Unsaved");
        }}
      />
    </div>
  );
};

export default TailwindAdvancedEditor;
