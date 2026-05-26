import AuthorCard from "@/components/authorCard";
import PostAdminControls from "@/components/post-admin-controls";
import ShareWidget from "@/components/shareWidget";
import PostPreview from "@/components/tailwind/post-preview";
import { ContextMenu, ContextMenuTrigger } from "@/components/tailwind/ui/context-menu";
import { formatDate } from "@/lib/datetime";
import { buildArticleJsonLd, buildBreadcrumbListJsonLd } from "@/lib/events/seo";
import { createPublicClient } from "@/lib/supabase/public";
import { notFound } from "next/navigation";
import { SubscribeForm } from "./SubscribeForm";
import { FeedbackForm } from "./feedbackForm";

export const revalidate = 3600;

const DEFAULT_CONTENT_PREVIEW = "Check out this post on our blog.";

// Walk TipTap JSON and concatenate `text` leaves. Replaces @tiptap/core's
// generateText so this route doesn't drag the whole novel/tiptap dep tree
// into the post page's compile graph.
function extractTiptapText(node: unknown): string {
	if (!node || typeof node !== "object") return "";
	const n = node as { text?: unknown; content?: unknown };
	if (typeof n.text === "string") return n.text;
	if (!Array.isArray(n.content)) return "";
	return n.content.map(extractTiptapText).join(" ");
}

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

	// No public /posts index page exists, so the breadcrumb is two levels:
	// Home > {post title}. The post slug (or id) is the canonical pathname.
	const postPathname = `/posts/${post.slug ?? post.id}`;
	const contentPreview = extractPostContentPreview(post.content);

	const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
		{ name: "Home", pathname: "/" },
		{ name: post.title, pathname: postPathname },
	]);

	const articleJsonLd = buildArticleJsonLd({
		pathname: postPathname,
		title: post.title,
		description: contentPreview,
		datePublished: post.created_at,
		dateModified: post.updated_at ?? post.created_at,
		// Use the same dynamic OG image as the social meta so the Article
		// schema, OG card, and on-page social preview all stay aligned.
		imageUrl: `https://adamastor.blog/api/og?title=${encodeURIComponent(post.title)}`,
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
				<div className="max-w-[750px] mx-auto md:px-4 animate-in">
					<div className="mb-4 flex gap-2 justify-end">
						<PostAdminControls postAuthorId={String(post.author_id)} postId={id} isPublic={post.is_public} />
					</div>
					<div className="mb-4">
						<h1 className="md:text-4xl scroll-m-20 tracking-tight !leading-tight text-3xl font-extrabold text-balance text-[#104357] dark:text-cyan-lifted [font-family:var(--font-inter)]">
							{post.title}
						</h1>
					</div>
					<div className="flex justify-between items-start mt-6">
						<AuthorCard author={post.authors} publishedAt={formattedPublishedDate} />

						<ShareWidget />
					</div>
					<SubscribeForm />
					<PostPreview initialContent={post.content} />
					<FeedbackForm />
				</div>
			</ContextMenuTrigger>
		</ContextMenu>
	);
}

export async function generateMetadata({ params }: PostPageProps) {
	const { id } = await params;

	const { data: post, error } = await getPostByIdOrSlug(id);

	if (error || !post) {
		notFound();
	}

	const contentPreview = extractPostContentPreview(post.content);

	return {
		title: post.title,
		description: contentPreview,
		authors: [{ name: post.authors.name, url: post.authors.website_url || undefined }],
		keywords: ["Startups Portugal", "Portugal", "Startup", "Portugal Startups"],
		openGraph: {
			images: [
				{
					url: `https://adamastor.blog/api/og?title=${encodeURIComponent(post.title)}`,
					width: 1200,
					height: 630,
					alt: post.title,
				},
			],
		},
	};
}
