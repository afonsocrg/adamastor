import { createPublicClient } from "@/lib/supabase/public";

interface Author {
	name?: string | null;
	bio?: string | null;
	image_url?: string | null;
}

export interface HomePost {
	id: string | number;
	slug: string | null;
	title: string;
	content: unknown;
	created_at: string;
	authors?: Author | Author[] | null;
}

export const HOME_POSTS_PAGE_SIZE = 10;

export async function getPaginatedHomePosts(page: number, pageSize = HOME_POSTS_PAGE_SIZE) {
	const supabase = createPublicClient();
	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;

	const {
		data: posts,
		error,
		count,
		status,
	} = await supabase
		.from("posts")
		.select(
			`
				*,
				authors (
					name,
					bio,
					image_url
				)
			`,
			{ count: "exact" },
		)
		.eq("is_public", true)
		.order("created_at", { ascending: false })
		.range(from, to);

	if (error && status !== 200) {
		console.log("error", error);
	}

	const totalPosts = count ?? posts?.length ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

	return {
		posts: (posts ?? []) as HomePost[],
		totalPages,
		totalPosts,
	};
}
