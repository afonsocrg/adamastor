/**
 * Posts are reachable under two public pathnames — the numeric id (`/posts/175`)
 * and, when present, the slug (`/posts/founder-vs-reality-fit-week-21`). Links
 * across the site are built as `slug ?? id` (see app/(main)/page.tsx and the
 * home components), so most real traffic lands on the slug while older links,
 * shares, and crawlers still hit the numeric id.
 *
 * Analytics must therefore attribute BOTH forms to the same post, or the
 * dashboard counts read far too low (the previous query matched only the
 * numeric id, missing the slug traffic that dominates recent posts). These
 * helpers keep the dashboard fetchers and the PostHog query routes agreeing on
 * one wire format and one set of pathnames.
 */

export interface PostRef {
	id: string;
	slug?: string | null;
}

// Ids are numeric; slugs are lowercase `[a-z0-9-]` (the shape our slugify
// produces). Validating both lets us safely interpolate them into HogQL.
const ID_RE = /^\d+$/;
const SLUG_RE = /^[a-z0-9-]+$/;

/** Wire format for the `?posts=` param: comma-separated `id:slug` (slug optional). */
export function encodePostRefsParam(refs: PostRef[]): string {
	return refs.map((ref) => (ref.slug ? `${ref.id}:${ref.slug}` : ref.id)).join(",");
}

/**
 * Parse `?posts=` back into validated refs. Ids must be digits; slugs must match
 * SLUG_RE — anything else is dropped (slug treated as absent) so the values are
 * always safe to interpolate into a HogQL string.
 */
export function parsePostRefsParam(param: string | null): PostRef[] {
	if (!param) return [];
	const refs: PostRef[] = [];
	for (const part of param.split(",")) {
		const [rawId, rawSlug] = part.split(":");
		const id = rawId?.trim();
		if (!id || !ID_RE.test(id)) continue;
		const slug = rawSlug?.trim();
		refs.push({ id, slug: slug && SLUG_RE.test(slug) ? slug : null });
	}
	return refs;
}

/** Every public pathname a post may have been viewed under (numeric id + slug). */
export function pathnamesForRef(ref: PostRef): string[] {
	const paths = [`/posts/${ref.id}`];
	if (ref.slug) paths.push(`/posts/${ref.slug}`);
	return paths;
}

/**
 * HogQL fragments to attribute events to posts across both URL forms:
 *  - `inClause`: quoted pathname list for `... IN (<inClause>)`
 *  - `postIdExpr`: a `multiIf` mapping the pathname column to a post id string
 *    (NULL when unmatched), so callers can `GROUP BY` it and dedupe per post
 *    rather than per pathname.
 *
 * `pathColumn` is the PostHog property to match — `$pathname` for `$pageview`,
 * `page_url` for the `subscribed_newsletter` event. Returns null when there are
 * no refs so callers can short-circuit without hitting PostHog.
 */
export function buildPostPathnameSql(
	refs: PostRef[],
	pathColumn: string,
): { inClause: string; postIdExpr: string } | null {
	if (refs.length === 0) return null;
	const col = `properties.${pathColumn}`;
	const quote = (s: string) => `'${s}'`;
	const inClause = refs.flatMap(pathnamesForRef).map(quote).join(", ");
	const branches = refs
		.map((ref) => `${col} IN (${pathnamesForRef(ref).map(quote).join(", ")}), '${ref.id}'`)
		.join(", ");
	return { inClause, postIdExpr: `multiIf(${branches}, NULL)` };
}
