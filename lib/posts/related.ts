import { createPublicClient } from "@/lib/supabase/public";
import { getPostKind } from "./kind";

export interface RelatedPost {
	id: number;
	slug: string | null;
	title: string;
	created_at: string;
	authors: { name: string; image_url: string | null } | null;
}

type RelatedPostAuthor = NonNullable<RelatedPost["authors"]>;

interface RelatedPostRow extends Omit<RelatedPost, "authors"> {
	authors: RelatedPostAuthor | RelatedPostAuthor[] | null;
}

function normalizeRelatedPost(row: RelatedPostRow): RelatedPost {
	return {
		...row,
		authors: Array.isArray(row.authors) ? (row.authors[0] ?? null) : row.authors,
	};
}

/**
 * Pull up to `take` recent Opinion posts (kind = opinion) for the read-next
 * strip on the post detail page. Excludes the current post by id. Implemented
 * as a fetch-then-filter rather than a join filter because the kind heuristic
 * lives in app code, not the DB — over-fetches lightly (~20 candidates) and
 * trims down to `take`.
 */
export async function getRecentOpinionPosts(currentId: number | string, take = 3): Promise<RelatedPost[]> {
	const supabase = createPublicClient();
	const { data, error } = await supabase
		.from("posts")
		.select(`
			id,
			slug,
			title,
			created_at,
			authors ( name, image_url )
		`)
		.eq("is_public", true)
		.neq("id", typeof currentId === "string" ? Number.parseInt(currentId, 10) || -1 : currentId)
		.order("created_at", { ascending: false })
		.limit(20);

	if (error || !data) return [];

	const opinions: RelatedPost[] = [];
	for (const row of data as unknown as RelatedPostRow[]) {
		if (opinions.length >= take) break;
		const post = normalizeRelatedPost(row);
		if (getPostKind({ title: post.title, authors: post.authors }) === "opinion") {
			opinions.push(post);
		}
	}
	return opinions;
}
