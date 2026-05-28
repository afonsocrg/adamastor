// Page H1 + kicker + byline. For the canonical type system (length-responsive
// H1 tiering, header ↔ prose alignment, kicker tracking), see
// `docs/typography.md` — particularly "Page chrome" and "Reading column".

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

	// Length-responsive H1 sizing. Short titles get the full editorial 48px
	// punch; longer titles compress so they don't wrap past 2-3 lines inside
	// the 60ch reading column. Thresholds calibrated against actual Adamastor
	// titles:
	//   ≤ 45 chars  →  48px (text-5xl)        Short, punchy headlines
	//   46-70 chars →  40px (text-[2.5rem])   Medium, often 2 lines
	//   71+ chars   →  32px (text-[2rem])     Long, must compress to fit
	// Mobile size stays constant (31px) — mobile is already narrow enough that
	// long titles wrap regardless, and the smaller starting point doesn't need
	// further compression.
	const titleLength = displayTitle.length;
	const h1DesktopSize =
		titleLength <= 45 ? "md:text-5xl"
		: titleLength <= 70 ? "md:text-[2.5rem]"
		: "md:text-[2rem]";

	return (
		// max-w-[60ch] aligns the header (kicker, title, byline) with the prose
		// column below. text-lg pins the header's font context to 18px so the ch
		// unit resolves to the same pixel width as PostPreview's max-w-[60ch],
		// which computes ch at prose-lg (18px). Without text-lg, the header
		// inherits the body's 16px and 60ch would be ~60px narrower than the
		// prose — invisibly misaligned, which defeats the purpose.
		<header className="max-w-[60ch] mx-auto text-lg space-y-5 md:space-y-8">
			<div className="space-y-2 md:space-y-4">
				<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-cyan-dim md:text-xs">
					{kicker}
				</p>
				<h1
					className={`text-[1.9375rem] font-bold leading-tight tracking-tight text-navy dark:text-cyan-lifted [font-family:var(--font-lora-bold)] [text-wrap:balance] ${h1DesktopSize}`}
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
