import HomeSidebar from "@/components/home/HomeSidebar";
import Masthead from "@/components/home/Masthead";
import PostRiver from "@/components/home/PostRiver";
import { SubscribeForm } from "@/components/SubscribeForm";
import { getPaginatedHomePosts } from "@/lib/home-posts";
import { getUpcomingEventsTeaser } from "@/lib/home/upcoming-events";
import { getRecentOpinionPosts } from "@/lib/posts/related";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const revalidate = 3600;

interface PaginatedHomePageProps {
	params: Promise<{ page: string }>;
}

export async function generateMetadata({ params }: PaginatedHomePageProps): Promise<Metadata> {
	const { page } = await params;
	const pageNumber = Number.parseInt(page, 10);
	const pathname = `/page/${pageNumber}`;
	return {
		title: `Adamastor archive — page ${pageNumber}`,
		description:
			"Browse older articles from Adamastor — Portugal's startup publication. The Adamastor Weekly digest plus occasional opinion from named voices.",
		alternates: { canonical: pathname },
		openGraph: { url: pathname },
		// Paginated archive pages are useful for users browsing but not for
		// Google to surface as canonical entry points. Follow but don't index.
		robots: { index: false, follow: true },
	};
}

const ARCHIVE_HEADING = "From the Adamastor archive";
const ARCHIVE_DEK =
	"Older articles from Portugal's startup publication. Use Newer / Older below to walk the archive.";

export default async function PaginatedHomePage({ params }: PaginatedHomePageProps) {
	const { page } = await params;
	const pageNumber = Number.parseInt(page, 10);

	if (!Number.isInteger(pageNumber) || pageNumber < 1) {
		notFound();
	}

	if (pageNumber === 1) {
		redirect("/");
	}

	const [{ posts, totalPages }, opinions, upcomingEvents] = await Promise.all([
		getPaginatedHomePosts(pageNumber),
		// `-1` matches no real post id, so the helper returns the unfiltered
		// top-N recent opinions — exactly what the archive sidebar wants.
		getRecentOpinionPosts(-1, 4),
		getUpcomingEventsTeaser(3),
	]);

	if (pageNumber > totalPages || posts.length === 0) {
		notFound();
	}

	return (
		<div className="grid grid-cols-1 gap-8 md:p-4 lg:grid-cols-8 lg:gap-20">
			<div className="order-1 space-y-10 lg:col-span-5 lg:space-y-12">
				<Masthead heading={ARCHIVE_HEADING} dek={ARCHIVE_DEK} />
				<PostRiver currentPage={pageNumber} posts={posts} totalPages={totalPages} />
				<SubscribeForm kind="opinion" />
			</div>
			<div className="order-2 lg:col-span-3">
				<HomeSidebar opinions={opinions} upcomingEvents={upcomingEvents} />
			</div>
		</div>
	);
}
