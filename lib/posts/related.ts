import { createPublicClient } from "@/lib/supabase/public";
import { getPostKind } from "./kind";

export interface RelatedPost {
	id: number;
	slug: string | null;
	title: string;
	created_at: string;
	authors: { name: string; image_url: string | null } | null;
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
	for (const row of data as RelatedPost[]) {
		if (opinions.length >= take) break;
		if (getPostKind({ title: row.title, authors: row.authors }) === "opinion") {
			opinions.push(row);
		}
	}
	return opinions;
}
