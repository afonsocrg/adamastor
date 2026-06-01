import { SubscribeForm } from "@/components/SubscribeForm";
import PostPreview from "@/components/tailwind/post-preview";
import { ContextMenu, ContextMenuTrigger } from "@/components/tailwind/ui/context-menu";
import { formatDate } from "@/lib/datetime";
import { estimateReadingMinutes } from "@/lib/posts/content";
import { extractHeadings } from "@/lib/posts/headings";
import { getPostKind } from "@/lib/posts/kind";
import { getRecentOpinionPosts } from "@/lib/posts/related";
import { getUserProfile } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ArticleLinkDecorator from "../../[id]/ArticleLinkDecorator";
import AuthorStrap from "../../[id]/AuthorStrap";
import PostHero from "../../[id]/PostHero";
import PostTOC from "../../[id]/PostTOC";
import ReadNext from "../../[id]/ReadNext";
import { FeedbackForm } from "../../[id]/feedbackForm";

// Preview route: render any post (draft or published) by id or slug. Used by
// the dashboard Preview action and by the typography specimen workflow.
//
// Architectural notes:
//   - force-dynamic disables ISR; we never want a draft preview cached and
//     served to anyone other than its author. The public /posts/[id] route
//     keeps revalidate=3600.
//   - Service-role bypasses RLS so we can read drafts. Authorization is gated
//     on the `getUserProfile()` check below — only authenticated dashboard
//     editors can hit this route. Unauthenticated requests redirect to /login.
//   - No JSON-LD, no OG/Twitter metadata, noindex/nofollow — drafts must not
//     leak to search engines if the URL is ever shared.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Preview — Adamastor",
	robots: { index: false, follow: false },
};

interface PreviewPageProps {
	params: Promise<{ id: string }>;
}

export default async function PostPreviewPage({ params }: PreviewPageProps) {
	// Auth check via cookie-aware client. The middleware doesn't gate
	// /posts/preview/* (only /dashboard/*), so we enforce auth in-route.
	const supabase = await createClient();
	const profile = await getUserProfile(supabase);
	if (!profile) {
		redirect("/login");
	}

	const { id } = await params;

	// Service-role read so RLS doesn't filter out drafts. Same select shape as
	// the public post page so the rendering components receive the same data.
	const adminSupabase = createServiceRoleClient();
	const isNumeric = /^\d+$/.test(id);
	const query = adminSupabase.from("posts").select(`
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

	const { data: post, error } = isNumeric
		? await query.eq("id", Number.parseInt(id, 10)).single()
		: await query.eq("slug", id).single();

	if (error || !post) {
		notFound();
	}

	const formattedPublishedDate = formatDate(post.created_at);
	const readingMinutes = estimateReadingMinutes(post.content);
	const kind = getPostKind(post);
	const headings = extractHeadings(post.content);
	const relatedOpinions = kind === "opinion" ? await getRecentOpinionPosts(post.id, 3) : [];

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<article className="-mt-2 mx-auto max-w-6xl pb-20 md:mt-0 md:p-4 md:pb-24 lg:grid lg:grid-cols-[12rem_minmax(0,48rem)_1fr] lg:gap-12">
					<aside className="hidden lg:block">
						<PostTOC headings={headings} className="sticky top-24" alignTo=".article-prose" />
					</aside>
					<div className="space-y-8 md:space-y-12">
						{/* Preview-mode strap. Quiet orange-tint band so it reads as
						    chrome, not an alert. Edit link gives editors a one-click
						    way back to the editor from a visual review. */}
						<div className="flex items-center justify-between gap-3 rounded-md border border-orange-hue/30 bg-orange-hue/[0.06] px-4 py-2 text-sm">
							<span className="font-medium text-navy dark:text-navy-lifted">
								Preview mode · {post.is_public ? "Published" : "Draft"}
							</span>
							<Link
								href={`/dashboard/posts/${post.id}/edit`}
								className="inline-flex items-center gap-1 font-semibold text-navy underline underline-offset-4 decoration-navy-tint decoration-2 hover:decoration-navy dark:text-navy-lifted"
							>
								Edit
								<ArrowRightIcon className="h-3.5 w-3.5 text-orange-hue" aria-hidden="true" />
							</Link>
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
						{/* Post coda: matches /posts/[id]'s coda wrapper exactly.
						    See that file for the 681px rationale (prose 60ch @
						    Inter 18px). */}
						<div className="mx-auto w-full max-w-[681px] space-y-8 md:space-y-12">
							<AuthorStrap author={post.authors} />
							<SubscribeForm kind={kind} />
							{kind === "opinion" && relatedOpinions.length > 0 && <ReadNext posts={relatedOpinions} />}
							<FeedbackForm />
						</div>
					</div>
				</article>
			</ContextMenuTrigger>
		</ContextMenu>
	);
}
