import { Separator } from "@/components/tailwind/ui/separator";
import { formatDate } from "@/lib/datetime";
import type { HomePost } from "@/lib/home-posts";
import Link from "next/link";

// Walk TipTap JSON and concatenate `text` leaves. Replaces @tiptap/core's
// generateText so this Server Component doesn't drag the whole novel/tiptap
// dep tree into the home route.
function extractTiptapText(node: unknown): string {
	if (!node || typeof node !== "object") return "";
	const n = node as { text?: unknown; content?: unknown };
	if (typeof n.text === "string") return n.text;
	if (!Array.isArray(n.content)) return "";
	return n.content.map(extractTiptapText).join(" ");
}

function getContentPreview(postContent: unknown) {
	let contentPreview = "Check out this post on our blog.";

	try {
		const contentText = extractTiptapText(postContent).slice(0, 360);

		if (contentText.length > 0) {
			const lastSpaceIndex = contentText.lastIndexOf(" ");
			contentPreview = lastSpaceIndex > 0 ? `${contentText.substring(0, lastSpaceIndex)}…` : `${contentText}…`;
		}
	} catch (error) {
		console.error("Error generating content preview", error);
		console.log("Continuing with default content preview");
	}

	return contentPreview;
}

function getAuthorNames(authors: HomePost["authors"]) {
	if (!authors) {
		return [];
	}

	const authorList = Array.isArray(authors) ? authors : [authors];
	return authorList.map((author) => author.name?.trim().toLowerCase()).filter((name): name is string => Boolean(name));
}

function getPostLabel(post: HomePost) {
	const authorNames = getAuthorNames(post.authors);
	const hasCarlosResende = authorNames.includes("carlos resende");
	const isWeeklyPattern = /\bWeek\s+\d+\b/i.test(post.title);

	return hasCarlosResende || isWeeklyPattern ? "Weekly Digest" : "Guest Article";
}

function getDisplayTitle(title: string) {
	return title.replace(/\s*\|\s*Week\s+\d+\b/i, "").trim();
}

function getWeekLabel(title: string) {
	const match = title.match(/\bWeek\s+\d+\b/i);
	return match?.[0] ?? null;
}

function getPageHref(page: number) {
	return page <= 1 ? "/" : `/page/${page}`;
}

interface HomePostsFeedProps {
	currentPage: number;
	posts: HomePost[];
	totalPages: number;
}

export default function HomePostsFeed({ currentPage, posts, totalPages }: HomePostsFeedProps) {
	return (
		<div className="mx-auto max-w-[750px] animate-in space-y-2 md:px-4">
			<header className="pb-4 pt-2 md:hidden">
				<h1 className="text-2xl font-extrabold tracking-tight text-[#104357] dark:text-cyan-lifted">Articles</h1>
			</header>

			<div className="flex flex-col">
				{posts.map((post) => {
					const contentPreview = getContentPreview(post.content);
					const label = getPostLabel(post);
					const displayTitle = getDisplayTitle(post.title);
					const weekLabel = getWeekLabel(post.title);

					return (
						<article className="group" key={post.id}>
							<Link
								href={`/posts/${post.id}`}
								className="flex flex-col py-5 transition-colors duration-150 ease-out sm:px-4 sm:hover:bg-accent/50"
							>
								<section className="space-y-2.5">
									<div className="flex items-center justify-between gap-3">
										<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-tone">{label}</p>
										{weekLabel && (
											<p className="shrink-0 text-[0.78rem] font-medium tracking-[0.04em] text-muted-foreground/75">
												{weekLabel}
											</p>
										)}
									</div>
									<h2 className="text-[1.22rem] font-bold leading-[1.22] text-[#104357] transition-colors duration-150 ease-out [text-wrap:pretty] group-hover:underline dark:text-cyan-lifted [font-family:var(--font-inter)] sm:text-[1.55rem] sm:leading-[1.18]">
										{displayTitle}
									</h2>
									<p className="max-w-[32rem] text-[0.98rem] leading-[1.55] text-muted-foreground line-clamp-3 sm:max-w-[42rem] sm:line-clamp-2 sm:text-base sm:leading-[1.6]">
										{contentPreview}
									</p>
									<p className="text-[0.95rem] leading-6 text-muted-foreground/70">{formatDate(post.created_at)}</p>
								</section>
							</Link>
							<Separator />
						</article>
					);
				})}
			</div>

			{totalPages > 1 && (
				<nav aria-label="Pagination" className="flex items-center justify-between gap-4 py-6 sm:px-4">
					<div>
						{currentPage > 1 ? (
							<Link
								href={getPageHref(currentPage - 1)}
								className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-[#104357] transition-colors hover:bg-accent dark:text-cyan-lifted"
							>
								Newer articles
							</Link>
						) : (
							<span className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground/50">
								Newer articles
							</span>
						)}
					</div>

					<div className="text-sm text-muted-foreground">
						Page {currentPage} of {totalPages}
					</div>

					<div className="flex justify-end">
						{currentPage < totalPages ? (
							<Link
								href={getPageHref(currentPage + 1)}
								className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-[#104357] transition-colors hover:bg-accent dark:text-cyan-lifted"
							>
								Older articles
							</Link>
						) : (
							<span className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground/50">
								Older articles
							</span>
						)}
					</div>
				</nav>
			)}
		</div>
	);
}
