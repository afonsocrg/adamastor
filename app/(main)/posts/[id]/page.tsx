import PostAdminControls from "@/components/post-admin-controls";
import PostPreview from "@/components/tailwind/post-preview";
import { ContextMenu, ContextMenuTrigger } from "@/components/tailwind/ui/context-menu";
import { formatDate } from "@/lib/datetime";
import { buildArticleJsonLd, buildBreadcrumbListJsonLd } from "@/lib/events/seo";
import { extractTiptapText, estimateReadingMinutes } from "@/lib/posts/content";
import { extractHeadings } from "@/lib/posts/headings";
import { getDisplayTitle, getPostKind } from "@/lib/posts/kind";
import { getRecentOpinionPosts } from "@/lib/posts/related";
import { createPublicClient } from "@/lib/supabase/public";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleLinkDecorator from "./ArticleLinkDecorator";
import AuthorStrap from "./AuthorStrap";
import PostHero from "./PostHero";
import PostTOC from "./PostTOC";
import QuoteVariantPicker from "./QuoteVariantPicker";
import ReadNext from "./ReadNext";
import { SubscribeForm } from "@/components/SubscribeForm";
import { FeedbackForm } from "./feedbackForm";

export const revalidate = 3600;

const DEFAULT_CONTENT_PREVIEW = "Check out this post on our blog.";

/**
 * Extract a ~160-char preview from a post's TipTap JSON content. Used as the
 * SEO meta description and the Article JSON-LD description, so both stay
 * consistent. Falls back to a generic string if parsing fails (e.g. malformed
 * historical content).
 */
function extractPostContentPreview(content: unknown): string {
	try {
		const contentText = extractTiptapText(content).slice(0, 160);
		if (contentText.length === 0) return DEFAULT_CONTENT_PREVIEW;
		const lastSpaceIndex = contentText.lastIndexOf(" ");
		return `${contentText.substring(0, lastSpaceIndex)}…`;
	} catch (error) {
		console.error("extractPostContentPreview failed; using default:", error);
		return DEFAULT_CONTENT_PREVIEW;
	}
}

async function getPostByIdOrSlug(idOrSlug: string) {
	const supabase = createPublicClient();
	const isNumeric = /^\d+$/.test(idOrSlug);
	const query = supabase.from("posts").select(`
			*,
			authors (
				id,
				name,
				bio,
				image_url,
				website_url,
				social_links,
				slug
			)
		`);

	return isNumeric
		? await query.eq("id", Number.parseInt(idOrSlug, 10)).single()
		: await query.eq("slug", idOrSlug).single();
}

interface PostPageProps {
	params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
	const { id } = await params;
	const { data: post, error } = await getPostByIdOrSlug(id);

	if (error || !post) {
		notFound();
	}

	const formattedPublishedDate = formatDate(post.created_at);
	const readingMinutes = estimateReadingMinutes(post.content);
	const kind = getPostKind(post);
	const headings = extractHeadings(post.content);
	// Weeklies skip read-next — yesterday's digest is dead news; the subscribe
	// coda IS the natural exit ramp. Opinion pieces are evergreen ecosystem
	// context, so the strip belongs there.
	const relatedOpinions = kind === "opinion" ? await getRecentOpinionPosts(post.id, 3) : [];

	// No public /posts index page exists, so the breadcrumb is two levels:
	// Home > {post title}. The post slug (or id) is the canonical pathname.
	const postPathname = `/posts/${post.slug ?? post.id}`;
	const contentPreview = extractPostContentPreview(post.content);
	// Use the cleaned title (without "| Week N" suffix) everywhere except
	// kind-aware on-page chrome (kicker shows Week N separately) — keeps SERP
	// titles, breadcrumbs, JSON-LD headlines, and OG image text aligned with
	// the visible H1 instead of the raw DB title.
	const cleanPostTitle = getDisplayTitle(post.title);

	const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
		{ name: "Home", pathname: "/" },
		{ name: cleanPostTitle, pathname: postPathname },
	]);

	const articleJsonLd = buildArticleJsonLd({
		pathname: postPathname,
		title: cleanPostTitle,
		description: contentPreview,
		datePublished: post.created_at,
		dateModified: post.updated_at ?? post.created_at,
		// Use the same dynamic OG image as the social meta so the Article
		// schema, OG card, and on-page social preview all stay aligned.
		imageUrl: `https://adamastor.blog/api/og?title=${encodeURIComponent(cleanPostTitle)}`,
		author: post.authors,
	});

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema markup
					dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
				/>
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema markup
					dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
				/>
				{/* Article container matches the navbar's width contract
				    (max-w-screen-xl + md:px-8) so the masthead chrome above and
				    the body content below share the same left edge at every
				    viewport. Inside, a 3-col grid: TOC (12rem) | body
				    (capped at 48rem for reading line-length) | empty space.
				    The body cap means widening the outer container doesn't
				    blow up prose line lengths — the body stays at the same
				    ~720px it had under the old narrower container, with
				    breathing room to the right at xl+ viewports. */}
				<article className="-mt-2 mx-auto max-w-screen-xl pb-20 md:mt-0 md:p-4 md:pb-24 lg:grid lg:grid-cols-[12rem_minmax(0,48rem)_1fr] lg:gap-12">
					{/* At lg+ viewports the article container aligns with the navbar
					    edge, but at xl+ the article and navbar diverge by 32px
					    (the navbar's outer px-8 vs the article-inside-main's
					    stacked p-4 + md:p-4). This calc nudges only the
					    necessary range — 0 below xl, growing to -32 around the
					    transition, capped at -32 from there. */}
					<aside
						className="hidden lg:block"
						style={{ marginLeft: "min(0px, max(-32px, calc((1280px - 100vw) / 2)))" }}
					>
						<PostTOC headings={headings} className="sticky top-24" alignTo=".article-prose" />
					</aside>
					<div className="space-y-8 md:space-y-12">
						<div className="flex justify-end">
							<PostAdminControls postAuthorId={String(post.author_id)} postId={id} isPublic={post.is_public} />
						</div>
						<PostHero
							kind={kind}
							title={post.title}
							author={post.authors}
							publishedAt={formattedPublishedDate}
							publishedAtIso={post.created_at}
							readingMinutes={readingMinutes}
						/>
						<PostPreview initialContent={post.content} />
						<ArticleLinkDecorator postSlug={post.slug ?? String(post.id)} />
						<AuthorStrap author={post.authors} kind={kind} />
						<SubscribeForm kind={kind} />
						{kind === "opinion" && relatedOpinions.length > 0 && <ReadNext posts={relatedOpinions} />}
						<FeedbackForm />
					</div>
				</article>
				<QuoteVariantPicker />
			</ContextMenuTrigger>
		</ContextMenu>
	);
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
	const { id } = await params;

	const { data: post, error } = await getPostByIdOrSlug(id);

	if (error || !post) {
		notFound();
	}

	const contentPreview = extractPostContentPreview(post.content);
	const cleanTitle = getDisplayTitle(post.title);
	const postPathname = `/posts/${post.slug ?? post.id}`;
	const ogImageUrl = `https://adamastor.blog/api/og?title=${encodeURIComponent(cleanTitle)}`;

	// SEO title strategy: use the cleaned title (no "| Week N" suffix — that's
	// editorial chrome, not a query target) + brand suffix. Keeps SERP clean
	// and avoids the double-space artifact from some Weekly DB titles.
	return {
		title: `${cleanTitle} — Adamastor`,
		description: contentPreview,
		authors: [{ name: post.authors.name, url: post.authors.website_url || undefined }],
		alternates: { canonical: postPathname },
		openGraph: {
			type: "article",
			title: cleanTitle,
			description: contentPreview,
			url: postPathname,
			siteName: "Adamastor",
			publishedTime: post.created_at,
			modifiedTime: post.updated_at ?? post.created_at,
			authors: [post.authors.name],
			images: [
				{
					url: ogImageUrl,
					width: 1200,
					height: 630,
					alt: cleanTitle,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: cleanTitle,
			description: contentPreview,
			images: [ogImageUrl],
		},
	};
}
