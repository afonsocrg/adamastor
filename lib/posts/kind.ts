/**
 * Single source of truth for the Weekly-vs-Opinion derivation. Both the
 * homepage feed and the post detail page consume this, so card labels and
 * hero kickers can never drift.
 *
 * Heuristic: a post is a Weekly if Carlos Resende is among its authors OR the
 * title carries a "Week N" marker. Everything else is Opinion. The dual check
 * survives data drift — a Carlos post that loses the Week N suffix still reads
 * as Weekly; a Week-N-titled post imported under a different author still
 * reads as Weekly.
 */

export type PostKind = "weekly" | "opinion";

type AuthorLike = { name?: string | null } | null | undefined;
type AuthorsLike = AuthorLike | readonly AuthorLike[];

const WEEKLY_AUTHOR = "carlos resende";
const WEEK_MARKER = /\bWeek\s+\d+\b/i;
const WEEK_TITLE_SUFFIX = /\s*\|\s*Week\s+\d+\b/i;

function authorNames(authors: AuthorsLike): string[] {
	if (!authors) return [];
	const list = Array.isArray(authors) ? authors : [authors];
	return list
		.map((author) => author?.name?.trim().toLowerCase())
		.filter((name): name is string => Boolean(name));
}

export function getPostKind(post: { title: string; authors?: AuthorsLike }): PostKind {
	if (authorNames(post.authors).includes(WEEKLY_AUTHOR)) return "weekly";
	if (WEEK_MARKER.test(post.title)) return "weekly";
	return "opinion";
}

/** Strips the "| Week N" suffix from a title for display. */
export function getDisplayTitle(title: string): string {
	return title.replace(WEEK_TITLE_SUFFIX, "").trim();
}

/** Pulls "Week 21" out of a title, or null when absent. */
export function getWeekLabel(title: string): string | null {
	const match = title.match(WEEK_MARKER);
	return match?.[0] ?? null;
}

/**
 * The kicker / card label for a post, used publication-wide: homepage feed
 * rows, the homepage featured hero, and the post-page hero all consume this,
 * so a reader who scans "WEEKLY ADAMASTOR" / "OPINION" on a card lands on the
 * post page and meets the same label.
 *
 * The week number ("· Week N") is appended alongside this label on the heroes
 * (where it's the editorial differentiator), not on river cards (where it
 * would compete with the per-row week-label gutter on the right).
 */
export function getFeedCardLabel(kind: PostKind): "Weekly Adamastor" | "Opinion" {
	return kind === "weekly" ? "Weekly Adamastor" : "Opinion";
}
