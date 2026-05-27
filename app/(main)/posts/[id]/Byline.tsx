import { Avatar, AvatarFallback, AvatarImage } from "@/components/tailwind/ui/avatar";
import type { PostKind } from "@/lib/posts/kind";
import Link from "next/link";
import ShareRow from "./ShareRow";

interface ByLineAuthor {
	name: string;
	bio: string | null;
	image_url: string | null;
	website_url: string | null;
}

interface BylineProps {
	kind: PostKind;
	author: ByLineAuthor;
	publishedAt: string;
	publishedAtIso: string;
	readingMinutes: number;
}

/**
 * Pull the first sentence out of a bio for the NYT-Opinion-style "By X. Mr. X
 * is the editor of…" tag. Falls back to a 140-char truncation if the bio has
 * no sentence break in the first stretch.
 */
function authorTag(bio: string | null): string | null {
	if (!bio) return null;
	const trimmed = bio.trim();
	if (!trimmed) return null;
	const firstSentence = trimmed.match(/^[^.!?]+[.!?]/);
	if (firstSentence) return firstSentence[0].trim();
	return trimmed.length > 140 ? `${trimmed.slice(0, 140).trimEnd()}…` : trimmed;
}

function initials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

const WEEKLY_ROLE = "Expert Evaluator at the European Commission and Co-founder of Founder Institute Portugal.";

export default function Byline({ kind, author, publishedAt, publishedAtIso, readingMinutes }: BylineProps) {
	const isOpinion = kind === "opinion";
	// Role line:
	//   - Opinion: pull the author's headline credential from the first sentence
	//     of their bio (NYT-Opinion register — "Mr. Walther is the editor of…").
	//   - Weekly: a fixed descriptor of Carlos's role. The Weekly is signed,
	//     not journalistic, so the byline carries authority like an Opinion
	//     column would.
	const tag = isOpinion ? authorTag(author.bio) : WEEKLY_ROLE;

	// Name link target:
	//   - Opinion: external website_url when present (so the reader can follow
	//     the writer's work beyond Adamastor).
	//   - Weekly: /about, where Carlos's full masthead bio lives.
	const nameHref = isOpinion ? author.website_url : "/about";
	const nameLinkProps = isOpinion ? { target: "_blank", rel: "noopener noreferrer" } : {};
	const nameNode = nameHref ? (
		<Link
			href={nameHref}
			{...nameLinkProps}
			className="font-semibold text-navy underline underline-offset-4 decoration-navy-tint decoration-2 hover:decoration-navy dark:text-cyan-lifted"
		>
			{author.name}
		</Link>
	) : (
		<span className="font-semibold text-navy dark:text-cyan-lifted">{author.name}</span>
	);

	return (
		<div className="border-y border-navy-frame py-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<Avatar className="h-14 w-14 shrink-0">
						<AvatarImage src={author.image_url ?? undefined} alt={author.name} />
						<AvatarFallback className="text-sm font-medium text-navy">{initials(author.name)}</AvatarFallback>
					</Avatar>
					{/* Two-row byline (NYT Opinion register): top row carries identity
					    + dateline at body weight; role line below is smaller +
					    muted so the name stays dominant. */}
					<div className="space-y-1.5 leading-snug">
						<p className="text-sm">
							By {nameNode}
							<span className="text-muted-foreground">
								{" "}
								<span aria-hidden="true">·</span>{" "}
								<time dateTime={publishedAtIso}>{publishedAt}</time>{" "}
								<span aria-hidden="true">·</span> {readingMinutes} min read
							</span>
						</p>
						{tag && (
							<p className="max-w-[44ch] text-xs text-navy-tone dark:text-cyan-dim">{tag}</p>
						)}
					</div>
				</div>
				<ShareRow className="-ml-2 sm:-mr-2 sm:-mt-1 sm:ml-0 shrink-0" />
			</div>
		</div>
	);
}
