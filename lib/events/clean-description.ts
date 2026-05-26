/**
 * Normalises event descriptions auto-filled from external sources (Luma,
 * Eventbrite, JSON-LD on generic sites). The cleaner does a sequence of small
 * passes; each one targets a class of crud we've seen leak into card copy:
 *
 *   1. Strip markdown structural markers that render as literal text in our
 *      plain-text card preview: headings (`# … ######`), blockquotes (`>`),
 *      bold (`**x**`, `__x__`), italic (`*x*`, `_x_`).
 *   2. Flatten markdown links: `[text](url)` → `text`. The URL isn't clickable
 *      from the line-clamped card anyway, so the bracketed form is just noise.
 *   3. Unescape backslash escapes that come from Markdown-table source rows
 *      (`\|`, `\,`, `\.`).
 *   4. De-shout SHOUTY MARKETING COPY — runs containing ≥3 long-caps tokens
 *      (3+ uppercase-letter words) get Title-Cased. Short acronyms (AI, IT,
 *      JS) and single-letter caps (A, I) extend a run but don't satisfy the
 *      threshold on their own — that lets us catch full shouty sentences like
 *      "DON'T BRING A BACKLOG TO A GUNFIGHT" or "DO NOT FORGET TO REGISTER
 *      ONLY ON OUR OFFICIAL WEBSITE" while leaving 2-word acronym pairs
 *      ("AWS GCP", "NFC SUMMIT", "AI ACT") alone. Newlines break runs so
 *      adjacent paragraphs aren't merged. Unicode-aware so Portuguese
 *      diacritics (ESTÁ, NEGÓCIO) and apostrophes (DON'T, O'NEILL) count.
 *   5. Collapse runs of 3+ blank lines to 2 (one paragraph break).
 *
 * Heading markers require a space after `#`, so number references like "#1",
 * "Panel #16" pass through unchanged.
 *
 * User-typed descriptions submitted via /events/submit are NOT passed through
 * this — the user's intent is preserved there. Apply only on the auto-fill path
 * (and on the one-shot DB cleanup; see `pg_temp.clean_event_description` in
 * docs/sql-snippets if you need to re-run it).
 */

const HEADING_MARKER = /^#{1,6}[ \t]+/gm;
const BLOCKQUOTE_MARKER = /^>[ \t]*/gm;

// Bold first, italic second — bolds wrap italics ("**A *B* C**") so we need
// the outer pair gone before the inner pair's regex can see the inner asterisks
// as italic markers rather than fragments of bold. The content class allows
// asterisks/underscores inside ("[^\n]+?") so an italic span inside a bold
// span doesn't block the outer match.
const BOLD_STAR = /\*\*([^\n]+?)\*\*/g;
const BOLD_UNDER = /__([^\n]+?)__/g;

// Italic must NOT match bullet-list markers (`* item`) or snake_case (`foo_bar`).
// We require a non-whitespace, non-marker character immediately after the
// opening marker and before the closing one. For underscores we additionally
// require word boundaries on the outside.
const ITALIC_STAR = /(?<![*\w])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![*\w])/g;
const ITALIC_UNDER = /(?<![_\w])_(?!\s)([^_\n]+?)(?<!\s)_(?![_\w])/g;

// Strip `[text](url)` keeping only the visible label. The link target is gone —
// fine for the plain-text card surface, which can't make it clickable anyway.
const MD_LINK = /\[([^\]\n]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

// Backslash-escapes from Markdown-table-shaped sources ("\|", "\,", "\.") get
// flattened to the literal character. Conservative — we only touch a small set
// of common escape targets so we don't accidentally undo escapes that matter
// (e.g. `\\` in code).
const BACKSLASH_ESCAPE = /\\([|,.()[\]_*])/g;

// Collapse paragraph-break inflation. 3+ newlines → exactly 2 (one blank line).
const MULTIPLE_BLANK_LINES = /\n{3,}/g;

type Tok =
	| { kind: "ws"; text: string }
	| { kind: "long-caps"; text: string }
	| { kind: "short-caps"; text: string }
	| { kind: "other"; text: string };

function classify(word: string): Tok {
	if (/^\s+$/.test(word)) {
		// A whitespace run that contains a newline marks a paragraph break and
		// breaks any in-progress run. Without this, a phrase like "1PM\n\nLACS"
		// on consecutive paragraphs would get merged into one shouty run.
		if (/\n/.test(word)) return { kind: "other", text: word };
		return { kind: "ws", text: word };
	}
	// Collect just the alphabetic chars; this lets words with internal
	// punctuation (DON'T, O'NEILL) classify on letter content alone.
	const letters = word.match(/\p{L}/gu)?.join("") ?? "";
	if (letters.length === 0) return { kind: "other", text: word };
	// If any letter isn't uppercase, it's not an all-caps token.
	if (!/^\p{Lu}+$/u.test(letters)) return { kind: "other", text: word };
	if (letters.length >= 3) return { kind: "long-caps", text: word };
	// 1- or 2-letter all-caps tokens. Includes "A", "I" (single-letter caps)
	// so they extend a run without anchoring one on their own.
	return { kind: "short-caps", text: word };
}

function titleCaseToken(text: string): string {
	let seenFirstLetter = false;
	let out = "";
	for (const ch of text) {
		if (/\p{L}/u.test(ch)) {
			if (!seenFirstLetter) {
				out += ch.toUpperCase();
				seenFirstLetter = true;
			} else {
				out += ch.toLowerCase();
			}
		} else {
			out += ch;
		}
	}
	return out;
}

/**
 * Tokenize the input by whitespace, then sweep forward looking for "shouty
 * runs" — contiguous sequences of caps tokens (long or short) possibly
 * intermixed with single-line whitespace. Transform any run that contains ≥3
 * long-caps tokens.
 *
 * Why ≥3 long: matches Malik's original "more than 2 words use all caps"
 * rule. Lower thresholds catch more shouty phrases ("YOUTH ENTREPRENEURSHIP",
 * "HUGE DEAL") but also demote real acronym pairs ("AWS GCP", "AI ACT",
 * "NFC SUMMIT"). The data shows the acronym-preservation trade is worth more
 * than catching 2-word shouts.
 *
 * A run can START with a short-caps token (e.g. "DO" in "DO NOT FORGET…")
 * provided the run as a whole still contains ≥3 long-caps. Without that, a
 * leading 2-letter caps word would be left untouched while the rest got
 * transformed — partial de-shouting reads weirder than no de-shouting at all.
 *
 * Newline-containing whitespace classifies as "other" (see classify()) so
 * paragraph boundaries naturally break runs.
 */
export function deshout(input: string): string {
	const parts = input.split(/(\s+)/);
	const toks = parts.map(classify);

	let i = 0;
	while (i < toks.length) {
		const start = toks[i].kind;
		if (start !== "long-caps" && start !== "short-caps") {
			i++;
			continue;
		}
		let j = i;
		let longCount = 0;
		while (
			j < toks.length &&
			(toks[j].kind === "long-caps" || toks[j].kind === "short-caps" || toks[j].kind === "ws")
		) {
			if (toks[j].kind === "long-caps") longCount++;
			j++;
		}
		let end = j;
		while (end > i && toks[end - 1].kind === "ws") end--;
		if (longCount >= 3) {
			for (let k = i; k < end; k++) {
				if (toks[k].kind === "long-caps" || toks[k].kind === "short-caps") {
					toks[k] = { kind: toks[k].kind, text: titleCaseToken(toks[k].text) };
				}
			}
		}
		i = j;
	}
	return toks.map((t) => t.text).join("");
}

export function cleanEventDescription(description: string | undefined): string | undefined {
	if (!description) return description;

	let cleaned = description;
	// Structural markdown markers first — these only have meaning at line start.
	cleaned = cleaned.replace(HEADING_MARKER, "");
	cleaned = cleaned.replace(BLOCKQUOTE_MARKER, "");
	// Pair markers next: bold before italic (bolds may wrap italics).
	cleaned = cleaned.replace(BOLD_STAR, "$1");
	cleaned = cleaned.replace(BOLD_UNDER, "$1");
	cleaned = cleaned.replace(ITALIC_STAR, "$1");
	cleaned = cleaned.replace(ITALIC_UNDER, "$1");
	// Markdown links → label only.
	cleaned = cleaned.replace(MD_LINK, "$1");
	// Unescape table-row backslash escapes.
	cleaned = cleaned.replace(BACKSLASH_ESCAPE, "$1");
	// De-shout AFTER markdown is stripped — caps inside `**...**` would be
	// invisible to the tokenizer if the asterisks were still attached.
	cleaned = deshout(cleaned);
	// Collapse runs of blank lines.
	cleaned = cleaned.replace(MULTIPLE_BLANK_LINES, "\n\n");

	return cleaned.trim();
}
