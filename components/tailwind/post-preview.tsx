"use client";

// Body typography reference: see `docs/typography.md` — particularly the
// "Reading column" and "Body typography (.article-prose)" sections for the
// reasoning behind the 60ch measure and the prose-lg / leading-relaxed stack.

import type { JSONContent } from "novel";
import { normalizeEmojiLists } from "@/lib/posts/normalize-emoji-lists";
import { normalizeTypography } from "@/lib/posts/normalize-typography";
import RichTextEditor from "./rich-text-editor";

const PostPreview = ({ initialContent }: { initialContent: JSONContent }) => {
	if (!initialContent) return null;
	// Render-time transforms over the stored TipTap JSON:
	//   1. normalizeTypography — ASCII shortcuts → proper Unicode (curly
	//      quotes, em-dash, ellipsis). Operates only on text-node strings.
	//   2. normalizeEmojiLists — runs of emoji-prefixed paragraphs → <ul>.
	// Order is independent (typography reads node-by-node; emoji detection
	// only inspects the leading emoji), so #1 first reads cleanly.
	const content = normalizeEmojiLists(normalizeTypography(initialContent));
	return (
		<RichTextEditor
			initialContent={content}
			editorProps={{
				editable: () => false,
				attributes: {
					class:
						"article-prose prose prose-lg dark:prose-invert prose-headings:font-title prose-headings:text-balance prose-h1:leading-tight prose-h2:leading-tight prose-h3:leading-snug font-default focus:outline-none max-w-[60ch] mx-auto leading-relaxed prose-p:leading-relaxed prose-li:leading-relaxed",
				},
			}}
		/>
	);
};

export default PostPreview;
