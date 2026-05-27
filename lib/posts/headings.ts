export interface PostHeading {
	level: 2 | 3;
	text: string;
	slug: string;
}

/**
 * Concatenate every `text` leaf inside a heading node WITHOUT inserting
 * spaces between siblings. Headings often mix inline marks (`**H**ighlights`
 * renders as adjacent `strong:"H"` + `text:"ighlights"` nodes) — the
 * generic body walker joins with spaces, which would produce `"H ighlights"`
 * and a `h-ighlights` slug. This walker concatenates marks the way the DOM
 * does.
 */
function extractHeadingText(node: unknown): string {
	if (!node || typeof node !== "object") return "";
	const n = node as { text?: unknown; content?: unknown };
	if (typeof n.text === "string") return n.text;
	if (!Array.isArray(n.content)) return "";
	return n.content.map(extractHeadingText).join("");
}

const SLUG_BAD_CHARS = /[^a-z0-9\s-]/g;
const SLUG_WHITESPACE = /\s+/g;
const SLUG_DASHES = /-+/g;

function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.replace(SLUG_BAD_CHARS, "")
		.trim()
		.replace(SLUG_WHITESPACE, "-")
		.replace(SLUG_DASHES, "-");
}

/**
 * Walk a TipTap document and pull every h2/h3 with its text and a unique
 * slug. Duplicate slugs are disambiguated with a `-2`, `-3` suffix so anchor
 * targets stay unique across the page.
 *
 * h1 is excluded — the post H1 lives in the hero, not in the body, and a TOC
 * entry for it would be redundant.
 */
export function extractHeadings(content: unknown): PostHeading[] {
	const headings: PostHeading[] = [];
	const seen = new Map<string, number>();

	function visit(node: unknown) {
		if (!node || typeof node !== "object") return;
		const n = node as { type?: string; attrs?: { level?: number }; content?: unknown };

		if (n.type === "heading") {
			const level = n.attrs?.level;
			if (level === 2 || level === 3) {
				const text = extractHeadingText(node).trim();
				if (text) {
					const baseSlug = slugify(text) || `section-${headings.length + 1}`;
					const count = seen.get(baseSlug) ?? 0;
					seen.set(baseSlug, count + 1);
					const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
					headings.push({ level, text, slug });
				}
			}
		}

		if (Array.isArray(n.content)) {
			for (const child of n.content) visit(child);
		}
	}

	visit(content);
	return headings;
}
