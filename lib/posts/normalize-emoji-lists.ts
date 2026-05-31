import type { JSONContent } from "novel";

/**
 * Render-time normalisation: coerce runs of emoji-prefixed paragraphs into
 * proper bulleted lists, preserving the emoji as the visible bullet marker.
 *
 * Adamastor Weekly historically uses emoji-prefixed paragraphs as visual
 * lists — 🔷 Highlights, 👏 Congrats, 📚🎧🎥 Read/Listen/Watch, 💡 Events.
 * Without normalisation these render as standalone paragraphs, missing the
 * list typography defined under `.article-prose ul` (tighter rhythm, hanging
 * indent on wrap) and lacking semantic `<ul>` markup.
 *
 * This walks the TipTap JSON top-level, groups consecutive emoji-paragraphs
 * into `bulletList` nodes tagged with `attrs.class = "emoji-list"`. The
 * leading emoji is left in place — it serves as the bullet — and the CSS
 * rule in `styles/prosemirror.css` suppresses the default disc bullet for
 * `ul.emoji-list` while providing the hanging-indent layout. Source content
 * in the DB is never modified; the transform runs at render time inside
 * `PostPreview`. Carlos keeps writing emoji-paragraphs; readers see proper
 * lists with the emoji as a pre-attentive scan marker.
 *
 * See `docs/typography.md` — "Adamastor Weekly — emoji-led sections".
 */

// ️ / ‍ handle emoji built from variation selectors or ZWJ
// sequences (skin-tone modifiers, family glyphs). Constructed via RegExp()
// so the escapes survive editors that strip invisible Unicode chars.
// Group 1 captures the emoji run WITHOUT its trailing whitespace, so we can
// collapse the variable number of spaces Carlos types after it (see
// collapseEmojiPrefixWhitespace).
const EMOJI_PREFIX_RE = new RegExp(
	"^((?:\\p{Extended_Pictographic}[\\uFE0F\\u200D]*)+)\\s+",
	"u",
);

function getFirstText(node: JSONContent): string {
	if (node.type === "text" && typeof node.text === "string") return node.text;
	if (Array.isArray(node.content)) {
		for (const child of node.content) {
			const t = getFirstText(child);
			if (t) return t;
		}
	}
	return "";
}

function isEmojiParagraph(node: JSONContent): boolean {
	if (node.type !== "paragraph") return false;
	return EMOJI_PREFIX_RE.test(getFirstText(node));
}

/**
 * Collapse the whitespace after the leading emoji to a single space.
 *
 * The emoji glyph is a fixed 1em advance, but Carlos sometimes types 2–3
 * spaces after it. ProseMirror renders the read-only view with
 * `white-space: pre-wrap`, so those runs are NOT collapsed the way normal HTML
 * would collapse them — the prefix ends up wider for 🎥 / 👏 than for 💡 / 🔷.
 * Since `ul.emoji-list` uses a fixed hanging indent (1.3em ≈ emoji + one
 * space), an uneven prefix pushes the wrap line out of alignment with the
 * first-line text. Normalising to exactly one space makes every marker the
 * same width, so the indent lines up for every emoji. DB content is untouched;
 * this rewrites only the in-memory render copy.
 */
function collapseEmojiPrefixWhitespace(paragraph: JSONContent): JSONContent {
	if (!Array.isArray(paragraph.content)) return paragraph;
	const idx = paragraph.content.findIndex(
		(n) => n.type === "text" && typeof n.text === "string",
	);
	if (idx === -1) return paragraph;
	const node = paragraph.content[idx];
	const collapsed = (node.text as string).replace(
		EMOJI_PREFIX_RE,
		(_match, emojiRun: string) => `${emojiRun} `,
	);
	if (collapsed === node.text) return paragraph;
	const content = paragraph.content.slice();
	content[idx] = { ...node, text: collapsed };
	return { ...paragraph, content };
}

export function normalizeEmojiLists(doc: JSONContent): JSONContent {
	if (!Array.isArray(doc.content)) return doc;

	const newContent: JSONContent[] = [];
	let run: JSONContent[] = [];

	const flushRun = () => {
		if (run.length === 0) return;
		newContent.push({
			type: "bulletList",
			attrs: { class: "emoji-list" },
			content: run.map((p) => ({
				type: "listItem",
				content: [collapseEmojiPrefixWhitespace(p)],
			})),
		});
		run = [];
	};

	for (const node of doc.content) {
		if (isEmojiParagraph(node)) {
			run.push(node);
		} else {
			flushRun();
			newContent.push(node);
		}
	}
	flushRun();

	return { ...doc, content: newContent };
}
