import DuotonePortraitFilter from "@/components/DuotonePortraitFilter";
import { BlueskyIcon, LinkedInIcon, TwitterIcon } from "@/public/social";
import { Github, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { JSX, SVGProps } from "react";

interface AuthorStrapAuthor {
	name: string;
	bio: string | null;
	image_url: string | null;
	website_url: string | null;
	social_links?: unknown;
}

interface AuthorStrapProps {
	author: AuthorStrapAuthor;
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

export default function AuthorStrap({ author }: AuthorStrapProps) {
	const icons = collectSocialIcons(author);
	const bio = author.bio?.trim();

	return (
		<aside className="border-t border-navy-frame pt-10">
			<DuotonePortraitFilter />
			<p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-cyan-dim">
				About the author
			</p>
			<div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
				{author.image_url ? (
					<Image
						src={author.image_url}
						alt={author.name}
						width={144}
						height={144}
						className="h-32 w-32 shrink-0 rounded-md border border-navy-frame object-cover sm:h-36 sm:w-36"
						style={{ filter: "url(#duotone-navy-portrait)" }}
					/>
				) : null}
				<div className="space-y-3">
					<div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
						<h2 className="text-2xl font-bold leading-tight tracking-tight text-navy dark:text-cyan-lifted md:text-[1.75rem]">
							{author.name}
						</h2>
						{icons.length > 0 && (
							<div className="flex items-center gap-4">
								{icons.map((social) => (
									<Link
										key={social.href}
										href={social.href}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={`${author.name} on ${social.label}`}
										className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-tone transition-colors hover:text-navy dark:text-cyan-dim dark:hover:text-cyan-lifted"
									>
										<social.Icon className="h-4 w-4" aria-hidden="true" />
										{social.label}
									</Link>
								))}
							</div>
						)}
					</div>
					{bio && (
						<p className="max-w-[55ch] text-base leading-relaxed text-navy-tone dark:text-cyan-dim">{bio}</p>
					)}
				</div>
			</div>
		</aside>
	);
}
