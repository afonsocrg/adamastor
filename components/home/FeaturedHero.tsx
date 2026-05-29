import { formatDate } from "@/lib/datetime";
import type { HomePost } from "@/lib/home-posts";
import { extractTiptapText, estimateReadingMinutes } from "@/lib/posts/content";
import { getDisplayTitle, getFeedCardLabel, getPostKind, getWeekLabel } from "@/lib/posts/kind";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface FeaturedHeroProps {
	post: HomePost;
}

const HERO_PREVIEW_CHARS = 280;
const WEEKLY_ROLE = "Expert Evaluator at the European Commission and Co-founder of Founder Institute Portugal.";

function firstAuthor(authors: HomePost["authors"]) {
	if (!authors) return null;
	const list = Array.isArray(authors) ? authors : [authors];
	return list[0] ?? null;
}

function opinionRoleLine(bio: string | null | undefined): string | null {
	if (!bio) return null;
	const trimmed = bio.trim();
	if (!trimmed) return null;
	const firstSentence = trimmed.match(/^[^.!?]+[.!?]/);
	if (firstSentence) return firstSentence[0].trim();
	return trimmed.length > 140 ? `${trimmed.slice(0, 140).trimEnd()}…` : trimmed;
}

function getLede(content: unknown): string {
	try {
		const raw = extractTiptapText(content).slice(0, HERO_PREVIEW_CHARS);
		if (!raw) return "";
		const lastSpace = raw.lastIndexOf(" ");
		return lastSpace > 0 ? `${raw.substring(0, lastSpace)}…` : `${raw}…`;
	} catch {
		return "";
	}
}

/**
 * Front-page hero card. The single most prominent post link on `/`. Open
 * editorial composition (no surface card, no border-box) — set apart from
 * the river below by Lora-bold title scale, a wider lede, and an editorial
 * byline strip. Kind-aware:
 *   - Weekly: kicker reads "Weekly Adamastor" (navy.bright) with the week
 *     marker ("Week N") in the right gutter; Carlos's canonical role line
 *     under the byline.
 *   - Opinion: kicker is "Opinion" (orange); author portrait + role line
 *     derived from the bio's first sentence.
 *
 * The duotone filter (id `duotone-navy-portrait`) is rendered once at the
 * top of the page; this hero just references it.
 */
export default function FeaturedHero({ post }: FeaturedHeroProps) {
	const kind = getPostKind(post);
	const author = firstAuthor(post.authors);
	const displayTitle = getDisplayTitle(post.title);
	const weekLabel = getWeekLabel(post.title);
	const label = getFeedCardLabel(kind);
	const kickerColor = kind === "opinion" ? "text-orange-hue" : "text-navy-bright dark:text-cyan-glow";
	const readingMinutes = estimateReadingMinutes(post.content);
	const lede = getLede(post.content);
	const href = `/posts/${post.slug ?? post.id}`;

	const roleLine =
		kind === "weekly" ? WEEKLY_ROLE : opinionRoleLine(author?.bio ?? null);
	// Hero portrait always renders when available — Weekly = Carlos (publication
	// face), Opinion = guest writer. Repetition of Carlos across Tuesdays is the
	// brand signal, not an accident; river cards stay text-only to balance.
	const showPortrait = Boolean(author?.image_url);

	return (
		<article className="group border-b border-navy-frame pb-10 dark:border-cyan-glow/[0.12]">
			<Link
				href={href}
				className="block rounded-sm transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:-mx-4 sm:px-4 sm:py-2 sm:hover:bg-navy-veil/40 dark:sm:hover:bg-cyan-glow/[0.04]"
			>
				<div className="flex items-center justify-between gap-3">
					{/* Two-pillar kicker accent (publication-wide): Weekly carries
					    the cool navy.bright brand-blue, Opinion the warm orange
					    "named voice." The issue marker recedes to the right gutter
					    — same kicker-left / week-right layout as the river cards
					    and the article-page hero; date + read-time move to the
					    byline cluster below. */}
					<p className={`text-[11px] font-semibold uppercase tracking-[0.18em] md:text-xs ${kickerColor}`}>
						{label}
					</p>
					{weekLabel && (
						<p className="shrink-0 text-[0.78rem] font-medium tracking-[0.04em] text-muted-foreground/75">
							{weekLabel}
						</p>
					)}
				</div>
				<h2 className="mt-4 text-[1.75rem] font-bold leading-[1.12] tracking-tight text-navy [text-wrap:balance] [font-family:var(--font-lora-bold)] transition-colors duration-150 ease-out group-hover:underline dark:text-cyan-lifted md:mt-5 md:text-[2.25rem] md:leading-[1.08]">
					{displayTitle}
				</h2>
				{lede && (
					<p className="mt-4 max-w-[60ch] text-base leading-[1.6] text-muted-foreground md:mt-5 md:text-lg md:leading-[1.55]">
						{lede}
					</p>
				)}
				<div className="mt-6 flex items-center gap-4 md:mt-8">
					{showPortrait && author?.image_url ? (
						<Image
							src={author.image_url}
							alt={author.name ?? "Author portrait"}
							width={64}
							height={64}
							priority
							className="h-14 w-14 shrink-0 rounded-full border border-navy-frame object-cover md:h-16 md:w-16"
						/>
					) : null}
					<div className="min-w-0 text-sm leading-snug">
						{author?.name && (
							<p className="font-semibold text-navy dark:text-cyan-lifted">By {author.name}</p>
						)}
						{roleLine && (
							<p className="max-w-[44ch] text-xs leading-snug text-navy-tone dark:text-cyan-dim">
								{roleLine}
							</p>
						)}
						<p className="mt-0.5 text-xs text-muted-foreground/80">
							<time dateTime={post.created_at}>{formatDate(post.created_at)}</time> · {readingMinutes} min read
						</p>
					</div>
					<span className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-navy dark:text-cyan-lifted">
						Read
						<ArrowRightIcon
							className="h-4 w-4 text-orange-hue transition-transform duration-150 ease-out group-hover:translate-x-0.5"
							aria-hidden="true"
						/>
					</span>
				</div>
			</Link>
		</article>
	);
}
