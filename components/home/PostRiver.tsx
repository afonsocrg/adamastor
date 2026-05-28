import { formatDate } from "@/lib/datetime";
import type { HomePost } from "@/lib/home-posts";
import { extractTiptapText } from "@/lib/posts/content";
import { getDisplayTitle, getFeedCardLabel, getPostKind, getWeekLabel } from "@/lib/posts/kind";
import Link from "next/link";

function getContentPreview(content: unknown): string {
	try {
		const raw = extractTiptapText(content).slice(0, 280);
		if (!raw) return "Check out this post on our blog.";
		const lastSpace = raw.lastIndexOf(" ");
		return lastSpace > 0 ? `${raw.substring(0, lastSpace)}…` : `${raw}…`;
	} catch {
		return "Check out this post on our blog.";
	}
}

function getPageHref(page: number): string {
	return page <= 1 ? "/" : `/page/${page}`;
}

function firstAuthorName(authors: HomePost["authors"]): string | null {
	if (!authors) return null;
	const list = Array.isArray(authors) ? authors : [authors];
	return list[0]?.name ?? null;
}

interface RiverCardProps {
	post: HomePost;
}

/**
 * Uniform card pattern for the chronological river of posts below the hero.
 * Inter title (deliberately not Lora — Lora is reserved for page H1 + hero,
 * so the visual hierarchy carries the editorial signal: Lora = anchor moment,
 * Inter = catalog/scan mode). Kicker shows the kind; week label, when
 * present, hangs in the right gutter as a magazine-issue marker.
 */
function RiverCard({ post }: RiverCardProps) {
	const contentPreview = getContentPreview(post.content);
	const kind = getPostKind(post);
	const label = getFeedCardLabel(kind);
	const displayTitle = getDisplayTitle(post.title);
	const weekLabel = getWeekLabel(post.title);
	const authorName = firstAuthorName(post.authors);

	return (
		<article className="group border-b border-navy-frame last:border-b-0 dark:border-cyan-glow/[0.12]">
			<Link
				href={`/posts/${post.slug ?? post.id}`}
				className="flex flex-col rounded-sm py-5 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:-mx-4 sm:px-4 sm:hover:bg-navy-veil/40 dark:sm:hover:bg-cyan-glow/[0.04]"
			>
				<section className="space-y-2.5">
					<div className="flex items-center justify-between gap-3">
						<p
							className={`text-[11px] font-semibold uppercase tracking-[0.14em] md:text-xs ${
								kind === "opinion" ? "text-orange-hue" : "text-navy-tone dark:text-cyan-dim"
							}`}
						>
							{label}
						</p>
						{weekLabel && (
							<p className="shrink-0 text-[0.78rem] font-medium tracking-[0.04em] text-muted-foreground/75">
								{weekLabel}
							</p>
						)}
					</div>
					<h3 className="text-[1.22rem] font-bold leading-[1.22] text-navy [text-wrap:pretty] transition-colors duration-150 ease-out group-hover:underline dark:text-cyan-lifted sm:text-[1.55rem] sm:leading-[1.18]">
						{displayTitle}
					</h3>
					<p className="max-w-[60ch] text-[0.98rem] leading-[1.55] text-muted-foreground line-clamp-3 sm:line-clamp-2 sm:text-base sm:leading-[1.6]">
						{contentPreview}
					</p>
					<p className="text-[0.85rem] leading-6 text-muted-foreground/80">
						{authorName ? <>{authorName} <span aria-hidden="true">·</span> </> : null}
						<time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
					</p>
				</section>
			</Link>
		</article>
	);
}

interface PostRiverProps {
	currentPage: number;
	posts: HomePost[];
	totalPages: number;
}

/**
 * Renders the river (uniform RiverCards) + pagination strip. Used on both `/`
 * (with hero above) and `/page/[page]` (alone, since hero only lives on page 1).
 */
export default function PostRiver({ currentPage, posts, totalPages }: PostRiverProps) {
	return (
		<div className="space-y-2">
			<div className="flex flex-col">
				{posts.map((post) => (
					<RiverCard key={post.id} post={post} />
				))}
			</div>

			{totalPages > 1 && (
				<nav aria-label="Pagination" className="flex items-center justify-between gap-4 py-6">
					<div>
						{currentPage > 1 ? (
							<Link
								href={getPageHref(currentPage - 1)}
								className="inline-flex items-center rounded-md border border-navy-frame px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-navy-veil/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-cyan-glow/[0.18] dark:text-cyan-lifted dark:hover:bg-cyan-glow/[0.06]"
							>
								Newer articles
							</Link>
						) : (
							<span className="inline-flex items-center rounded-md border border-navy-frame px-3 py-2 text-sm font-medium text-muted-foreground/50 dark:border-cyan-glow/[0.12]">
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
								className="inline-flex items-center rounded-md border border-navy-frame px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-navy-veil/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-cyan-glow/[0.18] dark:text-cyan-lifted dark:hover:bg-cyan-glow/[0.06]"
							>
								Older articles
							</Link>
						) : (
							<span className="inline-flex items-center rounded-md border border-navy-frame px-3 py-2 text-sm font-medium text-muted-foreground/50 dark:border-cyan-glow/[0.12]">
								Older articles
							</span>
						)}
					</div>
				</nav>
			)}
		</div>
	);
}
