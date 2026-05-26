/**
 * Normalises event descriptions auto-filled from external sources (Luma,
 * Eventbrite, JSON-LD on generic sites). Two specific accidents we guard against:
 *
 *   1. Markdown heading markers leaking into plain-text card copy — we render
 *      descriptions as raw text on the events list (EventCard), so a leading
 *      "#### Curious how AI..." shows the literal hashes.
 *
 *   2. SHOUTY MARKETING COPY where 3+ consecutive words are all-caps. Short
 *      acronyms (AI, IT, JS, EU, US) don't count toward the threshold — they
 *      stay capitalised unless they're inside an already-shouty run, in which
 *      case they get Title-Cased along with the rest so the result reads
 *      naturally ("JOIN US FOR THE EVENT" → "Join Us For The Event").
 *
 * User-typed descriptions submitted via /events/submit are NOT passed through
 * this — the user's intent is preserved there. Apply only on the auto-fill path.
 */

const HEADING_MARKER = /^#{1,6}[ \t]+/gm;

type Tok =
	| { kind: "ws"; text: string }
	| { kind: "long-caps"; text: string }
	| { kind: "short-caps"; text: string }
	| { kind: "other"; text: string };

function classify(word: string): Tok {
	if (/^\s+$/.test(word)) return { kind: "ws", text: word };
	const core = word.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
	if (/^[A-Z]{3,}$/.test(core)) return { kind: "long-caps", text: word };
	if (/^[A-Z]{2}$/.test(core)) return { kind: "short-caps", text: word };
	return { kind: "other", text: word };
}

function titleCaseToken(text: string): string {
	let seenFirstLetter = false;
	let out = "";
	for (const ch of text) {
		if (/[A-Za-z]/.test(ch)) {
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

function deshout(input: string): string {
	const parts = input.split(/(\s+)/);
	const toks = parts.map(classify);

	let i = 0;
	while (i < toks.length) {
		if (toks[i].kind !== "long-caps") {
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
	const stripped = description.replace(HEADING_MARKER, "");
	const deshouted = deshout(stripped);
	return deshouted.trim();
}
