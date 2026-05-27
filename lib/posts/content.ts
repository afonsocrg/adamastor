/**
 * Shared TipTap JSON helpers. Walking the document tree by hand keeps the
 * `novel` / `@tiptap/core` dep graph out of server components (per
 * [[feedback_tiptap_preview_walker]]).
 */

/** Concatenate every `text` leaf in a TipTap document into one string. */
export function extractTiptapText(node: unknown): string {
	if (!node || typeof node !== "object") return "";
	const n = node as { text?: unknown; content?: unknown };
	if (typeof n.text === "string") return n.text;
	if (!Array.isArray(n.content)) return "";
	return n.content.map(extractTiptapText).join(" ");
}

/**
 * Estimate reading time in whole minutes at ~225 wpm (Medium-aligned). Minimum
 * floor of 1 min so even short Weeklies don't read "0 min read." Words are
 * counted on whitespace splits — close enough for editorial copy.
 */
export function estimateReadingMinutes(content: unknown): number {
	const text = extractTiptapText(content);
	const words = text.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 225));
}
