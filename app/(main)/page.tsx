import HomePostsFeed from "@/components/home-posts-feed";
import { getPaginatedHomePosts } from "@/lib/home-posts";

export const revalidate = 3600;

export default async function Home() {
	const { posts, totalPages } = await getPaginatedHomePosts(1);

	return <HomePostsFeed currentPage={1} posts={posts} totalPages={totalPages} />;
}
