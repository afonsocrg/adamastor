import AuthorCard from "@/components/authorCard";
import PostAdminControls from "@/components/post-admin-controls";
import ShareWidget from "@/components/shareWidget";
import PostPreview from "@/components/tailwind/post-preview";
import { ContextMenu, ContextMenuTrigger } from "@/components/tailwind/ui/context-menu";
import { formatDate } from "@/lib/datetime";
import { createPublicClient } from "@/lib/supabase/public";
import { generateText } from "@tiptap/core";
import { notFound } from "next/navigation";
import {
	Color,
	StarterKit,
	TaskItem,
	TaskList,
	TextStyle,
	TiptapImage,
	TiptapLink,
	TiptapUnderline,
	Youtube,
} from "novel";
import { SubscribeForm } from "./SubscribeForm";
import { FeedbackForm } from "./feedbackForm";

export const revalidate = 3600;

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

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div className="max-w-[750px] mx-auto md:px-4 animate-in">
					<div className="mb-4 flex gap-2 justify-end">
						<PostAdminControls postAuthorId={String(post.author_id)} postId={id} isPublic={post.is_public} />
					</div>
					<div className="mb-4">
						<h1 className="md:text-4xl scroll-m-20 tracking-tight !leading-tight text-3xl font-extrabold text-balance text-[#104357] dark:text-[#E3F2F7] [font-family:var(--font-default)]">
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

	// TODO: @afonso I wanted to slice the content but it seems this is an object. Can you help?
	let contentPreview = "Check out this post on our blog.";
	try {
		const contentText = generateText(post.content, [
			StarterKit,
			TaskItem,
			TaskList,
			TiptapImage,
			TiptapUnderline,
			TextStyle,
			Color,
			TiptapLink,
			Youtube,
		]).slice(0, 160);
		if (contentText.length > 0) {
			const lastSpaceIndex = contentText.lastIndexOf(" ");
			contentPreview = `${contentText.substring(0, lastSpaceIndex)}…`;
		}
	} catch (error) {
		console.error("Error generating content preview", error);
		console.log("Continuing with default content preview");
	}

	// Generate Open Graph image with post title dynamically
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
