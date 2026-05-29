import type { JSONContent } from "novel";

/**
 * Render-time character normalisation: replaces ASCII typographic shortcuts
 * with their proper Unicode equivalents (curly quotes, em-dashes, ellipsis).
 *
 * Source content in the DB is never modified. Carlos types `"` and `--`; the
 * reader sees `"` `"` and `—`. This runs in `PostPreview` so it covers all
 * historical content immediately — no per-post migration needed.
 *
 * Substitutions are intentionally conservative; only cases with no realistic
 * false-positive in editorial prose are applied. See `docs/typography.md` —
 * "Character QA renderer" for the rationale on each rule and the cases that
 * were left for a later (smarter) pass.
 */

const RIGHT_SINGLE = "’"; //  ' — curly apostrophe / right single quote
const LEFT_DOUBLE = "“"; //  " — left double quote
const RIGHT_DOUBLE = "”"; //  " — right double quote
const EM_DASH = "—"; //      — — em-dash
const ELLIPSIS = "…"; //     … — horizontal ellipsis

function smartenText(text: string): string {
	return (
		text
			// Em-dash from two or more consecutive hyphens. Editorial prose
			// doesn't use compound hyphens with multiple `-`; CLI flags (`--no-x`)
			// would be wrong but Adamastor doesn't publish technical content
			// inline. Revisit if LisboaJS articles use `<code>`-less CLI snippets.
			.replace(/-{2,}/g, EM_DASH)

			// Ellipsis from exactly three consecutive dots, not surrounded by
			// more dots. `....` and `.....` stay as written — they're rare and
			// usually intentional (sentence-ending ellipsis or stylistic pause).
			.replace(/(?<!\.)\.{3}(?!\.)/g, ELLIPSIS)

			// Apostrophe before a digit — decade abbreviations like `'90s` and
			// `'08`. Must come BEFORE the after-word-char rule so the leading
			// apostrophe is caught even though there's no preceding word char.
			.replace(/'(?=\d)/g, RIGHT_SINGLE)

			// Apostrophe immediately after a word character — contractions
			// (`don't`, `they're`) and possessives (`Carlos's`). The proper
			// glyph is U+2019 (also the curly closing single quote).
			.replace(/(?<=\w)'/g, RIGHT_SINGLE)

			// Opening double quote: after whitespace, start-of-string, or any
			// opening bracket / paren. The capture group preserves the leading
			// character so we don't have to reconstruct it.
			.replace(/(^|[\s(\[{])"/g, `$1${LEFT_DOUBLE}`)

			// Closing double quote: everything else. Runs after the opening
			// pass so any `"` that survived is closing by definition.
			.replace(/"/g, RIGHT_DOUBLE)
	);
}

function hasCodeMark(node: JSONContent): boolean {
	return Array.isArray(node.marks) && node.marks.some((m) => m.type === "code");
}

export function normalizeTypography(node: JSONContent): JSONContent {
	// Don't touch code blocks — straight quotes, dashes, and dots inside code
	// are load-bearing (CLI flags, regex, etc).
	if (node.type === "codeBlock") return node;

	if (node.type === "text" && typeof node.text === "string") {
		if (hasCodeMark(node)) return node; // inline `<code>` — same reason
		return { ...node, text: smartenText(node.text) };
	}

	if (Array.isArray(node.content)) {
		return { ...node, content: node.content.map(normalizeTypography) };
	}

	return node;
}
