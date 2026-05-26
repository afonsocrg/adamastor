/**
 * Normalises event titles coming back from the scraper. Three classes of crud:
 *
 *   1. Online-indicator junk in brackets/emojis ("[Online]", "(Virtual)",
 *      "🌐") that no human would type into a real title — these come from
 *      platform UIs that bolt them on automatically.
 *
 *   2. Platform branding suffixes ("· Luma", "| Meetup", "| Eventbrite",
 *      Meetup's date-tail "..., Mon, Jan 1, 2026, 6:00 PM   | Meetup"). Useful
 *      on the source platform, just noise on ours.
 *
 *   3. SHOUTY titles ("BIG LISBON SUMMIT 2026") — same de-shout rules as
 *      descriptions: any run of 2+ long-caps words gets Title-Cased.
 *
 * Mirrors the structure of `cleanEventDescription`; kept separate because the
 * title surface has its own platform-suffix concerns that don't apply to
 * description bodies.
 */

import { deshout } from "./clean-description";

const ONLINE_INDICATORS_BRACKETED = /\[(online|virtual|remote|webinar)\]/gi;
const ONLINE_INDICATORS_PAREN = /\((online|virtual|remote|webinar)\)/gi;
const ONLINE_INDICATOR_EMOJI = /🌐|💻|🖥️/g;

// Meetup tacks a localised date string + " | Meetup" onto its page titles, like
// "Some Event, Mon, Jan 1, 2026, 6:00 PM   | Meetup". Strip the whole tail —
// we have the start_time in its own column, the title doesn't need to repeat
// it. The date pattern is anchored on the weekday-abbrev to avoid eating
// legitimate commas in titles.
const MEETUP_DATE_SUFFIX = /,\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*[A-Za-z]{3,}\s+\d{1,2},?\s*\d{4}.*?\|\s*Meetup\s*$/i;

// Standalone platform suffixes when there's no preceding date string.
// Order matters within the regex — match the longer "· Luma" form first.
const PLATFORM_SUFFIX = /\s*[·|\-–]\s*(Luma|Meetup|Eventbrite|Lu\.ma)\s*$/i;

export function cleanEventTitle(title: string): string {
	if (!title) return title;

	let cleaned = title;

	// 1. Online-indicator junk
	cleaned = cleaned
		.replace(ONLINE_INDICATORS_BRACKETED, "")
		.replace(ONLINE_INDICATORS_PAREN, "")
		.replace(ONLINE_INDICATOR_EMOJI, "");

	// 2. Platform suffixes — try the Meetup date-tail first (more specific),
	// then the generic suffix.
	cleaned = cleaned.replace(MEETUP_DATE_SUFFIX, "");
	cleaned = cleaned.replace(PLATFORM_SUFFIX, "");

	// 3. De-shout (same rule as descriptions: 2+ long-caps in a run).
	cleaned = deshout(cleaned);

	// Normalise whitespace and trim.
	cleaned = cleaned.replace(/\s+/g, " ").trim();

	return cleaned;
}
