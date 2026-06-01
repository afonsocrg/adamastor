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
	// Byline-link convention (per `docs/inspiration-guardian.md` → "Links
	// across contexts"): no underline at rest; the name sits at full navy
	// against quieter metadata around it. Hover adds the underline as the
	// two-axis affordance. Weight 575 matches `.article-prose strong` and
	// `PostTOC` active — same emphasis station across the publication.
	const nameNode = nameHref ? (
		<Link
			href={nameHref}
			{...nameLinkProps}
			className="font-[575] text-navy hover:underline hover:decoration-navy-tint hover:decoration-2 hover:underline-offset-4 dark:text-navy-lifted"
		>
			{author.name}
		</Link>
	) : (
		<span className="font-[575] text-navy dark:text-navy-lifted">{author.name}</span>
	);

	return (
		<div className="border-y border-navy-frame dark:border-navy-edge">
			{/* Two-zone strap, one concern per zone — the byline's job is to
			    keep "who's speaking" from blurring into "reader tooling".

			    Zone A — Author identity: avatar + name + credential. Answers
			    "who", in editorial voice: name at full navy / 575, credential
			    in Lora italic (sibling to the blockquote's set-apart voice).

			    Zone B — Utility bar: publication date + read time on the left,
			    share actions on the right, divided from the author by a
			    hairline and held in the quieter navy-tone register. Date,
			    read-time and share are all reader-tooling, so they share a
			    lane and never compete with the author block above. Share lives
			    here (not below the article) so it's in view on entry. */}
			<div className="flex items-start gap-4 py-5">
				<Avatar className="h-14 w-14 shrink-0">
					<AvatarImage src={author.image_url ?? undefined} alt={author.name} />
					<AvatarFallback className="text-sm font-medium text-navy">{initials(author.name)}</AvatarFallback>
				</Avatar>
				<div className="flex flex-col gap-1.5 leading-snug">
					<p className="text-[15px] text-navy dark:text-navy-lifted">{nameNode}</p>
					{tag && (
						<p className="max-w-[44ch] text-[14px] font-normal text-navy-tone dark:text-navy-dim hyphens-manual">
							{tag}
						</p>
					)}
				</div>
			</div>
			<div className="flex flex-col gap-2 border-t border-navy-frame dark:border-navy-edge py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
				<p className="text-[13px] text-navy-tone dark:text-navy-dim">
					<time dateTime={publishedAtIso}>{publishedAt}</time>{" "}
					<span aria-hidden="true">·</span> {readingMinutes} min read
				</p>
				<ShareRow className="-ml-2 sm:ml-0 sm:-mr-2" />
			</div>
		</div>
	);
}
