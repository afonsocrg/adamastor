/**
 * TipTap JSON to HTML Converter for Email
 *
 * This module converts TipTap/Novel JSON content to HTML suitable for emails.
 *
 * Why we need this:
 * - TipTap stores content as JSON (ProseMirror format)
 * - Emails require HTML
 * - Email HTML has limitations (no JS, limited CSS)
 *
 * The @tiptap/html package provides generateHTML() which does the heavy lifting,
 * but we need to configure it with the same extensions used in your editor.
 */

import { generateHTML } from "@tiptap/html";

// Import the extensions that match your editor configuration
// These must match what's in your RichTextEditor/extensions.ts
import {
	Color,
	StarterKit,
	TaskItem,
	TaskList,
	TextStyle,
	TiptapImage,
	TiptapLink,
	TiptapUnderline,
	Youtube,
} from "novel";

import type { JSONContent } from "novel";

/**
 * Extensions array matching your editor configuration
 *
 * Important: This MUST stay in sync with your editor's extensions.
 * If you add new extensions to your editor, add them here too.
 *
 * The order matters for some extensions (StarterKit should be first).
 */
const emailExtensions = [
	StarterKit,
	TaskItem,
	TaskList,
	TiptapImage,
	TiptapUnderline,
	TextStyle,
	Color,
	TiptapLink,
	Youtube,
];

/**
 * Converts TipTap JSON content to HTML string
 *
 * @param content - The TipTap JSON content from your Supabase posts table
 * @returns HTML string suitable for email rendering
 *
 * @example
 * const html = tiptapToHtml(post.content);
 * // Returns: "<h2>Hello World</h2><p>This is a paragraph...</p>"
 */
export function tiptapToHtml(content: JSONContent): string {
	try {
		// generateHTML is the core TipTap function that converts JSON → HTML
		// It needs the same extensions your editor uses to properly render each node type
		const html = generateHTML(content, emailExtensions);
		return html;
	} catch (error) {
		console.error("Error converting TipTap content to HTML:", error);
		// Return a fallback message rather than crashing
		return "<p>Content could not be rendered.</p>";
	}
}

/**
 * Wraps the generated HTML with email-safe inline styles
 *
 * Email clients have poor CSS support, so we need to:
 * 1. Use inline styles instead of classes
 * 2. Use simple, well-supported CSS properties
 * 3. Avoid modern CSS features
 *
 * This function adds basic typography styles that work across email clients.
 */
export function wrapWithEmailStyles(html: string): string {
	// These styles make the content readable in email clients
	// We're being conservative with CSS to ensure broad compatibility
	return `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #374151;
    ">
      ${html}
    </div>
  `;
}

/**
 * Complete conversion pipeline: JSON → HTML → Email-safe HTML
 *
 * Use this as the main entry point for email content conversion.
 */
export function convertPostContentForEmail(content: JSONContent): string {
	const html = tiptapToHtml(content);
	return wrapWithEmailStyles(html);
}
