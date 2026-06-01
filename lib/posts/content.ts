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

/**
 * Return a copy of a TipTap document with any `link` mark that has no usable
 * href stripped (the text is preserved). An editor slip — applying a link with
 * an empty URL — otherwise renders as an `<a>` with no `href`: a dead,
 * non-crawlable anchor that fails Lighthouse SEO and confuses crawlers/AI.
 * Render-time only; never mutates the stored content. Generic so callers keep
 * their node type (JSONContent stays JSONContent).
 */
export function stripEmptyLinkMarks<T>(node: T): T {
	if (!node || typeof node !== "object") return node;
	const n = node as { marks?: unknown; content?: unknown };
	const next = { ...(node as Record<string, unknown>) };
	if (Array.isArray(n.marks)) {
		// Keep every non-link mark; keep link marks only when they carry a real
		// href. An empty marks array is valid TipTap (renders the text plain).
		next.marks = (n.marks as Array<{ type?: string; attrs?: { href?: unknown } }>).filter(
			(mark) => mark?.type !== "link" || (typeof mark?.attrs?.href === "string" && mark.attrs.href.trim() !== ""),
		);
	}
	if (Array.isArray(n.content)) {
		next.content = (n.content as unknown[]).map((child) => stripEmptyLinkMarks(child));
	}
	return next as T;
}
