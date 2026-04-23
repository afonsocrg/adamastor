import HomePostsFeed from "@/components/home-posts-feed";
import { getPaginatedHomePosts } from "@/lib/home-posts";
import { notFound, redirect } from "next/navigation";

export const revalidate = 3600;

interface PaginatedHomePageProps {
	params: Promise<{ page: string }>;
}

export default async function PaginatedHomePage({ params }: PaginatedHomePageProps) {
	const { page } = await params;
	const pageNumber = Number.parseInt(page, 10);

	if (!Number.isInteger(pageNumber) || pageNumber < 1) {
		notFound();
	}

	if (pageNumber === 1) {
		redirect("/");
	}

	const { posts, totalPages } = await getPaginatedHomePosts(pageNumber);

	if (pageNumber > totalPages || posts.length === 0) {
		notFound();
	}

	return <HomePostsFeed currentPage={pageNumber} posts={posts} totalPages={totalPages} />;
}
