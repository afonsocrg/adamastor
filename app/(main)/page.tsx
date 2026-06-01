import { SubscribeForm } from "@/components/SubscribeForm";
import HomeSidebar from "@/components/home/HomeSidebar";
import Masthead from "@/components/home/Masthead";
import PostRiver from "@/components/home/PostRiver";
import { getPaginatedHomePosts } from "@/lib/home-posts";
import { getUpcomingEventsTeaser } from "@/lib/home/upcoming-events";
import { getDisplayTitle } from "@/lib/posts/kind";
import { getRecentOpinionPosts } from "@/lib/posts/related";
import type { Metadata } from "next";

export const revalidate = 3600;

// Per-page canonical (root layout doesn't set one). Same for OG URL +
// alternates so paginated archive pages (/page/2…) don't accidentally
// canonicalize to /.
export const metadata: Metadata = {
	alternates: { canonical: "/" },
	openGraph: { url: "/" },
};

const SITE_URL = "https://adamastor.blog";

interface BlogPostListing {
	id: string | number;
	slug: string | null;
	title: string;
	created_at: string;
	authors?: { name?: string | null } | { name?: string | null }[] | null;
}

function firstAuthorName(authors: BlogPostListing["authors"]): string | null {
	if (!authors) return null;
	const list = Array.isArray(authors) ? authors : [authors];
	return list[0]?.name ?? null;
}

/**
 * Homepage @graph: declares the three foundational entities that every other
 * page's schema references back to (Organization, WebSite, Blog). The Blog
 * entity now nests a `blogPost` array of recent BlogPosting references so
 * Google + ChatGPT/Perplexity see explicit "/ is the canonical hub for these
 * articles" relationships — boosts entity recognition and increases the odds
 * recent posts get retrieved during AI fan-out queries about Adamastor.
 */
function buildHomepageJsonLd(posts: BlogPostListing[]) {
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Organization",
				"@id": `${SITE_URL}/#organization`,
				name: "Adamastor",
				alternateName: "Adamastor Magazine",
				url: SITE_URL,
				logo: {
					"@type": "ImageObject",
					url: `${SITE_URL}/adamastorLogotype.svg`,
				},
				sameAs: ["https://x.com/adamastorHQ", "https://www.linkedin.com/company/adamastor-magazine/"],
			},
			{
				"@type": "WebSite",
				"@id": `${SITE_URL}/#website`,
				url: SITE_URL,
				name: "Adamastor",
				description: "A digital publication for all things startup in Portugal.",
				publisher: { "@id": `${SITE_URL}/#organization` },
				inLanguage: "en",
			},
			{
				"@type": "Blog",
				"@id": `${SITE_URL}/#blog`,
				url: SITE_URL,
				name: "Adamastor Weekly",
				description: "A weekly read on Portugal’s startup scene.",
				publisher: { "@id": `${SITE_URL}/#organization` },
				isPartOf: { "@id": `${SITE_URL}/#website` },
				inLanguage: "en",
				blogPost: posts.map((post) => {
					const postUrl = `${SITE_URL}/posts/${post.slug ?? post.id}`;
					const authorName = firstAuthorName(post.authors);
					return {
						"@type": "BlogPosting",
						"@id": postUrl,
						headline: getDisplayTitle(post.title),
						url: postUrl,
						datePublished: post.created_at,
						...(authorName ? { author: { "@type": "Person", name: authorName } } : {}),
					};
				}),
			},
		],
	};
}

export default async function Home() {
	// Parallel fetch — three independent queries on the homepage render path.
	const [{ posts, totalPages }, upcomingEvents] = await Promise.all([
		getPaginatedHomePosts(1),
		getUpcomingEventsTeaser(3),
	]);

	// Hero is hidden for now — the full posts array goes straight into the
	// river. Passing -1 to the opinions fetch returns the top recent opinions
	// unfiltered (no post id to exclude).
	const opinions = await getRecentOpinionPosts(-1, 4);

	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema markup
				dangerouslySetInnerHTML={{ __html: JSON.stringify(buildHomepageJsonLd(posts)) }}
			/>
			{/* 8-col editorial grid — matches /events geometry exactly so a reader
			    switching between / and /events lands on the same column widths
			    and gutters. Main column (5/8) carries Masthead → River →
			    Pagination → Subscribe coda. Sidebar (3/8) carries the Opinion
			    stack + Upcoming events teaser. Mobile collapses to single-column
			    with the sidebar following the main column as a coda.
			    FeaturedHero (`components/home/FeaturedHero.tsx`) is currently
			    hidden — the component file is kept for a future revisit. */}
			<div className="grid grid-cols-1 gap-8 md:p-4 lg:grid-cols-8 lg:gap-20">
				<div className="order-1 space-y-10 lg:col-span-5 lg:space-y-12">
					<Masthead />
					<PostRiver currentPage={1} posts={posts} totalPages={totalPages} />
					<SubscribeForm kind="opinion" />
				</div>
				<div className="order-2 lg:col-span-3">
					<HomeSidebar opinions={opinions} upcomingEvents={upcomingEvents} />
				</div>
			</div>
		</>
	);
}
