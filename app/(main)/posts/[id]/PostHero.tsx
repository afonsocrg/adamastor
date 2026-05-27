import { type PostKind, getDisplayTitle, getKickerLabel, getWeekLabel } from "@/lib/posts/kind";
import Byline from "./Byline";

interface PostHeroAuthor {
	name: string;
	bio: string | null;
	image_url: string | null;
	website_url: string | null;
}

interface PostHeroProps {
	kind: PostKind;
	title: string;
	author: PostHeroAuthor;
	publishedAt: string;
	publishedAtIso: string;
	readingMinutes: number;
}

export default function PostHero({ kind, title, author, publishedAt, publishedAtIso, readingMinutes }: PostHeroProps) {
	const displayTitle = getDisplayTitle(title);
	const weekLabel = getWeekLabel(title);
	const kicker = getKickerLabel(kind, weekLabel);

	return (
		<header className="space-y-5 md:space-y-8">
			<div className="space-y-2 md:space-y-4">
				<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-tone dark:text-cyan-dim md:text-xs">
					{kicker}
				</p>
				<h1
					className="text-[1.9375rem] font-bold leading-tight tracking-tight text-navy dark:text-cyan-lifted [font-family:var(--font-lora-bold)] [text-wrap:balance] md:text-5xl"
				>
					{displayTitle}
				</h1>
			</div>
			<Byline
				kind={kind}
				author={author}
				publishedAt={publishedAt}
				publishedAtIso={publishedAtIso}
				readingMinutes={readingMinutes}
			/>
		</header>
	);
}
