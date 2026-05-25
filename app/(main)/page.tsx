import HomePostsFeed from "@/components/home-posts-feed";
import { getPaginatedHomePosts } from "@/lib/home-posts";

export const revalidate = 3600;

export default async function Home() {
	const { posts, totalPages } = await getPaginatedHomePosts(1);

	// Articles list stays at screen-lg width — the wider (main) layout container
	// is for editorial pages like /events. Articles cards stretched to xl would
	// feel awkward and break reading rhythm.
	return (
		<div className="mx-auto max-w-screen-lg">
			<HomePostsFeed currentPage={1} posts={posts} totalPages={totalPages} />
		</div>
	);
}
