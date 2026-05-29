import type { JSONContent } from "novel";

/**
 * Render-time normalisation: coerce runs of emoji-prefixed paragraphs into
 * proper bulleted lists, preserving the emoji as the visible bullet marker.
 *
 * Weekly Adamastor historically uses emoji-prefixed paragraphs as visual
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
 * See `docs/typography.md` — "Weekly Adamastor — emoji-led sections".
 */

// ️ / ‍ handle emoji built from variation selectors or ZWJ
// sequences (skin-tone modifiers, family glyphs). Constructed via RegExp()
// so the escapes survive editors that strip invisible Unicode chars.
const EMOJI_PREFIX_RE = new RegExp(
	"^(\\p{Extended_Pictographic}[\\uFE0F\\u200D]*)+\\s+",
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
				content: [p],
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
