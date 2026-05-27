import DuotonePortraitFilter from "@/components/DuotonePortraitFilter";
import { BlueskyIcon, LinkedInIcon, TwitterIcon } from "@/public/social";
import type { PostKind } from "@/lib/posts/kind";
import { ArrowRightIcon, Github, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { SVGProps } from "react";

interface AuthorStrapAuthor {
	name: string;
	bio: string | null;
	image_url: string | null;
	website_url: string | null;
	social_links?: unknown;
}

interface AuthorStrapProps {
	author: AuthorStrapAuthor;
	kind: PostKind;
}

// Branded icons from /public/social and lucide line icons share the same
// `(props: SVGProps) => JSX.Element` shape — typing the slot as `IconComponent`
// avoids a `typeof Lucide` hack that fights lucide's stricter type.
type IconComponent = (props: SVGProps<SVGSVGElement>) => JSX.Element;

interface SocialIcon {
	href: string;
	label: string;
	Icon: IconComponent;
}

function classifyUrl(url: string): SocialIcon | null {
	try {
		const u = new URL(url);
		const host = u.hostname.toLowerCase().replace(/^www\./, "");
		if (host.includes("linkedin.com")) return { href: url, label: "LinkedIn", Icon: LinkedInIcon };
		if (host === "x.com" || host === "twitter.com") return { href: url, label: "X", Icon: TwitterIcon };
		if (host.endsWith("bsky.app") || host === "bsky.social") {
			return { href: url, label: "Bluesky", Icon: BlueskyIcon };
		}
		if (host === "github.com") return { href: url, label: "GitHub", Icon: Github as unknown as IconComponent };
		return { href: url, label: host, Icon: Globe as unknown as IconComponent };
	} catch {
		return null;
	}
}

function collectSocialIcons(author: AuthorStrapAuthor): SocialIcon[] {
	const seen = new Set<string>();
	const icons: SocialIcon[] = [];

	function visit(value: unknown) {
		if (typeof value === "string" && /^https?:\/\//i.test(value)) {
			if (seen.has(value)) return;
			seen.add(value);
			const icon = classifyUrl(value);
			if (icon) icons.push(icon);
			return;
		}
		if (Array.isArray(value)) {
			for (const v of value) visit(v);
			return;
		}
		if (value && typeof value === "object") {
			for (const v of Object.values(value)) visit(v);
		}
	}

	if (author.website_url) visit(author.website_url);
	visit(author.social_links);
	return icons;
}

export default function AuthorStrap({ author, kind }: AuthorStrapProps) {
	const icons = collectSocialIcons(author);
	const bio = author.bio?.trim();

	return (
		<aside className="border-t border-navy-frame pt-10">
			<DuotonePortraitFilter />
			<p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-navy-tone dark:text-cyan-dim">
				About the author
			</p>
			<div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
				{author.image_url ? (
					<Image
						src={author.image_url}
						alt={author.name}
						width={120}
						height={120}
						className="h-28 w-28 shrink-0 rounded-md border border-navy-frame object-cover sm:h-32 sm:w-32"
						style={{ filter: "url(#duotone-navy-portrait)" }}
					/>
				) : null}
				<div className="space-y-3">
					<h3 className="text-2xl font-semibold leading-tight tracking-tight text-navy dark:text-cyan-lifted">
						{author.name}
					</h3>
					{bio && (
						<p className="max-w-[55ch] text-base leading-relaxed text-muted-foreground">{bio}</p>
					)}
					{icons.length > 0 && (
						<ul className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
							{icons.map((social) => (
								<li key={social.href}>
									<Link
										href={social.href}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 text-sm text-navy-tone transition-colors hover:text-navy dark:text-cyan-dim dark:hover:text-cyan-lifted"
									>
										<social.Icon className="h-4 w-4" aria-hidden="true" />
										<span>{social.label}</span>
									</Link>
								</li>
							))}
						</ul>
					)}
					{kind === "weekly" && (
						<Link
							href="/subscribe"
							className="inline-flex items-center gap-2 pt-2 text-sm font-medium text-navy underline underline-offset-4 decoration-navy-tint decoration-2 transition-colors hover:decoration-navy dark:text-cyan-lifted dark:decoration-cyan-glow/40 dark:hover:decoration-cyan-lifted"
						>
							More from Carlos
							<ArrowRightIcon className="h-4 w-4 text-orange-hue" aria-hidden="true" />
						</Link>
					)}
				</div>
			</div>
		</aside>
	);
}
